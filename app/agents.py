import os
import json
import datetime as dt
from dotenv import load_dotenv
from google import genai
import json
import pathlib

# --- Setup ---
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Initialize the client with explicit API key (optional)
gemini_client = None
if GEMINI_API_KEY:
    try:
        gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception as e:
        print(f"Warning: Could not initialize Gemini client: {e}")
else:
    print("Warning: GEMINI_API_KEY not set. AI features will be disabled.")

# --- Master Prompt Template ---
# NOTE: All literal braces in the schema are doubled {{ }} so .format(...) does not treat them as placeholders.
MASTER_PROMPT_TEMPLATE = """
You are an expert AI workflow architect that outputs ONLY valid JSON (UTF-8, no comments).
Your job is to generate a detailed, chronological, step-by-step checklist for what to do after a death.

## Context
- Location: {location}
- Jurisdiction terms: {jurisdiction_terms}
- Relationship: {relationship}
- Additional context: {additional_context}

## Output Format
Return a single JSON object matching this schema:

{{
  "meta": {{
    "version": "1.4",
    "generated_at": "<ISO8601 UTC timestamp>",
    "location": "<string>",
    "jurisdiction_terms": ["<string>", "..."],
    "assumptions": ["<string>", "..."],
    "disclaimer": "<brief note>"
  }},
  "steps": [
    {{
      "id": "S001",
      "order": 1,
      "title": "<short label>",
      "summary": "<concise description>",
      "details": "<2–5 sentences explaining purpose and context>",
      "deadline": {{
        "relative": "<string>",
        "absolute_if_known": "<YYYY-MM-DD or null>"
      }},
      "responsible_party": "<spouse/executor/etc.>",
      "prerequisites": ["<step-id>", "..."],
      "automation_level": "none|partial|full",
      "automation_notes": "<brief why>",

      "documents_required": [...],
      "forms": [...],
      "agencies_contacts": [...],
      "data_fields_needed": ["<field>", "..."],
      "cost_notes": "<brief>",
      "risk_notes": "<brief>",
      "evidence_of_completion": "<proof>",

      "substeps": [
        {{
          "id": "S001-1",
          "title": "<single-action subtask>",
          "description": "<exactly one concrete action>",
          "party": "human" | "agent",
          "automatable": true | false,
          "automation_reason": "<why it can/cannot be automated>",
          "automation_agent_type": "<FormAgent | DraftingAgent | SearchAgent | ComputationAgent | null>",

          "action_type": ["online", "in-person", "phone"],
          "inputs_required": ["<input>", "..."],
          "outputs": ["<output>", "..."],
          "forms": [
            {{
              "name": "<form name>",
              "url": "<https://... or null>"
            }}
          ],
          "upload_required": false,
          "upload_notes": "<what should be uploaded (if applicable)>"
        }}
      ]
    }}
  ]
}}

## Agent Type Guidelines
Assign `"automation_agent_type"` according to substep purpose:

- **FormAgent** → filling or pre-filling official forms or online submissions.
- **DraftingAgent** → writing letters, emails, notices, call scripts, summaries.
- **SearchAgent** → finding verified local or online info (funeral homes, agencies, offices).
- **ComputationAgent** → computing estate values, tax amounts, thresholds.

Substeps marked `"party": "human"` do not need `"automation_agent_type"` unless `"automatable": true`, in which case it indicates **which agent assists** in generating or pre-filling required materials.

## Content Requirements
1. Steps must be chronological (earliest first).
2. Each step must include at least one substep.
3. Each substep = single-action task done by exactly one party.
4. Main step "automation_level" derived from its substeps:
   - full → all substeps automatable
   - partial → mix of automatable/non
   - none → none automatable
5. Use concise bulletable text; full sentences in "details".
6. Must be valid JSON. No trailing commas or text outside JSON.

Now generate the JSON.
"""


def build_master_prompt(
    location: str,
    relationship: str,
    jurisdiction_terms: str = "",
    additional_context: str = "",
) -> str:
    # Ensure empty placeholders don't render as "None"
    location = location or ""
    relationship = relationship or ""
    jurisdiction_terms = jurisdiction_terms or ""
    additional_context = additional_context or ""
    return MASTER_PROMPT_TEMPLATE.format(
        location=location,
        jurisdiction_terms=jurisdiction_terms,
        relationship=relationship,
        additional_context=additional_context,
    )


def get_post_death_checklist(
    location: str,
    relationship: str,
    jurisdiction_terms: str = "",
    additional_context: str = "",
    ) -> dict:
    """
    Calls Gemini with the master prompt and returns a parsed JSON dict.
    Raises ValueError if the model does not return valid JSON.
    """

    # Check if Gemini client is available
    if gemini_client is None:
        raise ValueError(
            "Gemini API client not initialized. Please set GEMINI_API_KEY in .env file"
        )

    prompt = build_master_prompt(
        location, relationship, jurisdiction_terms, additional_context
    )


    result = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    ).text

    if not isinstance(result, str):
        raise ValueError(f"Gemini API did not return a string. Got: {type(result)} - {result}")

    if result.startswith("```json"):
        result = result[len("```json\n") : -len("```")].strip()

    data = json.loads(result.strip())        # parse to Python dict
    # output = json.dumps(data, indent=2, ensure_ascii=False)
    return data


# # --- Example call ---
# if __name__ == "__main__":
#     result = get_post_death_checklist(
#         location="London, United Kingdom",
#         relationship="spouse",
#         jurisdiction_terms="Tell Us Once, MCCD, Green Form, HMCTS Probate, Coroner",
#         additional_context="Has a will; jointly owned home; may need probate depending on asset thresholds."
#     )

#     print(json.dumps(result))

# Test


# Test code below should be guarded by __name__ == "__main__"
if __name__ == "__main__":
  with open("test.txt", "r") as f:
    test_json = f.read()
    py_obj = json.loads(test_json)  # from Python-literal string -> dict
    data = py_obj

  # print(data['meta'].keys())

  print(data['steps'][0].keys())
  # print(data['steps'][0]['substeps'][0].keys())

  for step in data['steps']:
    print(f"{step['automation_level']}: ", step['automation_notes'])

    for substep in step['substeps']:
      print(f"  {substep['automatable']}: ", substep['automation_reason'])
      if substep['automatable']:
        print(f"    Agent Type: {substep['automation_agent_type']}")

    print()
