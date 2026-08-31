import { useState, useRef } from 'react';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { apiPost, apiTTS, API_URL } from '../services/api';
import { getCached, setCached } from '../services/cache';

type State = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';

export function useVoice() {
  const [state, setState] = useState<State>('idle');
  const [transcript, setTranscript] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Audio.Recording | null>(null);
  const webRecRef = useRef<{ rec: MediaRecorder; chunks: Blob[]; stream: MediaStream } | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<any>(null);

  const listening = state === 'listening';
  const processing = state === 'processing';
  const speaking = state === 'speaking';

  async function start() {
    setError(null);
    setTranscript('');
    try {
      if (Platform.OS === 'web') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const rec = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
        const chunks: Blob[] = [];
        rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
        rec.start();
        webRecRef.current = { rec, chunks, stream };
        setState('listening');
        timerRef.current = setTimeout(() => stop(), 5000);
        return;
      }
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setError('Mic permission denied — enable in Settings');
        setState('error');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true, staysActiveInBackground: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      recRef.current = rec;
      setState('listening');
      timerRef.current = setTimeout(() => stop(), 5000);
    } catch (e: any) {
      setError(e.message || 'Mic failed — allow microphone');
      setState('error');
    }
  }

  async function stop() {
    const isWeb = Platform.OS === 'web' && webRecRef.current;
    if (!recRef.current && !isWeb) return;
    clearTimeout(timerRef.current);
    setState('processing');
    try {
      let b64 = '';
      if (isWeb && webRecRef.current) {
        const { rec, chunks, stream } = webRecRef.current;
        webRecRef.current = null;
        await new Promise<void>(resolve => {
          rec.onstop = () => resolve();
          rec.stop();
        });
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
        if (blob.size < 800) throw new Error("We didn't catch that — speak a bit louder");
        b64 = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onloadend = () => res((r.result as string).split(',')[1] || '');
          r.onerror = () => rej(new Error('Audio read failed'));
          r.readAsDataURL(blob);
        });
        if (b64.length < 800) throw new Error("We didn't catch that — try again");
      } else if (recRef.current) {
        const rec = recRef.current;
        recRef.current = null;
        await rec.stopAndUnloadAsync();
        const uri = rec.getURI();
        if (!uri) throw new Error('No audio captured — tap again and speak 1-2s');
        const stat = await FileSystem.getInfoAsync(uri);
        if (!stat.exists || (stat as any).size < 800) throw new Error("We didn't catch that — speak a bit louder");
        b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        if (b64.length < 800) throw new Error("We didn't catch that — try again");
      }

      // STT
      const stt = await apiPost<{ text?: string; error?: string }>('/api/stt/cartesia', { audio_base64: b64 }, { retries: 1, timeout: 20000 });
      const text = (stt.text || '').trim();
      if (!text || text.includes("couldn't hear")) throw new Error(text || "We didn't catch that");
      setTranscript(text);

      // Check cache before Genie
      const cached = await getCached(text);
      if (cached) {
        setAnswer(cached);
        await speak(cached);
        setState('speaking');
        return;
      }

      // Genie
      const genie = await apiPost<{ answer?: string; error?: string }>('/api/genie', { question: text }, { retries: 1, timeout: 25000 });
      const ans = (genie.answer || genie.error || '').trim();
      if (!ans) throw new Error('No answer — try rephrasing');
      setAnswer(ans);
      await setCached(text, ans);
      await speak(ans);
      setState('speaking');
    } catch (e: any) {
      const msg = e.message || 'Something went wrong';
      setError(msg);
      setState('error');
      // auto-reset error to idle after 3s
      setTimeout(() => setState('idle'), 3000);
    }
  }

  async function speak(text: string) {
    try {
      if (Platform.OS === 'web') {
        const buf = await apiTTS(text);
        const blob = new Blob([buf], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        if (audioElRef.current) { audioElRef.current.pause(); audioElRef.current = null; }
        const el = new Audio(url) as HTMLAudioElement;
        audioElRef.current = el;
        el.onended = () => setState('idle');
        await el.play();
        return;
      }
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const buf = await apiTTS(text);
      const b64 = arrayBufferToBase64(buf);
      const path = FileSystem.cacheDirectory + `tts_${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(path, b64, { encoding: FileSystem.EncodingType.Base64 });
      const { sound } = await Audio.Sound.createAsync({ uri: path }, { shouldPlay: true, staysActiveInBackground: true });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate(s => {
        if ((s as any).didJustFinish) setState('idle');
      });
    } catch (e: any) {
      console.warn('TTS failed', e.message);
      setState('idle');
    }
  }

  function arrayBufferToBase64(buf: ArrayBuffer): string {
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    // Web + RN both have btoa, no Buffer needed (Buffer crashes on web)
    return btoa(binary);
  }

  function reset() {
    clearTimeout(timerRef.current);
    setTranscript('');
    setAnswer('');
    setError(null);
    setState('idle');
    soundRef.current?.unloadAsync();
    soundRef.current = null;
  }

  return { state, listening, processing, speaking, transcript, answer, error, start, stop, reset, api: API_URL };
}
