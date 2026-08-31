"""
PRISM — Little Demo: Test every API before Sept 1
Run: python test_all_apis.py
Needs: DATABRICKS_HOST, DATABRICKS_TOKEN, CARTESIA_API_KEY, RUMIK_API_KEY (set in .env or export)
If keys missing, it mocks and still teaches you the flow.
"""

import os, json, requests

def test_databricks_vector_search():
    print("\n1. Databricks Vector Search (Mosaic AI)")
    print("   What: Finds similar skills/JDs by meaning, not keyword")
    print("   SQL: CREATE VECTOR SEARCH INDEX prism.gold.jds_index ON ...")
    print("   Call: POST https://<workspace>/api/2.0/vector-search/indexes/query")
    print("   → Try in Databricks SQL editor first, then via API. Mock: 'Docker' finds 'containerization'")

def test_databricks_genie():
    print("\n2. Databricks Genie (Conversation API)")
    print("   What: You ask English, Genie writes SQL + shows chart")
    host = os.getenv("DATABRICKS_HOST", "https://your-workspace.cloud.databricks.com")
    token = os.getenv("DATABRICKS_TOKEN", "")
    space_id = os.getenv("GENIE_SPACE_ID", "GENIE-SKILLS-ID")
    q = "Am I ready for Infosys? Which lab tonight fixes my gap?"
    print(f"   Example Q: {q}")
    print(f"   Call: POST {host}/api/2.0/genie/spaces/{space_id}/conversations")
    if not token:
        print("   → No token set. Mock response:")
        print("   → Genie: Missing Docker, System Design. Lab 3B free 19:00-22:00, 3 seniors used it. [cited]")
    else:
        try:
            r = requests.post(f"{host}/api/2.0/genie/spaces/{space_id}/conversations",
                headers={"Authorization": f"Bearer {token}"},
                json={"question": q}, timeout=10)
            print(f"   Status {r.status_code}: {r.text[:400]}")
        except Exception as e:
            print(f"   Error: {e} (check host/token)")

def test_cartesia_stt():
    print("\n3. Cartesia SST (ears)")
    print("   What: Your voice -> text")
    key = os.getenv("CARTESIA_API_KEY", "")
    print("   Call: POST https://api.cartesia.ai/stt -H 'X-API-Key: ...' --data-binary @audio.wav")
    if not key:
        print("   → No CARTESIA_API_KEY. Mock: audio.wav ('Test me on System Design') -> text 'Test me on System Design'")
    else:
        print("   → Key found, try: curl -X POST https://api.cartesia.ai/stt -H 'X-API-Key: $CARTESIA_API_KEY' --data-binary @demo/audio.wav")

def test_rumik_tts():
    print("\n4. Rumik TTS (mouth)")
    print("   What: Genie text -> voice (Kannada/Hindi/English)")
    key = os.getenv("RUMIK_API_KEY", "")
    text = "You’re missing Docker. Lab 3B is free tonight 7 to 10."
    print(f"   Input text: {text}")
    print("   Call: POST https://api.rumik.ai/tts -H 'Authorization: Bearer ...' -d '{\"text\": \"...\", \"voice\": \"kannada\"}'")
    if not key:
        print("   → No RUMIK_API_KEY. Mock: Would play audio 'You’re missing Docker...' in Kannada voice")
    else:
        try:
            r = requests.post("https://api.rumik.ai/tts", headers={"Authorization": f"Bearer {key}"}, json={"text": text, "voice": "kannada"}, timeout=10)
            print(f"   Status {r.status_code}: {r.text[:400]}")
        except Exception as e:
            print(f"   Error: {e} (check rumik.ai docs for exact endpoint)")

def test_lakebase():
    print("\n5. Lakebase (Postgres inside lakehouse)")
    print("   What: Live writes — when Genie says Lab 3B free, App does INSERT")
    print("   SQL: INSERT INTO prism.app.bookings (student_id, lab_id, ts) VALUES ('you','LAB-3B', now())")
    print("   → Test in Databricks SQL editor or psycopg2. Mock: Booked!")

if __name__ == "__main__":
    print("PRISM — Test every API (learn the flow, even without keys)")
    test_databricks_vector_search()
    test_databricks_genie()
    test_cartesia_stt()
    test_rumik_tts()
    test_lakebase()
    print("\nDone. Set keys in .env and rerun to hit real APIs. Next: open demo.html for voice test.")
