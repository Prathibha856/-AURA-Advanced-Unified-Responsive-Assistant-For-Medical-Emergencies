@echo off
echo ========================================================
echo   Starting AURA Medical Chatbot AI Service (FastAPI)
echo ========================================================
cd /d "%~dp0ai-services\chatbot"
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
)
echo Running AURA RAG Service on http://127.0.0.1:8000 ...
python -m uvicorn main:app --host 127.0.0.1 --port 8000
