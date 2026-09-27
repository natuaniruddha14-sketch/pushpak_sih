# MineIntel AI — Product Requirements Document (PRD)

**Version:** 1.0  
**Project:** MineIntel AI — Sovereign Document Intelligence & Automated Parliamentary Reporting Platform  
**Hackathon:** Smart India Hackathon (SIH) 2026  
**Problem Statement:** Automated Platform for AI-Assisted Geological, Mining, and Production Document Processing & Reporting  
**Target Organization:** CMPDI, CIL & Ministry of Coal

---

## 1. Product Vision

MineIntel AI transforms unstructured geological, mining, and production records into searchable, validated, and actionable intelligence.

The platform is designed to process scanned PDFs, handwritten borewell logs, geological maps, spreadsheets, historical archives, and enterprise data, then support automated reporting, semantic retrieval, topic analytics, and evidence-backed parliamentary response drafting.

> **Product definition:** MineIntel AI is a sovereign multimodal document-intelligence platform that converts decades of unstructured mining records into searchable, validated knowledge and evidence-backed reports and parliamentary responses.

---

## 2. Problem Statement

CMPDI and CIL subsidiaries maintain large volumes of historical mining and geological information across scanned PDFs/TIFFs, borewell logs, geological maps, production ledgers, spreadsheets, and archives.

The source architecture identifies:

- Heavy dependence on manual compilation and domain experts.
- Long reporting timelines.
- Difficulty retrieving information from historical scanned records.
- Risk of discrepancies during manual extraction and reconciliation.
- Difficulty rapidly preparing evidence-backed responses to parliamentary and administrative queries.

The source document describes more than 3.5 million pages of historical records across CMPDI and eight CIL subsidiaries and reports 14–21 day timelines for some parliamentary dossier preparation.

---

## 3. Product Goals

### Primary Goals

1. Digitize historical mining and geological documents.
2. Extract structured information from scanned and handwritten records.
3. Make historical records searchable using natural language.
4. Build a retrieval-augmented generation (RAG) knowledge layer.
5. Generate structured reports automatically.
6. Generate evidence-backed parliamentary response drafts.
7. Validate extracted figures against authoritative data.
8. Provide page/line-level source traceability.
9. Support topic and trend analytics.
10. Enable secure on-premise/air-gapped deployment.

---

## 4. Non-Goals

The initial product will not:

- Replace geologists, mining engineers, auditors, or government officers.
- Automatically approve or publish parliamentary responses.
- Make autonomous regulatory decisions.
- Modify authoritative source systems without authorization.
- Depend on external public AI APIs for sensitive production deployment.
- Replace SAP ERP or NIC e-Office.
- Generate factual claims without supporting evidence.

---

## 5. Target Users

### 5.1 Administrator

- Manage users and roles.
- Configure system settings.
- Monitor security and audit events.
- Manage data sources.

### 5.2 Document/Data Operator

- Upload documents.
- Import spreadsheets.
- Monitor processing.
- Review and correct extraction results.

### 5.3 Geologist / Mining Engineer

- Search geological records.
- Inspect borehole and seam information.
- Explore mine/seam relationships.
- Validate extracted geological information.

### 5.4 Reporting Officer

- Generate reports.
- Analyze production information.
- Export reports and analytics.

### 5.5 Parliamentary / Ministry Officer

- Enter parliamentary questions.
- Retrieve supporting evidence.
- Generate response drafts.
- Verify citations.

### 5.6 Auditor

- Review source evidence.
- Inspect validation results.
- Review AI outputs.
- Inspect audit trails.

---

## 6. Core Product Modules

### Module 1 — Document Ingestion

**Supported inputs:**

- PDF
- TIFF
- JPG/PNG
- DOC/DOCX
- XLS/XLSX
- CSV
- Enterprise/API data

**Features:**

- Single and bulk upload.
- Document metadata.
- Document classification.
- Duplicate detection.
- Version tracking.
- Processing status.

**Metadata:**

```text
Document ID
Document Name
Document Type
Mine
Subsidiary
Year
Department
Source
Confidentiality
Upload Date
Uploaded By
Processing Status
```

---

### Module 2 — AI Document Processing

Pipeline:

```text
Document
   ↓
Image Quality Detection
   ↓
Deskew / Noise Removal / Super Resolution
   ↓
OCR
   ↓
Layout Detection
   ↓
Table Extraction
   ↓
Mining Entity Extraction
   ↓
Validation
   ↓
Structured Data
```

Information to extract may include:

- Mine name
- Borehole ID
- Seam name
- Seam depth
- Latitude / longitude
- Coal grade
- GCV
- Ash percentage
- Moisture percentage
- Production
- Date
- Equipment
- Safety incidents
- Geological formation

---

### Module 3 — Knowledge Repository

#### Vector Knowledge Base

Used for:

- Semantic search.
- RAG retrieval.
- Similar-document retrieval.
- Evidence retrieval.

Proposed technology: **Qdrant / Milvus**.

#### Knowledge Graph

Used to represent:

```text
CIL
 └── Subsidiary
      └── Mine
           └── Seam
                └── Borehole
```

Proposed technology: **Neo4j**.

---

### Module 4 — AI Query & Response

Users can ask natural-language questions such as:

> What was the production of coal from Mine X during 2022–23?

Processing:

```text
Question
 ↓
Intent Detection
 ↓
Hybrid Retrieval
 ↓
Vector + Keyword + Graph Search
 ↓
Evidence Collection
 ↓
Validation
 ↓
LLM
 ↓
Citation Generation
 ↓
Answer
```

If sufficient evidence is unavailable, the system must not invent an answer.

Recommended fallback:

> Insufficient verified information found in the available records.

---

### Module 5 — Parliamentary Query Assistant

Example:

> Provide state-wise coal production and royalty figures for FY 2023–24.

Expected response structure:

```text
Executive Summary

State | Production | Royalty
------|------------|--------
...

Sources:
Document A — Page 17
Document B — Page 42
Enterprise Record — Reference XXX

Validation:
✓ Production verified
✓ Royalty verified
⚠ Discrepancy detected
```

The final output remains subject to human review.

---

### Module 6 — Topic & Trend Analytics

The NLP layer should identify recurring topics such as:

- Safety
- Production
- Equipment downtime
- Compliance
- Geological exploration
- Mine closure
- Royalty
- Coal quality

Outputs:

- Word clouds.
- Topic clusters.
- Trend charts.
- Mine-wise analysis.
- Year-wise analysis.
- Topic frequency.

The source architecture proposes BERTopic/LDA for topic identification.

---

### Module 7 — Validation & Audit

Validation flow:

```text
AI Extracted Value
       ↓
Authoritative Data
       ↓
Comparison
       ↓
 ┌─────┴─────┐
 ↓           ↓
Match       Mismatch
 ↓           ↓
Verified    Human Review
```

Low-confidence or conflicting outputs should be routed to a human reviewer.

The source architecture specifies human review when confidence falls below 88%.

---

## 7. Functional Requirements

| ID | Requirement |
|---|---|
| FR-01 | Secure user authentication |
| FR-02 | Role-based access control |
| FR-03 | Single and bulk document upload |
| FR-04 | Asynchronous document processing |
| FR-05 | OCR for scanned documents |
| FR-06 | Handwritten-record processing |
| FR-07 | Table extraction |
| FR-08 | Mining-domain entity extraction |
| FR-09 | Keyword and semantic search |
| FR-10 | Hybrid RAG retrieval |
| FR-11 | Source/page/line citations |
| FR-12 | Parliamentary query drafting |
| FR-13 | Report generation |
| FR-14 | Topic and trend analytics |
| FR-15 | Data validation and discrepancy detection |
| FR-16 | Human review workflow |
| FR-17 | Audit logging |
| FR-18 | PDF/DOCX/XLSX/JSON export |

---

## 8. Non-Functional Requirements

| Requirement | Description |
|---|---|
| Security | Government/enterprise-grade security |
| Deployment | On-premise and air-gapped capable |
| Scalability | Support large historical archives |
| Reliability | Fail-safe AI responses |
| Traceability | Evidence-backed outputs |
| Privacy | No mandatory external AI API dependency |
| Performance | Asynchronous batch processing |
| Maintainability | Modular service architecture |
| Accessibility | Usable enterprise dashboard |

---

## 9. Key Product KPIs

The source architecture proposes the following target/claimed benchmarks:

- 98.8% preparation-time reduction.
- 98.4% structured extraction accuracy on printed PDFs.
- 91.2% extraction accuracy on handwritten field ledgers.
- 90% automation of repetitive parliamentary draft responses.

These figures should be treated as **targets/claims to be validated through testing**, not guaranteed production results.

---

## 10. User Journey

```text
Login
  ↓
Dashboard
  ↓
Upload Historical Documents
  ↓
AI Processing
  ↓
Extraction Results
  ↓
Human Verification
  ↓
Knowledge Base
  ↓
Ask Question / Generate Report
  ↓
RAG Retrieval
  ↓
Validation
  ↓
AI Response
  ↓
Source Citations
  ↓
Export
```

---

## 11. MVP Scope for SIH

The SIH prototype should focus on the end-to-end value chain instead of implementing every enterprise integration.

### MVP

```text
1. Login
2. Document Upload
3. OCR
4. Structured Extraction
5. Document Search
6. RAG Query Assistant
7. Source Citations
8. Parliamentary Response Generator
9. Validation
10. PDF Report Export
```

### Recommended Demo

```text
Upload historical mining PDF
        ↓
AI extracts information
        ↓
Information indexed
        ↓
Judge asks a question
        ↓
RAG retrieves evidence
        ↓
Validation runs
        ↓
Response generated
        ↓
Exact source page displayed
        ↓
Report exported
```

---

## 12. Product Roadmap

### Phase 1 — Foundation

- Authentication.
- Dashboard.
- Document upload.
- Metadata.
- PostgreSQL.
- Basic OCR.

### Phase 2 — AI Processing

- OCR enhancement.
- Table extraction.
- Entity extraction.
- Chunking.
- Embeddings.

### Phase 3 — RAG

- Qdrant.
- Hybrid retrieval.
- LLM integration.
- Citations.

### Phase 4 — Intelligence

- Parliamentary assistant.
- Validation.
- Reports.
- Topic analytics.

### Phase 5 — Enterprise

- Neo4j.
- SAP/CoalNet connector.
- e-Office connector.
- Advanced audit.
- Air-gapped deployment.

---

## 13. Expected Business Value

MineIntel is intended to:

- Reduce manual document compilation.
- Improve information retrieval.
- Reduce reporting turnaround time.
- Improve traceability.
- Reduce data discrepancies.
- Support faster parliamentary response preparation.
- Preserve and unlock historical mining knowledge.
- Provide a sovereign AI architecture for sensitive government data.
