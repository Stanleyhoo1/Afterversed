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
