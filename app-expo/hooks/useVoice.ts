import { useState, useRef } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

const API = (Constants.expoConfig?.extra as any)?.apiUrl || process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8001';

export function useVoice() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [answer, setAnswer] = useState('');
  const [playing, setPlaying] = useState(false);
  const recRef = useRef<Audio.Recording | null>(null);

  async function start() {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const rec = new Audio.Recording();
    await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await rec.startAsync();
    recRef.current = rec;
    setListening(true);
    // auto-stop 5s like web demo
    setTimeout(() => { if (recRef.current) stop(); }, 5000);
  }

  async function stop() {
    if (!recRef.current) return;
    setListening(false);
    try {
      await recRef.current.stopAndUnloadAsync();
      const uri = recRef.current.getURI();
      recRef.current = null;
      if (!uri) return;
      const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });

      // STT -> Genie -> TTS (same server.py)
      const stt = await fetch(`${API}/api/stt/cartesia`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_base64: b64 }),
      }).then(r => r.json());
      const text = stt.text || '';
      setTranscript(text);
      if (!text || text.includes("couldn't hear")) return;

      const genie = await fetch(`${API}/api/genie`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text }),
      }).then(r => r.json());
      const ans = genie.answer || genie.error || 'No answer';
      setAnswer(ans);

      // TTS cartesia sonic-3.6 pcm_s16le
      const ttsRes = await fetch(`${API}/api/tts/cartesia`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: ans }),
      });
      const blob = await ttsRes.blob();
      // save and play via expo-av
      const path = FileSystem.cacheDirectory + 'tts.wav';
      const reader = new FileReader() as any; // web fallback
      // For native, write via base64
      const buf = await ttsRes.arrayBuffer();
      const b64w = Buffer.from(buf).toString('base64');
      await FileSystem.writeAsStringAsync(path, b64w, { encoding: FileSystem.EncodingType.Base64 });
      const { sound } = await Audio.Sound.createAsync({ uri: path });
      setPlaying(true);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate(s => { if ((s as any).didJustFinish) setPlaying(false); });
    } catch (e: any) {
      setAnswer(`Error: ${e.message}`);
    }
  }

  function reset() {
    setTranscript(''); setAnswer(''); setListening(false); setPlaying(false);
  }

  return { listening, transcript, answer, playing, start, stop, reset, api: API };
}
