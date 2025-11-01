import os
import json
import pathlib
from dotenv import load_dotenv

# Loads environment variables from a .env file
load_dotenv()

ANAM_API_KEY = os.getenv("ANAM_API_KEY")

