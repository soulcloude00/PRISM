import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useVoice } from './hooks/useVoice';

export default function App() {
  const { listening, transcript, answer, playing, start, stop, reset } = useVoice();
  const [log, setLog] = useState<string[]>(['-- waiting --']);

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <View style={s.header}>
        <Text style={s.h1}>✦ PRISM</Text>
        <Text style={s.tag}>Cartesia STT → Genie → Sonic 3.6</Text>
      </View>
      <ScrollView contentContainerStyle={s.body}>
        <View style={s.card}>
          <Text style={s.cardTitle}>🎙️ Voice Chat</Text>
          <Pressable
            onPress={listening ? stop : start}
            style={[s.mic, listening && s.micListening]}
          >
            <Text style={s.micText}>{listening ? '🔴' : '🎙️'}</Text>
          </Pressable>
          <Text style={[s.status, listening && s.statusActive]}>
            {listening ? 'Listening... tap to stop (5s auto)' : playing ? '🔊 Playing...' : 'Tap to speak'}
          </Text>
          <View style={s.row}>
            <Pressable onPress={reset} style={s.btn}><Text style={s.btnText}>↻ Reset</Text></Pressable>
            <Pressable onPress={() => setLog(l => [...l, 'Try: What is distribution of customer gender?'])} style={[s.btn, s.btnPrimary]}>
              <Text style={[s.btnText, s.btnTextPrimary]}>Try Sample</Text>
            </Pressable>
          </View>
        </View>
        <View style={s.card}>
          <Text style={s.cardTitle}>📋 Transcript</Text>
          {transcript ? <Text style={s.you}>🎤 {transcript}</Text> : null}
          {answer ? <Text style={s.genie}>🤖 {answer}</Text> : null}
          {log.map((l, i) => <Text key={i} style={s.log}>{l}</Text>)}
        </View>
        <Text style={s.footer}>PRISM Expo Dev Client • OTA via EAS • API: {process.env.EXPO_PUBLIC_API_URL || 'https://prism-api.onrender.com'}</Text>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { padding: 24, borderBottomWidth: 1, borderBottomColor: '#1a1a1a', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h1: { color: '#fff', fontSize: 22, fontWeight: '700' },
  tag: { color: '#818cf8', fontSize: 11, backgroundColor: '#1a1a1a', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  body: { padding: 24, gap: 16 },
  card: { backgroundColor: '#131313', borderWidth: 1, borderColor: '#1f1f1f', borderRadius: 16, padding: 24, alignItems: 'center' },
  cardTitle: { color: '#e5e5e5', fontSize: 16, fontWeight: '600', alignSelf: 'flex-start', marginBottom: 16 },
  mic: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#1a1a1a', borderWidth: 3, borderColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  micListening: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  micText: { fontSize: 36 },
  status: { color: '#666', marginTop: 12, fontSize: 13 },
  statusActive: { color: '#dc2626' },
  row: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: '#2a2a2a', backgroundColor: '#131313' },
  btnPrimary: { backgroundColor: '#818cf8', borderColor: '#818cf8' },
  btnText: { color: '#ccc', fontSize: 13 },
  btnTextPrimary: { color: '#fff' },
  you: { color: '#818cf8', alignSelf: 'flex-start', marginTop: 8 },
  genie: { color: '#22c55e', alignSelf: 'flex-start', marginTop: 8 },
  log: { color: '#444', fontSize: 12, alignSelf: 'flex-start' },
  footer: { color: '#333', fontSize: 12, textAlign: 'center', marginTop: 16 },
});
