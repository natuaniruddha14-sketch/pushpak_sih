# Security Policy & Production-Readiness Architecture — MINEINTEL AI

## 1. Overview & Security Posture

MINEINTEL AI is an enterprise document intelligence and automated reporting platform designed for sensitive geological surveys, borewell logs, and statutory mining dossiers (CMPDI / Coal India Limited standards).

Security, data privacy, and isolation are paramount. This document details the security model, vulnerability mitigation controls, data validation rules, operational practices, and incident reporting procedures implemented across the platform.

---

## 2. Core Security Architecture & Review Matrix

| Domain | Implemented Controls & Architecture | Status |
| :--- | :--- | :--- |
| **Authentication** | Cryptographic password hashing using `bcryptjs` with salt work factor. Stateless JSON Web Tokens (`jsonwebtoken`) signed with a minimum 256-bit secret. Expiring sessions (default 24h). | **Hardened** |
| **Authorization & RBAC** | Strict role-based access control (`ADMIN`, `GEOLOGIST`, `MINING_ENGINEER`, `EXECUTIVE`, `ANALYST`, `VIEWER`). Organization-level data boundary multi-tenancy. Route-level guard middleware (`requireRole`). | **Hardened** |
| **File Upload Security** | Dual-layer validation: MIME type whitelist (`PDF`, `DOCX`, `XLSX`, `PNG`, `JPEG`), binary magic bytes inspection (`%PDF-`, `\x89PNG`, `\xFF\xD8\xFF`, `PK`), and strict size cap (max 50MB default, hard boundary 100MB). | **Hardened** |
| **Path Traversal Prevention** | Elimination of user-supplied paths; file basename extraction, null-byte stripping (`\0`), alphanumeric sanitization, UUID/timestamp prefixing, and canonical storage root boundary verification (`validateSafePath`). | **Hardened** |
| **SQL Injection Prevention** | All persistence interactions mediated by Prisma ORM parameterized queries. Raw queries (pgvector similarity search) strictly bound through prepared statements and typed template tags. | **Hardened** |
| **XSS & Content Security** | Strict HTTP security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`. Removed `X-Powered-By`. React 19 automatic output escaping. | **Hardened** |
| **CSRF Mitigation** | Stateless Bearer token architecture passed exclusively via `Authorization: Bearer <token>` HTTP headers. The platform does not rely on ambient credentialed cookies for state changes. Cross-origin requests restricted by CORS origin whitelist. | **Hardened** |
| **Secrets Management** | Zero hardcoded production secrets. Multi-environment validation via Zod (`apps/api/src/lib/env.ts`) and Pydantic Settings (`services/ai/app/core/config.py`). Git exclusion rules in `.gitignore` covering `**/.env*`, certificates, and keys. Insecure default secrets blocked in production. | **Hardened** |
| **API Rate Limiting** | Multi-tiered sliding-window rate limiters: General API (200 req/min), Authentication endpoints (15 req/15 min to defeat brute-force), Document Uploads (30 uploads/10 min). Returns `HTTP 429` with `Retry-After` header. | **Hardened** |
| **Input Validation** | End-to-end runtime request validation using Zod schemas for all request bodies and query parameters. Bounded JSON/urlencoded body parsing limit (10MB). | **Hardened** |
| **API Error Handling** | Centralized error-handling middleware (`errorHandlerMiddleware`) mapping domain exceptions (`AppError`) to clean HTTP codes. Sensitive database internals and stack traces are suppressed in production. | **Hardened** |
| **Structured Logging** | Structured JSON logging with timestamp, service identifier, request ID, status, and duration. Automatic redaction of sensitive credentials (`password`, `token`, `authorization`, `secret`, `cookie`). | **Hardened** |
| **Request IDs** | Unique `X-Request-Id` UUID assigned to every incoming request and propagated through downstream responses and structured logs for complete distributed auditability. | **Hardened** |
| **Database & Vector Indexes** | B-Tree indexing on foreign keys and lookup columns (`Document.projectId`, `checksum`, `mineName`). HNSW (Hierarchical Navigable Small World) index on `DocumentChunk.embedding` for fast approximate nearest neighbor search; GIN index for full-text search. | **Hardened** |
| **Background Jobs & Timeouts** | Explicit status state machines (`QUEUED` -> `PROCESSING` -> `COMPLETED`/`FAILED`). Configurable downstream HTTP timeouts (10s graceful shutdown timeout, 30s service timeout). Background unhandled promise rejections captured. | **Hardened** |
| **CORS Policy** | Whitelist-based origin checking using `CORS_ORIGIN` environment variable. Defaults to local development and requires explicit production origins in production deployments. | **Hardened** |

---

## 3. File Upload & Storage Security

### A. Sanitized Filename Generation
Incoming files are never written to disk with their user-supplied names. The storage abstraction executes:
1. Strips null bytes (`\0`) and path delimiters (`/`, `\`, `..`).
2. Extracts the file extension and verifies it matches authorized mining formats.
3. Replaces non-alphanumeric characters with safe underscores.
4. Generates an immutable, non-colliding filename:
   ```
   <timestamp>_<crypto_random_uuid8>_<sanitized_name>.<ext>
   ```

### B. Path Containment Verification
The storage layer validates that any resolved file path is strictly contained within the canonical `storage/` root directory:
```typescript
const normalizedRoot = path.normalize(this.storageRoot);
if (!absolutePath.startsWith(normalizedRoot)) {
  throw new BadRequestError('Access denied: File path outside authorized storage boundaries');
}
```

### C. Binary Signature (Magic Bytes) Verification
To counter MIME-spoofing (e.g. uploading a malicious script renamed to `.pdf`), the server validates initial byte signatures:
- **PDF**: `%PDF-` (`0x25 0x50 0x44 0x46`)
- **PNG**: `\x89PNG` (`0x89 0x50 0x4E 0x47`)
- **JPEG**: `\xFF\xD8\xFF`
- **DOCX / XLSX**: `PK\x03\x04` (Zip archive container)

---

## 4. Environment Variables & Secrets Policy

1. **Never Commit Secrets**:
   The monorepo `.gitignore` strictly ignores:
   - `**/.env`
   - `**/.env.*` (except `.env.example`)
   - `*.pem`, `*.key`, `*.cert`, `*.crt`, `*.pfx`, `*.p12`
   - `credentials.json`, `secrets.json`, `service-account*.json`

2. **Startup Environment Validation**:
   `apps/api/src/lib/env.ts` parses and enforces constraints on startup. If running in `NODE_ENV=production` with missing variables or an insecure default `JWT_SECRET`, the application logs a security alert or aborts startup.

---

## 5. Security Testing & Verification Procedures

Run standard automated security and health verification commands:

```bash
# 1. Dependency Vulnerability Audit
npm run audit

# 2. Python Environment Integrity Check
services/ai/venv/Scripts/python.exe -m pip check

# 3. Python AI & Processing Test Suite (100% Pass)
npm run test:ai

# 4. TypeScript Monorepo Build & Typecheck (All workspaces)
npm run test:ts

# 5. Prisma Database Schema & Migration Validation
npx prisma validate --schema=apps/api/prisma/schema.prisma
```

---

## 6. Reporting Security Vulnerabilities

If you identify a security vulnerability in MINEINTEL AI:
1. **Do not create a public issue** on GitHub/GitLab.
2. Email the core maintainers at `security@mineintel.internal` (or your organizational IT security team).
3. Include:
   - Description of the vulnerability and affected components.
   - Proof of Concept (PoC) or reproduction steps.
   - Potential impact assessment.
4. The security team will acknowledge receipt within 48 hours and provide a remediation timeline.
