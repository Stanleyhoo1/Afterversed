import os

from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv()

ANAM_API_KEY = os.environ.get("ANAM_API_KEY")

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}
