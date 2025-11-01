import os
import json
import pathlib
from dotenv import load_dotenv

# Loads environment variables from a .env file
load_dotenv()

app = Flask(__name__, static_folder="static")
app.secret_key = os.environ.get("SECRET_KEY") or os.urandom(32)