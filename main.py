from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models import (
    ProjectSubmission,
    RiskPredictionOutput
)

from rag_pipeline import (
    generate_risk_prediction
)

app = FastAPI(

    title="NYC Construction Risk Predictor",

    description="""
    RAG-based AI system for predicting
    construction safety risks,
    violations, and delays.
    """,

    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():

    return {

        "message":
        "NYC Construction Risk Predictor API Running"
    }


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