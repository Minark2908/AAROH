import sys
print("Python:", sys.executable)

errors = []

try:
    from dotenv import load_dotenv
    print("OK: dotenv")
except Exception as e:
    errors.append(f"FAIL dotenv: {e}")

try:
    import torch
    print("OK: torch")
except Exception as e:
    errors.append(f"FAIL torch: {e}")

try:
    from fastapi import FastAPI, Depends
    print("OK: fastapi")
except Exception as e:
    errors.append(f"FAIL fastapi: {e}")

try:
    from sqlalchemy import create_engine
    print("OK: sqlalchemy")
except Exception as e:
    errors.append(f"FAIL sqlalchemy: {e}")

try:
    from passlib.context import CryptContext
    print("OK: passlib")
except Exception as e:
    errors.append(f"FAIL passlib: {e}")

try:
    import jwt
    print("OK: jwt (PyJWT)")
except Exception as e:
    errors.append(f"FAIL jwt: {e}")

try:
    import psycopg
    print("OK: psycopg")
except Exception as e:
    errors.append(f"FAIL psycopg: {e}")

try:
    from database import engine, get_db, Base
    print("OK: database module")
except Exception as e:
    errors.append(f"FAIL database: {e}")

try:
    import models
    print("OK: models module")
except Exception as e:
    errors.append(f"FAIL models: {e}")

try:
    import schemas
    print("OK: schemas module")
except Exception as e:
    errors.append(f"FAIL schemas: {e}")

try:
    from routers import auth
    print("OK: routers.auth")
except Exception as e:
    errors.append(f"FAIL routers.auth: {e}")

try:
    from routers import dashboard
    print("OK: routers.dashboard")
except Exception as e:
    errors.append(f"FAIL routers.dashboard: {e}")

try:
    from services.auth_service import get_current_user
    print("OK: services.auth_service")
except Exception as e:
    errors.append(f"FAIL services.auth_service: {e}")

print("\n--- ERRORS ---")
for err in errors:
    print(err)

if not errors:
    print("No import errors found!")
