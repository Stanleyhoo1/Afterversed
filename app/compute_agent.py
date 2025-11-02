import os
import pathlib
import json
import datetime as dt
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pprint import pprint

from .random_data import generate_random_financial_data

# --- Setup ---
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Initialize the client with explicit API key
gemini_client = genai.Client(api_key=GEMINI_API_KEY)


def format_general_report(result: dict) -> str:
    """
    Formats a human-readable report string from the
    GENERALIZED JSON output format.
    """
    report_lines = []
    try:
        report_lines.append(f"--- {result.get('task_title', 'General Report')} ---")

        # --- Final Decision ---
        final_decision = result.get("final_decision", "N/A")
        report_lines.append(f"Decision: {final_decision}")

        # --- Loop through all report sections ---
        for section in result.get("report_sections", []):
            title = section.get("title", "Section")
            s_type = section.get("type", "text")
            content = section.get("content", "N/A")

            report_lines.append(f"\n{title}:")

            if s_type == "text":
                report_lines.append(f"\t{content}")

            elif s_type == "key_value":
                for key, value in content.items():
                    report_lines.append(f"\t- {key}: {value}")

            elif s_type == "list":
                for item in content:
                    report_lines.append(f"\t- {item}")

            else:
                # Fallback for unknown types
                report_lines.append(f"\t{content}")

        return "\n".join(report_lines)

    except Exception as e:
        # Fallback to raw JSON if formatting fails
        return f"--- ERROR: Failed to format report ---\n{json.dumps(result, indent=2)}\nError: {e}"


def compute_figures(data: dict, user_data: dict) -> list:
    """Computes necessary mathematical computation.

    Args:
        data (dict): the tasks dictionary
        user_data (dict): a dictionary containing personalised information about the deceased

    Returns:
        list: a list of results
    """
    system_prompt = r"""
You are a "ComputationAgent," an expert AI accountant specializing in UK estate administration and probate. Your role is to perform complex financial calculations and logical assessments.

You will be provided with a JSON payload containing two main keys:
1.  `task_definition`: This is the 'substep' JSON. It defines your specific goal, what inputs are required (e.g., "Full estate inventory"), and what output you must produce.
2.  `user_data`: This is the *entire* JSON database record. It contains all available financial data for the estate.

**Your process is:**
1.  **Analyze `task_definition`:** Understand your current job (e.g., "Calculate total estate value," "Calculate IHT").
2.  **Analyze `user_data`:** Scan the `user_data` to find all the financial data required by the `task_definition.inputs_required`.
3.  **Perform Calculations:** Execute the required financial logic. You must *show your work*.
4.  **Generate Output:** You MUST respond with a single, valid JSON object in the following specific, generalized format.

**MANDATORY OUTPUT FORMAT:**
Your response MUST be a JSON object `{}` with the following keys:
{
  "task_id": "The 'id' from the task_definition (e.g., S006-3)",
  "task_title": "The 'title' from the task_definition",
  "final_decision": "A single, clear string for the main output (e.g., 'Probate IS Required', 'Total IHT Due: £12,000')",
  "report_sections": [
    {
      "title": "The title for this section of the report (e.g., 'Total Value for Probate', 'Calculation Details')",
      "type": "The type of data: 'key_value', 'list', or 'text'",
      "content": "The data for this section. See format rules below."
    }
  ]
}

**Rules for "content" in `report_sections`:**
* If `type` is `"key_value"`, `content` MUST be a JSON object: `{"Total Value": "£497,000", "Reason": "..."}`
* If `type` is `"list"`, `content` MUST be a JSON array of strings: `["Item 1: £100", "Item 2: £200"]`
* If `type` is `"text"`, `content` MUST be a single string: `"The total value of solely-owned assets (£497,000) exceeds all known thresholds."`

**FINAL RULES:**
* Your tone is analytical and precise.
* Do not add any conversational text (e.g., "Here is the calculation...").
* **Your entire response must be ONLY the raw JSON object.**
* **Do NOT wrap the JSON in Markdown backticks (e.g., ```json ... ```) or any other formatting.**
* **The raw text of your response must start with `{` and end with `}`.**
"""

    results = []

    for steps in data["steps"]:
        if "substeps" in steps.keys():
            for substeps in steps["substeps"]:
                if substeps.get("automation_agent_type") == "ComputationAgent":
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

                    # First, strip any potential whitespace or newlines from the start/end
                    cleaned_response = response.text.strip()

                    # Optional: A simple check to remove markdown if it *still* appears
                    if cleaned_response.startswith("```json"):
                        cleaned_response = cleaned_response[
                            7:
                        ].strip()  # Remove ```json
                    if cleaned_response.endswith("```"):
                        cleaned_response = cleaned_response[:-3].strip()  # Remove ```

                    computations = json.loads(cleaned_response)
                    print(f"\n===== PROCESSING TASK: {substeps['title']} =====")
                    try:
                        print(f"--- Result for {substeps['id']} ---")

                        # Use our NEW general printer for ALL tasks
                        output = format_general_report(computations)
                        print(output)
                        results.append({"id": substeps["id"], "body": output})

                        print("-----------------------------------")

                    except Exception as e:
                        print(f"--- ERROR: Failed to process task {substeps['id']} ---")
                        print(f"Details: {e}")
    return results


if __name__ == "__main__":
    with open(str(pathlib.Path(__file__).parent / "temp.txt")) as f:
        pprint(
            compute_figures(
                json.load(f),
                generate_random_financial_data(),
                # {
                #     "deceased_details": {
                #         "name": "John Alistair Smith",
                #         "date_of_passing": "2025-10-15",
                #     },
                #     "executor_details": {
                #         "name": "Jane Mary Smith",
                #         "relationship": "Spouse",
                #     },
                #     "assets": {
                #         "real_estate": [
                #             {
                #                 "id": "prop1",
                #                 "address": "123 Oak Avenue, Anytown, AT 45678",
                #                 "ownership": "Jointly Owned (with Jane Mary Smith)",
                #                 "value_at_death": 500000,
                #                 "passes_to_survivor": True,
                #                 "notes": "Passes to spouse Jane Smith automatically.",
                #             },
                #             {
                #                 "id": "prop2",
                #                 "address": "22b Baker Street, London, W1U 3BW",
                #                 "ownership": "Solely Owned",
                #                 "value_at_death": 350000,
                #                 "passes_to_survivor": False,
                #                 "notes": "Forms part of the probate estate.",
                #             },
                #         ],
                #         "bank_accounts": [
                #             {
                #                 "id": "bank1",
                #                 "institution": "Mainstream Bank",
                #                 "type": "Chequing Account",
                #                 "account_number": "00123-456789",
                #                 "ownership": "Solely Owned",
                #                 "value_at_death": 12000,
                #                 "passes_to_survivor": False,
                #             },
                #             {
                #                 "id": "bank2",
                #                 "institution": "Mainstream Bank",
                #                 "type": "Savings Account",
                #                 "account_number": "00123-987654",
                #                 "ownership": "Jointly Owned (with Jane Mary Smith)",
                #                 "value_at_death": 80000,
                #                 "passes_to_survivor": True,
                #             },
                #         ],
                #         "investments": [
                #             {
                #                 "id": "inv1",
                #                 "institution": "Capital Investments",
                #                 "type": "Portfolio Account",
                #                 "account_number": "CI-45882B",
                #                 "ownership": "Solely Owned",
                #                 "value_at_death": 120000,
                #                 "passes_to_survivor": False,
                #             }
                #         ],
                #         "pensions": [
                #             {
                #                 "id": "pension1",
                #                 "institution": "National Pension Fund",
                #                 "type": "Defined Benefit",
                #                 "account_number": "NPF-JSMITH-72",
                #                 "notes": "Passes outside of estate to nominated beneficiary (Jane Smith). Not included in IHT or probate value.",
                #             }
                #         ],
                #         "personal_chattels": {
                #             "id": "chattels1",
                #             "description": "Art, furniture, and personal belongings",
                #             "ownership": "Solely Owned",
                #             "value_at_death": 15000,
                #             "passes_to_survivor": False,
                #         },
                #     },
                #     "liabilities": {
                #         "mortgages": [
                #             {
                #                 "id": "mort1",
                #                 "property_id": "prop2",
                #                 "provider": "City Mortgage Corp",
                #                 "outstanding_balance": 100000,
                #             }
                #         ],
                #         "credit_cards": [
                #             {
                #                 "id": "cc1",
                #                 "provider": "Premier Credit",
                #                 "outstanding_balance": 2500,
                #             }
                #         ],
                #         "utility_bills": 450,
                #         "funeral_costs": 4000,
                #     },
                #     "post_death_transactions": {
                #         "assets_sold": [
                #             {
                #                 "asset_id": "inv1",
                #                 "description": "Capital Investments Portfolio",
                #                 "value_at_death": 120000,
                #                 "sale_price": 145000,
                #                 "costs_of_sale": 1500,
                #             }
                #         ],
                #         "administration_expenses": {
                #             "legal_fees": 3000,
                #             "probate_fees": 273,
                #         },
                #         "income_received_post_death": {"bank_interest": 350},
                #     },
                #     "tax_and_will_details": {
                #         "probate_thresholds": {
                #             "hmcts": 5000,
                #             "mainstream_bank": 50000,
                #             "capital_investments": 25000,
                #         },
                #         "iht_thresholds": {
                #             "nil_rate_band": 325000,
                #             "residence_nil_rate_band": 175000,
                #             "iht_rate_percent": 40,
                #         },
                #         "cgt_tax_rate_percent": 20,
                #         "will_summary": {
                #             "leaves_everything_to_spouse": True,
                #             "spouse_name": "Jane Mary Smith",
                #             "notes": "All assets pass to the surviving spouse. This means the estate benefits from 100% spousal exemption for IHT.",
                #         },
                #     },
                # },
            )
        )
