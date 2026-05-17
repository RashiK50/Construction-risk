from pydantic import BaseModel, Field
from typing import List, Optional

# --- INCOMING DATA (From React to FastAPI) ---
class ProjectSubmission(BaseModel):
    # Mapping directly to the DOB NOW column names for consistency
    job_type: str = Field(..., description="Corresponds to 'job_type' (e.g., A1, A2, NB, DM)")
    borough: str = Field(..., description="Corresponds to 'borough' (e.g., Manhattan, Brooklyn, Queens)")
    building_type: str = Field(..., description="Corresponds to 'building_type' (e.g., 1-2-3 Family, Commercial)")
    
    # Financials & Scale
    initial_cost: float = Field(..., description="Corresponds to 'initial_cost'")
    total_construction_floor_area: int = Field(..., description="Corresponds to 'total_construction_floor_area'")
    proposed_no_of_stories: int = Field(default=1, description="Corresponds to 'proposed_no_of_stories'")
    
    # Contractor / Scope Info
    applicant_professional_title: str = Field(..., description="Corresponds to 'applicant_professional_title' (e.g., PE, RA, GC)")
    
    # In the DB, these are individual boolean columns (e.g., `plumbing_work_type`, `structural_work_type_`). 
    # For the UI, it's much cleaner to accept an array of strings.
    work_types: List[str] = Field(..., description="List of involved trades (e.g., ['Plumbing', 'Mechanical', 'Structural'])")
    
    # An optional free-text field for the user to add context that embeddings can easily pick up
    project_description: Optional[str] = Field(default="", description="Optional user-provided summary of the work")


# --- OUTGOING DATA (From FastAPI/LangChain to React) ---
class RiskPredictionOutput(BaseModel):
    risk_score: int = Field(..., description="0-100 scale predicting the likelihood of violations/delays")
    primary_risks: List[str] = Field(..., description="Specific risks identified from historical data")
    recommended_mitigations: List[str] = Field(..., description="Actionable steps to avoid these risks")
    historical_summary: str = Field(..., description="A short narrative summarizing the retrieved ChromaDB/SQLite context")