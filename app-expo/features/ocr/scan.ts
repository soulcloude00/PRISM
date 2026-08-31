// T5 E4: Camera OCR -> Genie -> flashcards (stub, wire to expo-camera + ML Kit)
export async function scanToFlashcards(base64Image: string, apiUrl: string) {
  // 1. OCR via Google ML Kit (native) or fallback: send to server /api/ocr (to build)
  // 2. Genie: "Summarize these notes into 5 flashcards"
  const res = await fetch(`${apiUrl}/api/genie`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: `Create 5 flashcards from: ${base64Image.slice(0, 200)}...` }),
  }).then(r => r.json());
  return res.answer;
}
