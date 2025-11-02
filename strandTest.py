# strands_local_browser_example.py
from strands import Agent
from strands.models.gemini import GeminiModel
from strands_tools import calculator
from strands_tools.browser import LocalChromiumBrowser

# -------------------------------
# 1. Initialize the LLM model
# -------------------------------
model = GeminiModel(
    model_id="gemini-2.5-flash",
    client_args={
        "api_key": "AIzaSyD3IoFM7uoUS-O_Zit-sI2H46e-Za_y5Dc"  # Replace with your key
    },
    params={
        "temperature": 0.7,
        "max_output_tokens": 2048
    }
)

# -------------------------------
# 2. Initialize LocalChromium tool
# -------------------------------
# headless=False so you can see the browser for testing
local_browser = LocalChromiumBrowser()
# -------------------------------
# 3. Create the agent with tools
# -------------------------------
agent = Agent(
    model=model,
    tools=[local_browser.browser, calculator]  # file_read removed
)

# -------------------------------
# 4. Define form data and URL
# -------------------------------
form_data = {
    # --- Personal / Deceased Details ---
    "Title": "Mr",
    "First name": "John",
    "Last name": "Doe",
    "Usual address of person that has died (UK)": "123 Test Street",
    "Postcode": "E1 1AA",
    "Manual Entry tick": True,
    "Number and street name": "123 Test Street",
    "Town or city": "London",
    "County": "Greater London",
    "Do you know of any other recent address that might be useful": "No",
    
    # --- Dates ---
    "Date of birth": "1950-01-01",
    "Date of death": "2024-05-10",
    "Date of funeral": "2024-05-20",
    
    # --- Legal / Document Info ---
    "Do you have a death certificate": "Yes",
    "Is there a will": "Yes",
    
    # --- Executor / Organisation Info ---
    "Individual or Organisation": "Individual",
    "First name (executor)": "Jane",
    "Last name (executor)": "Doe",
    "Address (executor)": "456 Executor Lane, London",
    "Date of Birth (executor)": "1980-02-15",
    "Contact number": "07123456789",
    "Email address": "jane@example.com",
    
    # --- Optional sections ---
    "Do you wish to provide information about Financial Services?": "Yes",
    "Do you wish to provide information about Insurance?": "Yes",
    "Yes dealing with estate": True,
    "Add Account Details": "Estate Account #123456789",
    
    # --- Notification section ---
    "Who would you like to notify?": ["Barclays", "Santander", "Lloyds"]
}


# For testing, you can use a local HTML file like:
# file:///C:/Users/Dell/Downloads/test_form.html
# Or any online test form URL
url = "https://www.deathnotificationservice.co.uk/DNS_Notification_fields.ofml"


# -------------------------------
# 5. Prompt the agent
# -------------------------------
prompt = f"""
You are an autonomous web automation assistant with direct access to a local browser tool.
Your mission is to open the given URL, identify all form elements on every page using DOM inspection,
and fill them with the correct values from the provided hardcoded question–answer mapping.

## Instructions:

1. **Page Load**
   - Navigate to the provided URL and wait until the page is fully loaded.
   - The first page is a **Welcome or Introduction page** with no input fields.
     When this page loads, click the visible button such as “Start”, “Next”, or “Continue” to move to the first form page.
   - After loading, zoom the page to about 125% (using JavaScript: `document.body.style.zoom = "1.25"`) to ensure all elements are visible.

2. **DOM Scanning**
   - On every page, perform a complete DOM scan to find all possible interactive form elements:
     - `<input>`
     - `<select>`
     - `<textarea>`
     - `<label>`
     - Any clickable elements tied to inputs (e.g. `<label for="...">`).
   - Extract the following attributes and text for mapping:
     - innerText
     - placeholder
     - aria-label
     - name
     - id
     - label text
   - For each discovered element, compare these attributes to the provided hardcoded mapping keys.

3. **Question Mapping**
   - For each visible question or input field:
     - Search for the closest match (case-insensitive substring match) in the provided mapping keys.
     - If a match is found:
       - If the value is text → type it in.
       - If the value is a date → type in the date (format: YYYY-MM-DD).
       - If the value is “Yes” or “No” → click the matching radio button or label.
       - If the value is True → tick the checkbox.
       - If the value is a list → select or check all matching options.
       - If the input is a dropdown → select the matching option by text.
     - Log which question was matched and the value entered.
   - If a question label is found but not in the mapping, fill it with default dummy data and log a warning.

4. **Dynamic Elements & Re-Scan**
   - After filling all fields, re-scan the DOM.
     - Some “Yes” or “No” selections may reveal new hidden sections.
     - Re-run the DOM scan and fill any newly revealed inputs.
   - Repeat until no unfilled elements remain on the current page.

5. **Navigation**
   - After completing a page:
     - Search the DOM for any buttons with visible text containing “Next”, “Continue”, “Proceed”, or “Submit”.
     - Click the correct button to move to the next page.
     - Wait until the next page is fully loaded, then repeat the DOM scan and fill process.
   - If clicking “Next” fails or triggers validation errors, look for messages like:
     “This field is required”, “Please complete all fields”, or “Missing information”.
     - Identify the field related to the message.
     - Fill it using the mapping or default dummy data.
     - Retry the button click.

6. **Completion**
   - Continue navigating through the form pages until no further “Next”, “Continue”, or “Submit” buttons are found.
   - If a CAPTCHA or human verification appears, stop and report it.
   - At the end, log “Form completed successfully”.

---

### 🔍 Live Thinking Output Mode
After every browser or tool action (scan, fill, click, or page load), print a live reasoning line to stdout in this format:

> [Agent Thought] Scanning DOM for input elements...
> [Agent Thought] Found 18 elements (inputs, selects, labels).
> [Agent Thought] Matched question "Date of death" → Entered "2024-05-10".
> [Agent Thought] Matched question "Is there a will" → Selected "Yes".
> [Agent Thought] Matched question "Who would you like to notify?" → Checked Barclays, Santander.
> [Agent Thought] All visible fields filled, clicking "Next" to continue...
> [Agent Thought] New page loaded — re-scanning DOM.

All logs must be plain stdout text (not hidden reasoning).

---

### Hardcoded Question Mapping
Use the following mapping to answer each question:

{form_data}

---

### Context
Target website: {url}

Begin executing now. For each page:
- Scan the DOM to detect every possible input field and label.
- Match those labels or attributes to the hardcoded question mapping.
- Fill each field appropriately.
- Click “Next”, “Continue”, or “Submit” to proceed.
- Repeat until the final page is reached and the form is completed.
"""






# -------------------------------
# 6. Run the agent
# -------------------------------
response = agent(prompt)
print("Agent response:", response)


