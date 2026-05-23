import os
import sqlite3
import chromadb

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from sentence_transformers import SentenceTransformer

SIMILARITY_THRESHOLD = 0.78

from models import (
    ProjectSubmission,
    RiskPredictionOutput,
    LLMRiskPrediction
)

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_collection(name="construction_risk_rag")

from dotenv import load_dotenv
import os

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=GEMINI_API_KEY,
    temperature=0.3
)

parser = PydanticOutputParser(pydantic_object=RiskPredictionOutput)

def generate_risk_prediction(project: ProjectSubmission):
    conn = sqlite3.connect("risk_data.db")
    cursor = conn.cursor()

    # 1. Format the incoming project data into a searchable string
    # MATCH RASHI'S EXACT FORMATTING FROM chunk.ipynb
    query_text = f"""

    PROJECT DETAILS:

    Job Type: {project.job_type}
    Borough: {project.borough.upper()}
    BIN: UNKNOWN
    Block: UNKNOWN
    Lot: UNKNOWN

    Building Type: {project.building_type}

    Initial Cost: {project.initial_cost}

    Floor Area:
    {project.total_construction_floor_area}

    Existing Stories:
    UNKNOWN

    Proposed Stories:
    {project.proposed_no_of_stories}

    Existing Dwelling Units:
    UNKNOWN

    Proposed Dwelling Units:
    UNKNOWN

    CONTRACTOR & SCOPE:

    Applicant Professional Title:
    {project.applicant_professional_title}
    """

    query_embedding = embedding_model.encode(
        [query_text]
    ).tolist()[0]

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=5
    )

    valid_projects = []
    
    if results["metadatas"] and results["metadatas"][0]:
        metadatas = results["metadatas"][0]
        distances = results["distances"][0]

        for metadata, distance in zip(metadatas, distances):
            # BULLETPROOF MATH: Converts L2 or Cosine distance to a safe 0-1 scale
            similarity = 1 / (1 + distance)
            
            if similarity >= SIMILARITY_THRESHOLD:
                valid_projects.append({
                    "metadata": metadata,
                    "similarity": similarity
                })

    # 4. Calculate Confidence Metrics
    LOW_CONFIDENCE_MODE = len(valid_projects) < 2

    if valid_projects:
        similarity_scores = [p["similarity"] for p in valid_projects]
        avg_similarity = sum(similarity_scores) / len(similarity_scores)
    else:
        avg_similarity = 0.0

    # ADJUSTED TIERS for MiniLM embeddings
    if avg_similarity >= 0.65:
        confidence_level = "HIGH"
    elif avg_similarity >= 0.55:
        confidence_level = "MEDIUM"
    else:
        confidence_level = "LOW"

    risk_histories = []

    for project in valid_projects:

        bin_number = project["metadata"].get("bin")

        if not bin_number:
            continue

        cursor.execute(
            """
            SELECT *
            FROM violations
            WHERE bin = ?
            """,
            (bin_number,)
        )

        rows = cursor.fetchall()

        if len(rows) == 0:
            history = f"""
            BIN: {bin_number}
            Historical Risk:
            LOW RISK
            No recorded violations found.
            """

        else:
            history = f"""
            BIN: {bin_number}
            Historical Violations:
            {rows}
            """

        risk_histories.append(history)

    combined_history = "\n\n".join(risk_histories)

    if LOW_CONFIDENCE_MODE:
        retrieval_instruction = """
        WARNING:
        WARNING: Retrieved historical projects have weak semantic similarity to the current project.
        Do NOT make highly specific claims. Avoid overconfident predictions.
        Provide generalized NYC construction safety guidance based on the work types and building scale.
        Clearly mention in the summary that prediction confidence is reduced due to limited historical matches.
        """

    else:

        retrieval_instruction = """
        Use the retrieved historical NYC
        construction violations as strong
        grounding for risk prediction.
        """

    prompt = PromptTemplate(
        template="""
        You are an expert NYC construction
        risk analysis AI.
        Analyze the following NEW project
        and compare it against historical
        NYC construction safety data.
        ------------------------------------------------
        NEW PROJECT:
        {query_text}
        ------------------------------------------------
        HISTORICAL RISK DATA:
        {historical_context}
        ------------------------------------------------
        {retrieval_instruction}
        Predict:
        - likelihood of violations
        - stop-work orders
        - project delays
        - safety concerns

        {format_instructions}
        """,

        input_variables=[
            "query_text",
            "historical_context",
            "retrieval_instruction"
        ],

        partial_variables={
            "format_instructions":
            parser.get_format_instructions()
        }
    )


    final_prompt = prompt.format(
        query_text=query_text,
        historical_context=combined_history,
        retrieval_instruction=retrieval_instruction
    )


    retrieval_summary = f"""
        Retrieved {len(valid_projects)}
        high-confidence historical projects.

        Average similarity:
        {round(avg_similarity, 2)}

        Confidence Level:
        {confidence_level}
        """


    response = llm.invoke(final_prompt)


    llm_parsed_response = parser.parse(response.content)

    # 2. Merge it with your Python logic into the Final Output Model
    final_output = RiskPredictionOutput(
        risk_score=llm_parsed_response.risk_score,
        primary_risks=llm_parsed_response.primary_risks,
        recommended_mitigations=llm_parsed_response.recommended_mitigations,
        historical_summary=llm_parsed_response.historical_summary,
        confidence_level=confidence_level,
        retrieved_project_count=len(valid_projects),
        average_similarity_score=round(avg_similarity, 2)
    )

    conn.close()
    return final_output