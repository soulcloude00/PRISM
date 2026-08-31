import { useState, useRef } from 'react';
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
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<any>(null);

  const listening = state === 'listening';
  const processing = state === 'processing';
  const speaking = state === 'speaking';

  async function start() {
    setError(null);
    setTranscript('');
    try {
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
      setError(e.message || 'Mic failed');
      setState('error');
    }
  }

  async function stop() {
    if (!recRef.current) return;
    clearTimeout(timerRef.current);
    setState('processing');
    const rec = recRef.current;
    recRef.current = null;
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      if (!uri) throw new Error('No audio captured — tap again and speak 1-2s');
      const stat = await FileSystem.getInfoAsync(uri);
      if (!stat.exists || (stat as any).size < 800) throw new Error("We didn't catch that — speak a bit louder");

      const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      if (b64.length < 800) throw new Error("We didn't catch that — try again");

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
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const buf = await apiTTS(text);
      // Buffer is not global in RN — use Uint8Array -> base64
      const b64 = arrayBufferToBase64(buf);
      const path = FileSystem.cacheDirectory + `tts_${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(path, b64, { encoding: FileSystem.EncodingType.Base64 });
      const { sound } = await Audio.Sound.createAsync({ uri: path }, { shouldPlay: true, staysActiveInBackground: true });
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate(s => {
        if ((s as any).didJustFinish) setState('idle');
      });
    } catch (e: any) {
      // TTS fail is non-blocking — show text anyway
      console.warn('TTS failed', e.message);
      setState('idle');
    }
  }

  function arrayBufferToBase64(buf: ArrayBuffer): string {
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    // RN has no btoa reliably — use base64 via FileSystem trick or manual
    // Fallback: use global Buffer if available (polyfilled)
    try {
      // @ts-ignore
      if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
    } catch {}
    // manual base64
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
