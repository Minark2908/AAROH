# AAROH Frontend Application

Welcome to the frontend repository for the **AAROH Farm Intelligence Platform**. AAROH is a comprehensive enterprise solution designed to empower agricultural professionals with AI-driven crop disease detection, robust IoT monitoring, and actionable advisory services.

This Next.js application serves as the primary interface for the platform, offering a highly responsive, secure, and interactive experience tailored for both end-users and administrators.

---

## Key Features

- **Pest Detection Dashboard:** Upload crop images directly from the interface to view real-time AI predictions, confidence scoring, and Explainable AI (XAI) heatmaps via Grad-CAM integration.
- **Interactive GIS Mapping:** A Leaflet-powered geographic information system to visualize farm health trends, localized pest outbreaks, and physical sensor node locations.
- **AI Advisory Chatbot:** A seamlessly integrated conversational agent powered by the Groq LLM, providing contextual agricultural advice based on detected threats and real-time environmental data.
- **Role-Based Access Control (RBAC):** Distinct views and strict permissions for standard users (managing individual crops and sensors) and administrators (monitoring system-wide analytics and user management).
- **IoT Sensor Monitoring:** Real-time telemetry visualization of soil moisture, ambient temperature, and humidity using interactive data charting.

---

## Technology Stack

- **Core Framework:** [Next.js 16](https://nextjs.org/) (App Router architecture)
- **Language:** TypeScript
- **Styling:** Tailwind CSS and modular component styles
- **Animations:** Framer Motion (for interface micro-interactions)
- **UI Components:** Lucide React, standard component-driven architecture
- **State Management & Network:** Axios (featuring custom interceptors for secure JWT transmission)
- **Mapping Infrastructure:** Leaflet & React-Leaflet

---

## Getting Started

### 1. Prerequisites

- Node.js (v18.0.0 or higher recommended)
- npm (Node Package Manager)

### 2. Installation

Navigate into the `ui` directory and install the required dependencies:

```bash
cd ui
npm install
```

### 3. Environment Configuration

The frontend requires specific environment variables to communicate securely with the backend services. Create a `.env` file in the root of the `ui` folder:

```bash
cp .env.example .env
```

Ensure your `.env` contains the internal routing URL:

```env
# URL for Next.js to proxy API requests to the Python Backend
INTERNAL_API_URL=http://127.0.0.1:8000
```

*Note: The application utilizes Next.js rewrites (configured in `next.config.ts`) to securely proxy requests from `/api-proxy/*` directly to the backend. This mitigates CORS policies during local development and standardizes API paths.*

### 4. Running the Development Server

Start the local development server:

```bash
npm run dev
```

Navigate to [http://localhost:3000](http://localhost:3000) in your web browser. 

---

## Project Structure

```text
ui/
├── app/                  # Next.js App Router (Pages, Layouts, API routes)
│   ├── (auth)/           # Authentication flows (Login, Registration, Password Reset)
│   ├── (dashboard)/      # Protected routes (Analytics, AI Advisor, Crop Health)
│   └── page.tsx          # Public Landing Page
├── components/           # Reusable UI Components
│   ├── landing/          # Modular landing page segments
│   ├── layout/           # Structural components (Sidebar, Navbar, Footer)
│   ├── map/              # GIS/Leaflet implementations
│   └── ui/               # Base atomic UI elements
├── public/               # Static assets
├── api/                  # Axios instances and API service definitions
├── hooks/                # Custom React hooks
├── lib/                  # Core utilities (formatting, validation logic)
├── schemas/              # Zod validation schemas for strict type-checking
└── tailwind.config.ts    # Design system tokens and configuration
```

---

## Deployment Guidelines

When preparing for a production deployment (e.g., Vercel, AWS Amplify, or custom Docker containers):
1. Execute `npm run build` to generate the optimized, production-ready `.next` bundle.
2. Ensure you configure the `INTERNAL_API_URL` to point to your production backend endpoint (e.g., `https://api.aaroh.com`) within your hosting provider's environment variables dashboard.
