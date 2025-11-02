import os
import pathlib
import json
import re
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pprint import pprint

from .random_data import generate_random_estate_data
from .send_emails import send_emails

# --- Setup ---
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Initialize the client with explicit API key
gemini_client = genai.Client(api_key=GEMINI_API_KEY)


def extract_json_from_text(text: str) -> str | None:
    """
    Tries to find and extract a JSON array or object from a text string.
    This is used to clean up model output that might be wrapped in Markdown.
    """
    # Pattern to find a JSON object or array, even if wrapped in Markdown
    # This looks for the first '{' or '[' and the last '}' or ']'
    json_match = re.search(r"(\{.*\})|(\[.*\])", text, re.DOTALL)

    if json_match:
        # Return the first non-empty group (either the object or the array)
        return json_match.group(1) or json_match.group(2)

    return None


def draft_emails(data: dict, user_data: dict) -> list:
    """Drafts the emails to be sent.

    Args:
        data (dict): the tasks dictionary
        user_data (dict): a dictionary containing personalised information about the deceased

    Returns:
        list: a list of drafted emails
    """
    system_prompt = r"""
You are a "DraftingAgent," an expert AI assistant for estate administration. Your role is to help an Executor by drafting necessary documents.

You will be provided with a JSON payload containing two main keys:
1.  `task_definition`: This is the 'substep' JSON. It defines your specific goal, what inputs are required (e.g., "Beneficiary names"), and what output you must produce.
2.  `user_data`: This is the *entire* JSON database record. It contains all available data (all beneficiaries, all organizations, all executor details, etc.).

**Your process is:**
1.  **Analyze `task_definition`:** Read the "title" and "description" to understand your current job (e.g., "Draft notification email," "Obtain receipts from beneficiaries").
2.  **Analyze `user_data`:** Scan the entire `user_data` object to find the data required by the `task_definition.inputs_required`.
3.  **Determine Cardinality:** You must determine if this task requires generating one document or multiple documents.
    * For example, "Draft notification letters" requires you to find *all* organizations in `user_data["purpose for notifications"]` and generate one draft *for each*.
    * "Obtain receipts from beneficiaries" requires you to find *all* beneficiaries in `user_data.beneficiaries` and generate one draft *for each*.
4.  **Generate Output:** You MUST respond with a single, valid JSON array `[]`. Each item in the array must be a JSON object with two keys:
    * `"document_name"`: A unique name for the draft (e.g., "Notification for Mainstream Bank", "Receipt for Robert John Smith").
    * `"draft"`: The full text of the drafted document (e.g., "Subject: Notification of Death...\n\n...").

**Rules:**
* The tone must be professional, formal, and appropriate for the specific task.
* Do not add any conversational text (e.g., "Here is the draft...").
* **Your entire response must be ONLY the raw JSON array.**
* **Do NOT wrap the JSON in Markdown backticks (e.g., ```json ... ```) or any other formatting.**
* **The raw text of your response must start with `[` and end with `]`.**
"""

    results = []

    for steps in data["steps"]:
        if "substeps" in steps.keys():
            for substeps in steps["substeps"]:
                if substeps.get("automation_agent_type") == "DraftingAgent":
                    payload = {
                        "task_definition": {
                            "id": substeps["id"],
                            "title": substeps["title"],
                            "description": substeps["description"],
                            "inputs_required": substeps["inputs_required"],
                        },
                        "user_data": user_data,
                    }
                    contents_for_api = [
                        f"Please execute the task defined in `task_definition` using the complete `user_data` record. \n\n {json.dumps(payload, indent=2)}"
                    ]
                    response = gemini_client.models.generate_content(
                        model="gemini-2.5-flash",
                        config=types.GenerateContentConfig(
                            system_instruction=system_prompt
                        ),
                        contents=contents_for_api,
                    )

                    try:
                        raw_response = response.text

                        # Use the new helper to clean the response
                        json_string = extract_json_from_text(raw_response)

                        if not json_string:
                            print(
                                "--- ERROR: Could not find any JSON in the model's response ---"
                            )
                            print(f"Raw response: {raw_response}")
                            continue  # Skip to the next task

                        # Now, parse the *clean* string
                        drafts = json.loads(json_string)

                        # ... rest of your code for printing drafts ...
                        for draft in drafts:
                            print(
                                f"--- Generated Draft: {draft.get('document_name', 'Untitled')} ---"
                            )
                            print(draft.get("draft", "No draft content."))
                            print("-----------------------------------")
                            results.append(
                                {
                                    "heading": draft.get("document_name"),
                                    "body": draft.get("draft"),
                                }
                            )

                    except json.JSONDecodeError:
                        print("--- ERROR: Failed to decode the extracted JSON ---")
                        print(f"Extracted string was: {json_string}")
                    except Exception as e:
                        print(f"An unexpected error occurred: {e}")
                    # try:
                    #     # First, strip any potential whitespace or newlines from the start/end
                    #     cleaned_response = response.text.strip()

                    #     # Optional: A simple check to remove markdown if it *still* appears
                    #     if cleaned_response.startswith("```json"):
                    #         cleaned_response = cleaned_response[
                    #             7:
                    #         ].strip()  # Remove ```json
                    #     if cleaned_response.endswith("```"):
                    #         cleaned_response = cleaned_response[
                    #             :-3
                    #         ].strip()  # Remove ```

                    #     generated_drafts = json.loads(cleaned_response)
                    #     for draft in generated_drafts:
                    #         print(
                    #             f"--- Generated Draft: {draft.get('document_name')} ---"
                    #         )
                    #         print(draft.get("draft"))
                    #         print("-----------------------------------")

                    #         results.append(
                    #             {
                    #                 "heading": draft.get("document_name"),
                    #                 "body": draft.get("draft"),
                    #             }
                    #         )

                    # except json.JSONDecodeError:
                    #     print("--- ERROR: Model did not return valid JSON ---")
                    #     print(f"Raw response: {response.text}")

                    # except Exception as e:
                    #     print(f"An unexpected error occurred: {e}")

    return results


if __name__ == "__main__":
    with open(str(pathlib.Path(__file__).parent / "temp.txt")) as f:
        data = draft_emails(
            json.load(f),
            generate_random_estate_data(),
            #     {
            #         "deceased_name": "John Doe",
            #         "date of passing": "2025-08-19",
            #         "date of death certificate issuance": "2025-08-21",
            #         "relevant account numbers": {
            #             "Mainstream Bank": {
            #                 "Chequing Account": "(00123-456789)",
            #                 "Savings Account": "(00123-987654)",
            #             },
            #             "Capital Investments": {"Portfolio Account": "(CI-45882B)"},
            #             "Premier Credit": {"Visa Card": "(4500-1234-5678-9012)"},
            #             "National Pension Fund": {"Member ID": "(NPF-JSMITH-72)"},
            #         },
            #         "estate executors' details": [
            #             {
            #                 "Name": "Jane Mary Smith",
            #                 "relationship": "Spouse",
            #                 "Address": "123 Oak Avenue, Anytown, AT 45678",
            #                 "Phone": "(555) 123-4567",
            #                 "Email": "jane.m.smith@example.com",
            #             },
            #         ],
            #         "purpose for notifications": {
            #             "Mainstream Bank": "To formally notify of the death, freeze all accounts in the deceased's sole name, and request a final balance statement for all held accounts as of 15-Oct-2025.",
            #             "Capital Investments": "To notify of the death and request a date-of-death valuation for portfolio CI-45882B for probate purposes.",
            #             "Premier Credit": "To cancel card 4500-1234-5678-9012 and receive a final statement of account.",
            #             "National Pension Fund": "To notify of the member's passing and to formally begin the process of claiming any spousal or death benefits.",
            #         },
            #         "beneficiaries": [
            #             {
            #                 "name": "Jane Mary Smith",
            #                 "relationship": "spouse",
            #                 "assets": "100% of the National Pension Fund (NPF-JSMITH-72); 50% of Mainstream Bank Savings Account (00123-987654); 100% of the primary residence at 123 Oak Avenue.",
            #             },
            #             {
            #                 "name": "Robert John Smith",
            #                 "relationship": "son",
            #                 "assets": "25% of Mainstream Bank Savings Account (00123-987654); 50% of Capital Investments Portfolio (CI-45882B).",
            #             },
            #             {
            #                 "name": "Emily Sarah Parker",
            #                 "relationship": "daughter",
            #                 "assets": "25% of Mainstream Bank Savings Account (00123-987654); 50% of Capital Investments Portfolio (CI-45882B).",
            #             },
            #         ],
            #     },
        )

        # send_emails(data, [""] * len(data))
