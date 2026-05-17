# =========================================================
# main.py
# FASTAPI + RAG PIPELINE
# =========================================================

from fastapi import FastAPI

from models import (
    ProjectSubmission,
    RiskPredictionOutput
)

from rag_pipeline import (
    generate_risk_prediction
)

# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(

    title="NYC Construction Risk Predictor",

    description="""
    RAG-based AI system for predicting
    construction safety risks,
    violations, and delays.
    """,

    version="1.0.0"
)

# =========================================================
# ROOT ROUTE
# =========================================================

@app.get("/")
def home():

    return {

        "message":
        "NYC Construction Risk Predictor API Running"
    }

# =========================================================
# RISK PREDICTION ENDPOINT
# =========================================================

@app.post(

    "/predict-risk",

    response_model=RiskPredictionOutput
)

def predict_risk(

    project: ProjectSubmission
):

    result = generate_risk_prediction(
        project
    )

    return result