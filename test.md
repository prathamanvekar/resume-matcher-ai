To test the **AI-Powered Career Intelligence Platform** end-to-end, you need to simulate a real user journey. This ensures that the Frontend, Backend, Database, AI Agents, and ML Models are all talking to each other correctly.

Here is a step-by-step **User Acceptance Testing (UAT) Guide**.

---

### 🟢 Phase 0: Prerequisites (Start Everything)

1.  **Backend:**
    ```bash
    cd backend
    # Ensure virtual env is active
    # Ensure .env has GROQ_API_KEY
    uvicorn main:app --reload --port 8000
    ```
    *Check:* You should see `✅ ML models loaded` and `✅ Application ready!`.

2.  **Frontend:**
    ```bash
    cd frontend
    npm run dev
    ```
    *Check:* Open `http://localhost:5173`.

3.  **Test Data:** Create a simple dummy resume named `test_resume.txt`:
    ```text
    John Doe
    john.doe@example.com | 555-0199 | San Francisco, CA

    SUMMARY
    Junior Data Analyst with 2 years of experience in Python, SQL, and Excel. Looking to transition into Machine Learning.

    EXPERIENCE
    Data Analyst | Tech Corp | 2022 - Present
    - Analyzed marketing data using Pandas and SQL.
    - Created visualizations in Tableau.

    EDUCATION
    B.S. Computer Science | University of Tech | 2022

    SKILLS
    Python, SQL, Excel, Tableau, Data Analysis, Communication
    ```

---

### 🧪 Phase 1: Onboarding (Auth & Settings)

1.  **Register:**
    *   Go to `/register`.
    *   Enter Name: `Test User`, Email: `test@example.com`, Password: `Password123`.
    *   **Click "Create Account".**
    *   *Expected:* Redirects to Dashboard. Toast says "Account created".

2.  **Configure Preferences:**
    *   Go to **Settings** (Sidebar).
    *   **Target Role:** `Data Scientist`.
    *   **Location:** `Remote`.
    *   **Salary:** Min `80000`, Max `150000`.
    *   **Click "Save Preferences".**
    *   *Expected:* Toast says "Preferences saved". Database updates.

---

### 🧪 Phase 2: Resume Intelligence (Parser, ATS, Agent)

3.  **Upload Resume:**
    *   Go to **My Resumes** `/resumes`.
    *   **Click "Upload Resume"** and select `test_resume.txt` (or a PDF).
    *   *Expected:* Progress bar fills. Resume appears in the list. ATS Score gauge appears.

4.  **View Analysis:**
    *   **Click "View"** on the resume card.
    *   Check **Overview tab:** Are Name, Email, and Skills parsed correctly?
    *   Check **ATS Report tab:** See the breakdown (Length, Keywords, etc.).
    *   Check **Skills tab:** Are badges colored correctly?

5.  **Test Resume Optimizer Agent:**
    *   **Click "Optimize Resume"** (top right).
    *   **Target Role:** Type `Data Scientist`.
    *   **Click "Optimize Resume" button.**
    *   *Wait (10-20s):* The Agent is calling Groq API.
    *   *Expected:*
        *   "Optimization Complete" card appears.
        *   "New Score" should be higher than "Original Score".
        *   "Changes Made" list shows what the AI did.
        *   Version History sidebar updates.

---

### 🧪 Phase 3: Job Matching & Strategy (Vector DB & Logic)

6.  **Semantic Search & Matching:**
    *   Go to **Job Matching** `/jobs`.
    *   **Select Resume:** Choose the one you uploaded.
    *   **Click "Find Matching Jobs".**
    *   *Expected:* A list of jobs appears. These come from your `FAISS` index (Notebook 2).
    *   *Check:* Look at the **Match Score** on the cards.

7.  **Deep Analysis & Decision Agent:**
    *   **Click "View Details"** on any job card.
    *   You are now on the **Apply Page**.
    *   *Check Match Analysis:* Look for "Skills You Have" vs "Skills to Develop".
    *   *Check AI Recommendation:* Look at the right sidebar **"AI Recommendation"**.
        *   Does it say **APPLY**, **SAVE**, or **SKIP**?
        *   Expand it. Does the **AI Reasoning** text make sense? (e.g., "High skill match but missing Tensorflow").
    *   *Check Prediction:* Look at **"Interview Callback Prediction"**. Is there a percentage?

8.  **Cover Letter Agent:**
    *   In the center column, find "Cover Letter".
    *   **Click "Generate Cover Letter".**
    *   *Wait (5-10s):* Agent is writing.
    *   *Expected:* A text box appears with a letter addressing the specific company and highlighting your specific skills.

9.  **Apply:**
    *   **Click "Mark as Applied"** (Sidebar).
    *   *Expected:* Redirects to Dashboard. Toast says "Application recorded".

---

### 🧪 Phase 4: Career Planning (Transition Model)

10. **Skill Gap Analysis:**
    *   Go to **Skill Gap** `/career/skill-gap`.
    *   **Select Resume.**
    *   **Target Role:** Select `Machine Learning Engineer`.
    *   **Click "Analyze Gap".**
    *   *Expected:*
        *   "Skills to Learn" section appears (e.g., TensorFlow, PyTorch).
        *   Priorities (High/Medium) are shown.

11. **Transition Roadmap:**
    *   Click **"Plan My Transition"** (or go to **Career Path** `/career`).
    *   **Current Role:** `Data Analyst`.
    *   **Target Role:** `Data Scientist`.
    *   **Click "Plan Transition".**
    *   *Expected:*
        *   **Feasibility Score:** (e.g., 73%).
        *   **Timeline:** (e.g., 12 Months).
        *   **Roadmap:** A timeline view showing Phase 1, Phase 2, etc.
        *   **AI Advice:** A paragraph of text giving specific advice.

---

### 🧪 Phase 5: Dashboard (Analytics)

12. **Verify Stats:**
    *   Go to **Dashboard** `/dashboard`.
    *   *Check:*
        *   "Total Applications" should be `1` (from Step 9).
        *   "Recent Applications" list should show the job you applied to.
        *   "Best Resume" should show your resume score.

---

### 🐛 Troubleshooting Common Issues during Testing

*   **Error: "LLM parsing failed" / "Cover letter failed"**:
    *   *Fix:* Check your terminal where `uvicorn` is running. If you see 401/403 errors, your `GROQ_API_KEY` in `.env` is invalid or missing.
*   **Error: "Models not loaded"**:
    *   *Fix:* Ensure the `trained_models/` folder exists in the root and contains all 14 files downloaded from Kaggle.
*   **No Jobs Found**:
    *   *Fix:* Ensure `job_index.faiss` and `job_metadata.pkl` are in `trained_models`.
*   **Frontend "Network Error"**:
    *   *Fix:* Ensure Backend is running on port 8000.

If you can get through **Steps 1-12**, your system is working perfectly! 🚀
