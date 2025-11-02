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
        "api_key": "AIzaSyBQxhTl4FQpE_emDGHrc1HS42LQdbK3vnQ"  # Replace with your key
    },
    params={
        "temperature": 0.7,
    
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
Your goal is to navigate to the provided URL, find **every** form input on the page (including dynamically loaded ones),
and fill them in with appropriate dummy data. Continue through the form until completion or no further steps remain.

## Form-Filling Logic

1. **Page Load & Scanning**
   - Navigate to the given URL and wait until the page is fully loaded.
   - Perform a full scroll from top to bottom to trigger any lazy-loaded or dynamic fields.
   - Use the DOM inspection tool to collect *all* <input>, <select>, <textarea>, and <button> elements — even if hidden in containers or loaded after scrolling.
   - Re-scan after each scroll or interaction, since new inputs may appear dynamically.

2. **Input Identification**
   - Identify inputs by any of the following:
     - Visible labels (e.g., “Full Name”, “Email”, “Date of Birth”)
     - Placeholder text
     - name/id/class attributes
     - aria-label or title attributes
   - If an input appears without visible label but has a recognizable type, infer its meaning by name or pattern.
     - e.g., "email", "mail" → email field
     - "dob", "birth", "date" → date field
     - "phone", "mobile" → phone field
     - otherwise treat as generic text.

3. **Field Filling**
   - Fill each recognized field with dummy, type-appropriate data:
     - Full name → "John Doe"
     - Email → "john@example.com"
     - Date of Birth → "1990-01-01"
     - Address → "123 Test Street"
     - Phone → "07123456789"
     - Any text field → "Sample Data"
   - For dropdowns or selects, choose the first valid option.
   - For checkboxes or radio buttons, select one that seems required or neutral.

4. **Validation Handling**
   - After filling, click any visible “Next”, “Continue”, or “Submit” buttons.
   - If the page raises an alert, validation warning, or message such as:
     “This field is required”, “Please fill out this field”, “Missing information”:
       - Log the message.
       - Identify the referenced or highlighted field.
       - Re-scan the page to locate that input (even if it was missed before).
       - Fill it with appropriate dummy data.
       - Retry the submission.
   - Repeat until there are no remaining validation errors.

5. **Navigation & Completion**
   - Continue filling subsequent pages or steps until there are no more input fields or forms to complete.
   - Scroll as needed to reveal hidden sections.
   - If a CAPTCHA or human verification appears, stop and report that user input is required.
   - At the end, summarize what fields were filled and how many pages or steps were completed.

---

### 🧠 Live Thinking Output Mode
You must **print your reasoning to the console** after each browser or tool action.

Output logs in real time using the exact format:
> [Agent Thought] <description of your reasoning or action>

For example:
> [Agent Thought] Scanning DOM for all input and select elements...
> [Agent Thought] Found 12 inputs, including hidden required ones.
> [Agent Thought] Filling 'Email' field with john@example.com
> [Agent Thought] Detected alert: "This field is required" — refilling missing field.
> [Agent Thought] Clicking 'Next' button to continue.

These logs must appear as normal output text (stdout), not hidden reasoning.

---

### Context
Target website: {url}
Form data template: {form_data}

Begin executing these steps now, ensuring every input field on each form page is detected and completed before proceeding.
"""






# -------------------------------
# 6. Run the agent
# -------------------------------
response = agent(prompt)
print("Agent response:", response)


