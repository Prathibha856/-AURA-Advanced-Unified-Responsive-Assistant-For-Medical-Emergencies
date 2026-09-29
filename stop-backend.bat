@echo off
echo ========================================================
echo   Stopping AURA Medical Platform - Backend & Database
echo ========================================================

:: 1. Stop Spring Boot on port 8082
for /f "tokens=5" %%a in ('netstat -ano ^| findstr 8082 ^| findstr LISTENING') do (
    echo Stopping Spring Boot Process PID: %%a
    taskkill /F /PID %%a
)

:: 2. Stop PostgreSQL Server
echo Stopping PostgreSQL Server...
"C:\Users\Admin\pgsql\bin\pg_ctl.exe" -D "C:\Users\Admin\pgsql\data" stop

echo Done.
