import os
import json
import datetime as dt
from dotenv import load_dotenv
from google import genai
import json

# --- Setup ---
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Initialize the client with explicit API key
gemini_client = genai.Client(api_key=GEMINI_API_KEY)

# --- Master Prompt Template ---
# NOTE: All literal braces in the schema are doubled {{ }} so .format(...) does not treat them as placeholders.
MASTER_PROMPT_TEMPLATE = """
You are an expert assistant that outputs ONLY valid JSON (UTF-8, no comments).
Your job is to generate a detailed, chronological, step-by-step checklist for what to do after a death.

## Audience & Scope
- Location: {location}                  # e.g., "London, United Kingdom"
- Jurisdiction terms: {jurisdiction_terms}   # e.g., "Tell Us Once, MCCD, Green Form, HMCTS Probate"
- Relationship to deceased: {relationship}   # e.g., "parent", "spouse"
- Additional context: {additional_context}   # e.g., "religious funeral", "died at home", "no will", "estate likely small"

## Output Contract
Return a single JSON object matching the schema below. DO NOT include any text outside the JSON.

### JSON Schema (shape)
{{
  "meta": {{
    "version": "1.1",
    "generated_at": "<ISO8601 UTC timestamp>",
    "location": "<string>",
    "jurisdiction_terms": ["<string>", "..."],
    "assumptions": ["<string>", "..."],
    "disclaimer": "<brief note that this is not legal advice>"
  }},
  "steps": [
    {{
      "id": "S001",
      "order": 1,
      "title": "<short label for main step>",
      "summary": "<one-line checklist summary>",
      "details": "<2–5 sentence explanation of what/why>",
      "deadline": {{
        "relative": "<e.g., 'within 5 days'>",
        "absolute_if_known": "<YYYY-MM-DD or null>"
      }},
      "action_type": ["in-person", "online", "phone"],
      "responsible_party": "<who usually performs it>",
      "prerequisites": ["<step-id>", "..."],
      "automatable": true,                      # true if ANY substep is automatable
      "automation_reason": "<why or why not>",
      "ai_tasks": [
        {{
          "name": "<task>",
          "inputs_required": ["<field>", "..."],
          "outputs": ["<artifact>", "..."]
        }}
      ],
      "human_tasks": ["<short imperative>", "..."],
      "documents_required": [
        {{
          "name": "<document>",
          "source": "<who issues it>",
          "notes": "<brief>"
        }}
      ],
      "forms": [
        {{
          "name": "<form or portal>",
          "url": "<https://... or null>",
          "submission": "<online/in-person/post>",
          "notes": "<brief>"
        }}
      ],
      "agencies_contacts": [
        {{
          "name": "<agency/office>",
          "phone": "<tel or null>",
          "url": "<https://... or null>",
          "address": "<address or null>"
        }}
      ],
      "data_fields_needed": ["<field>", "..."],
      "cost_notes": "<brief>",
      "risk_notes": "<brief>",
      "evidence_of_completion": "<proof of completion>",
      "substeps": [
        {{
          "id": "S001-1",
          "title": "<concise subtask label>",
          "description": "<one-line description>",
          "automatable": true,
          "automation_reason": "<why/why not>",
          "action_type": ["online", "in-person", "phone"],
          "forms": [
            {{
              "name": "<form name>",
              "url": "<https://... or null>"
            }}
          ],
          "ai_tasks": [
            {{
              "name": "<AI subtask>",
              "inputs_required": ["<field>", "..."],
              "outputs": ["<artifact>", "..."]
            }}
          ],
          "human_tasks": ["<short imperative>", "..."]
        }}
      ]
    }}
  ]
}}

## Content Requirements
1) Steps MUST be in strict chronological order (earliest first).
2) Each main step represents a key milestone; include substeps for granular actions (e.g., data gathering, pre-filling forms, booking).
3) Mark a main step's "automatable" = true if ANY of its substeps are automatable.
4) Mark "automatable" = false for substeps requiring physical attendance, identity verification, signatures, or sensitive personal choices.
5) Include "automation_reason" for both steps and substeps.
6) Use official local terms, offices, portals, and time limits for {location}.
7) Keep "title" and "summary" concise; put explanations in "details" (2–5 sentences).
8) Prefer official portals (provide URLs) and specify "submission" method where applicable.
9) Include conditions in "details" where relevant (e.g., probate need depends on thresholds/ownership).
10) The output MUST be valid JSON per the schema (no comments, no markdown fences, no extra text).

## Validation
- Output MUST be valid JSON and self-contained.
- No trailing commas.
- Dates should be ISO 8601 if specific.

Now produce the JSON.
"""


def build_master_prompt(location: str,
                        relationship: str,
                        jurisdiction_terms: str = "",
                        additional_context: str = "") -> str:
    # Ensure empty placeholders don't render as "None"
    location            = location or ""
    relationship        = relationship or ""
    jurisdiction_terms  = jurisdiction_terms or ""
    additional_context  = additional_context or ""
    return MASTER_PROMPT_TEMPLATE.format(
        location=location,
        jurisdiction_terms=jurisdiction_terms,
        relationship=relationship,
        additional_context=additional_context
    )

def get_post_death_checklist(location: str,
                             relationship: str,
                             jurisdiction_terms: str = "",
                             additional_context: str = "") -> dict:
    """
    Calls Gemini with the master prompt and returns a parsed JSON dict.
    Raises ValueError if the model does not return valid JSON.
    """
    prompt = build_master_prompt(location, relationship, jurisdiction_terms, additional_context)

    result = gemini_client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    ).text


    result = result[len("```json\n") : -len("```")].strip() if result.startswith("```json") else result

    data = json.loads(result.strip())        # parse to Python dict
    # output = json.dumps(data, indent=2, ensure_ascii=False)
    return data


# --- Example call ---
if __name__ == "__main__":
    result = get_post_death_checklist(
        location="London, United Kingdom",
        relationship="spouse",
        jurisdiction_terms="Tell Us Once, MCCD, Green Form, HMCTS Probate, Coroner",
        additional_context="Has a will; jointly owned home; may need probate depending on asset thresholds."
    )
    print(json.dumps(result))
