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
    RiskPredictionOutput
)

embedding_model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)

chroma_client = chromadb.PersistentClient(
    path="./chroma_db"
)

collection = chroma_client.get_collection(
    name="construction_risk_rag"
)

from dotenv import load_dotenv
import os

load_dotenv()

GEMINI_API_KEY = os.getenv(
    "GEMINI_API_KEY"
)

llm = ChatGoogleGenerativeAI(

    model="gemini-2.5-flash",

    google_api_key=GEMINI_API_KEY,

    temperature=0.3
)

parser = PydanticOutputParser(
    pydantic_object=RiskPredictionOutput
)

def generate_risk_prediction(
    project: ProjectSubmission   

):
    
    conn = sqlite3.connect(
    "risk_data.db"
)

    cursor = conn.cursor()

    query_text = f"""

    Construction project in {project.borough}

    Job Type:
    {project.job_type}

    Building Type:
    {project.building_type}

    Initial Cost:
    {project.initial_cost}

    Floor Area:
    {project.total_construction_floor_area}

    Proposed Stories:
    {project.proposed_no_of_stories}

    Applicant Professional Title:
    {project.applicant_professional_title}

    Work Types:
    {", ".join(project.work_types)}

    Project Description:
    {project.project_description}

    """

    query_embedding = embedding_model.encode(
        [query_text]
    ).tolist()[0]

    results = collection.query(

        query_embeddings=[query_embedding],

        n_results=5
    )

    valid_projects = []

    metadatas = results["metadatas"][0]

    distances = results["distances"][0]

    for metadata, distance in zip(
        metadatas,
        distances
    ):

        similarity = 1 - distance

        if similarity >= SIMILARITY_THRESHOLD:

            valid_projects.append({

                "metadata": metadata,

                "similarity": similarity
            })

    LOW_CONFIDENCE_MODE = False

    if len(valid_projects) < 2:

        LOW_CONFIDENCE_MODE = True

    retrieved_bins = [

        project["metadata"]["bin"]

        for project in valid_projects
    ]

    similarity_scores = [

        project["similarity"]

        for project in valid_projects
    ]

    if len(similarity_scores) > 0:

        avg_similarity = sum(
            similarity_scores
        ) / len(similarity_scores)

    else:

        avg_similarity = 0

    if avg_similarity >= 0.85:

        confidence_level = "HIGH"

    elif avg_similarity >= 0.72:

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
        Retrieved historical projects have weak
        semantic similarity to the current project.

        Do NOT make highly specific claims.

        Avoid overconfident predictions.

        Provide generalized NYC construction
        safety guidance instead of strongly
        grounded historical conclusions.

        Clearly mention that prediction confidence
        is reduced due to limited historical matches.

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


    parsed_response = parser.parse(
        response.content
    )

    parsed_response.confidence_level = (
        confidence_level
    )

    parsed_response.retrieved_project_count = (
        len(valid_projects)
    )

    parsed_response.average_similarity_score = round(
        avg_similarity,
        2
    )

    conn.close()
    return parsed_response