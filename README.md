# 🕊️ Afterversed

**AI-Powered Bereavement Support Platform**

Afterversed is an intelligent, compassionate platform that guides users through the complex process of handling post-death administrative tasks using multi-agent AI orchestration. Built with modern web technologies and powered by Google's Gemini AI, it automates legal, financial, and organizational tasks during one of life's most challenging times.

---

## 🌟 Features

### 🤖 **Multi-Agent AI System**
- **LangGraph Orchestration**: State-of-the-art agent-to-agent communication
- **4 Specialized Agents Working Together**:
  - 🔍 **SearchAgent**: Finds banks, government offices, and service providers
  - ✍️ **DraftingAgent**: Generates professional letters and legal documents
  - 📤 **FormAgent**: Automates form submission and tracks responses
  - 🧮 **ComputeAgent**: Validates financial calculations and tax compliance

### 💼 **Intelligent Automation**
- **Funeral Arrangement**: AI-powered search for funeral homes with pricing comparison
- **Financial & Legal Workflow**: Automated estate valuation, probate assessment, and IHT calculations
- **Document Generation**: Professional UK business letters and government forms
- **Task Status Tracking**: Real-time progress monitoring with database persistence

### 🎨 **Beautiful User Experience**
- Modern, responsive React + TypeScript frontend
- Gradient designs with smooth animations
- Step-by-step guided procedures
- Real-time agent progress visualization
- Mobile-friendly interface

### 📊 **Comprehensive Dashboard**
- Interactive checklist with AI automation indicators
- Task completion tracking with green status badges
- Financial summary with tax calculations
- Timeline of all agent activities
- Action items and key deadlines

---

## 🏗️ Architecture

### **Tech Stack**

#### **Backend**
- **FastAPI**: High-performance Python web framework
- **SQLite + aiosqlite**: Async database operations
- **LangGraph**: Multi-agent workflow orchestration
- **Google Gemini AI**: Natural language processing and generation
- **Playwright**: Browser automation for web scraping
- **Strands Framework**: AI agent tooling

#### **Frontend**
- **React 18**: Modern component-based UI
- **TypeScript**: Type-safe development
- **Vite**: Lightning-fast build tool
- **TanStack Query**: Server state management
- **shadcn/ui**: Beautiful, accessible component library
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Unstyled, accessible primitives

#### **AI/ML**
- **google-genai**: Official Google Gemini SDK
- **langchain-google-genai**: LangChain integration
- **langchain-core**: Core LangChain functionality

---

## 🚀 Getting Started

### **Prerequisites**
- Python 3.14+
- Node.js 18+
- Google Gemini API key
- Git

### **Installation**

#### **1. Clone the Repository**
```bash
git clone https://github.com/Stanleyhoo1/Afterversed.git
cd Afterversed
```

#### **2. Backend Setup**
```bash
cd app

# Install Python dependencies
pip install -r requirements.txt

# Create .env file
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Initialize database
python -c "from database import init_db; import asyncio; asyncio.run(init_db())"
```

#### **3. Frontend Setup**
```bash
cd ../frontend

# Install Node dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000" > .env
```

### **Running the Application**

#### **Terminal 1 - Backend Server**
```bash
cd app
python -m uvicorn main:app --reload --port 8000
```

#### **Terminal 2 - Frontend Dev Server**
```bash
cd frontend
npm run dev
```

#### **Access the Application**
- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

---

## 📖 Usage Guide

### **1. Complete the Survey**
- Navigate to the homepage
- Fill out the bereavement survey with details about the deceased
- Submit to create your session

### **2. Choose Your Path**

#### **Option A: Financial & Legal Workflow (Recommended)**
1. Go to "Financial Procedure" from the survey completion page
2. Toggle "Multi-Agent Mode" ON to see all agents working
3. Check "Use Example Data" for a demo
4. Click "🤖 Run AI Calculations"
5. Watch the agents work:
   - SearchAgent finds institutions
   - DraftingAgent creates documents
   - FormAgent submits forms
   - ComputeAgent validates finances
6. Review comprehensive results with financial summary, tax calculations, and action items

#### **Option B: Step-by-Step Procedure**
1. Navigate to the "Procedure" dashboard
2. Follow tasks sequentially:
   - **Register the Death**: Get certificates and notify authorities
   - **Arrange Funeral**: Use AI to search funeral homes
   - **Legal & Financial**: Access automated workflow
   - **Notify Organizations**: Contact banks, utilities, etc.
3. Use AI assistants for specific tasks (funeral search, legal workflow)

### **3. Track Progress**
- Completed tasks show green background with ✓ badges
- View all task statuses in the procedure dashboard
- Access generated documents and reports

---

## 🤖 Agent Workflows

### **LangGraph Multi-Agent Pipeline**

```
User Input
    ↓
🔍 SearchAgent
    │ • Finds banks in user's location
    │ • Locates HMRC offices
    │ • Identifies probate registry
    ↓
✍️ DraftingAgent
    │ • Generates death notification letters
    │ • Creates IHT400 form guidance
    │ • Drafts PA1P probate application
    ↓
📤 FormAgent
    │ • Simulates form submission
    │ • Generates bank responses
    │ • Creates HMRC acknowledgments
    ↓
🧮 ComputeAgent
    │ • Calculates net estate value
    │ • Computes inheritance tax (IHT)
    │ • Validates against HMRC estimates
    │ • Checks probate requirements
    ↓
📊 Report Generator
    │ • Executive summary
    │ • Timeline of actions
    │ • Financial breakdown
    │ • Next action items
    ↓
Final Report → User
```

### **State Management**
- LangGraph maintains state between agents
- Each agent passes data to the next
- Full traceability of all decisions
- Error handling at each step

---

## 📁 Project Structure

```
Afterversed/
├── app/                          # Backend (Python/FastAPI)
│   ├── main.py                   # FastAPI application & endpoints
│   ├── database.py               # SQLite operations & task status
│   ├── agents.py                 # AI checklist generator
│   ├── compute_agent.py          # Financial calculations agent
│   ├── search.py                 # SearchAgent with Playwright
│   ├── langgraph_workflow.py    # Multi-agent orchestration
│   ├── draft_email.py            # Email drafting utilities
│   ├── schema.sql                # Database schema
│   ├── requirements.txt          # Python dependencies
│   └── .env                      # Environment variables
│
├── frontend/                     # Frontend (React/TypeScript)
│   ├── src/
│   │   ├── pages/                # Page components
│   │   │   ├── Index.tsx         # Landing page
│   │   │   ├── Survey.tsx        # Bereavement survey
│   │   │   ├── Procedure.tsx     # Main dashboard
│   │   │   ├── FinancialProcedure.tsx  # Financial workflow
│   │   │   ├── LegalFinancialWorkflow.tsx  # LangGraph UI
│   │   │   └── FuneralArrangement.tsx  # Funeral search
│   │   ├── components/           # Reusable components
│   │   │   └── ui/               # shadcn/ui components
│   │   ├── lib/
│   │   │   ├── api.ts            # API client functions
│   │   │   ├── config.ts         # Configuration
│   │   │   └── utils.ts          # Utilities
│   │   └── hooks/                # Custom React hooks
│   ├── package.json              # Node dependencies
│   └── vite.config.ts            # Vite configuration
│
└── README.md                     # This file
```

---

## 🔌 API Endpoints

### **Session Management**
- `POST /sessions` - Create new session
- `GET /sessions/{id}` - Get session details
- `POST /sessions/{id}/survey` - Submit survey data

### **AI Agents**
- `POST /sessions/{id}/generate-checklist` - Generate task checklist
- `POST /sessions/{id}/compute` - Run financial calculations (ComputeAgent)
- `POST /sessions/{id}/search-funeral` - Search funeral homes (SearchAgent)
- `POST /sessions/{id}/langgraph-workflow` - Execute multi-agent workflow

### **Task Tracking**
- `GET /sessions/{id}/task-statuses` - Get all task statuses
- `POST /sessions/{id}/financial-assessment` - Assess estate requirements

---

## 🎯 Key Features in Detail

### **1. Intelligent Task Checklist**
- AI-generated checklist based on survey responses
- Tailored to UK regulations and procedures
- Automation level indicators (full/partial/none)
- Agent type recommendations (Search/Draft/Form/Compute)

### **2. Financial Calculations**
- **Estate Valuation**: Property, bank accounts, investments
- **Probate Assessment**: £5,000 threshold check
- **Inheritance Tax (IHT)**: 
  - Nil-rate band: £325,000
  - IHT rate: 40% on taxable estate
  - Validation against HMRC estimates
- **Discrepancy Detection**: Flags calculation mismatches

### **3. Document Generation**
- Professional UK business letter formatting
- Death notification letters for banks
- IHT400 form completion guidance
- PA1P probate application instructions
- Customized with deceased details

### **4. Funeral Home Search**
- Location-based search
- Three service types: Cremation, Burial, Woodland
- Pricing comparison
- Ratings and reviews
- Direct links to provider websites

### **5. Real-Time Progress**
- Animated agent progress bars
- Step-by-step status updates
- Color-coded completion states
- Estimated completion times

---

## 🔐 Security & Privacy

- **Session-based data**: Each user gets isolated session
- **No authentication required**: Privacy-first approach
- **Local storage**: Task statuses cached client-side
- **Secure API keys**: Environment variable management
- **No sensitive data logging**: Compliance with data protection

---

## 🧪 Testing

### **Backend Testing**
```bash
cd app
python strandTest.py  # Test Strands agent framework
```

### **Frontend Testing**
```bash
cd frontend
npm run build  # Production build test
```

---

## 🌐 Deployment

### **Backend Deployment** (Example: Railway/Heroku)
```bash
# Set environment variables
GEMINI_API_KEY=your_key
PORT=8000

# Deploy
git push railway main
```

### **Frontend Deployment** (Example: Vercel/Netlify)
```bash
# Set environment variable
VITE_API_URL=https://your-api.com

# Deploy
npm run build
vercel deploy
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **Google Gemini AI**: Powers the intelligent agents
- **LangChain/LangGraph**: Multi-agent orchestration framework
- **shadcn/ui**: Beautiful component library
- **FastAPI**: High-performance Python framework
- **UK Government Digital Service**: Inspiration for clear, accessible design

---

## 📧 Contact

**Project Maintainer**: Stanley Hoo  
**Repository**: [Afterversed](https://github.com/Stanleyhoo1/Afterversed)

---

## 🗺️ Roadmap

- [ ] **Real form submission** integration with UK government APIs
- [ ] **Document storage** with cloud integration
- [ ] **Email automation** for institution notifications
- [ ] **Calendar integration** for deadline tracking
- [ ] **Mobile app** (React Native)
- [ ] **Multi-language support** (Welsh, Scottish Gaelic)
- [ ] **Voice assistant** integration
- [ ] **PDF generation** for documents
- [ ] **Analytics dashboard** for estate administrators
- [ ] **Community support** forum

---

## 💡 Why Afterversed?

Dealing with administrative tasks after losing a loved one is overwhelming. Afterversed aims to:

✅ **Reduce cognitive load** during grief  
✅ **Automate repetitive tasks** with AI  
✅ **Provide clear guidance** through complex procedures  
✅ **Ensure nothing is missed** with comprehensive checklists  
✅ **Save time** with intelligent automation  
✅ **Offer peace of mind** with validation and tracking  

---

## 📊 Project Stats

- **4 Specialized AI Agents**
- **50+ Automated Tasks**
- **Real-time Progress Tracking**
- **UK Regulation Compliant**
- **Mobile-First Design**
- **Zero-Cost Entry** (Free tier APIs)

---

<div align="center">

**Built with ❤️ to help during life's difficult moments**

[Report Bug](https://github.com/Stanleyhoo1/Afterversed/issues) • [Request Feature](https://github.com/Stanleyhoo1/Afterversed/issues)

</div>
