# Resume Matcher AI

An AI-powered resume and job matching platform that optimizes resumes for ATS, matches candidates with relevant opportunities, and provides intelligent career guidance. Features skill gap analysis, real-time job matching, and AI agents for strategy and outcome prediction.

## Features

- **Resume Optimization**: Analyzes and optimizes resumes for ATS (Applicant Tracking System) scoring
- **Job Matching**: Intelligent multi-agent system that matches candidates with relevant job opportunities
- **ATS Scoring**: Real-time ATS compliance scoring with detailed breakdowns
- **Skill Analysis**: Extracts and analyzes skills from resumes, identifies gaps, and suggests improvements
- **Career Roadmap**: AI-powered career strategy and transition recommendations
- **Cover Letter Generation**: Automatic cover letter generation tailored to job descriptions
- **Job Search**: Browse and apply for jobs with intelligent matching insights
- **User Authentication**: Secure user registration and authentication system
- **Dashboard**: Comprehensive dashboard with personalized recommendations

## Tech Stack

**Backend:**

- FastAPI (Python web framework)
- SQLAlchemy (ORM)
- LangChain + Groq (LLM integration for AI agents)
- Sentence Transformers (NLP embeddings)
- FAISS (Vector similarity search)
- spaCy (NLP processing)

**Frontend:**

- React 19
- Vite (build tool)
- Tailwind CSS (styling)
- React Router (navigation)
- Axios (HTTP client)
- Recharts (data visualization)

**ML Models:**

- XGBoost (ATS scoring)
- FAISS index (job embeddings)
- Sentence Transformers (semantic search)

## Prerequisites

Before you begin, ensure you have installed:

- **Python 3.9+** (for backend)
- **Node.js 18+** (for frontend)
- **npm** or **yarn** (package manager)
- **Git**

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/prathamanvekar/resume-matcher-ai.git
cd resume-matcher-ai
```

### 2. Backend Setup

#### Install Python Dependencies

```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

#### Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Database
DATABASE_URL=sqlite:///./app.db

# Authentication
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# LLM (Groq)
GROQ_API_KEY=your-groq-api-key

# Server
DEBUG=True
```

Get your Groq API key from [console.groq.com](https://console.groq.com)

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:8000
```

## Running the Application

### Start the Backend Server

From the `backend` directory:

```bash
# Make sure your virtual environment is activated
python -m uvicorn main:app --reload
```

The backend will run on `http://localhost:8000`

API Documentation will be available at `http://localhost:8000/docs`

### Start the Frontend Development Server

From the `frontend` directory:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Building for Production

### Frontend Build

```bash
cd frontend
npm run build
```

Output will be in `frontend/dist`

### Backend Production

```bash
# Use a production ASGI server (e.g., Gunicorn with Uvicorn)
pip install gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 0.0.0.0:8000
```

## Project Structure

```
resume-matcher-ai/
├── backend/                    # Python FastAPI backend
│   ├── agents/                # AI agents (career, explainability, outcome, strategy)
│   ├── ml/                    # ML components (embeddings, search, model loading)
│   ├── models/                # Database models (user, resume, job, application)
│   ├── routers/               # API endpoints (auth, career, jobs, resume, dashboard)
│   ├── services/              # Business logic (ATS scoring, parser, matcher, analyzer)
│   ├── config.py              # Configuration settings
│   ├── database.py            # Database setup
│   ├── main.py                # FastAPI app initialization
│   └── requirements.txt        # Python dependencies
│
├── frontend/                   # React Vite frontend
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── pages/             # Page components
│   │   ├── api/               # API client configuration
│   │   ├── context/           # React context (auth)
│   │   ├── App.jsx            # Main app component
│   │   └── main.jsx           # Entry point
│   ├── package.json           # Node dependencies
│   └── vite.config.js         # Vite configuration
│
├── trained_models/            # Pre-trained ML models
│   ├── job_index.faiss        # FAISS job embeddings index
│   ├── job_embeddings.npy     # Job vector embeddings
│   ├── ats_config.json        # ATS model configuration
│   ├── skill_job_mapping.json # Skill to job mappings
│   └── role_transition_graph.json # Career transition paths
│
└── README.md                   # This file
```

## API Endpoints

### Authentication

- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Resume

- `POST /resume/upload` - Upload and parse resume
- `GET /resume/{id}` - Get resume details
- `PUT /resume/{id}` - Update resume
- `DELETE /resume/{id}` - Delete resume

### Jobs

- `GET /jobs` - List all jobs
- `GET /jobs/search` - Search jobs with filters
- `POST /jobs/apply` - Apply for a job
- `GET /jobs/matches/{resume_id}` - Get job matches

### Career

- `GET /career/roadmap` - Get career roadmap
- `GET /career/skill-gap` - Analyze skill gaps
- `POST /career/strategy` - Get career strategy

### Dashboard

- `GET /dashboard/overview` - Dashboard overview

## Key AI Agents

1. **Career Agent**: Provides career progression strategy and recommendations
2. **Strategy Agent**: Develops application strategies for specific roles
3. **Outcome Agent**: Predicts application success rates
4. **Explainability Agent**: Explains matching scores and recommendations
5. **Resume Optimizer**: Suggests resume improvements for specific jobs

## Usage Examples

### 1. Register and Login

Navigate to `http://localhost:5173` → Register → Login with your credentials

### 2. Upload Resume

Upload a PDF or DOCX resume in the dashboard. The system will parse and extract information automatically.

### 3. View Job Matches

Browse available jobs and get intelligent match scores showing compatibility and required skill gaps.

### 4. Get ATS Score

View detailed ATS compliance scores with specific recommendations for improvement.

### 5. Career Guidance

Check your career roadmap and get AI-powered recommendations for skill development and role transitions.

## Troubleshooting

**Backend fails to start:**

- Ensure Python virtual environment is activated
- Check that Groq API key is set correctly in `.env`
- Verify SQLite database permissions

**Frontend won't connect to backend:**

- Check that backend is running on `http://localhost:8000`
- Verify `VITE_API_URL` in frontend `.env` matches backend address
- Check browser console for CORS errors

**ML models not loading:**

- Ensure `trained_models/` directory exists with all required files
- Check file permissions for model files

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or suggestions, please open an issue on the GitHub repository.

---

**Created with ❤️ by Resume Matcher AI Team**
