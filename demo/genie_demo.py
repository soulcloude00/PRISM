"""
PRISM Genie Demo — Bring Genie to your demo (works on Free Edition)
Tested live: Bakehouse Genie returns 151 females / 149 males
Run: python genie_demo.py
"""
from databricks.sdk import WorkspaceClient

w = WorkspaceClient(
    host="https://dbc-42ea286b-3fd9.cloud.databricks.com",
    token="YOUR_DATABRICKS_TOKEN_REDACTED"
)

def ask_genie(space_id: str, question: str):
    print(f"\nQ: {question}")
    conv = w.genie.start_conversation_and_wait(space_id=space_id, content=question)
    # conv contains the answer in attachments
    for att in conv.attachments:
        if att.text:
            print(f"A: {att.text.content}")
        if att.query:
            print(f"SQL: {att.query.query}")
    return conv

# Test with Bakehouse (works now)
print("Testing Bakehouse Genie...")
ask_genie("YOUR_GENIE_SPACE_ID_REDACTED", "What is the distribution of customer gender?")

# For PRISM: create space PRISM-Skills and use its ID here
# PRISM_SPACE_ID = "YOUR_NEW_PRISM_SPACE_ID"
# ask_genie(PRISM_SPACE_ID, "Who is at-risk for Infosys next month and why?")
# Then pipe to Cartesia/Rumik:
# cartesia_text = "Who is at-risk..." -> Genie -> rumik.speak(genie_answer)
