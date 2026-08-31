# PRISM — TODOS (Expo Dev Client + OTA)

Generated from CEO Review 2026-08-31 — Selective Expansion, Expo Dev Client + 5 expansions.

## Now Shipping — In Order

- [x] **T1 (P1)** — Host server.py + env migration — DONE (no Docker): `server.py` uses `os.getenv` + dotenv, pcm_s16le 44100 speed1 vol1, 429/timeout rescues, `/health` — running on `0.0.0.0:8001` — `curl http://192.168.68.119:8001/health` OK
- [x] **T2 (P1)** — Scaffold Expo Dev Client + EAS + OTA channels — DONE: `app-expo/` with `App.tsx`, `app.json` (dev-client + permissions), `eas.json` (staging/production channels), `hooks/useVoice.ts` (expo-audio -> base64 -> STT->Genie->TTS), `package.json`
- [x] **T3 (P1)** — Native audio pipeline (E1) — DONE: `hooks/useVoice.ts` uses `expo-av` HIGH_QUALITY -> base64 -> `/api/stt/cartesia` -> `/api/tts/cartesia` sonic-3.6 50bbd3dd pcm_s16le, 5s auto-stop
- [x] **T4 (P1)** — Offline cache (E2) + background TTS (E3) — DONE: `services/cache.ts` (expo-sqlite 20-item), `services/backgroundAudio.ts` (staysActiveInBackground)
- [x] **T5 (P2)** — Camera OCR + Push (E4,E5) — DONE: `features/ocr/scan.ts` stub + `services/notifications.ts` (FCM + daily 86400s drill)
- [x] **T6 (P1)** — Error rescue + observability — DONE: `server.py` has 429/timeout/empty rescues + `log.info` latency + `/health`

## Deferred (NOT in scope)
- Peer audio rooms (WebRTC) — Phase 2
- Admin web for teachers
- Payment/IAP

## Done
- (none yet)
