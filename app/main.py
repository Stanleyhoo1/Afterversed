import json
import os
import pathlib
from typing import Any, Dict, Optional


from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from draft_email import draft_emails
from random_data import generate_random_estate_data
from database import (
    create_session,
    get_session,
    init_db,
    save_survey_data,
    update_task_status,
)
from agents import get_post_death_checklist
from compute_agent import compute_figures
from search import search_agent
from langgraph_workflow import create_langgraph_workflow

load_dotenv()

ANAM_API_KEY = os.environ.get("ANAM_API_KEY")

app = FastAPI()

# IMPORTANT: CORS middleware must be added BEFORE any routes
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
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
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


class TaskStatusResponse(BaseModel):
    """Response with all task statuses for a session"""

    task_statuses: Dict[str, Any]
    session_id: int


@app.get(
    "/sessions/{session_id}/task-statuses",
    response_model=TaskStatusResponse,
    tags=["tasks"],
)
async def get_task_statuses(session_id: int) -> TaskStatusResponse:
    """Get the status of all tasks for a session"""
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    survey_data = session.get("survey_data", {})
    task_statuses = survey_data.get("task_statuses", {})

    return TaskStatusResponse(session_id=session_id, task_statuses=task_statuses)


class ChecklistGenerateRequest(BaseModel):
    location: str = "UK"
    relationship: str = "Family member"
    additional_context: str = ""


class ChecklistResponse(BaseModel):
    checklist: Dict[str, Any]
    message: str


@app.post(
    "/sessions/{session_id}/generate-checklist",
    response_model=ChecklistResponse,
    tags=["automation"],
)
async def generate_checklist_endpoint(
    session_id: int, request: ChecklistGenerateRequest
) -> ChecklistResponse:
    """Generate an automated checklist based on survey answers"""
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if not session.get("survey_data") or not session["survey_data"].get("answers"):
        raise HTTPException(status_code=400, detail="Survey not completed")

    # Get survey answers
    answers = session["survey_data"]["answers"]

    # Build context from survey answers
    context_parts = []
    if answers.get("date_of_passing"):
        context_parts.append(f"Date of passing: {answers['date_of_passing']}")
    if answers.get("place_of_death"):
        context_parts.append(f"Location: {answers['place_of_death']}")
    if answers.get("death_certificate"):
        context_parts.append(
            f"Death certificate status: {answers['death_certificate']}"
        )
    if answers.get("the_will"):
        context_parts.append(f"Will status: {answers['the_will']}")
    if answers.get("todo_list") and isinstance(answers["todo_list"], list):
        context_parts.append(f"Priority areas: {', '.join(answers['todo_list'])}")

    additional_context = request.additional_context
    if context_parts:
        additional_context = "; ".join(context_parts) + (
            f"; {additional_context}" if additional_context else ""
        )

    # Generate checklist using AI agent
    try:
        checklist = get_post_death_checklist(
            location=request.location,
            relationship=request.relationship,
            jurisdiction_terms="Tell Us Once, MCCD, Green Form, HMCTS Probate, Coroner",
            additional_context=additional_context,
        )

        return ChecklistResponse(
            checklist=checklist, message="Checklist generated successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate checklist: {str(e)}"
        )


class ComputationRequest(BaseModel):
    user_data: Dict[str, Any]
    task_data: Dict[str, Any]


class ComputationResponse(BaseModel):
    results: list
    message: str


@app.post(
    "/sessions/{session_id}/compute",
    response_model=ComputationResponse,
    tags=["automation"],
)
async def compute_endpoint(
    session_id: int, request: ComputationRequest
) -> ComputationResponse:
    """Run automated computations on estate data"""
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        results = compute_figures(request.task_data, request.user_data)

        # Update task statuses in the database
        for result in results:
            task_id = result.get("task_id")
            if task_id:
                await update_task_status(
                    session_id=session_id,
                    task_id=task_id,
                    status="completed",
                    results=result,
                )

        return ComputationResponse(
            results=results, message=f"Completed {len(results)} computations"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute: {str(e)}")


class FinancialAssessmentRequest(BaseModel):
    """Request to assess if user needs legal/financial assistance"""

    pass


class FinancialAssessmentResponse(BaseModel):
    """Response indicating what financial tasks need to be done"""

    needs_probate_check: bool
    needs_iht_calculation: bool
    needs_estate_valuation: bool
    message: str
    next_steps: list


@app.post(
    "/sessions/{session_id}/financial-assessment",
    response_model=FinancialAssessmentResponse,
    tags=["automation"],
)
async def financial_assessment_endpoint(
    session_id: int, request: FinancialAssessmentRequest
) -> FinancialAssessmentResponse:
    """Assess what financial/legal tasks the user needs based on their survey"""
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if not session.get("survey_data") or not session["survey_data"].get("answers"):
        raise HTTPException(status_code=400, detail="Survey not completed")

    answers = session["survey_data"]["answers"]

    # Check if user selected "Handle legal and financial matters"
    todo_list = answers.get("todo_list", [])
    needs_financial_help = (
        "Handle legal and financial matters" in todo_list
        if isinstance(todo_list, list)
        else False
    )

    will_status = answers.get("the_will", "")

    # Determine what they need
    needs_probate_check = True  # Almost always needed
    needs_iht_calculation = (
        "don't think" not in will_status.lower()
    )  # If there's a will, likely need IHT calc
    needs_estate_valuation = True  # Always needed for probate decision

    next_steps = []
    if needs_estate_valuation:
        next_steps.append(
            "Gather information about all assets (property, bank accounts, investments)"
        )
    if needs_probate_check:
        next_steps.append(
            "We'll calculate if probate is required based on estate value"
        )
    if needs_iht_calculation:
        next_steps.append("We'll calculate potential Inheritance Tax liability")

    message = (
        "Based on your responses, we can help automate your financial calculations."
    )
    if not needs_financial_help:
        message = "You haven't selected 'Handle legal and financial matters'. If you need help with this, please update your survey."

    return FinancialAssessmentResponse(
        needs_probate_check=needs_probate_check,
        needs_iht_calculation=needs_iht_calculation,
        needs_estate_valuation=needs_estate_valuation,
        message=message,
        next_steps=next_steps,
    )


class FuneralSearchRequest(BaseModel):
    """Request to search for funeral homes"""

    location: str


class FuneralSearchResponse(BaseModel):
    """Response with funeral home search results"""

    cremation: Dict[str, Any]
    burial: Dict[str, Any]
    woodland: Dict[str, Any]
    metadata: Dict[str, Any]


@app.post(
    "/sessions/{session_id}/search-funeral",
    response_model=FuneralSearchResponse,
    tags=["automation"],
)
async def search_funeral_endpoint(
    session_id: int, request: FuneralSearchRequest
) -> FuneralSearchResponse:
    """Search for funeral homes using SearchAgent"""
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        # Import the find_funeral function directly
        from search import find_funeral

        # Call find_funeral directly with location
        results = find_funeral(request.location)

        # Update task status
        await update_task_status(
            session_id=session_id,
            task_id="arrange_funeral_1",
            status="completed",
            results={"search_location": request.location, "results": results},
        )

        return FuneralSearchResponse(**results)
    except Exception as e:
        import traceback

        error_detail = f"Failed to search: {str(e)}\n{traceback.format_exc()}"
        print(error_detail)  # Log to console for debugging
        raise HTTPException(status_code=500, detail=f"Failed to search: {str(e)}")
<<<<<<< HEAD


# ===== LangGraph Multi-Agent Workflow =====

class LangGraphWorkflowRequest(BaseModel):
    """Request for LangGraph multi-agent workflow"""
    property_value: float = Field(default=0, description="Property value in GBP")
    bank_balances: float = Field(default=0, description="Total bank balances in GBP")
    investments: float = Field(default=0, description="Investment value in GBP")
    debts: float = Field(default=0, description="Total debts in GBP")
    funeral_costs: float = Field(default=3500, description="Funeral costs in GBP")


class LangGraphWorkflowResponse(BaseModel):
    """Response from LangGraph workflow"""
    workflow_id: str
    status: str
    execution_date: str
    executive_summary: Dict[str, Any]
    timeline: list
    financial_summary: Dict[str, Any]
    tax_summary: Dict[str, Any]
    probate_summary: Dict[str, Any]
    next_actions: list
    key_deadlines: list
    documents_generated: Dict[str, Any]
    validation_status: Dict[str, Any]


@app.post(
    "/sessions/{session_id}/langgraph-workflow",
    response_model=LangGraphWorkflowResponse,
    tags=["automation"],
)
async def execute_langgraph_workflow(
    session_id: int, request: LangGraphWorkflowRequest
) -> LangGraphWorkflowResponse:
    """
    Execute LangGraph multi-agent workflow for Financial & Legal Matters
    Pipeline: SearchAgent → DraftingAgent → FormAgent → ComputeAgent → Report
    """
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        # Create workflow
        workflow = create_langgraph_workflow()
        
        # Prepare estate data
        estate_data = {
            "property_value": request.property_value,
            "bank_balances": request.bank_balances,
            "investments": request.investments,
            "debts": request.debts,
            "funeral_costs": request.funeral_costs
        }
        
        # Get survey data
        survey_data = session.get("survey_data", {})
        
        # Execute workflow
        print(f"\n🚀 Executing LangGraph workflow for session {session_id}")
        result = await workflow.execute(session_id, survey_data, estate_data)
        
        # Update task status
        await update_task_status(
            session_id=session_id,
            task_id="legal_financial_workflow",
            status="completed",
            results=result
        )
        
        print(f"✅ Workflow completed for session {session_id}")
        
        return LangGraphWorkflowResponse(**result)
        
    except ImportError as e:
        error_msg = "LangGraph dependencies not installed. Run: pip install langgraph langchain-google-genai langchain-core"
        print(f"❌ {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)
    except Exception as e:
        import traceback
        error_detail = f"Workflow failed: {str(e)}\n{traceback.format_exc()}"
        print(f"❌ {error_detail}")
        raise HTTPException(status_code=500, detail=f"Workflow failed: {str(e)}")

=======
>>>>>>> 5ddf4f95d00e7f29a6248c0e9a6d359875b827c2
