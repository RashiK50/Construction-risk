import os
import sqlite3
import chromadb

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from sentence_transformers import SentenceTransformer

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

    retrieved_bins = []

    for metadata in results["metadatas"][0]:

        bin_number = metadata.get("bin")

        if bin_number:

            retrieved_bins.append(bin_number)


    risk_histories = []

    for bin_number in retrieved_bins:

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

        Predict:

        - likelihood of violations
        - stop-work orders
        - project delays
        - safety concerns

        {format_instructions}

        """,

        input_variables=[

            "query_text",

            "historical_context"
        ],

        partial_variables={

            "format_instructions":
            parser.get_format_instructions()
        }
    )


    final_prompt = prompt.format(

        query_text=query_text,

        historical_context=combined_history
    )


    response = llm.invoke(final_prompt)


    parsed_response = parser.parse(
        response.content
    )

    conn.close()
    return parsed_response