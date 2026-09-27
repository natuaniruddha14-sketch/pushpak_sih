# MineIntel Codebase Audit

**Date:** 2026-09-27  
**Platform:** MineIntel AI — Mining Document Intelligence & Reporting Platform  
**Target Organization:** CMPDI, Coal India Limited (CIL) & Ministry of Coal  
**Audit Scope:** Full Monorepo (Frontend `apps/web`, Backend `apps/api`, Python AI Service `services/ai`, Packages `packages/shared-types`, Database `prisma`)

---

## Executive Summary

A comprehensive engineering audit of the MineIntel AI codebase was conducted across frontend, backend, database, AI/RAG, file processing, security, UX, and performance. 

While the monorepo has an impressive UI layout, clean directory structure, strict TypeScript configurations, and a comprehensive Prisma schema with pgvector support, the underlying implementation contains significant discrepancies between reported test results and real runtime capabilities. Specifically, the Node.js API currently does not communicate with the Python AI service, key RAG and report generation features rely on hardcoded text strings, file uploads simulate processing via `setTimeout`, and repository calls incur 4-second timeout penalties when PostgreSQL is offline due to lack of connection pooling checks.

This document itemizes all working, partially working, broken, mocked, and missing functionality, followed by a prioritized remediation plan.

---

## 1. Working Features

1. **User Authentication & JWT Tokens**:
   - `apps/api/src/controllers/auth.controller.ts`: Registration, bcrypt password hashing, login, and signed JWT issuance.
   - `apps/web/src/context/AuthContext.tsx`: Token persistence in `localStorage`, role state management, and protected routes.

2. **Project Management (CRUD & Scoping)**:
   - `apps/api/src/controllers/project.controller.ts`: Create project, fetch project by ID, list projects by organization, and delete project with tenancy isolation checks.
   - `apps/web/src/pages/ProjectsPage.tsx`: Interactive project list, organization tagging, and project creation modal.

3. **Storage Sanitization Abstraction**:
   - `apps/api/src/lib/storage.ts`: Disk storage provider safely generates immutable filenames (`<timestamp>_<uuid>_<sanitized>.<ext>`), prevents directory traversal via path containment checks, and computes SHA-256 checksums.

4. **Security Middleware & Rate Limiting**:
   - `apps/api/src/middleware/rate-limit.middleware.ts`: Sliding window rate limiters for general API (200 req/min), authentication (15 req/15 min), and file upload (30 uploads/10 min).
   - `apps/api/src/middleware/security-headers.middleware.ts`: Sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`, and strips `X-Powered-By`.
   - `apps/api/src/middleware/request-id.middleware.ts`: Injects and propagates UUID `X-Request-Id`.

5. **Deterministic Mining Entity Extractor (Python Service)**:
   - `services/ai/app/extraction/deterministic_extractor.py`: Comprehensive regex patterns for mining domain entities (`annual_production`, `proved_reserve`, `indicated_reserve`, `stripping_ratio`, `seam_thickness`, `ash_content`, `gcv`, `land_reclaimed`, `groundwater_inflow`).
   - `services/ai/app/extraction/unit_validator.py`: Normalizes and validates units (`MT`, `m³/tonne`, `meters`, `kcal/kg`, `ha`).

6. **Semantic Chunker (Python Service)**:
   - `services/ai/app/chunking/chunker.py`: Text cleaning, markdown/numbered header detection, configurable chunk sizes, and token count calculations.

7. **Vector Retrival & Hybrid RAG Engine (Python Service)**:
   - `services/ai/app/rag/hybrid_rag.py`: Multi-stream retrieval (`VectorRetriever`, `KeywordRetriever`, `StructuredRetriever`), query classification, and grounded prompt construction.

8. **Frontend Application Shell & UI Foundations**:
   - `apps/web/src/App.tsx`, `Sidebar.tsx`, `AppLayout.tsx`: TailwindCSS dark mining theme, responsive sidebar navigation, and role-based badge displays.

---

## 2. Partially Working Features

1. **Document Upload Pipeline**:
   - *Current State*: File uploads are accepted, saved to disk, and a `ProcessingJob` is created in database/memory.
   - *Limitation*: The background processing is simulated with two `setTimeout` calls (2s to 45%, 3s to 100%). No actual text extraction, OCR, or vector indexing occurs on uploaded files.

2. **Database Persistence with In-Memory Fallback**:
   - *Current State*: Repositories contain logic to query Prisma if `DATABASE_URL` is set, falling back to `memStore` if queries fail.
   - *Limitation*: When PostgreSQL is offline, every query attempts a connection, incurring a 4-second timeout per operation before falling back to memory. Furthermore, `StructuredRecordRepository` and `ReportRepository` lack `memStore` fallbacks and fail when the DB is offline.

3. **Analytics Dashboard**:
   - *Current State*: `apps/web/src/pages/AnalyticsPage.tsx` renders production charts, comparison tables, and trend lines using `recharts`.
   - *Limitation*: The underlying API endpoint `analytics.controller.ts` returns a static array of 10 hardcoded data points rather than aggregating data dynamically from indexed records.

4. **Document Viewer Modal**:
   - *Current State*: `apps/web/src/components/DocumentViewerModal.tsx` opens an interactive modal with page navigation, zoom controls, and layer switching ("Original", "Extracted", "OCR", "AI Interpretation").
   - *Limitation*: The modal does not render the real PDF binary or images; all four layers display the same placeholder text string.

---

## 3. Broken Features

1. **Node.js API to Python AI Service Connection**:
   - *File*: `apps/api/src/lib/env.ts`, `apps/api/src/controllers/search.controller.ts`, `document.controller.ts`
   - *Problem*: `AI_SERVICE_URL` is defined in configuration but is never invoked anywhere in `apps/api`. The API never delegates OCR, entity extraction, embedding generation, or RAG querying to the Python AI service.
   - *Severity*: CRITICAL
   - *Recommended Fix*: Implement an `aiClient` service in `apps/api/src/lib/ai-client.ts` to forward OCR, indexing, and RAG requests to `http://localhost:8000`.

2. **Report PDF/DOCX Export**:
   - *File*: `apps/api/src/controllers/report.controller.ts:226-232`
   - *Problem*: Plain ASCII text is streamed with headers `application/pdf` and `application/vnd.openxmlformats-officedocument.wordprocessingml.document`. Opening these files in standard PDF/Word readers results in corrupted file format errors.
   - *Severity*: HIGH
   - *Recommended Fix*: Integrate a standard document generator (e.g. `pdfkit` / HTML-to-PDF or binary DOCX builder) to produce valid document binaries.

3. **Global Search Bar in TopNav**:
   - *File*: `apps/web/src/components/TopNav.tsx`, `apps/web/src/components/AppLayout.tsx`
   - *Problem*: The global search input in `TopNav` updates `globalSearch` state passed to `<Outlet context={{ globalSearch }} />`, but none of the pages (`DocumentsPage`, `ProjectsPage`, `IntelligencePage`) consume `useOutletContext()`. The search input does nothing.
   - *Severity*: MEDIUM
   - *Recommended Fix*: Connect `useOutletContext<{ globalSearch: string }>()` in `DocumentsPage` and `ProjectsPage` to filter lists dynamically.

4. **Payload Too Large Unhandled Error**:
   - *File*: `apps/api/src/app.ts:41`, `apps/api/src/middleware/error.middleware.ts`
   - *Problem*: `express.json({ limit: '10mb' })` rejects oversized payloads with `PayloadTooLargeError`, but `errorHandlerMiddleware` does not recognize this error class, resulting in an unhandled 500 error instead of HTTP 413 / 400.
   - *Severity*: MEDIUM
   - *Recommended Fix*: Add explicit error handling in `error.middleware.ts` for `type === 'entity.too.large'` returning HTTP 413.

---

## 4. Mocked / Hardcoded Features

1. **AI RAG Query Endpoint**:
   - *File*: `apps/api/src/controllers/search.controller.ts:87, 291-304`
   - *Mocked Elements*: `SearchController.queryAI` returns a hardcoded answer ("Proved Reserves: 425.80 Million Tonnes (MT)... Overburden Stripping Ratio: 2.14 m³/tonne") whenever keywords like "gevra", "coal", or "reserve" are present. It does not run embeddings or LLM inference.

2. **Insufficient Evidence Test Bypass**:
   - *File*: `apps/api/src/controllers/search.controller.ts:22`
   - *Mocked Elements*: Hardcoded `if (queryText.includes('mars sector') || queryText.includes('nuclear lithium'))` specifically written to pass E2E failure test `F7`.

3. **Generated Report Structure**:
   - *File*: `apps/api/src/controllers/report.controller.ts:250-330`
   - *Mocked Elements*: `ReportController.buildReportPayload` hardcodes 8 sections with synthetic citations referencing fake PDF names (e.g. `${projectName}_Geological_Report.pdf`).

4. **Data Quality & Validation Anomalies**:
   - *File*: `apps/api/src/controllers/validation.controller.ts:13, 38-120, 134-218`
   - *Mocked Elements*: Static quality score (94.2%), 7 fixed validation check categories, and pre-scripted conflict pairs (Gevra OCP 70.5 MT vs 64.1 MT).

5. **Analytics Data Points & Topic Taxonomy**:
   - *File*: `apps/api/src/controllers/analytics.controller.ts:60-72, 267-346, 377-391`
   - *Mocked Elements*: Fixed array of 10 production entries, 5 hardcoded topics, and 13 static word-cloud terms.

6. **End-to-End Test Suite Simulated Passes**:
   - *File*: `scripts/run-e2e-test-suite.ts:448, 455`
   - *Mocked Elements*: Failure Case 5 (Embedding timeout) and Failure Case 6 (LLM timeout) directly call `recordResult(..., true, ...)` without performing actual tests, and the script overwrites `TEST_REPORT.md` with fabricated 100% pass claims.

---

## 5. Missing Features

1. **CSV Document Ingestion**:
   - *File*: `apps/api/src/middleware/upload.middleware.ts`, `services/ai/app/document_parsers`
   - *Missing*: PRD lists CSV support, but `text/csv` is excluded from `ALLOWED_MIME_TYPES`, causing CSV uploads to be rejected. There is no CSV parser in `document_parsers`.

2. **Image OCR Pipeline Integration**:
   - *File*: `apps/api/src/controllers/document.controller.ts`
   - *Missing*: When images or scanned PDFs are uploaded, OCR is never dispatched to `services/ai/app/ocr`.

3. **Tesseract Binary Fallback Handling**:
   - *File*: `services/ai/app/ocr/local_engine.py:155-178`
   - *Missing*: When Tesseract binary is absent on Windows, `_fallback_image_ocr` returns an empty string `""`. Scanned files yield no text.

4. **Real pgvector Integration in Node.js Search**:
   - *File*: `apps/api/src/controllers/search.controller.ts`
   - *Missing*: Search controller performs SQL `LIKE %queryText%` on chunk text; vector similarity search (`<=>` cosine distance query) is completely absent.

5. **Notification System**:
   - *File*: `apps/web/src/components/TopNav.tsx:24-27`
   - *Missing*: Notifications dropdown displays two hardcoded mock entries; there is no backend API or WebSocket for real notifications.

---

## 6. Frontend Problems

### Issue 6.1: Hardcoded Statistics on Dashboard
- **File**: `apps/web/src/pages/DashboardPage.tsx:72-73`
- **Current Behaviour**: Displays `queriesAnswered: 14` and `reportsGenerated: 3` regardless of actual backend records.
- **Problem**: Misrepresents system activity to operators.
- **Severity**: MEDIUM
- **Recommended Fix**: Query `/api/v1/analytics/summary` or compute counts from real query sessions and reports.

### Issue 6.2: Silent Failure Fallback in Intelligence Chat
- **File**: `apps/web/src/pages/IntelligencePage.tsx:317-350`
- **Current Behaviour**: If the AI query API endpoint returns a 500 error, the frontend intercepts the error and displays a fake successful assistant response with Gevra citations.
- **Problem**: Conceals backend failures from the user and fabricates answers when the server is down.
- **Severity**: HIGH
- **Recommended Fix**: Display a clean error alert with a "Retry" button when an API request fails.

### Issue 6.3: Simulated Loading Timers in Intelligence Chat
- **File**: `apps/web/src/pages/IntelligencePage.tsx:262-264`
- **Current Behaviour**: Runs fake `setTimeout` steps: "Executing vector search" at 400ms, "Querying structured database" at 800ms, "Reranking evidence" at 1200ms.
- **Problem**: Artificial UI delay that does not reflect actual backend processing stages.
- **Severity**: LOW
- **Recommended Fix**: Bind loading states to real server response status or Server-Sent Events.

### Issue 6.4: Hardcoded Localhost URLs in Settings Page
- **File**: `apps/web/src/pages/SettingsPage.tsx:26, 35`
- **Current Behaviour**: Directly fetches `http://localhost:4000/health` and `http://localhost:8000/health`.
- **Problem**: Breaks in non-localhost or containerized environments where port 4000/8000 are accessed via domain or reverse proxy.
- **Severity**: MEDIUM
- **Recommended Fix**: Use `import.meta.env.VITE_API_URL` and `import.meta.env.VITE_AI_SERVICE_URL`.

### Issue 6.5: Inconsistent Empty State Handling Across Pages
- **File**: `apps/web/src/pages/DocumentsPage.tsx:148-154`, `ProjectsPage.tsx:76`
- **Current Behaviour**: If the database returns an empty array `[]`, the UI automatically displays hardcoded default documents/projects.
- **Problem**: Users cannot see when their workspace is truly empty, and deleting records causes fake defaults to reappear.
- **Severity**: HIGH
- **Recommended Fix**: Display clean empty state components (e.g. "No documents uploaded yet. Upload your first mining dossier.") when list is empty.

---

## 7. Backend Problems

### Issue 7.1: Repositories Fall Back to First Item on Not Found in memStore
- **File**: `apps/api/src/repositories/user.repository.ts:21`, `document.repository.ts:27`, `project.repository.ts:25`
- **Current Behaviour**: In `memStore` mode, calling `findById(unknownId)` returns `Array.from(store.values())[0]` instead of `null`.
- **Problem**: Any request with an invalid or unauthorized ID gets access to the first user/document/project in memory (admin), creating security vulnerabilities and masking 404 bugs.
- **Severity**: CRITICAL
- **Recommended Fix**: Return `null` when `store.get(id)` is undefined.

### Issue 7.2: Inconsistent Response Format
- **File**: `apps/api/src/controllers/*.ts`
- **Current Behaviour**: Endpoints return varied response shapes (e.g. `{ document }`, `{ projects: [] }`, `{ message, report }`, `{ error, message }`).
- **Problem**: Inconsistent client integration and error handling.
- **Severity**: MEDIUM
- **Recommended Fix**: Enforce standardized wrapper `{ success: boolean, data?: any, error?: string, message?: string }`.

### Issue 7.3: Database Connection Timeout on Every Query When DB Offline
- **File**: `apps/api/src/repositories/*.ts`
- **Current Behaviour**: Every function executes `if (process.env.DATABASE_URL) await prisma...` inside a `try/catch`. When PostgreSQL is offline, every query blocks for ~4 seconds before erroring out and hitting `memStore`.
- **Problem**: Causes extreme request latency (~4-8 seconds per HTTP call) and floods stdout with `Can't reach database server at localhost:5432`.
- **Severity**: HIGH
- **Recommended Fix**: Maintain an active DB connection state / health flag so repositories immediately use `memStore` or fail fast if PostgreSQL is unavailable.

### Issue 7.4: Missing memStore Fallback in StructuredRecord and Report Repositories
- **File**: `apps/api/src/repositories/structured-record.repository.ts`, `report.repository.ts`
- **Current Behaviour**: Methods call `prisma.structuredRecord.*` and `prisma.report.*` without try-catch or in-memory fallback.
- **Problem**: Unhandled promise rejection / 500 error when PostgreSQL is offline.
- **Severity**: HIGH
- **Recommended Fix**: Add fallback storage in `mem-store.ts` for structured records and reports.

---

## 8. Database Problems

### Issue 8.1: Unsupported Type in Prisma Schema for pgvector
- **File**: `apps/api/prisma/schema.prisma:207`
- **Current Behaviour**: `embedding Unsupported("vector")?` is defined. Prisma cannot query or mutate this field through standard client methods (`findMany`, `create`).
- **Problem**: Vector insertions and similarity queries require raw SQL (`prisma.$queryRawUnsafe` / `prisma.$executeRaw`). Without raw SQL handlers, vector data cannot be saved or searched.
- **Severity**: HIGH
- **Recommended Fix**: Implement explicit raw SQL vector helper queries in `DocumentRepository` for HNSW vector inserts and `<=>` cosine distance retrieval.

### Issue 8.2: Lack of Database Migration Execution Check
- **File**: `apps/api/prisma/migrations/20260925000000_init/migration.sql`
- **Current Behaviour**: Schema and migration files exist, but there is no startup check ensuring migrations have run before the API serves requests.
- **Problem**: If the container starts with a fresh PostgreSQL instance, requests fail immediately.
- **Severity**: MEDIUM
- **Recommended Fix**: Add a database readiness check on API startup.

---

## 9. AI / RAG Problems

### Issue 9.1: Disconnected RAG Pipeline
- **File**: `apps/api/src/controllers/search.controller.ts:87` vs `services/ai/app/rag/hybrid_rag.py`
- **Current Behaviour**: Python service contains a functional `AnswerGenerator` and `HybridRetriever`, but the Node.js API never calls it. It returns static strings.
- **Problem**: Real multimodal document intelligence is completely bypassed.
- **Severity**: CRITICAL
- **Recommended Fix**: Connect `SearchController.queryAI` to POST `/api/v1/rag/query` on the Python AI service.

### Issue 9.2: Python RAG Queries In-Memory Dict Instead of PostgreSQL
- **File**: `services/ai/app/rag/hybrid_rag.py:129`, `services/ai/app/rag/indexer.py`
- **Current Behaviour**: `VectorRetriever` iterates over `IN_MEMORY_VECTOR_STORE = {}`.
- **Problem**: Chunks indexed in one process are lost on restart and cannot be shared across multiple instances.
- **Severity**: HIGH
- **Recommended Fix**: Update `VectorRetriever` to query PostgreSQL `pgvector` table or persist vector embeddings.

### Issue 9.3: Hardcoded Structured Knowledge Base in Python RAG
- **File**: `services/ai/app/rag/hybrid_rag.py:210-237`
- **Current Behaviour**: `StructuredRetriever.STRUCTURED_KNOWLEDGE_BASE` contains a hardcoded array of 2 mines (Gevra and Rajmahal).
- **Problem**: Cannot answer structured questions about any other mine block.
- **Severity**: HIGH
- **Recommended Fix**: Query dynamic database table `StructuredRecord` instead of a static dictionary.

---

## 10. Security Problems

### Issue 10.1: Magic Bytes Validation Is Never Executed
- **File**: `apps/api/src/middleware/upload.middleware.ts:63`
- **Current Behaviour**: `validateFileMagicBytes` is defined but never invoked in `fileFilter` or `DocumentController`.
- **Problem**: Attackers can upload arbitrary malicious files (e.g. scripts or binaries) by setting the `Content-Type` header to `application/pdf`.
- **Severity**: HIGH
- **Recommended Fix**: Call `validateFileMagicBytes(buffer, mimetype)` in `upload.middleware.ts` before saving files.

### Issue 10.2: Insecure Default Fallback User Access
- **File**: `apps/api/src/repositories/user.repository.ts:21`
- **Current Behaviour**: Requesting non-existent user returns Admin user from `memStore`.
- **Problem**: Potential authentication/authorization bypass in development/demo environments.
- **Severity**: CRITICAL
- **Recommended Fix**: Return `null` immediately if user ID is not found.

### Issue 10.3: Unmasked Stack Traces on Body Parser Failure
- **File**: `apps/api/src/middleware/error.middleware.ts`
- **Current Behaviour**: When `body-parser` throws `PayloadTooLargeError`, full node_modules stack trace is logged and returned in unhandled error responses.
- **Problem**: Information disclosure.
- **Severity**: LOW
- **Recommended Fix**: Ensure `error.middleware.ts` suppresses stack traces in all non-debug responses.

---

## 11. UX Problems

### Issue 11.1: Non-Functional Export CSV Buttons
- **File**: `apps/web/src/pages/AnalyticsPage.tsx:354`, `TopicsPage.tsx:216`
- **Current Behaviour**: The CSV export generates a basic data URI with hardcoded headers and triggers a browser download.
- **Problem**: Works on static rows, but when filters are changed or API is offline, it exports empty or invalid CSV files.
- **Severity**: LOW
- **Recommended Fix**: Validate data array before trigger and show alert if no data is available to export.

### Issue 11.2: Missing Retry Options on Failed API Calls
- **File**: `apps/web/src/pages/AnalyticsPage.tsx`, `ReportsPage.tsx`, `DocumentsPage.tsx`
- **Current Behaviour**: If fetch fails, the page shows an error or blank screen with no "Retry" button.
- **Problem**: Poor operator experience on transient network disconnects.
- **Severity**: MEDIUM
- **Recommended Fix**: Add standard error banner with "Retry" action button.

---

## 12. Performance Problems

### Issue 12.1: Large Frontend Bundle Size (>939 kB)
- **File**: `apps/web/dist/assets/index-*.js`
- **Current Behaviour**: Single large JavaScript bundle of 939 kB (251 kB gzipped) is created without code splitting.
- **Problem**: Slow initial load time on low-bandwidth field laptops.
- **Severity**: MEDIUM
- **Recommended Fix**: Implement React `lazy` and `Suspense` for routes in `App.tsx`.

### Issue 12.2: Unbounded In-Memory Map Stores
- **File**: `apps/api/src/controllers/report.controller.ts:6`, `services/ai/app/main.py:32`
- **Current Behaviour**: Maps (`reportMemoryStore`, `JOB_PROGRESS_STORE`) grow indefinitely without eviction or TTL.
- **Problem**: Memory leak over prolonged server execution.
- **Severity**: LOW
- **Recommended Fix**: Add LRU eviction cache or bounded store size.

---

## 13. Technical Debt

1. **Unused Document Parser Modules**: `PDFDocumentParser`, `ExcelDocumentParser`, `DocxDocumentParser` in `services/ai/app/document_parsers` are unlinked and never imported.
2. **Duplicated Type Definitions**: `shared-types` package defines interfaces, but `apps/api` and `apps/web` duplicate many identical interface definitions locally.
3. **Redundant E2E Script Mocks**: Test runner script `run-e2e-test-suite.ts` manufactures test results instead of exercising actual end-to-end integration.

---

## 14. Recommended Fix Order

### Phase 1: Platform Stability & Backend Hardening (Immediate Priority)
1. **Fix Repository Fallbacks & 404 Behavior**:
   - Prevent `user.repository.ts`, `document.repository.ts`, and `project.repository.ts` from returning the first item when an ID is not found.
   - Implement fast-failing DB connection checks to prevent 4-second timeout blocks when PostgreSQL is offline.
   - Add safe in-memory fallback handlers for `StructuredRecordRepository` and `ReportRepository`.
2. **Standardize API Responses**:
   - Wrap all API responses in `{ success: boolean, data?: any, error?: string, message?: string }`.
   - Fix `PayloadTooLargeError` handling to return HTTP 413 instead of 500.
3. **Upload Security Hardening**:
   - Enforce `validateFileMagicBytes` on file upload payloads to reject MIME spoofing.
   - Add `.csv` support to allowed MIME types and sanitize all uploads.
4. **Frontend Error & Empty States**:
   - Remove fake success fallbacks on failed API calls in `IntelligencePage`.
   - Replace fake pre-filled default data with genuine empty states and retry buttons.
   - Wire `TopNav` search bar to filter page lists via `useOutletContext`.
   - Fix hardcoded URLs in `SettingsPage`.

### Phase 2: Microservice Integration & File Processing
1. Implement Node.js API client to communicate directly with Python AI service.
2. Connect uploaded documents to real parsing pipeline (PDF, Excel, Word, CSV).
3. Connect `SearchController` to Python Hybrid RAG pipeline.

### Phase 3: Reporting & Binary Output
1. Replace fake ASCII text in PDF/DOCX downloads with genuine binary document generation.
2. Dynamically ground synthesized reports on indexed database chunks.

---
*Audit Completed by Antigravity AI Engineering Suite.*
