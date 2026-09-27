# MineIntel AI — Technical Requirements Document (TRD)

**Version:** 1.0  
**Project:** MineIntel AI  
**Architecture Type:** Sovereign Multimodal AI + RAG + Enterprise Integration  
**Target Deployment:** NIC MeghRaj / On-Premise / Air-Gapped Environment

---

## 1. Technical Objective

Build a secure, modular, multimodal AI platform capable of ingesting historical mining documents, extracting structured information, indexing evidence, answering natural-language queries, validating outputs, and generating traceable reports and parliamentary response drafts.

---

## 2. High-Level Architecture

```text
                         ┌─────────────────────┐
                         │       USERS         │
                         └──────────┬──────────┘
                                    ↓
                         ┌─────────────────────┐
                         │   MINEINTEL WEB UI  │
                         │ React + Vite        │
                         └──────────┬──────────┘
                                    ↓
                         ┌─────────────────────┐
                         │     FASTAPI API     │
                         └──────────┬──────────┘
                                    ↓
              ┌─────────────────────┴─────────────────────┐
              ↓                                           ↓
      ┌───────────────┐                           ┌──────────────┐
      │ Document      │                           │ Query/RAG    │
      │ Processing    │                           │ Engine       │
      └───────┬───────┘                           └──────┬───────┘
              ↓                                          ↓
      ┌───────────────┐                     ┌────────────┼────────────┐
      │ OCR / Vision  │                     ↓            ↓            ↓
      │ PaddleOCR     │                  Qdrant        Neo4j       Metadata
      │ LayoutLMv3    │                     │            │
      └───────┬───────┘                     └──────┬─────┘
              ↓                                    ↓
      ┌───────────────┐                     ┌──────────────┐
      │ Structured DB │                     │ RAG Engine   │
      │ PostgreSQL    │                     │ Local LLM    │
      └───────┬───────┘                     └──────┬───────┘
              │                                    ↓
              └────────────────┬───────────────────┘
                               ↓
                    ┌──────────────────────┐
                    │ DUAL VALIDATION      │
                    │ + CONFIDENCE ENGINE  │
                    └──────────┬───────────┘
                               ↓
                    ┌──────────────────────┐
                    │ HUMAN REVIEW         │
                    └──────────┬───────────┘
                               ↓
                    ┌──────────────────────┐
                    │ REPORT / PQ RESPONSE │
                    │ + CITATIONS          │
                    └──────────────────────┘
```

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 | Enterprise UI |
| Build | Vite | Fast frontend build |
| Styling | TailwindCSS | UI system |
| PDF Viewer | PDF.js | Document visualization/citations |
| Backend | Python 3.11 | Application services |
| API | FastAPI | REST APIs |
| Async Jobs | Celery | Batch processing |
| Queue/Cache | Redis | Job queue and caching |
| Transactional DB | PostgreSQL | Users, metadata, jobs, records |
| OCR | PaddleOCR | Text extraction |
| Layout | LayoutLMv3 | Document structure understanding |
| Image AI | Real-ESRGAN | Low-quality scan enhancement |
| Vector DB | Qdrant / Milvus | Semantic retrieval |
| Graph DB | Neo4j | Mine/seam/borehole relationships |
| LLM | DeepSeek-R1-Distill / Llama-3-70B | Local AI inference |
| RAG Framework | LangChain | Retrieval/orchestration |
| Government Adapter | REST / OData / RFC | e-Office and SAP integration |

The stack above follows the uploaded solution architecture.

---

## 4. Frontend Technical Requirements

### 4.1 Application Routes

```text
/login
/dashboard
/documents
/documents/upload
/documents/:id
/search
/query-assistant
/parliamentary
/reports
/topics
/mines
/seams
/validation
/audit
/admin
```

### 4.2 Core UI Components

- Login page.
- Dashboard.
- Upload component.
- Processing-status component.
- Document viewer.
- OCR result viewer.
- Search interface.
- AI chat/query interface.
- Citation panel.
- Parliamentary response editor.
- Validation dashboard.
- Topic analytics dashboard.
- Report generator.
- Audit log viewer.

### 4.3 Document Viewer

PDF.js should support:

- Page navigation.
- Search.
- Highlighted evidence.
- Citation navigation.
- OCR overlay where available.

---

## 5. Backend Architecture

Suggested structure:

```text
backend/
│
├── app/
│   ├── api/
│   ├── auth/
│   ├── documents/
│   ├── ocr/
│   ├── extraction/
│   ├── search/
│   ├── rag/
│   ├── reports/
│   ├── parliamentary/
│   ├── analytics/
│   ├── validation/
│   ├── audit/
│   └── integrations/
│
├── workers/
│   ├── ocr_worker.py
│   ├── extraction_worker.py
│   ├── embedding_worker.py
│   └── report_worker.py
│
└── main.py
```

---

## 6. API Requirements

### Authentication

```http
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

### Documents

```http
POST   /api/v1/documents
GET    /api/v1/documents
GET    /api/v1/documents/{id}
DELETE /api/v1/documents/{id}
POST   /api/v1/documents/{id}/process
GET    /api/v1/documents/{id}/status
```

### Search

```http
POST /api/v1/search
GET  /api/v1/search/suggestions
```

### AI Query

```http
POST /api/v1/query
```

Example request:

```json
{
  "question": "What was coal production in Mine X in 2023?",
  "filters": {
    "mine": "Mine X",
    "year": 2023
  }
}
```

### Parliamentary

```http
POST /api/v1/parliamentary/query
POST /api/v1/parliamentary/draft
GET  /api/v1/parliamentary/{id}
POST /api/v1/parliamentary/{id}/review
```

### Validation

```http
POST /api/v1/validation/run
GET  /api/v1/validation/{id}
POST /api/v1/validation/{id}/approve
POST /api/v1/validation/{id}/reject
```

### Reports

```http
POST /api/v1/reports
GET  /api/v1/reports
GET  /api/v1/reports/{id}
GET  /api/v1/reports/{id}/download
```

---

## 7. Document Processing Pipeline

```text
                 INPUT DOCUMENT
                       ↓
              Document Classifier
                       ↓
              Quality Assessment
                       ↓
              Image Preprocessing
             ┌─────────┼─────────┐
             ↓         ↓         ↓
          Deskew     Denoise   Super Resolution
             └─────────┼─────────┘
                       ↓
                    OCR
                       ↓
                Layout Analysis
                       ↓
                Table Extraction
                       ↓
             Entity / Field Extraction
                       ↓
                  Validation
                       ↓
              Structured Storage
                       ↓
                Chunk Generation
                       ↓
                  Embeddings
                       ↓
                  Vector Index
```

---

## 8. OCR & Vision Requirements

### 8.1 Image Preprocessing

Required operations:

- Deskew.
- Denoising.
- Contrast enhancement.
- Orientation detection.
- Resolution enhancement.

### 8.2 OCR

Primary technology:

**PaddleOCR**

Required output:

```json
{
  "text": "Coal production...",
  "page": 12,
  "confidence": 0.96,
  "bounding_box": [x1, y1, x2, y2]
}
```

### 8.3 Layout Understanding

Use **LayoutLMv3** to identify:

- Headings.
- Paragraphs.
- Tables.
- Form fields.
- Key-value structures.

### 8.4 Table Extraction

Must support:

- Bordered tables.
- Borderless tables.
- Multi-row headers.
- Multi-page tables where feasible.

---

## 9. Mining Entity Extraction

The extraction service should normalize entities such as:

```text
Mine
Subsidiary
Coal Seam
Borehole
Borehole Depth
Coal Grade
GCV
Ash
Moisture
Production
Date
Equipment
Safety Incident
Geological Formation
Location
```

Example:

```json
{
  "mine": "Mine-A",
  "seam": "Seam-X",
  "borehole": "BH-104",
  "depth_m": 183.5,
  "gcv_kcal_kg": 4620,
  "ash_percent": 18.2
}
```

---

## 10. Data Model

### PostgreSQL Core Tables

```text
users
roles
permissions
documents
document_pages
document_metadata
processing_jobs
extracted_entities
extracted_tables
reports
queries
responses
citations
validation_results
audit_logs
```

### Document

```text
document_id
filename
document_type
mine_id
subsidiary_id
year
source
checksum
storage_path
status
created_at
created_by
```

### Processing Job

```text
job_id
document_id
job_type
status
progress
error_message
started_at
completed_at
```

---

## 11. Vector Database

Use **Qdrant or Milvus**.

Each chunk should contain:

```text
chunk_id
document_id
page_number
text
embedding
mine
subsidiary
year
document_type
entity_metadata
```

Example:

```json
{
  "document_id": "DOC-1001",
  "page": 37,
  "mine": "Mine-A",
  "subsidiary": "WCL",
  "year": 2023,
  "document_type": "Production Report"
}
```

---

## 12. Knowledge Graph

Neo4j graph model:

```text
(CIL)
   ↓
(SUBSIDIARY)
   ↓
(MINE)
   ↓
(SEAM)
   ↓
(BOREHOLE)
   ↓
(DEPTH)
```

Possible relationships:

```text
OWNS
OPERATES
CONTAINS
HAS_SEAM
HAS_BOREHOLE
LOCATED_IN
RECORDED_IN
PRODUCED
```

---

## 13. Hybrid RAG Architecture

```text
                     USER QUESTION
                           ↓
                  Query Understanding
                           ↓
            ┌──────────────┼──────────────┐
            ↓              ↓              ↓
       Vector Search   Keyword Search   Graph Search
            ↓              ↓              ↓
            └──────────────┼──────────────┘
                           ↓
                    Result Re-ranking
                           ↓
                     Evidence Set
                           ↓
                    Validation Layer
                           ↓
                         LLM
                           ↓
                  Citation Generator
                           ↓
                     Final Answer
```

RAG must retrieve evidence before generation.

---

## 14. LLM Requirements

Proposed local models:

- DeepSeek-R1-Distill
- Llama-3-70B

The selected model should be deployed locally where security requirements demand air-gapped operation.

### LLM rules

1. Do not treat model knowledge as authoritative source data.
2. Provide retrieved context to the model.
3. Require source references for factual outputs.
4. Refuse unsupported claims.
5. Preserve numerical values from verified evidence.
6. Flag conflicting evidence.
7. Route low-confidence outputs to human review.

---

## 15. Anti-Hallucination / Validation Engine

Processing:

```text
AI Extracted Value
        ↓
Authoritative Source
        ↓
Normalization
        ↓
Comparison
        ↓
Confidence Score
        ↓
 ┌──────┴───────┐
 ↓              ↓
PASS           FAIL
 ↓              ↓
Verified     Human Review
```

The source architecture specifies a human-review threshold of **88% confidence**.

Example output:

```json
{
  "answer": "42.8 MT",
  "confidence": 94,
  "validation": "VERIFIED",
  "sources": [
    {
      "document": "production_2023.pdf",
      "page": 42,
      "line": 17
    }
  ]
}
```

---

## 16. Parliamentary Response Engine

Input:

```text
Parliamentary Question
```

Pipeline:

```text
Question
 ↓
Question Classification
 ↓
Entity Extraction
 ↓
RAG Retrieval
 ↓
Evidence Ranking
 ↓
Cross-Validation
 ↓
LLM Draft
 ↓
Citation Attachment
 ↓
Confidence Evaluation
 ↓
Human Review
 ↓
Export
```

The system should distinguish between:

- Verified facts.
- Conflicting figures.
- Missing information.
- AI-generated summaries.

---

## 17. Topic Analytics

Pipeline:

```text
Documents
 ↓
Text Extraction
 ↓
Cleaning
 ↓
Chunking
 ↓
Topic Modeling
 ↓
Topic Classification
 ↓
Trend Aggregation
 ↓
Visualization
```

Proposed techniques from the source architecture:

- BERTopic
- LDA

Outputs:

- Word cloud.
- Topic clusters.
- Topic frequency.
- Time-series trends.
- Mine-wise topic distribution.

---

## 18. Asynchronous Processing

Large document archives must be processed asynchronously.

```text
Upload
 ↓
Create Job
 ↓
Redis Queue
 ↓
Celery Worker
 ↓
OCR
 ↓
Extraction
 ↓
Embedding
 ↓
Indexing
 ↓
Completed
```

Job statuses:

```text
QUEUED
PROCESSING
OCR
EXTRACTING
INDEXING
COMPLETED
FAILED
REVIEW_REQUIRED
```

---

## 19. Report Generation

Supported formats:

- PDF
- DOCX
- XLSX
- JSON

Report structure:

```text
Title
Executive Summary
Source Information
Extracted Data
Tables
Charts
Analysis
Validation Results
Discrepancies
Citations
Generated By
Timestamp
```

---

## 20. Security Requirements

### Authentication

- Secure authentication.
- Enterprise SSO where available.
- MFA where available.

### Authorization

RBAC roles:

```text
ADMIN
OPERATOR
GEOLOGIST
REPORTING_OFFICER
PARLIAMENTARY_OFFICER
AUDITOR
```

### Data Protection

- TLS in transit.
- Encryption at rest.
- Secure backups.
- Secrets management.
- Database access controls.
- Least-privilege access.

### AI Security

- Local model inference.
- No mandatory outbound AI API dependency.
- Air-gapped deployment capability.
- No sensitive data sent to external LLM providers.

---

## 21. Audit Logging

Every sensitive action should record:

```text
User ID
Timestamp
Action
Resource
Old Value
New Value
Session/IP Metadata
Result
```

Auditable actions include:

- Login.
- Upload.
- Document deletion.
- Extraction correction.
- Validation.
- AI query.
- Parliamentary draft generation.
- Approval/rejection.
- Report generation.
- Configuration changes.

---

## 22. Enterprise Integration

The architecture proposes integration with:

### NIC e-Office

```text
MineIntel
    ↕
REST API
    ↕
NIC e-Office
```

### SAP ERP / CoalNet

```text
MineIntel
    ↕
SAP RFC / OData
    ↕
SAP ERP / CoalNet
```

### Vendor Gateway

Support standardized:

```text
REST
JSON
XML
```

for authorized external mining contractors, drilling agencies, and transportation vendors.

For SIH, these should initially be implemented as **mock/sandbox connectors** unless authorized production credentials and interfaces are available.

---

## 23. Deployment

### SIH Prototype

```text
Docker Environment
│
├── React Frontend
├── FastAPI Backend
├── Celery Worker
├── Redis
├── PostgreSQL
├── Qdrant
└── Neo4j
```

### Production

```text
              NIC MeghRaj / Government DC
                         │
                  Load Balancer
                         │
            ┌────────────┴────────────┐
            │                         │
       App Servers                GPU Cluster
            │                         │
            │                    ┌────┴────┐
            │                    │         │
            │                   OCR       LLM
            │
       ┌────┴─────┐
       │           │
 PostgreSQL      Qdrant
       │
     Neo4j
```

---

## 24. Storage Architecture

Recommended separation:

```text
Object Storage
    ↓
Original Documents

PostgreSQL
    ↓
Metadata + Transactions

Qdrant
    ↓
Embeddings + Chunks

Neo4j
    ↓
Mining Relationships

Redis
    ↓
Jobs + Cache
```

Original source documents should remain immutable where required for auditability.

---

## 25. Performance Requirements

The architecture targets batch processing of large archives, including 10,000+ page workloads.

The implementation should therefore:

- Process documents asynchronously.
- Support parallel workers.
- Avoid loading entire archives into application memory.
- Stream large files where possible.
- Cache repeated queries.
- Index documents incrementally.
- Provide processing progress.

Actual throughput must be benchmarked on the target hardware and document corpus.

---

## 26. Reliability Requirements

The system should:

- Retry failed asynchronous jobs.
- Preserve original files.
- Maintain processing status.
- Record errors.
- Support resumable processing where practical.
- Prevent duplicate ingestion using checksums.
- Never overwrite authoritative source data automatically.

---

## 27. Observability

Monitor:

```text
API latency
Request count
OCR processing time
Queue depth
Worker failures
LLM latency
RAG retrieval latency
Database health
GPU utilization
Storage usage
Validation failure rate
```

Logs should be centralized and searchable in production.

---

## 28. Testing Requirements

### Unit Testing

Test:

- API services.
- Extraction functions.
- Validation logic.
- Authentication.
- Data transformations.

### Integration Testing

Test:

```text
Upload → OCR → Extraction → DB → Embedding → RAG → LLM → Citation
```

### AI Evaluation

Evaluate:

- OCR accuracy.
- Entity extraction accuracy.
- Table extraction accuracy.
- Retrieval precision.
- Citation correctness.
- Answer faithfulness.
- Hallucination rate.
- Validation accuracy.

### Security Testing

- Authentication tests.
- Authorization tests.
- API security.
- File-upload security.
- Injection testing.
- Access-control testing.

---

## 29. Acceptance Criteria

### Document Processing

- User can upload supported files.
- Processing status is visible.
- OCR output is stored.
- Extracted entities are displayed.
- Source page information is preserved.

### Search

- User can perform keyword search.
- User can perform natural-language search.
- Results show relevant source documents.

### RAG

- Query retrieves relevant evidence.
- Answer is based on retrieved evidence.
- Citations are displayed.
- Unsupported claims are rejected or flagged.

### Validation

- Extracted figures can be compared with trusted records.
- Discrepancies are highlighted.
- Low-confidence results enter review.

### Reporting

- User can generate reports.
- Reports include source information.
- Reports can be exported.

---

## 30. SIH MVP Technical Scope

For the hackathon prototype, prioritize:

```text
React + Vite
        ↓
FastAPI
        ↓
PostgreSQL
        ↓
Document Upload
        ↓
PaddleOCR
        ↓
Entity/Table Extraction
        ↓
Qdrant
        ↓
RAG
        ↓
Local/Prototype LLM
        ↓
Validation
        ↓
Citation Engine
        ↓
Report Generator
```

Neo4j, SAP, CoalNet and e-Office integrations can be demonstrated through a clearly labeled enterprise-integration architecture/mock layer if live government interfaces are unavailable.

---

## 31. Recommended Repository Structure

```text
mineintel-ai/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── utils/
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── documents/
│   │   ├── ocr/
│   │   ├── extraction/
│   │   ├── search/
│   │   ├── rag/
│   │   ├── reports/
│   │   ├── parliamentary/
│   │   ├── validation/
│   │   └── audit/
│   ├── workers/
│   ├── tests/
│   └── requirements.txt
│
├── ai/
│   ├── prompts/
│   ├── embeddings/
│   ├── evaluation/
│   └── models/
│
├── data/
│   ├── sample_documents/
│   └── processed/
│
├── infrastructure/
│   ├── docker/
│   ├── postgres/
│   ├── qdrant/
│   └── neo4j/
│
├── docs/
│   ├── PRD.md
│   └── TRD.md
│
└── docker-compose.yml
```

---

## 32. Technical Delivery Phases

### Phase 1 — Foundation

- Repository setup.
- React frontend.
- FastAPI backend.
- PostgreSQL.
- Authentication.
- Document upload.

### Phase 2 — Processing

- PDF/image pipeline.
- OCR.
- Layout extraction.
- Table extraction.
- Entity extraction.

### Phase 3 — Knowledge Layer

- Chunking.
- Embeddings.
- Qdrant.
- Search.
- Citation metadata.

### Phase 4 — AI Layer

- RAG.
- Local/prototype LLM.
- Query assistant.
- Parliamentary assistant.

### Phase 5 — Validation

- Confidence scoring.
- Cross-source comparison.
- Human review.
- Audit trail.

### Phase 6 — Enterprise

- Neo4j.
- SAP/CoalNet adapter.
- e-Office adapter.
- Air-gapped deployment.
- Production hardening.

---

## 33. Final Technical Principle

MineIntel must follow this architecture principle:

```text
                SOURCE OF TRUTH
                      ↓
          Documents / Trusted Data
                      ↓
                  Retrieval
                      ↓
                 Validation
                      ↓
                    LLM
                      ↓
               Citation Layer
                      ↓
                Human Review
                      ↓
             Official Response
```

**The AI generates from evidence; it does not replace the evidence.**
