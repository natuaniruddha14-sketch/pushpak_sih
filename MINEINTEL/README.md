# MINEINTEL AI — Mining Document Intelligence & Reporting Platform

> A production-style prototype for AI-powered mining document intelligence, metadata extraction, vector indexing, hybrid RAG retrieval, and automated executive report generation designed for CMPDI/CIL-style mining workflows.

---

## 🏗 Monorepo Architecture Layout

```
MINEINTEL/
├── apps/
│   ├── api/                    # Node.js + Express + TypeScript Backend
│   │   ├── prisma/             # PostgreSQL + pgvector Schema Definitions
│   │   └── src/                # Express App & Health Endpoints
│   └── web/                    # React + TypeScript + Vite Frontend Dashboard
│       └── src/                # React UI Components & Health Status View
├── services/
│   └── ai/                     # Python + FastAPI Document & AI Processing Service
│       ├── app/                # OCR, Embeddings, LLM & Parsing Modules
│       └── requirements.txt    # PyMuPDF, pandas, openpyxl, python-docx, fastapi
├── packages/
│   └── shared-types/           # Shared TypeScript Interfaces & Data Contracts
├── data/                       # Mining Document Samples (PDF, DOCX, XLSX, Images)
├── storage/                    # Local Runtime File Storage (Uploads, Extracted, Reports)
├── scripts/                    # Setup & Initialization Utility Scripts
├── docker-compose.yml          # PostgreSQL + pgvector Docker Services
├── .env.example                # Monorepo Environment Template
├── .eslintrc.json              # ESLint Configuration
├── .prettierrc                 # Code Formatting Configuration
└── tsconfig.json               # Root Base TypeScript Configuration
```

---

## 🛠 Tech Stack Overview

| Layer | Technologies |
| :--- | :--- |
| **Frontend (`apps/web`)** | React 19, TypeScript, Vite, Tailwind CSS, React Query, React Router, Recharts, Lucide Icons |
| **Backend (`apps/api`)** | Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, pgvector, JWT, Zod |
| **AI Service (`services/ai`)** | Python 3.10+, FastAPI, PyMuPDF, OCR abstraction, pandas, openpyxl, python-docx, Embedding abstraction, LLM abstraction |
| **Shared (`packages/shared-types`)** | TypeScript Interfaces & Domain Models |
| **Infrastructure** | Docker Compose (PostgreSQL 16 with pgvector) |

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: 3.10 or higher
- **Docker & Docker Compose** (for PostgreSQL + pgvector)

### 2. Install Node Dependencies
From the repository root:
```bash
npm install
```

### 3. Build Shared Types
```bash
npm run build --workspace=packages/shared-types
```

### 4. Set Up Python Virtual Environment
Run the setup script:
```powershell
# Windows PowerShell
.\scripts\setup-venv.ps1
```
Or manually:
```bash
python -m venv services/ai/venv
# Windows:
.\services\ai\venv\Scripts\activate
# Linux/macOS:
source services/ai/venv/bin/activate

pip install -r services/ai/requirements.txt
```

### 5. Start PostgreSQL with pgvector
```bash
docker compose up -d
```

### 6. Environment Configuration
Copy environment templates:
```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp services/ai/.env.example services/ai/.env
cp apps/web/.env.example apps/web/.env
```

---

## 🚦 Running Services

### Start API Backend Service (Port 4000)
```bash
npm run dev:api
```
- Health Check: `GET http://localhost:4000/health`

### Start AI Processing Service (Port 8000)
```bash
npm run dev:ai
```
- Health Check: `GET http://localhost:8000/health`

### Start Web Frontend Dashboard (Port 3000)
```bash
npm run dev:web
```
- Frontend UI: `http://localhost:3000`

---

## 🩺 Service Health Endpoints

| Service | Protocol / URL | Expected Response |
| :--- | :--- | :--- |
| **API Backend** | `GET http://localhost:4000/health` | `{ "status": "ok", "service": "mineintel-api", "version": "0.1.0" }` |
| **AI Service** | `GET http://localhost:8000/health` | `{ "status": "ok", "service": "mineintel-ai-service", "version": "0.1.0" }` |

---

## ⚙️ Modular Architecture Note

Business functionality for OCR processing, vector embedding generation, RAG retrieval, and report synthesis are structured behind clean interface abstractions with `TODO` markers for deferred feature implementations.
