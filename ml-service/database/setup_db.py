"""
AAROH Database Setup Script
Run once from the ml-service directory: python -m database.setup_db
"""
import os
import subprocess
import sys
from pathlib import Path

ML_SERVICE_ROOT = Path(__file__).resolve().parents[1]

print("=" * 55)
print("  AAROH - PostgreSQL Database Setup")
print("=" * 55)
print()
print("Enter your PostgreSQL credentials:")
print("(Press Enter to use the default shown in brackets)")
print()

pg_host = input("  Host [localhost]: ").strip() or "localhost"
pg_port = input("  Port [5432]: ").strip() or "5432"
pg_user = input("  Username [postgres]: ").strip() or "postgres"
pg_password = input("  Password: ").strip()
pg_db = input("  Database name [aaroh_db]: ").strip() or "aaroh_db"

if not pg_password:
    print("\nERROR: Password cannot be empty!")
    sys.exit(1)

database_url = f"postgresql+psycopg://{pg_user}:{pg_password}@{pg_host}:{pg_port}/{pg_db}"

print(f"\nTesting connection to: postgresql+psycopg://{pg_user}:****@{pg_host}:{pg_port}/{pg_db}")

# Test connection
try:
    from sqlalchemy import create_engine, text
    engine = create_engine(database_url)
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("Connection test: SUCCESS!")
except Exception as e:
    err_str = str(e)
    if "does not exist" in err_str and pg_db in err_str:
        print(f"  Database '{pg_db}' does not exist yet - will be created.")
    elif "password authentication failed" in err_str:
        print(f"\nERROR: Wrong password for user '{pg_user}'")
        print("Please check your PostgreSQL credentials and try again.")
        sys.exit(1)
    elif "Connection refused" in err_str or "could not connect" in err_str:
        print(f"\nERROR: Cannot connect to PostgreSQL at {pg_host}:{pg_port}")
        print("Make sure PostgreSQL is running.")
        sys.exit(1)
    else:
        print(f"  Note: {err_str[:120]}")

# Read existing .env (always next to ml-service root, not inside database/)
env_path = ML_SERVICE_ROOT / ".env"
lines = []
if env_path.exists():
    with open(env_path, "r") as f:
        for line in f:
            stripped = line.strip()
            # keep existing lines that are NOT DATABASE_URL or SECRET_KEY
            if not stripped.startswith("DATABASE_URL=") and not stripped.startswith("SECRET_KEY="):
                lines.append(line.rstrip("\n"))

import secrets
secret_key = secrets.token_hex(32)
lines.append(f"DATABASE_URL={database_url}")
lines.append(f"SECRET_KEY={secret_key}")

with open(env_path, "w") as f:
    f.write("\n".join(lines) + "\n")

print(f"\n.env updated with:")
print(f"  DATABASE_URL=postgresql+psycopg://{pg_user}:****@{pg_host}:{pg_port}/{pg_db}")
print(f"  SECRET_KEY=<generated securely>")

print(f"\nAttempting to create database '{pg_db}' if it doesn't exist...")
try:
    import psycopg
    # Connect to the postgres default database
    conn_str = f"host={pg_host} port={pg_port} user={pg_user} password={pg_password} dbname=postgres"
    conn = psycopg.connect(conn_str, autocommit=True)
    cursor = conn.cursor()
    cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{pg_db}'")
    exists = cursor.fetchone()
    if not exists:
        cursor.execute(f'CREATE DATABASE "{pg_db}"')
        print(f"  Database '{pg_db}' created successfully!")
    else:
        print(f"  Database '{pg_db}' already exists.")
    cursor.close()
    conn.close()
except Exception as e:
    print(f"  Could not auto-create database: {e}")
    print(f"  Please manually run: CREATE DATABASE {pg_db};")

# Now create all tables
print("\nCreating database tables...")
try:
    from sqlalchemy import create_engine

    # reload the env
    from dotenv import load_dotenv
    load_dotenv(override=True)
    db_url = os.getenv("DATABASE_URL")

    engine = create_engine(db_url)

    root = str(ML_SERVICE_ROOT)
    if root not in sys.path:
        sys.path.insert(0, root)
    from database import Base
    import models  # noqa: F401 — registers models with Base

    Base.metadata.create_all(bind=engine)
    print("  All tables created successfully!")
except Exception as e:
    print(f"  Error creating tables: {e}")

print("\n" + "=" * 55)
print("  SETUP COMPLETE! Start the server with:")
print("  .\\venv\\Scripts\\uvicorn app:app --reload")
print("=" * 55)
