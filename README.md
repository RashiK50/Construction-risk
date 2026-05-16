# NYC Construction Risk Predictor (RAG System)

An enterprise-grade Retrieval-Augmented Generation (RAG) system designed to predict safety violations, project delays, and stop-work orders for new construction permits in New York City. 

This project bridges the gap between raw municipal open data and actionable business intelligence by semantically mapping new project proposals to historical construction failures.

## System Architecture

We implemented a decoupled dual-database RAG architecture to optimize for both semantic search accuracy and context-window latency:

1. **User Input (Abstraction):** Users submit a high-signal 8-field form (e.g., Job Type, Cost, Work Types). The backend dynamically constructs a dense semantic paragraph for vector search.
2. **Vector Retrieval (ChromaDB):** The semantic query is embedded and searched against thousands of historical NYC building permits to find the Top-K most similar past projects.
3. **Document Store (SQLite):** Using the retrieved Building Identification Numbers (BINs) from ChromaDB, the system performs an O(1) lookup in SQLite to fetch historical safety violations and "Risk Registers."
4. **LLM Generation (Gemini API + LangChain):** The historical context and new project details are injected into a LangChain prompt template. Google's Gemini 1.5 model analyzes the data and outputs a highly structured JSON risk assessment.

## Tech Stack

* **Framework:** FastAPI (Python)
* **AI Orchestration:** LangChain
* **LLM Provider:** Google Gemini API (`gemini-1.5-flash` / `gemini-1.5-pro`)
* **Vector Database:** ChromaDB (Project Features)
* **Document Database:** SQLite (Historical Risk Registers)
* **Data Processing:** Pandas
* **Frontend:** React (In Development)

## Datasets Used
Data was sourced and cleaned from **NYC Open Data**:
* **DOB NOW: Build – Job Application Filings:** Cleaned and vectorized 74+ columns into searchable project profiles.
* **DOB Safety Violations:** Aggregated and structured into JSON-based "Risk Registers" mapped by building BIN.

## Project Structure

    ├── backend/
    │   ├── main.py                 # FastAPI server and endpoints
    │   ├── models.py               # Pydantic schemas for request validation
    │   ├── rag_pipeline.py         # LangChain orchestration and Gemini API logic
    │   ├── ingest_violations.py    # ETL script: JSON to SQLite DB
    │   ├── chroma_db/              # ChromaDB vector index (Ignored in Git)
    │   └── risk_data.db            # SQLite database (Ignored in Git)
    ├── data_processing/
    │   ├── clean_dob_now.ipynb     # Jupyter notebook for cleaning application data
    │   ├── clean_violations.ipynb  # Jupyter notebook for aggregating safety risks
    │   └── embed_to_chroma.ipynb   # Vector embedding pipeline
    ├── frontend/                   # React UI (WIP)
    ├── requirements.txt
    └── README.md

## Quick Start (Local Development)

### 1. Clone the repository
`git clone https://github.com/RashiK50/Construction-risk.git`
`cd Construction-risk/backend`

### 2. Set up Virtual Environment & Install Dependencies
`python3 -m venv venv`
`source venv/bin/activate`  
`pip install -r requirements.txt`

### 3. Environment Variables
Create a `.env` file in the `backend/` directory and add your Google AI Studio API key:
`GEMINI_API_KEY=your_google_gemini_api_key_here`

### 4. Database Setup
*(Note: Raw data and databases are not tracked in git. You must run the local ingestion scripts first).*

1. Run Rashi's ChromaDB ingestion script (ensure DOB NOW data is present)
2. Run the SQLite ingestion script for violations
`python3 ingest_violations.py`

### 5. Start the FastAPI Server
`uvicorn main:app --reload`

The API will be available at `http://127.0.0.1:8000`. You can view the interactive Swagger documentation at `http://127.0.0.1:8000/docs`.

## API Usage Example

**Endpoint:** `POST /api/predict-risk`

**Request Body:**
    {
      "job_type": "Major Alteration",
      "borough": "Manhattan",
      "occupancy_type": "Commercial",
      "estimated_cost": 450000,
      "sq_footage": 12000,
      "applicant_title": "Professional Engineer",
      "work_types": ["Plumbing", "Mechanical", "Structural"],
      "description": "Upgrading HVAC systems and structural reinforcements on floors 2-4."
    }

**Response:**
    {
      "risk_score": 78,
      "primary_risks": [
        "High probability of Stop-Work Order due to mechanical scope in commercial alterations.",
        "SWARMP conditions frequently escalated to unsafe classifications in similar past projects."
      ],
      "recommended_mitigations": [
        "Ensure pre-inspection of existing guardrails before mechanical demolition begins.",
        "Verify secondary contractor plumbing licenses prior to day 1."
      ],
      "historical_summary": "Based on 5 highly similar Manhattan commercial alterations, 3 resulted in ECB penalties due to undocumented plumbing work and site safety failures."
    }
