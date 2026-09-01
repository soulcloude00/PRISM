# Changelog

## 0.1.0 — 2026-09-01

### Hackathon ship — PRISM BMSCE Track A

**Voice pipeline**
- Cartesia ink-whisper STT + sonic-3.6 TTS (voice 50bbd3dd) via curl bypass for LibreSSL
- Expo Dev Client (`expo-av` HIGH_QUALITY) -> base64 -> STT -> Genie -> TTS, 5s auto-stop, 429/timeout rescues
- Web fallback: MediaRecorder webm -> FileReader base64
- Demo mock: `DEMO_MODE=true` serves canned Genie answers when offline / rate-limited

**App**
- `app-expo/App.tsx` — mic UI, listening/processing/speaking states, sample Q button, answer card with citations, copy debug logs
- Offline cache `services/cache.ts` (expo-sqlite 20-item), background audio `staysActiveInBackground`
- Camera OCR stub + push notifications (FCM daily drill)

**Backend**
- `demo/server.py` Flask proxy: `/health`, `/api/genie`, `/api/stt/cartesia`, `/api/tts/cartesia`, env via `dotenv`, latency logs
- `app/supervisor.py` Databricks App: 3 Genie sharding (Skills/Labs) + Lakebase write-back

**Data**
- `notebooks/01_medallion.py` Bronze/Silver/Gold + Skills Graph `skill->course->lab->company`
- Vector Search + Genie Spaces `genie/*.json` + Lakebase bookings

**Fixes**
- expo-clipboard added, metro config restored, watchman ignore, package-lock synced
