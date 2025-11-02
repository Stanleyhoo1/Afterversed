import random
from datetime import datetime, timedelta

# -------------------------------------------------------------------
# Data Components (No Faker)
# -------------------------------------------------------------------

FIRST_NAMES = [
    "John",
    "Jane",
    "David",
    "Emily",
    "Michael",
    "Sarah",
    "Robert",
    "Laura",
    "William",
    "Emma",
    "Richard",
    "Olivia",
    "Thomas",
    "Sophia",
    "James",
    "Ava",
]
LAST_NAMES = [
    "Smith",
    "Jones",
    "Williams",
    "Brown",
    "Taylor",
    "Davies",
    "Evans",
    "Wilson",
    "Thomas",
    "Roberts",
    "Johnson",
    "Walker",
    "Wright",
    "Thompson",
    "White",
    "Green",
]
STREET_NAMES = [
    "High St",
    "Station Rd",
    "Main St",
    "Church Rd",
    "Park Rd",
    "London Rd",
    "Victoria Rd",
    "Green Ln",
    "Manor Rd",
    "King St",
    "Queen St",
    "The Green",
]
TOWNS = [
    "London",
    "Manchester",
    "Birmingham",
    "Leeds",
    "Glasgow",
    "Bristol",
    "Liverpool",
    "Sheffield",
    "Edinburgh",
    "Cardiff",
    "Nottingham",
    "Reading",
]
EMAIL_DOMAINS = ["example.com", "mail.org", "test.net", "data.co.uk"]

# -------------------------------------------------------------------
# Helper Functions (No Faker)
# -------------------------------------------------------------------


def get_random_name():
    """Generates a simple random name."""
    return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"


def get_random_phone():
    """Generates a random 11-digit UK-style phone number."""
    return f"07{random.randint(100, 999)} {random.randint(100000, 999999)}"


def get_random_address():
    """Generates a simple random address."""
    postcode_num = random.randint(1, 20)
    postcode_letters = "".join(random.choices("ABCDEFGHJKLMNPQRSTUVWXYZ", k=2))
    postcode = f"{random.choice(['SW', 'N', 'E', 'W'])}{postcode_num} {random.randint(1, 9)}{postcode_letters}"
    return f"{random.randint(1, 200)} {random.choice(STREET_NAMES)}, {random.choice(TOWNS)}, {postcode}"


def get_random_email(name):
    """Generates an email from a name."""
    clean_name = name.lower().replace(" ", ".")
    return f"{clean_name}@{random.choice(EMAIL_DOMAINS)}"


def get_random_date(start_date_str, end_date_str):
    """Gets a random date between two relative date strings (e.g., "-2y", "-1m")."""

    def parse_relative_date(date_str):
        now = datetime.now()
        # Fix: Use [1:-1] to get the number, skipping the '-' sign
        num = int(date_str[1:-1])
        unit = date_str[-1]
        if unit == "y":
            return now - timedelta(days=num * 365)
        elif unit == "m":
            return now - timedelta(days=num * 30)
        elif unit == "d":
            return now - timedelta(days=num)
        return now

    start_date = parse_relative_date(start_date_str)
    end_date = parse_relative_date(end_date_str)

    total_days = (end_date - start_date).days

    # Ensure total_days is not negative (e.g., if start and end are swapped)
    if total_days <= 0:
        return start_date.date()

    random_days = random.randint(0, total_days)
    return (start_date + timedelta(days=random_days)).date()


def get_random_bban():
    """Generates a random 8-digit bank account number."""
    return f"{random.randint(10000000, 99999999)}"


def get_random_card():
    """Generates a random 16-digit card number."""
    return f"{random.randint(1000, 9999)} {random.randint(1000, 9999)} {random.randint(1000, 9999)} {random.randint(1000, 9999)}"


def get_random_id(prefix, digits):
    """Generates a random ID string."""
    number = "".join([str(random.randint(0, 9)) for _ in range(digits)])
    return f"({prefix}-{number})"


def get_random_value(min_val, max_val):
    """Generates a random integer value, rounded to the nearest 100."""
    return random.randint(min_val // 100, max_val // 100) * 100


# -------------------------------------------------------------------
# Main Data Generation Function (For DraftingAgent)
# -------------------------------------------------------------------


def generate_random_estate_data():
    """
    Generates a complete, randomized estate data object using only
    Python's built-in 'random' library.
    """

    # 1. Generate Deceased Person's Details
    deceased_name = get_random_name()
    date_of_passing = get_random_date(start_date_str="-2y", end_date_str="-1m")
    date_of_cert = date_of_passing + timedelta(days=random.randint(2, 7))

    # 2. Generate Executor Details
    executors = []
    num_executors = random.randint(1, 2)
    for i in range(num_executors):
        exec_name = get_random_name()
        if i == 0:
            rel = random.choice(["Spouse", "Son", "Daughter"])
        else:
            rel = random.choice(["Solicitor", "Accountant", "Niece"])

        executors.append(
            {
                "Name": exec_name,
                "relationship": rel,
                "Address": get_random_address(),
                "Phone": get_random_phone(),
                "Email": get_random_email(exec_name),
            }
        )

    # 3. Generate Financial Details
    institutions = {
        "Mainstream Bank": {
            "type": "bank",
            "purpose": "To formally notify of the death, freeze all accounts in the deceased's sole name, and request a final balance statement.",
        },
        "Capital Investments": {
            "type": "investment",
            "purpose": "To notify of the death and request a date-of-death valuation for portfolio for probate purposes.",
        },
        "Premier Credit": {
            "type": "credit",
            "purpose": "To cancel the card and receive a final statement of account.",
        },
        "National Pension Fund": {
            "type": "pension",
            "purpose": "To notify of the member's passing and to formally begin the process of claiming any spousal or death benefits.",
        },
        "HSBC": {
            "type": "bank",
            "purpose": "To freeze all sole accounts and request a final balance statement.",
        },
        "Fidelity Investments": {
            "type": "investment",
            "purpose": "To request a date-of-death valuation for all holdings.",
        },
    }

    num_to_pick = random.randint(3, 5)
    selected_keys = random.sample(list(institutions.keys()), num_to_pick)

    relevant_account_numbers = {}
    purpose_for_notifications = {}

    for key in selected_keys:
        inst = institutions[key]
        purpose_for_notifications[key] = inst["purpose"]

        if inst["type"] == "bank":
            relevant_account_numbers[key] = {
                "Chequing Account": f"({get_random_bban()})",
                "Savings Account": f"({get_random_bban()})",
            }
        elif inst["type"] == "investment":
            relevant_account_numbers[key] = {
                "Portfolio Account": get_random_id("INV", 7)
            }
        elif inst["type"] == "credit":
            relevant_account_numbers[key] = {"Visa Card": f"({get_random_card()})"}
        elif inst["type"] == "pension":
            relevant_account_numbers[key] = {"Member ID": get_random_id("PEN", 8)}

    # 4. Generate Beneficiaries
    num_beneficiaries = random.randint(2, 3)
    beneficiaries = []
    for _ in range(num_beneficiaries):
        beneficiaries.append(
            {
                "name": get_random_name(),
                "relationship": random.choice(
                    ["Spouse", "Son", "Daughter", "Grandchild", "Friend"]
                ),
                "assets": f"{random.randint(10, 50)}% of the residual estate and {random.choice(['£10,000 cash legacy', 'the vintage watch collection', '50% of the property'])}.",
            }
        )

    # 5. Assemble the final data object
    final_data = {
        "deceased_name": deceased_name,
        "date of passing": date_of_passing.isoformat(),
        "date of death certificate issuance": date_of_cert.isoformat(),
        "relevant account numbers": relevant_account_numbers,
        "estate executors' details": executors,
        "purpose for notifications": purpose_for_notifications,
        "beneficiaries": beneficiaries,
        "current date": datetime.now().strftime(r"%Y-%m-%d"),
    }

    return final_data


# -------------------------------------------------------------------
# NEW: Data Generation Function (For ComputationAgent)
# -------------------------------------------------------------------


def generate_random_financial_data():
    """
    Generates a complex, randomized financial inventory for the
    ComputationAgent, based on the user's provided structure.
    """

    # --- 1. People ---
    deceased_name = get_random_name()
    spouse_name = get_random_name()
    executor_name = spouse_name

    # --- 2. Dates ---
    date_of_passing = get_random_date("-1y", "-3m")

    # --- 3. Assets ---

    # Real Estate
    prop1_val = get_random_value(300000, 700000)
    prop2_val = get_random_value(200000, 500000)
    real_estate = [
        {
            "id": "prop1",
            "address": get_random_address(),
            "ownership": f"Jointly Owned (with {spouse_name})",
            "value_at_death": prop1_val,
            "passes_to_survivor": True,
            "notes": "Passes to spouse automatically.",
        },
        {
            "id": "prop2",
            "address": get_random_address(),
            "ownership": "Solely Owned",
            "value_at_death": prop2_val,
            "passes_to_survivor": False,
            "notes": "Forms part of the probate estate.",
        },
    ]

    # Bank Accounts
    bank1_val = get_random_value(5000, 20000)
    bank2_val = get_random_value(30000, 100000)
    bank_accounts = [
        {
            "id": "bank1",
            "institution": "Mainstream Bank",
            "type": "Chequing Account",
            "account_number": get_random_bban(),
            "ownership": "Solely Owned",
            "value_at_death": bank1_val,
            "passes_to_survivor": False,
        },
        {
            "id": "bank2",
            "institution": "Mainstream Bank",
            "type": "Savings Account",
            "account_number": get_random_bban(),
            "ownership": f"Jointly Owned (with {spouse_name})",
            "value_at_death": bank2_val,
            "passes_to_survivor": True,
        },
    ]

    # Investments
    inv1_val = get_random_value(50000, 150000)
    investments = [
        {
            "id": "inv1",
            "institution": "Capital Investments",
            "type": "Portfolio Account",
            "account_number": get_random_id("CI", 6),
            "ownership": "Solely Owned",
            "value_at_death": inv1_val,
            "passes_to_survivor": False,
        }
    ]

    # Chattels
    personal_chattels = {
        "id": "chattels1",
        "description": "Art, furniture, and personal belongings",
        "ownership": "Solely Owned",
        "value_at_death": get_random_value(5000, 25000),
        "passes_to_survivor": False,
    }

    # --- 4. Liabilities ---
    mortgage_val = get_random_value(int(prop2_val * 0.2), int(prop2_val * 0.6))
    liabilities = {
        "mortgages": [
            {
                "id": "mort1",
                "property_id": "prop2",
                "provider": "City Mortgage Corp",
                "outstanding_balance": mortgage_val,
            }
        ],
        "credit_cards": [
            {
                "id": "cc1",
                "provider": "Premier Credit",
                "outstanding_balance": get_random_value(500, 3000),
            }
        ],
        "utility_bills": get_random_value(200, 600),
        "funeral_costs": get_random_value(3500, 5000),
    }

    # --- 5. Post-Death Transactions (for CGT) ---
    sale_gain = get_random_value(5000, 30000)
    sale_costs = get_random_value(1000, 2500)
    post_death_transactions = {
        "assets_sold": [
            {
                "asset_id": "inv1",
                "description": "Capital Investments Portfolio",
                "value_at_death": inv1_val,
                "sale_price": inv1_val + sale_gain + sale_costs,
                "costs_of_sale": sale_costs,
            }
        ],
        "administration_expenses": {
            "legal_fees": get_random_value(2500, 4000),
            "probate_fees": 273,  # This is a fixed court fee
        },
        "income_received_post_death": {"bank_interest": get_random_value(100, 500)},
    }

    # --- 6. Tax & Will Details (mostly fixed) ---
    tax_and_will_details = {
        "probate_thresholds": {
            "hmcts": 5000,
            "mainstream_bank": 50000,
            "capital_investments": 25000,
        },
        "iht_thresholds": {
            "nil_rate_band": 325000,
            "residence_nil_rate_band": 175000,
            "iht_rate_percent": 40,
        },
        "cgt_tax_rate_percent": 20,  # Assuming higher rate for simplicity
        "will_summary": {
            "leaves_everything_to_spouse": True,
            "spouse_name": spouse_name,
            "notes": "All assets pass to the surviving spouse. This means the estate benefits from 100% spousal exemption for IHT.",
        },
    }

    # --- 7. Assemble Final Object ---
    final_data = {
        "deceased_details": {
            "name": deceased_name,
            "date_of_passing": date_of_passing.isoformat(),
        },
        "executor_details": {
            "name": executor_name,
            "relationship": "Spouse",
        },
        "assets": {
            "real_estate": real_estate,
            "bank_accounts": bank_accounts,
            "investments": investments,
            "pensions": [
                {
                    "id": "pension1",
                    "institution": "National Pension Fund",
                    "type": "Defined Benefit",
                    "account_number": get_random_id("NPF", 8),
                    "notes": f"Passes outside of estate to nominated beneficiary ({spouse_name}). Not included in IHT or probate value.",
                }
            ],
            "personal_chattels": personal_chattels,
        },
        "liabilities": liabilities,
        "post_death_transactions": post_death_transactions,
        "tax_and_will_details": tax_and_will_details,
    }

    return final_data
