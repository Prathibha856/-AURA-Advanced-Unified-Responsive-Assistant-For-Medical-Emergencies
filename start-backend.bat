@echo off
echo ========================================================
echo   Starting AURA Medical Platform - Backend & Database
echo ========================================================

:: 1. Start PostgreSQL if not already running
netstat -ano | findstr 5432 >nul
if %ERRORLEVEL% NEQ 0 (
    echo [1/2] Starting PostgreSQL Server on port 5432...
    "C:\Users\Admin\pgsql\bin\pg_ctl.exe" -D "C:\Users\Admin\pgsql\data" -l "C:\Users\Admin\pgsql\server.log" start
) else (
    echo [1/2] PostgreSQL Server is already running on port 5432.
)

:: 2. Start Spring Boot Backend
echo [2/2] Launching Spring Boot Backend on port 8082...
cd /d "%~dp0backend\aura"
mvn spring-boot:run "-Djava.version=21"
