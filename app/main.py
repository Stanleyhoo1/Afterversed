import json
import os
import pathlib
from typing import Any, Dict, Optional


from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from database import create_session, get_session, init_db, save_survey_data
from draft_email import draft_emails
from random_data import generate_random_estate_data

load_dotenv()

ANAM_API_KEY = os.environ.get("ANAM_API_KEY")

app = FastAPI()

origins_env = os.environ.get("FRONTEND_ORIGINS")
if origins_env:
    allowed_origins = [
        origin.strip() for origin in origins_env.split(",") if origin.strip()
    ]
else:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SessionCreateResponse(BaseModel):
    session_id: int = Field(..., description="Identifier for the newly created session")


class SurveySubmission(BaseModel):
    answers: Dict[str, Any]
    timestamp: Optional[str] = None

    class Config:
        extra = "allow"


class SessionDetailResponse(BaseModel):
    session_id: int
    survey_data: Optional[Dict[str, Any]] = None
    completed_at: Optional[str] = None
    created_at: Optional[str] = None


class DraftEmailResponse(BaseModel):
    drafts: list = Field(..., description="List of drafted email templates")
    updated_at: Optional[str] = None


@app.on_event("startup")
async def on_startup() -> None:
    await init_db()


@app.get("/", tags=["health"])
async def read_root() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/sessions", response_model=SessionCreateResponse, tags=["sessions"])
async def create_session_endpoint() -> SessionCreateResponse:
    session_id = await create_session()
    return SessionCreateResponse(session_id=session_id)


@app.get(
    "/sessions/{session_id}", response_model=SessionDetailResponse, tags=["sessions"]
)
async def get_session_endpoint(session_id: int) -> SessionDetailResponse:
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionDetailResponse(**session)


@app.post(
    "/sessions/{session_id}/survey",
    response_model=SessionDetailResponse,
    tags=["survey"],
)
async def submit_survey(
    session_id: int, payload: SurveySubmission
) -> SessionDetailResponse:
    saved = await save_survey_data(session_id, payload.dict())
    if not saved:
        raise HTTPException(status_code=404, detail="Session not found")
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionDetailResponse(**session)


@app.get(
    "/sessions/{session_id}/draft-emails",
    response_model=DraftEmailResponse,
    tags=["emails"],
)
async def get_draft_emails(session_id: int) -> DraftEmailResponse:
    """Get drafted emails for a session."""
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Extract survey data from the session
    survey_data = session.get("survey_data")
    if not survey_data:
        raise HTTPException(
            status_code=400, detail="No survey data found for this session"
        )

    # Draft the emails using the survey data
    try:
        # Structure the data as expected by draft_emails
        formatted_data = {
            "steps": [
                {
                    "substeps": [
                        {
                            "id": "notify_organizations",
                            "title": "Notify Organizations",
                            "description": "Draft notification emails for organizations",
                            "automation_agent_type": "DraftingAgent",
                            "inputs_required": [
                                "organization_details",
                                "deceased_details",
                            ],
                        }
                    ]
                }
            ]
        }

        # Use the answers from survey_data if available, otherwise use the whole survey_data
        user_data = survey_data.get("answers", survey_data)
        with open(str(pathlib.Path(__file__).parent / "temp.txt")) as f:
            drafts = draft_emails(
                json.load(f),
                generate_random_estate_data(),
            )
        # drafts = draft_emails(formatted_data, user_data)
        return DraftEmailResponse(drafts=drafts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
