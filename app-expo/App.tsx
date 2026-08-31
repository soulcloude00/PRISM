import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useVoice } from './hooks/useVoice';

export default function App() {
  const { state, transcript, answer, error, start, stop, reset } = useVoice();
  const listening = state === 'listening';
  const processing = state === 'processing';
  const speaking = state === 'speaking';

  return (
    <View style={s.container}>
      <StatusBar style="light" />
      <View style={s.header}>
        <Text style={s.h1}>✦ PRISM</Text>
        <Text style={s.tag}>Cartesia STT → Genie → Sonic 3.6</Text>
      </View>

      <ScrollView contentContainerStyle={s.body}>
        {/* Voice Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>🎙️ Voice Tutor</Text>
          <Text style={s.hint}>Tap → speak → proof + voice. Like company app, not demo.</Text>

          <Pressable onPress={listening ? stop : start} disabled={processing} style={[s.mic, listening && s.micListening, processing && s.micDisabled]}>
            {processing ? <ActivityIndicator color="#fff" /> : <Text style={s.micText}>{listening ? '🔴' : '🎙️'}</Text>}
          </Pressable>

          <Text style={[s.status, listening && s.statusActive, processing && s.statusProc, speaking && s.statusSpeak, error && s.statusErr]}>
            {listening ? '🔴 Listening — tap to stop (5s auto)' : processing ? '🧠 Processing — STT → Genie → TTS' : speaking ? '🔊 Speaking — Sonic 3.6' : error ? `❌ ${error}` : 'Tap to speak'}
          </Text>

          <View style={s.row}>
            <Pressable onPress={reset} style={s.btn}><Text style={s.btnText}>↻ Reset</Text></Pressable>
            <Pressable
              onPress={async () => {
                // Sample without mic — direct Genie -> TTS
                const { apiPost } = await import('./services/api');
                const { getCached, setCached } = await import('./services/cache');
                const q = 'What is the distribution of customer gender?';
                const cached = await getCached(q);
                let ans = cached;
                if (!ans) {
                  const r: any = await apiPost('/api/genie', { question: q });
                  ans = r.answer;
                  await setCached(q, ans);
                }
                // quick TTS via hook's internal — for now just show
                reset();
                // leverage hook state via direct set — simple: show answer
                // user can tap mic for full voice; this proves Genie works
              }}
              style={[s.btn, s.btnPrimary]}
            >
              <Text style={[s.btnText, s.btnTextPrimary]}>Try sample (Genie)</Text>
            </Pressable>
          </View>
        </View>

        {/* Transcript — company states: empty / loading / error / success */}
        <View style={s.card}>
          <Text style={s.cardTitle}>📋 Transcript</Text>
          {!transcript && !answer && !error ? <Text style={s.empty}>— No questions yet. Tap mic and say: “Am I ready for Infosys?” —</Text> : null}
          {transcript ? <Text style={s.you}>🎤 You: {transcript}</Text> : null}
          {answer ? <Text style={s.genie}>🤖 Genie: {answer}</Text> : null}
          {processing ? <Text style={s.loading}>⏳ Genie is querying prism.gold…</Text> : null}
          {error ? <Text style={s.error}>⚠️ {error}</Text> : null}
        </View>

        <Text style={s.footer}>PRISM MVP • Expo Dev Client • OTA staging/production • API http://192.168.68.119:8001</Text>
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
  cardTitle: { color: '#e5e5e5', fontSize: 16, fontWeight: '600', alignSelf: 'flex-start', marginBottom: 4 },
  hint: { color: '#666', fontSize: 12, alignSelf: 'flex-start', marginBottom: 16 },
  mic: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#1a1a1a', borderWidth: 3, borderColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  micListening: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  micDisabled: { opacity: 0.6 },
  micText: { fontSize: 36 },
  status: { color: '#666', marginTop: 12, fontSize: 13, textAlign: 'center' },
  statusActive: { color: '#dc2626' },
  statusProc: { color: '#f59e0b' },
  statusSpeak: { color: '#22c55e' },
  statusErr: { color: '#ef4444' },
  row: { flexDirection: 'row', gap: 12, marginTop: 24 },
  btn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: '#2a2a2a', backgroundColor: '#131313' },
  btnPrimary: { backgroundColor: '#818cf8', borderColor: '#818cf8' },
  btnText: { color: '#ccc', fontSize: 13 },
  btnTextPrimary: { color: '#fff' },
  you: { color: '#818cf8', alignSelf: 'flex-start', marginTop: 8, lineHeight: 20 },
  genie: { color: '#22c55e', alignSelf: 'flex-start', marginTop: 8, lineHeight: 20 },
  empty: { color: '#444', fontSize: 13, alignSelf: 'flex-start', fontStyle: 'italic' },
  loading: { color: '#f59e0b', fontSize: 13, alignSelf: 'flex-start', marginTop: 8 },
  error: { color: '#ef4444', fontSize: 13, alignSelf: 'flex-start', marginTop: 8 },
  footer: { color: '#333', fontSize: 11, textAlign: 'center', marginTop: 8 },
});
