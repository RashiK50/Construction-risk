# Use an official lightweight Python image
FROM python:3.11-slim

# Set the working directory
WORKDIR /app

# Copy your requirements and install them
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all your project files (including chroma_db and risk_data.db)
COPY . .

# Expose the FastAPI port
EXPOSE 8000

# Run Uvicorn bound to all interfaces so your frontend can reach it
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]