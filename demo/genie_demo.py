"""
PRISM Genie Demo — Bring Genie to your demo (works on Free Edition)
Run: DEMO_MODE=true python genie_demo.py  # offline mock
     or set DATABRICKS env and run live
"""
import os
from dotenv import load_dotenv
from databricks.sdk import WorkspaceClient

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

HOST = os.getenv("DATABRICKS_HOST", "")
TOKEN = os.getenv("DATABRICKS_TOKEN", "")
GENIE_SPACE_ID = os.getenv("GENIE_SPACE_ID", "")

if not HOST or not TOKEN:
    print("No DATABRICKS_HOST/TOKEN in env — set demo/.env (see .env.example) or use DEMO_MODE")
    print("Mock demo: 'What is the distribution of customer gender?' -> 52% Male, 45% Female [prism.gold.students]")
    raise SystemExit(0)

w = WorkspaceClient(host=HOST, token=TOKEN)

def ask_genie(space_id: str, question: str):
    print(f"\nQ: {question}")
    conv = w.genie.start_conversation_and_wait(space_id=space_id, content=question)
    for att in conv.attachments:
        if att.text:
            print(f"A: {att.text.content}")
        if att.query:
            print(f"SQL: {att.query.query}")
    return conv

# Test — uses GENIE_SPACE_ID from env, fallback to placeholder for docs
space = GENIE_SPACE_ID or "your_genie_space_id_here"
print(f"Testing Genie space {space[:8]}...")
ask_genie(space, "What is the distribution of customer gender?")

# For PRISM:
# ask_genie(space, "Who is at-risk for Infosys next month and why?")
