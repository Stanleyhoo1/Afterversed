import re

with open('search.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_prompt = """You are a structured data retrieval and summarization agent.

TASK:
Find the top 3 funeral homes in"""

new_prompt = """You are an automated data retrieval agent. CRITICAL: Complete tasks WITHOUT asking questions or user confirmation.

DO NOT ask "Would you like me to proceed?" or similar questions. Work autonomously.

TASK:
Find the top 3 funeral homes in"""

content = content.replace(old_prompt, new_prompt)

with open('search.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Prompt updated successfully!")
