"""
Check if all required packages for the backend are installed
"""

import sys

required_packages = {
    'fastapi': 'FastAPI',
    'uvicorn': 'Uvicorn',
    'pydantic': 'Pydantic',
    'python-dotenv': 'dotenv',
    'aiosqlite': 'aiosqlite',
    'bcrypt': 'bcrypt',
    'google-genai': 'google.genai'
}

missing_packages = []
installed_packages = []

for package_name, import_name in required_packages.items():
    try:
        if '.' in import_name:
            parts = import_name.split('.')
            __import__(parts[0])
            import importlib
            importlib.import_module(import_name)
        else:
            __import__(import_name)
        installed_packages.append(package_name)
        print(f"✓ {package_name:20} - INSTALLED")
    except ImportError:
        missing_packages.append(package_name)
        print(f"✗ {package_name:20} - MISSING")

print("\n" + "="*50)
if missing_packages:
    print(f"\n❌ Missing {len(missing_packages)} package(s):")
    print("\nTo install missing packages, run:")
    print(f"pip install {' '.join(missing_packages)}")
else:
    print("\n✅ All required packages are installed!")
    print("\nYou can now start the server with:")
    print("cd app")
    print("python -m uvicorn main:app --reload --port 8000")

sys.exit(0 if not missing_packages else 1)
