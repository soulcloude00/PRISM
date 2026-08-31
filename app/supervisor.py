# supervisor.py — Databricks App: 3 Genies + Lakebase + Voice hook
from databricks.sdk import WorkspaceClient
import psycopg2

w = WorkspaceClient()

def ask_prism(question: str):
    q = question.lower()
    if "lab" in q:
        return w.genie.ask(space_id="GENIE-LABS-ID", question=question)
    elif "at-risk" in q or "infosys" in q:
        return w.genie.ask(space_id="GENIE-SKILLS-ID", question=question)
    else:
        r1 = w.genie.ask(space_id="GENIE-SKILLS-ID", question=question)
        r2 = w.genie.ask(space_id="GENIE-LABS-ID", question=question)
        return f"{r1}\n\n**Lab fix:** {r2}"

# Lakebase write-back (Postgres inside lakehouse)
def book_lab(student_id, lab_id):
    conn = psycopg2.connect("host=prism-lakebase dbname=prism")
    cur = conn.cursor()
    cur.execute("INSERT INTO prism.app.bookings (student_id, lab_id, ts) VALUES (%s,%s,now())", (student_id, lab_id))
    conn.commit()
    return "Booked"

# Voice hook: Cartesia STT -> Genie -> Rumik TTS
# 1. POST https://api.cartesia.ai/stt with audio -> text
# 2. ask_prism(text)
# 3. POST https://api.rumik.ai/tts with Genie text -> audio, play
# Demo fallback: if TTS fails, show text
