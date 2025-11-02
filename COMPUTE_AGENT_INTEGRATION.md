# ComputeAgent Integration for Financial Matters

## Overview
The ComputeAgent is specifically designed to automate the "Handle legal and financial matters" process. When users select this option in the survey, they get access to AI-powered financial calculations including estate valuation, probate requirements, and inheritance tax calculations.

## How It Works

### 1. **Survey Completion**
When users complete the survey and select "Handle legal and financial matters" in the todo_list question:
- A special button appears: **💰 Start Financial Calculations**
- This button only shows if they selected financial matters
- Clicking it navigates to `/procedure`

### 2. **Automatic Route Detection**
The `Procedure` component now:
- Checks the user's survey answers
- If "Handle legal and financial matters" was selected, shows `FinancialProcedure` component
- Otherwise, shows the regular procedure steps

### 3. **Financial Assessment**
When the Financial Procedure loads:
- Calls `/sessions/{session_id}/financial-assessment` endpoint
- Backend analyzes survey answers (will status, death certificate, etc.)
- Determines what calculations are needed:
  - ✅ Estate valuation
  - ✅ Probate requirement check
  - ✅ Inheritance Tax (IHT) calculation

### 4. **Data Input**
Users provide estate information in a simplified form:
- Deceased details (name, date of passing)
- Asset information (properties, bank accounts, investments)
- Liability information (optional for demo)

### 5. **AI Computation**
When user clicks "Run AI Calculations":
- Frontend calls `/sessions/{session_id}/compute` endpoint
- Backend runs `compute_figures()` from `compute_agent.py`
- ComputeAgent processes three key tasks:
  1. **Calculate Total Estate Value** - Sums all assets
  2. **Determine Probate Requirement** - Checks against thresholds
  3. **Calculate IHT** - Computes inheritance tax liability

### 6. **Results Display**
ComputeAgent returns structured results:
```
--- Calculate Total Estate Value ---
Decision: Total Value: £497,000

Total Value for Probate: £497,000
Calculation Details:
  - Property: £350,000
  - Bank Accounts: £12,000
  - Investments: £120,000
  - Personal Chattels: £15,000
```

## API Endpoints

### Financial Assessment
```http
POST /sessions/{session_id}/financial-assessment
```

**Response:**
```json
{
  "needs_probate_check": true,
  "needs_iht_calculation": true,
  "needs_estate_valuation": true,
  "message": "Based on your responses, we can help automate your financial calculations.",
  "next_steps": [
    "Gather information about all assets",
    "We'll calculate if probate is required",
    "We'll calculate potential Inheritance Tax liability"
  ]
}
```

### Run Computations
```http
POST /sessions/{session_id}/compute
```

**Request:**
```json
{
  "user_data": {
    "deceased_details": {...},
    "assets": {...},
    "liabilities": {...},
    "tax_and_will_details": {...}
  },
  "task_data": {
    "steps": [{
      "id": "S006",
      "substeps": [
        {
          "id": "S006-1",
          "automation_agent_type": "ComputationAgent",
          "inputs_required": [...]
        }
      ]
    }]
  }
}
```

**Response:**
```json
{
  "results": [
    {
      "id": "S006-1",
      "body": "--- Formatted Report ---\nDecision: £497,000\n..."
    },
    {
      "id": "S006-2",
      "body": "--- Probate Check ---\nDecision: Probate IS Required\n..."
    },
    {
      "id": "S006-3",
      "body": "--- IHT Calculation ---\nDecision: Total IHT Due: £0\n..."
    }
  ],
  "message": "Completed 3 computations"
}
```

## ComputeAgent Capabilities

### Task 1: Estate Valuation
- Sums all solely-owned assets
- Excludes jointly-owned assets (pass outside estate)
- Considers:
  - Real estate
  - Bank accounts
  - Investments
  - Personal chattels
- **Output**: Total estate value for probate

### Task 2: Probate Requirement
- Compares estate value to thresholds:
  - HMCTS: £5,000
  - Banks: Typically £25,000-£50,000
  - Investments: Varies by institution
- **Output**: Whether probate is required

### Task 3: Inheritance Tax (IHT)
- Calculates using UK IHT rules:
  - Nil Rate Band: £325,000
  - Residence Nil Rate Band: £175,000
  - IHT Rate: 40% above thresholds
- Considers:
  - Spousal exemption (100% relief)
  - Charitable donations
  - Gifts in last 7 years
- **Output**: IHT amount due (if any)

## User Journey

```
Survey Completed
    ↓
Select "Handle legal and financial matters"
    ↓
Click "💰 Start Financial Calculations"
    ↓
See Assessment (what will be calculated)
    ↓
Provide Estate Data
    ↓
Click "🤖 Run AI Calculations"
    ↓
ComputeAgent processes (5-10 seconds)
    ↓
View Detailed Results
    ↓
Continue to Dashboard
```

## Frontend Components

### Survey.tsx
- Detects if financial help is needed
- Shows conditional button
- Stores `needsFinancialHelp` state

### Procedure.tsx
- Router component
- Checks survey answers
- Routes to `FinancialProcedure` if needed

### FinancialProcedure.tsx
- Main financial computation UI
- Three-step process:
  1. Assessment display
  2. Data input form
  3. Results display
- Handles API calls and state management

## Backend Files

### main.py
- `/financial-assessment` - Analyzes survey for financial needs
- `/compute` - Runs ComputeAgent calculations

### compute_agent.py
- `compute_figures()` - Main computation function
- Uses Gemini AI for intelligent calculations
- Processes structured JSON task definitions
- Returns formatted reports

### agents.py
- General workflow generation
- Not directly used for computations
- Provides checklist context

## Example Calculation Output

```
=== PROCESSING TASK: Calculate Total Estate Value ===
--- Result for S006-1 ---
--- Calculate Total Estate Value ---
Decision: £497,000

Total Value for Probate:
	Total Value: £497,000
	Reason: Sum of solely-owned assets

Calculation Details:
	- 22b Baker Street, London: £350,000
	- Mainstream Bank Chequing: £12,000
	- Capital Investments Portfolio: £120,000
	- Personal Chattels: £15,000

Note: Jointly-owned assets excluded (pass outside estate)
-----------------------------------
```

## Benefits

✅ **Automated Calculations** - Complex financial math done by AI
✅ **UK-Specific Rules** - Follows HMRC guidelines
✅ **Instant Results** - No need to hire accountant for initial assessment
✅ **Educational** - Explains calculations step-by-step
✅ **Actionable** - Clear next steps provided
✅ **Secure** - Data only used for calculations, not stored long-term

## Future Enhancements

1. **Save Calculations** - Store results in database for later reference
2. **PDF Export** - Generate printable reports
3. **More Calculations** - Add CGT, estate administration costs
4. **Real Data Integration** - Connect to banks/HMRC APIs
5. **Multi-Currency** - Support non-UK estates
6. **Form Pre-fill** - Use calculations to auto-fill IHT forms

---

*The ComputeAgent significantly reduces the complexity and stress of handling financial matters after a death by providing instant, accurate calculations with clear explanations.*
