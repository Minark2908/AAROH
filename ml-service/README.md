# AAROH Backend & ML Service

This repository contains the backend infrastructure for the **AAROH Farm Intelligence Platform**. Engineered as a robust Python-based API server using **FastAPI**, it handles critical system operations including secure JWT authentication, PostgreSQL database management, PyTorch model inference for pest detection, and external integrations for environmental data and LLM-based advisory services.

---

## Architecture & Core Capabilities

### 1. Computer Vision & Explainable AI (XAI)
- **Inference Engine:** Utilizes a fine-tuned `MobileNetV2` model trained on a comprehensive agricultural dataset encompassing 40 distinct pest classifications.
- **Grad-CAM Integration:** Upon prediction, the service dynamically hooks into the final convolutional layer of the model to generate a Grad-CAM heatmap. This artifact is returned to the client as a base64 overlay, providing visual explainability (XAI) regarding the model's decision-making process.

### 2. Risk Assessment Engine & AI Advisory
- **Algorithmic Risk Calculation:** Aggregates the vision model's confidence scoring with real-time or simulated environmental telemetry (soil moisture, temperature, humidity) to calculate a unified pest outbreak Risk Index.
- **Generative AI Advisory:** Integrates with the **Groq API** to produce contextual, multi-lingual agricultural treatment recommendations based on current weather data and the calculated risk profile.

### 3. Real-Time Telemetry & Weather Integration
- **Meteorological Data:** Retrieves live and forecasted weather patterns via the OpenWeatherMap API to inform agricultural decision-making.
- **IoT Simulation Layer:** Features a resilient background service that simulates live farm sensor data streams, ensuring continuous dashboard telemetry independent of physical hardware connections.

---

## Technology Stack

- **Web Framework:** FastAPI (served via Uvicorn ASGI)
- **Relational Database:** PostgreSQL (interfaced via SQLAlchemy ORM)
- **Machine Learning:** PyTorch (`torch`, `torchvision`)
- **Image Processing:** OpenCV (`cv2`), Pillow (`PIL`)
- **Security Protocols:** Passlib (Bcrypt) for password hashing, PyJWT for stateless authentication tokens
- **External Services:** Groq (LLM integration), OpenWeatherMap, Open-Meteo

---

## Getting Started

### 1. Prerequisites

- Python 3.12 or higher
- PostgreSQL (running locally or a managed cloud database solution)

### 2. Environment Setup

Navigate into the `ml-service` directory and establish an isolated Python virtual environment:

```bash
cd ml-service
python -m venv .venv
```

Activate the environment:

- **Windows:** `.venv\Scripts\activate`
- **Mac/Linux:** `source .venv/bin/activate`

Install the required dependencies:

```bash
pip install -r requirements.txt
```

### 3. Configuration (.env)

Establish the local configuration file:

```bash
cp .env.example .env
```

Update the `.env` file with the requisite operational values:
- `DATABASE_URL`: Your PostgreSQL connection string.
- `GROQ_API_KEY`: API credential for the Groq LLM service.
- `SECRET_KEY`: A high-entropy cryptographic string for JWT signing.
- `ADMIN_USERNAME` & `ADMIN_PASSWORD`: Default credentials established during database initialization.

### 4. Database Initialization

Prior to starting the server, initialize the database schema and required tables:

```bash
python -m database.setup_db
```

*(Optional)* To apply incremental schema updates from recent commits:

```bash
python -m database.upgrade_db
```

### 5. Running the API Server

Launch the FastAPI server utilizing Uvicorn with hot-reloading for development:

```bash
python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

- **Base Endpoint:** `http://localhost:8000`
- **API Documentation (Swagger UI):** `http://localhost:8000/docs`

---

## Project Structure

```text
ml-service/
├── app.py                     # ASGI application instance and core route aggregation
├── models.py                  # SQLAlchemy ORM declarations (Users, Farms, Detections)
├── schemas.py                 # Pydantic schemas for strict payload validation
├── security_config.py         # JWT protocols, cryptography, and RBAC utilities
├── database/                  # Connection pooling, initialization, and migration logic
├── model/                     # ML Artifacts (aaroh_model.pth, class_mapping.json)
├── routers/                   # Modular API Route Controllers
│   ├── admin.py               # Administrative analytics and user management
│   ├── ai.py                  # AI Chatbot history and contextual endpoints
│   ├── auth.py                # Authentication, token issuing, and registration
│   ├── crop_health.py         # Pest detection and image upload handlers
│   └── ...
├── services/                  # Core Business Logic and Domain Services
│   ├── pest_inference_service.py # PyTorch model lifecycle and inference execution
│   ├── xai_service.py         # Grad-CAM heatmap computation
│   ├── risk_engine.py         # Outbreak severity algorithms
│   ├── genai_advisory_service.py # LLM integration protocols
│   └── ...
└── uploads/                   # Local staging for user-uploaded media
```
