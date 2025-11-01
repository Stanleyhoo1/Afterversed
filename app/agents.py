import os
import json
import pathlib
from dotenv import load_dotenv
from google import genai

# Loads environment variables from a .env file
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# The client gets the API key from the environment variable `GEMINI_API_KEY`.
gemini_client = genai.Client()

def get_post_death_checklist(location, relationship, jurisdiction_specific_terms="", additional_context=""):
    # Here you would integrate with the Gemini API using the GEMINI_API_KEY
    # and send the prompt to get the response.
    
    prompt = f"""
You are an expert legal and administrative assistant specializing in post-death arrangements.

A user has come to you for step-by-step guidance after the death of a relative.

Context:
- Location: {location}
- Relationship to deceased: {relationship}
- Jurisdiction terms (if any): {jurisdiction_specific_terms}
- Additional details: {additional_context}

Your task:
1. Provide a **structured, chronological checklist** of what must be done when someone dies in that location.
2. Include all key steps such as:
   - Official confirmation of death
   - Registering the death
   - Arranging the funeral
   - Handling wills, probate, and estate distribution
   - Dealing with taxes, debts, and property
   - Contacting government agencies and notifying organizations
3. Reference **local offices, services, and timeframes** specific to the location (e.g., Register Offices, Coroner, Probate Registry, etc.).
4. Highlight required **forms, documents, and online portals** (e.g., death certificate, Green Form, probate application).
5. Add a section for **support resources** (bereavement counseling, government helplines, etc.).
6. Format the answer clearly using headings, numbered steps, and bullet points.

Output style:
- Formal, factual, and empathetic.
- Optimized for readability.
- Use region-appropriate legal terminology and examples.
"""
    
    response = gemini_client.models.generate_content(
        model="gemini-2.5-flash", contents=prompt
    )

    print(response.text)
        
    return response.text

get_post_death_checklist(
    location="London, UK",
    relationship="spouse",
    jurisdiction_specific_terms="Probate process in London",
    additional_context="The deceased had a will and owned property jointly."
)