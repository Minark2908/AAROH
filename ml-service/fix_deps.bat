@echo off
echo ===== AAROH Backend Dependency Fix =====

echo [1] Downgrading bcrypt to 4.0.1 (passlib 1.7.4 compatible)...
.\venv\Scripts\pip.exe install "bcrypt==4.0.1" --force-reinstall > fix_deps_log.txt 2>&1
if %ERRORLEVEL% EQU 0 (echo   bcrypt OK) else (echo   bcrypt FAILED - check fix_deps_log.txt)

echo [2] Fixing starlette to match fastapi 0.115.x compatible version...
.\venv\Scripts\pip.exe install "starlette==0.46.2" --force-reinstall >> fix_deps_log.txt 2>&1
if %ERRORLEVEL% EQU 0 (echo   starlette OK) else (echo   starlette FAILED - check fix_deps_log.txt)

echo [3] Verifying passlib+bcrypt work...
.\venv\Scripts\python.exe -c "from passlib.context import CryptContext; c=CryptContext(schemes=['bcrypt'],deprecated='auto'); h=c.hash('test'); print('  passlib+bcrypt: OK, hash='+h[:20]+'...')" >> fix_deps_log.txt 2>&1
.\venv\Scripts\python.exe -c "from passlib.context import CryptContext; c=CryptContext(schemes=['bcrypt'],deprecated='auto'); h=c.hash('test'); print('passlib+bcrypt: OK')"

echo [4] Verifying imports (fastapi, starlette, sqlalchemy)...
.\venv\Scripts\python.exe -c "import fastapi, starlette, sqlalchemy; print('All core imports OK')"

echo ===== Done. Check fix_deps_log.txt for details =====
pause
