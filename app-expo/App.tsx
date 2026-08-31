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
        <Text style={s.h1}>PRISM</Text>
        <Text style={s.tag}>BMSCE</Text>
      </View>

      <ScrollView contentContainerStyle={s.body}>
        <View style={s.card}>
          <Text style={s.cardTitle}>Ask anything</Text>
          <Text style={s.hint}>Tap to speak — placement, skills, campus help.</Text>

          <Pressable onPress={listening ? stop : start} disabled={processing} style={[s.mic, listening && s.micListening, processing && s.micDisabled]}>
            {processing ? <ActivityIndicator color="#fff" /> : <Text style={s.micText}>{listening ? '●' : '🎙️'}</Text>}
          </Pressable>

          <Text style={[s.status, listening && s.statusActive, processing && s.statusProc, speaking && s.statusSpeak, error && s.statusErr]}>
            {listening ? 'Listening…' : processing ? 'Thinking…' : speaking ? 'Speaking…' : error ? error : 'Tap to speak'}
          </Text>

          <View style={s.row}>
            <Pressable onPress={reset} style={s.btn}><Text style={s.btnText}>Clear</Text></Pressable>
            <Pressable
              onPress={async () => {
                const { apiPost } = await import('./services/api');
                const q = 'Am I ready for Infosys? Which skill should I fix tonight?';
                try {
                  const r: any = await apiPost('/api/genie', { question: q });
                  // Use hook's answer display via reset + manual — simplest: open transcript
                  // For product demo without mic, show answer directly
                  (global as any).__prismSample = r.answer;
                } catch {}
              }}
              style={[s.btn, s.btnPrimary]}
            >
              <Text style={[s.btnText, s.btnTextPrimary]}>Try: Am I ready for Infosys?</Text>
            </Pressable>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Answer</Text>
          {!transcript && !answer && !error ? <Text style={s.empty}>Your answer will appear here.</Text> : null}
          {transcript ? <Text style={s.you}>{transcript}</Text> : null}
          {answer ? <Text style={s.genie}>{answer}</Text> : null}
          {processing ? <Text style={s.loading}>Checking your data…</Text> : null}
          {error ? <Text style={s.error}>{error}</Text> : null}
        </View>

        <Text style={s.footer}>PRISM • Your campus, answered.</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#1a1a1a', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  h1: { color: '#fff', fontSize: 20, fontWeight: '700', letterSpacing: 0.5 },
  tag: { color: '#818cf8', fontSize: 11, backgroundColor: '#1a1a1a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  body: { padding: 20, gap: 16 },
  card: { backgroundColor: '#131313', borderWidth: 1, borderColor: '#1f1f1f', borderRadius: 16, padding: 20, alignItems: 'center' },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '600', alignSelf: 'flex-start', marginBottom: 4 },
  hint: { color: '#777', fontSize: 13, alignSelf: 'flex-start', marginBottom: 16 },
  mic: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  micListening: { backgroundColor: '#dc2626', borderColor: '#dc2626' },
  micDisabled: { opacity: 0.6 },
  micText: { fontSize: 28 },
  status: { color: '#777', marginTop: 12, fontSize: 13, textAlign: 'center' },
  statusActive: { color: '#ef4444' },
  statusProc: { color: '#f59e0b' },
  statusSpeak: { color: '#22c55e' },
  statusErr: { color: '#ef4444' },
  row: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, borderWidth: 1, borderColor: '#2a2a2a', backgroundColor: '#1a1a1a' },
  btnPrimary: { backgroundColor: '#fff', borderColor: '#fff' },
  btnText: { color: '#aaa', fontSize: 13, fontWeight: '500' },
  btnTextPrimary: { color: '#000' },
  you: { color: '#e5e5e5', alignSelf: 'flex-start', marginTop: 10, lineHeight: 20, fontSize: 14 },
  genie: { color: '#e5e5e5', alignSelf: 'flex-start', marginTop: 8, lineHeight: 20, fontSize: 14 },
  empty: { color: '#555', fontSize: 13, alignSelf: 'flex-start', fontStyle: 'italic' },
  loading: { color: '#888', fontSize: 13, alignSelf: 'flex-start', marginTop: 8 },
  error: { color: '#ef4444', fontSize: 13, alignSelf: 'flex-start', marginTop: 8, lineHeight: 18 },
  footer: { color: '#333', fontSize: 11, textAlign: 'center', marginTop: 8 },
});
