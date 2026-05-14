from dotenv import load_dotenv
load_dotenv()

from database import engine
from sqlalchemy import text

def upgrade():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'user' NOT NULL;"))
            print("Added role column to users table.")
        except Exception as e:
            print(f"Role column may already exist or error: {e}")
            
        try:
            conn.execute(text("ALTER TABLE detections ADD COLUMN IF NOT EXISTS treatment_override VARCHAR;"))
            print("Added treatment_override column to detections table.")
        except Exception as e:
            print(f"treatment_override column may already exist or error: {e}")
            
        try:
            conn.execute(text("ALTER TABLE detections ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'Pending' NOT NULL;"))
            print("Added status column to detections table.")
        except Exception as e:
            print(f"status column may already exist or error: {e}")
            
        try:
            conn.execute(text("ALTER TABLE farms ADD COLUMN IF NOT EXISTS farm_location VARCHAR;"))
            conn.execute(text("ALTER TABLE farms ADD COLUMN IF NOT EXISTS crop_growth_stage VARCHAR;"))
            print("Added farm_location and crop_growth_stage columns to farms table.")
        except Exception as e:
            print(f"Farm profile columns may already exist or error: {e}")
            
        try:
            conn.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS level VARCHAR DEFAULT 'info' NOT NULL;"))
            conn.execute(text("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS meta JSON;"))
            print("Added level and meta columns to notifications table.")
        except Exception as e:
            print(f"Notification columns may already exist or error: {e}")

        try:
            conn.execute(text("ALTER TABLE field_health_history ADD COLUMN IF NOT EXISTS soil_moisture FLOAT;"))
            conn.execute(text("ALTER TABLE field_health_history ADD COLUMN IF NOT EXISTS humidity FLOAT;"))
            conn.execute(text("ALTER TABLE field_health_history ADD COLUMN IF NOT EXISTS confidence FLOAT;"))
            print("Added soil_moisture, humidity, confidence columns to field_health_history table.")
        except Exception as e:
            print(f"Field Health History columns error: {e}")

        try:
            conn.execute(text("ALTER TABLE fields ADD COLUMN IF NOT EXISTS area_acres FLOAT;"))
            conn.execute(text("ALTER TABLE fields ADD COLUMN IF NOT EXISTS growth_stage VARCHAR;"))
            conn.execute(text("ALTER TABLE fields ADD COLUMN IF NOT EXISTS progress_percentage INTEGER;"))
            print("Added area_acres, growth_stage, progress_percentage to fields table.")
        except Exception as e:
             print(f"Fields table columns error: {e}")

        conn.commit()

if __name__ == "__main__":
    upgrade()
    print("Database upgrade complete.")
