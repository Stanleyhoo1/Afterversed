import os
<<<<<<< HEAD
import json
import pathlib
from dotenv import load_dotenv
from google import genai
=======
>>>>>>> 7374a15d328008072eee1f73afb13e605bcebf55

from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv()

<<<<<<< HEAD
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# The client gets the API key from the environment variable `GEMINI_API_KEY`.
gemini_client = genai.Client()
=======
ANAM_API_KEY = os.environ.get("ANAM_API_KEY")

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}
>>>>>>> 7374a15d328008072eee1f73afb13e605bcebf55
