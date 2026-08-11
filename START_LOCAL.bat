@echo off
echo ===========================================
echo CV/Resume Matching Platform - Local Startup
echo ===========================================
echo.

echo Starting MongoDB...
echo (Make sure MongoDB is running on port 27017)
echo.

echo Starting Backend Server...
start "Backend" cmd /k "cd Backend && npm run dev"

timeout /t 3 /nobreak > nul

echo Starting Model 1 (CV-Job Matcher) on port 5001...
start "Model 1" cmd /k "cd model-1-cv-matcher && python cv_job_matcher.py"

timeout /t 2 /nobreak > nul

echo Starting Model 2 (CV Classifier) on port 5002...
start "Model 2" cmd /k "cd model-2-cv-classifier && python cv_classifier.py"

timeout /t 2 /nobreak > nul

echo Starting Model 3 (Skill Analyzer) on port 5003...
start "Model 3" cmd /k "cd model-3-skill-analyzer && python skill_analyzer.py"

timeout /t 2 /nobreak > nul

echo Starting Model 4 (Chat Model) on port 5004...
start "Model 4" cmd /k "cd model-4-chat-model && python chat_model.py"

timeout /t 2 /nobreak > nul

echo Starting Frontend...
start "Frontend" cmd /k "cd Frontend && npm run dev"

echo.
echo ===========================================
echo All services are starting...
echo ===========================================
echo.
echo Service URLs:
echo   Frontend:  http://localhost:5174
echo   Backend:   http://localhost:5000
echo   Model 1:   http://localhost:5001
echo   Model 2:   http://localhost:5002
echo   Model 3:   http://localhost:5003
echo   Model 4:   http://localhost:5004
echo   MongoDB:   localhost:27017
echo.
echo Press any key to exit...
pause > nul
