# search.py
import os
import json
import threading
from typing import Optional

from dotenv import load_dotenv
from strands import Agent, tool
from strands.models.gemini import GeminiModel
from string import Template

from playwright.sync_api import (
    sync_playwright, Page, Browser, BrowserContext,
    TimeoutError as PWTimeout
)

import re

# -------------------------------------------------------------------
# Env / LLM
# -------------------------------------------------------------------
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

model = GeminiModel(
    client_args={"api_key": GEMINI_API_KEY},
    model_id="gemini-2.5-flash",
    params={"temperature": 0.1},
)

# -------------------------------------------------------------------
# Shared headful Playwright browser
# -------------------------------------------------------------------
class SharedBrowser:
    _lock = threading.Lock()
    _playwright = None
    _browser: Optional[Browser] = None
    _context: Optional[BrowserContext] = None
    _page: Optional[Page] = None

    @classmethod
    def get_page(cls, headless: bool = False) -> Page:
        with cls._lock:
            if cls._playwright is None:
                cls._playwright = sync_playwright().start()
            if cls._browser is None:
                cls._browser = cls._playwright.chromium.launch(headless=headless)
            if cls._context is None:
                cls._context = cls._browser.new_context(viewport={"width": 1280, "height": 900})
            if cls._page is None or cls._page.is_closed():
                cls._page = cls._context.new_page()
            return cls._page

    @classmethod
    def close(cls):
        # Call from the same thread where it was opened
        with cls._lock:
            try:
                if cls._context:
                    cls._context.close()
                if cls._browser:
                    cls._browser.close()
                if cls._playwright:
                    cls._playwright.stop()
            finally:
                cls._context = None
                cls._browser = None
                cls._playwright = None

# -------------------------------------------------------------------
# Minimal navigation tools (NO form filling)
# -------------------------------------------------------------------
@tool
def browser_open(url: str, headless: bool = False, timeout_ms: int = 15000) -> str:
    """
    Open a URL. Returns: {"ok": bool, "url": "...", "title": "..."}
    """
    page = SharedBrowser.get_page(headless=headless)
    try:
        page.goto(url, timeout=timeout_ms, wait_until="domcontentloaded")
        return json.dumps({"ok": True, "url": page.url, "title": page.title()})
    except Exception as e:
        return json.dumps({"ok": False, "error": str(e)})
    
@tool
def browser_click_role_button(name_regex: str, timeout_ms: int = 15000) -> str:
    """
    Click a <button> by its accessible name using a regex (case-insensitive).
    Example: browser_click_role_button("find.*register office")
    """
    page = SharedBrowser.get_page()
    try:
        loc = page.get_by_role("button", name=re.compile(name_regex, re.I))
        loc.first.click(timeout=timeout_ms)
        return json.dumps({"ok": True, "selector": f"role=button name~/{name_regex}/i", "url": page.url})
    except Exception as e:
        return json.dumps({"ok": False, "error": str(e)})


@tool
def browser_query_links(max_links: int = 100, only_gov_uk: bool = True) -> str:
    """
    Return visible links: {"ok": true, "links":[{"text":"..","href":".."}]}
    If only_gov_uk=True, filters to *.gov.uk domains.
    """
    from urllib.parse import urlparse
    page = SharedBrowser.get_page()
    try:
        links = page.eval_on_selector_all(
            "a",
            "els => els.map(e => ({text:(e.innerText||'').trim(), href:e.href||''}))"
        )
        def keep(l):
            if not l["href"] or not l["text"]:
                return False
            if only_gov_uk:
                host = (urlparse(l["href"]).hostname or "").lower()
                return host.endswith(".gov.uk")
            return True
        filtered = [l for l in links if keep(l)]
        return json.dumps({"ok": True, "links": filtered[:max_links]})
    except Exception as e:
        return json.dumps({"ok": False, "error": str(e)})

@tool
def browser_click(selector: str, timeout_ms: int = 15000) -> str:
    """
    Click a CSS selector. Returns: {"ok": bool, "selector": "...", "url": "..."}
    """
    page = SharedBrowser.get_page()
    try:
        page.wait_for_selector(selector, timeout=timeout_ms)
        page.click(selector)
        return json.dumps({"ok": True, "selector": selector, "url": page.url})
    except Exception as e:
        return json.dumps({"ok": False, "error": str(e)})

@tool
def browser_click_text(text: str, exact: bool = False, timeout_ms: int = 15000) -> str:
    """
    Click by visible text. Returns: {"ok": bool, "selector": "text=...", "url": "..."}
    """
    page = SharedBrowser.get_page()
    try:
        sel = f'text={"="+text if exact else text}'
        page.wait_for_selector(sel, timeout=timeout_ms)
        page.click(sel)
        return json.dumps({"ok": True, "selector": sel, "url": page.url})
    except Exception as e:
        return json.dumps({"ok": False, "error": str(e)})

@tool
def browser_wait(selector: str, state: str = "visible", timeout_ms: int = 15000) -> str:
    """
    Wait for selector state: visible|attached|detached|hidden.
    Returns: {"ok": bool, "selector": "..."}
    """
    page = SharedBrowser.get_page()
    try:
        page.wait_for_selector(selector, state=state, timeout=timeout_ms)
        return json.dumps({"ok": True, "selector": selector})
    except PWTimeout:
        return json.dumps({"ok": False, "error": f"Timeout waiting for {selector} [{state}]"})
    except Exception as e:
        return json.dumps({"ok": False, "error": str(e)})

@tool
def browser_scroll(pixels: int = 800, repeats: int = 1, delay_ms: int = 200) -> str:
    """
    Scroll down by pixels, repeats. Returns: {"ok": true, "scrolls": n}
    """
    import time
    page = SharedBrowser.get_page()
    try:
        for _ in range(max(1, repeats)):
            page.evaluate("window.scrollBy(0, arguments[0]);", pixels)
            time.sleep(delay_ms/1000.0)
        return json.dumps({"ok": True, "scrolls": max(1, repeats)})
    except Exception as e:
        return json.dumps({"ok": False, "error": str(e)})

@tool
def browser_current_url() -> str:
    """Return {"ok": true, "url": "...", "title": "..."}"""
    page = SharedBrowser.get_page()
    return json.dumps({"ok": True, "url": page.url, "title": page.title()})

@tool
def browser_screenshot(path: str = "page.png", full_page: bool = False) -> str:
    """Return {"ok": bool, "path": "..."}"""
    page = SharedBrowser.get_page()
    try:
        page.screenshot(path=path, full_page=full_page)
        return json.dumps({"ok": True, "path": os.path.abspath(path)})
    except Exception as e:
        return json.dumps({"ok": False, "error": str(e)})
    
@tool 
def browser_fill(selector: str, value: str) -> str:
    """ Fill a text input/textarea identified by CSS/XPath selector. Returns: {"ok": bool, "selector": "...", "value_len": int} """ 
    page = SharedBrowser.get_page() 
    try: 
        page.fill(selector, value) 
        return json.dumps({"ok": True, "selector": selector, "value_len": len(value)}) 
    except Exception as e: 
        return json.dumps({"ok": False, "error": str(e)})

@tool
def browser_click_role_link(name_regex: str, timeout_ms: int = 15000) -> str:
    """
    Click an <a> by its accessible name (regex, case-insensitive).
    Example: browser_click_role_link("book.*(appointment|online)")
    """
    page = SharedBrowser.get_page()
    try:
        loc = page.get_by_role("link", name=re.compile(name_regex, re.I))
        loc.first.click(timeout=timeout_ms)
        return json.dumps({"ok": True, "selector": f"role=link name~/{name_regex}/i", "url": page.url})
    except Exception as e:
        return json.dumps({"ok": False, "error": str(e)})

@tool
def browser_click_any_text(texts_pipe: str, timeout_ms: int = 15000) -> str:
    """
    Try multiple visible text targets (pipe-separated) and click the first that works.
    Example: browser_click_any_text("Start|Continue|Next|Book online|Book now")
    """
    page = SharedBrowser.get_page()
    tried = []
    for t in [s.strip() for s in texts_pipe.split("|") if s.strip()]:
        tried.append(t)
        try:
            sel = f"text={t}"
            page.wait_for_selector(sel, timeout=min(3000, timeout_ms))
            page.click(sel)
            return json.dumps({"ok": True, "selector": sel, "clicked_text": t, "url": page.url})
        except Exception:
            continue
    return json.dumps({"ok": False, "error": f"No clickable text among: {tried}"})

@tool
def browser_has_form_fields(timeout_ms: int = 8000) -> str:
    """
    Returns {"ok": true, "has_fields": bool}. True when any input/select/textarea is visible.
    """
    page = SharedBrowser.get_page()
    try:
        page.wait_for_selector("input, select, textarea", state="visible", timeout=timeout_ms)
        return json.dumps({"ok": True, "has_fields": True})
    except Exception:
        return json.dumps({"ok": True, "has_fields": False})

# -------------------------------------------------------------------
# Task template (use ${} to avoid str.format brace collisions)
# -------------------------------------------------------------------
LOCAL_REGISTAR_SEARCH_TASK = Template(r"""
You are a deterministic Search & Navigation Agent. Use ONLY the provided tools and return ONLY valid JSON at the end.

# Inputs
USER_INPUTS:
${user_inputs_json}

CONFIG:
${config_json}

# Rules
- Prefer official *.gov.uk domains for this task.
- Keep a small visited-set mentally; do not revisit URLs.
- After reaching a borough/council page, prioritise links that book an appointment online.

# High-level plan
1) Open https://www.gov.uk/register-offices via browser_open.
2) Fill the postcode field with USER_INPUTS.postcode using browser_fill. Try in order:
   - "input[name='postcode']"
   - "input[type='search']"
   - "input[aria-label*='postcode' i]"
   - "input[placeholder*='postcode' i]"
3) Submit the search (try in this order):
   - browser_click_role_button("find.*register office")
   - browser_click("button.govuk-button")
   - browser_click("form[action*='register-offices'] button.govuk-button")
   - browser_click("button[type='submit']")
   - browser_click("input[type='submit']")
4) On the results, use browser_query_links(max_links=100, only_gov_uk=true) and click a *.gov.uk borough/council link (NOT www.gov.uk).
   Prefer hosts/paths/text with CONFIG.links.prefer_keywords. Respect CONFIG.links.blocklist.
5) On the borough site, navigate to the death registration booking flow:
   - First attempt a direct booking link:
     - browser_click_role_link("book.*(appointment|online).*death")
     - browser_click_any_text("Book an appointment to register a death|Book an appointment|Book online|Book now|Make an appointment")
   - If not visible, find the “Register a death” page (use browser_click_text or site navigation),
     then repeat the booking clicks above.
6) Follow the booking flow until an actual form is present:
   - Repeatedly try browser_click_any_text("Start|Continue|Next|Proceed|I agree|Accept and continue|Book now|Begin") when present.
   - After each click, call browser_has_form_fields(). If {"has_fields": true}, you have reached the booking form; stop.
7) Before returning, take a screenshot with browser_screenshot("page.png", full_page=false).

# Stopping conditions (any):
- browser_has_form_fields() returned {"has_fields": true}.
- Current URL matches any regex in CONFIG.stop.url_regex_any that is known to be a booking form host.
- Page title contains "appointment" and browser_has_form_fields() is true.

# Output (must be valid JSON only)
{
  "navigated_url": "<final url>",
  "page_title": "<title>",
  "form_detected": true,
  "next_action_advice": "You are on the booking form. Proceed to fill it out.",
  "screenshot_path": "page.png",
  "registrar_page": "<resolved registrar page or null>"
}
""").substitute


def build_general_task(user_inputs: dict, config: dict) -> str:
    return LOCAL_REGISTAR_SEARCH_TASK(
        user_inputs_json=json.dumps(user_inputs, ensure_ascii=False),
        config_json=json.dumps(config, ensure_ascii=False),
    )

# -------------------------------------------------------------------
# Orchestrator
# -------------------------------------------------------------------
def run_search(user_inputs: dict):
    """
    user_inputs example:
    {
      "death_location": "Covent Garden, London, UK",
      "postcode": "WC2E 8AA",
      "preferred_borough": "Camden"     # optional
    }
    """
    # Build a query that avoids filling forms: we push the query via URL parameters.
    location = user_inputs.get("death_location", "")
    borough_filter = f" site:.gov.uk"

    # Strongly bias to gov.uk and "register a death"
    duck_query = f"site:gov.uk local registar office {location}{borough_filter}"

    config = {
        # Start directly at DuckDuckGo with query param — no typing.
        "seed_url": f"https://duckduckgo.com/?q={duck_query.replace(' ', '+')}",
        "search": {
            "entrypoint": "https://duckduckgo.com",
            "query": duck_query
        },
        "links": {
            "allowlist": [".gov.uk"],
            # Avoid City of London unless explicitly requested or postcode maps to EC1-EC4
            "blocklist": (
                ["cityoflondon.gov.uk"] if not (
                    (user_inputs.get("postcode","").upper().startswith(("EC1","EC2","EC3","EC4")))
                ) else []
            ),
            "required_domain_suffixes": [".gov.uk"],
            "prefer_keywords": [
                "register a death", "book an appointment", "births, deaths and marriages",
                "register office", "registering a death"
            ]
        },
        "goal": {
            "keywords": ["register a death", "book an appointment", "registering a death"],
            "xpath_or_selectors": [
                "//a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'register a death')]",
                "//a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'book an appointment')]",
                "a[href*='register']",
                "a[href*='death']",
            ]
        },
        "stop": {
            "url_regex_any": [
                r"/register(-|%20)?death",
                r"/births(-|%20)?deaths(-|%20)?marriages",
                r"/book.*appointment"
            ],
            "selectors_any": ["a[href*='book']", "a[href*='register']"],
            "phrases_any": ["register a death", "book an appointment", "certificate for burial or cremation"]
        }
    }

    tools = [
        browser_open, browser_query_links, browser_click, browser_click_text,
        browser_wait, browser_scroll, browser_current_url, browser_screenshot,
        browser_fill, browser_click_role_button,
        browser_click_role_link, browser_click_any_text, browser_has_form_fields
    ]
    agent = Agent(tools=tools, model=model)
    task = build_general_task(user_inputs, config)
    result = agent(task)
    print(result)


if __name__ == "__main__":
    try:
        run_search(
            {
                "death_location": "St. Johns Wood Terrace, London, UK",
                "postcode": "NW8 6JJ"
            }
        )
    finally:
        # Leave open during dev so you can see; uncomment to close.
        # SharedBrowser.close()
        print("Done.")
