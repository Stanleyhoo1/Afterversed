# Financial Data Requirements for ComputeAgent

## Problem
The survey only collects general information (dates, yes/no questions), but the ComputeAgent needs **detailed financial data** to perform calculations like estate valuation, probate checks, and inheritance tax.

## Solution
We've added an **"Use Example Data"** checkbox that provides realistic example data to demonstrate the AI calculations.

## How to Use

### Option 1: Demo with Example Data (Recommended)
1. Complete the survey and select "Handle legal and financial matters"
2. Click "💰 Start Financial Calculations"
3. **Check the box: "🚀 Use Example Data for Demo"**
4. Click "🤖 Run AI Calculations"
5. See the results in 5-10 seconds!

### Option 2: Enter Real Data (For Production)
For real-world use, you would need to collect detailed financial information through a more extensive form.

## Required Data Structure

The ComputeAgent expects this structured data:

```typescript
{
  deceased_details: {
    name: string
    date_of_passing: string (YYYY-MM-DD)
  },
  
  executor_details: {
    name: string
    relationship: string
  },
  
  assets: {
    real_estate: [
      {
        id: string
        address: string
        ownership: "Solely Owned" | "Jointly Owned"
        value_at_death: number
        passes_to_survivor: boolean
        notes: string
      }
    ],
    
    bank_accounts: [
      {
        id: string
        institution: string
        type: string
        account_number: string
        ownership: "Solely Owned" | "Jointly Owned"
        value_at_death: number
        passes_to_survivor: boolean
      }
    ],
    
    investments: [
      {
        id: string
        institution: string
        type: string
        account_number: string
        ownership: "Solely Owned" | "Jointly Owned"
        value_at_death: number
        passes_to_survivor: boolean
      }
    ],
    
    personal_chattels: {
      id: string
      description: string
      ownership: "Solely Owned" | "Jointly Owned"
      value_at_death: number
      passes_to_survivor: boolean
    }
  },
  
  liabilities: {
    mortgages: [
      {
        id: string
        property_id: string
        provider: string
        outstanding_balance: number
      }
    ],
    credit_cards: [
      {
        id: string
        provider: string
        outstanding_balance: number
      }
    ],
    utility_bills: number
    funeral_costs: number
  },
  
  tax_and_will_details: {
    probate_thresholds: {
      hmcts: 5000  // Fixed UK threshold
      [institution_name]: number  // Bank/investment thresholds
    },
    
    iht_thresholds: {
      nil_rate_band: 325000  // Current UK threshold
      residence_nil_rate_band: 175000  // Additional if home passed to descendants
      iht_rate_percent: 40  // Standard UK IHT rate
    },
    
    will_summary: {
      leaves_everything_to_spouse: boolean
      spouse_name?: string
      notes: string
    }
  }
}
```

## Example Data Provided

The example data includes:

### Assets (Total: £507,000)
- **Property**: £350,000 (123 Main Street, solely owned)
- **Bank Accounts**: 
  - Barclays: £12,000 (solely owned)
  - HSBC: £80,000 (jointly owned - passes outside estate)
- **Investments**: Vanguard ISA £50,000 (solely owned)
- **Personal Items**: £15,000 (furniture, jewelry, etc.)

### Liabilities (Total: £104,500)
- **Mortgage**: £100,000 (on main property)
- **Funeral Costs**: £4,000
- **Utility Bills**: £500

### Will Details
- Everything passes to spouse (Jane Smith)
- 100% spousal exemption applies (no IHT)

## Calculation Results

When you run the example data, ComputeAgent will calculate:

### 1. Estate Value
- **Solely-owned assets for probate**: £427,000
  - Property: £350,000
  - Bank account: £12,000
  - Investments: £50,000
  - Personal items: £15,000
- **Excludes**: Joint bank account (£80,000) - passes outside estate

### 2. Probate Requirement
- **Decision**: Probate IS required
- **Reason**: Estate value (£427,000) exceeds:
  - HMCTS threshold: £5,000 ✓
  - Barclays threshold: £50,000 ✓
  - Vanguard threshold: £25,000 ✓

### 3. Inheritance Tax
- **IHT Due**: £0
- **Reason**: Full spousal exemption
- All assets pass to surviving spouse (Jane Smith)
- No IHT payable due to spousal exemption

## Future Enhancement Ideas

For a production system, you would:

1. **Multi-step Form**: Break data collection into logical sections
   - Step 1: Properties and real estate
   - Step 2: Bank accounts and savings
   - Step 3: Investments and pensions
   - Step 4: Debts and liabilities
   - Step 5: Will and beneficiary details

2. **Data Import**: Allow users to upload documents
   - Bank statements (PDF)
   - Property valuations
   - Investment statements
   - Will document

3. **Progressive Disclosure**: Show fields conditionally
   - "Do you own property?" → Show property form
   - "Are there any mortgages?" → Show mortgage form

4. **Save and Resume**: Store partial data
   - Users rarely have all info at once
   - Allow saving progress and returning later

5. **Value Estimation Tools**:
   - Property value estimator (using postcode)
   - Chattels value calculator
   - Standard funeral cost estimates

6. **Bank Integration** (Future):
   - Open Banking API to pull balances
   - Investment platform connections
   - Automated data import

## Testing the Demo

1. Navigate to survey completion page
2. Make sure you selected "Handle legal and financial matters"
3. Click "💰 Start Financial Calculations"
4. On the financial procedure page:
   - ✅ Check "Use Example Data for Demo"
   - See the example data breakdown
   - Click "Run AI Calculations"
5. Wait 5-10 seconds for Gemini AI to process
6. Review the three calculation results:
   - Estate valuation
   - Probate requirement
   - Inheritance tax calculation

## Why This Approach?

**Survey → General Info** (What areas need help?)
- Quick to complete
- Low barrier to entry
- Identifies user needs

**Financial Procedure → Detailed Data** (Actual calculations)
- Only shown if selected "Handle legal and financial matters"
- Can use example data for demo
- In production, would be full form with validation

This separation allows:
- ✅ Quick initial survey
- ✅ Deep dive only when needed
- ✅ Demo capability without requiring real data
- ✅ Clear user expectations

---

*The example data demonstrates the full power of ComputeAgent while acknowledging that real users would need a more comprehensive data collection process.*
