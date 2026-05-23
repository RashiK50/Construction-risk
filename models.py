from pydantic import BaseModel, Field
from typing import List, Optional

# --- INCOMING DATA ---
class ProjectSubmission(BaseModel):
    job_type: str = Field(...)
    borough: str = Field(...)
    building_type: str = Field(...)
    initial_cost: float = Field(...)
    total_construction_floor_area: int = Field(...)
    proposed_no_of_stories: int = Field(default=1)
    applicant_professional_title: str = Field(...)
    work_types: List[str] = Field(...)
    project_description: Optional[str] = Field(default="")

# --- LLM TARGET DATA (Strictly for Langchain Parser) ---
class LLMRiskPrediction(BaseModel):
    risk_score: int = Field(..., description="0-100 scale predicting the likelihood of violations/delays")
    primary_risks: List[str] = Field(..., description="Specific risks identified from historical data")
    recommended_mitigations: List[str] = Field(..., description="Actionable steps to avoid these risks")
    historical_summary: str = Field(..., description="A short narrative summarizing the retrieved context")

# --- FINAL API OUTPUT (Sent to React Frontend) ---
class RiskPredictionOutput(BaseModel):
    # LLM Generated
    risk_score: int
    primary_risks: List[str]
    recommended_mitigations: List[str]
    historical_summary: str
    
    # Python Generated Metadata
    confidence_level: str
    retrieved_project_count: int
    average_similarity_score: float