import os
from dotenv import load_dotenv
load_dotenv()

db_url = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:postgres@localhost:5432/aaroh_db")
print("DATABASE_URL:", db_url)

# Try connecting
try:
    from sqlalchemy import create_engine, text
    engine = create_engine(db_url)
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("DB CONNECTION: SUCCESS")
except Exception as e:
    print(f"DB CONNECTION FAILED: {e}")
