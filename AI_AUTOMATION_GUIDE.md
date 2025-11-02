# AI Automation Integration Guide

## Overview
The survey now integrates with AI agents to automate parts of the post-death administrative process. After completing the survey, users can generate a personalized, AI-powered checklist with automated assistance.

## What's Been Automated

### 1. **AI Checklist Generation** 🤖
After completing the survey, users can click "Generate AI Checklist" to receive:
- Personalized step-by-step action plan
- Tasks marked as fully/partially automated
- Agent types assigned to automatable tasks (FormAgent, DraftingAgent, SearchAgent, ComputationAgent)
- Context-aware recommendations based on survey answers

### 2. **Agent Types Available**

#### **FormAgent**
- Fills or pre-fills official forms
- Handles online submissions
- Example: Death certificate registration forms

#### **DraftingAgent**
- Writes letters, emails, notices
- Creates call scripts
- Generates summaries
- Example: Notification letters to banks

#### **SearchAgent**
- Finds verified local information
- Locates funeral homes, agencies, offices
- Example: Finding local probate offices

#### **ComputationAgent**
- Calculates estate values
- Computes tax amounts (IHT, CGT)
- Determines probate thresholds
- Example: Calculating inheritance tax

## Backend Endpoints

### Generate Checklist
```
POST /sessions/{session_id}/generate-checklist
```
**Request Body:**
```json
{
  "location": "UK",
  "relationship": "Family member",
  "additional_context": "Optional context"
}
```

**Response:**
```json
{
  "checklist": {
    "meta": { ... },
    "steps": [
      {
        "id": "S001",
        "title": "Register the Death",
        "automation_level": "partial",
        "substeps": [...]
      }
    ]
  },
  "message": "Checklist generated successfully"
}
```

### Run Computations
```
POST /sessions/{session_id}/compute
```
**Request Body:**
```json
{
  "user_data": { ... },
  "task_data": { ... }
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "S006-3",
      "body": "--- Task Result ---\n..."
    }
  ],
  "message": "Completed 5 computations"
}
```

## Frontend Integration

### New Features in Survey.tsx

1. **Generate AI Checklist Button**
   - Appears on the survey completion page
   - Calls the AI agent to generate a personalized checklist
   - Shows loading state during generation

2. **Checklist Display**
   - Shows first 5 steps with expandable details
   - Color-coded automation badges
   - Lists agent types for automated substeps
   - Displays total steps available

3. **Survey Context Integration**
   - Location from postcode answer
   - Death certificate status
   - Will status
   - Priority areas from todo_list

## How It Works

1. **User completes survey** → Answers stored in database
2. **User clicks "Generate AI Checklist"** → Frontend calls backend endpoint
3. **Backend extracts survey context** → Builds additional_context from answers
4. **AI Agent processes request** → Gemini API generates structured checklist
5. **Response parsed and displayed** → Shows steps with automation levels
6. **Optional: Run computations** → For specific financial calculations

## Survey Data Used for Automation

The AI uses these survey answers to personalize the checklist:

- `date_of_passing` → Timeline calculations
- `place_of_death` → Location-specific guidance
- `death_certificate` → Determines if registration needed
- `the_will` → Probate requirements
- `todo_list` → Priority areas focus

## Example Generated Output

```
Step 1: Register the Death
⚡ Partially Automated
• Book appointment with registrar (FormAgent)
• Gather required documents (human)
• Complete registration form (FormAgent)

Step 2: Obtain Death Certificates
✅ Fully Automated
• Order certificates online (FormAgent)
• Calculate number needed (ComputationAgent)
• Track delivery (SearchAgent)
```

## Environment Variables Required

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

## Next Steps for Full Automation

1. **Implement Form Auto-Fill**: Connect FormAgent to actual government portals
2. **Draft Letter Generation**: Use DraftingAgent to create notification letters
3. **Estate Calculations**: Integrate ComputationAgent for IHT/probate calculations
4. **Document Upload**: Add file upload for processing by agents
5. **Task Tracking**: Store agent results and track completion status

## Files Modified

### Backend
- `app/main.py` - Added checklist and computation endpoints
- `app/agents.py` - Existing AI agent logic
- `app/compute_agent.py` - Existing computation logic

### Frontend
- `frontend/src/pages/Survey.tsx` - Added UI and handlers
- `frontend/src/lib/api.ts` - Added API client functions

## Testing the Integration

1. Complete the survey with all questions
2. Click "Generate AI Checklist" button
3. Wait for AI to generate (5-10 seconds)
4. Review personalized checklist with automation markers
5. See which tasks can be automated vs. require human action

## Benefits

✅ **Reduced Manual Work**: Many forms can be auto-filled
✅ **Personalized Guidance**: Context-aware recommendations
✅ **Clear Automation Path**: Know what's automated vs. manual
✅ **Time Savings**: Quick generation of comprehensive checklist
✅ **Accuracy**: AI ensures nothing is missed

---

*This integration demonstrates how AI agents can significantly reduce the administrative burden during a difficult time.*
