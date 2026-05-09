# 007 Security Audit Report

## 1. System Summary

**Target:** MERN Marketplace Application (Backend + Frontend)
**Scope:** Static source code analysis, Express server configurations, CORS policies, Security middlewares, and Authentication.
**Context:** The system is a marketplace platform based on Node.js, Express, MongoDB, and React, with image uploads delegated to Cloudinary and authentication via Passport/Express-Session.

## 2. Attack Map

**Inputs and Outputs:**
- **Inputs:** API Endpoints (`/api/*`), image uploads, OAuth, and authentication forms.
- **Outputs:** API JSON responses, file exports, Cloudinary image URLs.
- **Trust Boundaries:** The Express backend acts as the primary boundary protecting the MongoDB database.

**Critical Assets:**
- **Secrets:** `JWT_SECRET`, `SESSION_SECRET`, `MONGODB_URI`, Cloudinary Credentials, Google OAuth Credentials.
- **Data:** User sessions, PII (Personal Identifiable Information), Payment Orders, and Products.

**Execution Points:**
- Body parser middleware, local/Cloudinary image processing.

## 3. Vulnerabilities Found

| # | Severity | Vulnerability | Vector | Impact | Fix |
|---|----------|---------------|--------|--------|-----|
| 1 | **HIGH** | **Excessive JSON Payload Limit** (`50mb`) | DoS attack by sending a massive JSON payload. | Memory exhaustion in Node.js (Event Loop Blocking / OOM). | Reduce `express.json({ limit: '50mb' })` to `100kb` or `1mb`. |
| 2 | **MEDIUM** | **Permissive CSP connectSrc** | Data exfiltration in case of XSS bypass. | CSP allows `connectSrc: ["'self'", "*"]`, permitting scripts to send data anywhere. | Remove the `*` and list specific API domains. |
| 3 | **LOW** | **Lack of Anti-CSRF Token** | CSRF (Cross-Site Request Forgery) attack. | Although it uses `sameSite: 'lax'`, older browsers might be vulnerable to request forgery. | Implement CSRF middleware (e.g., csurf) for mutating requests. |

## 4. Threat Model (STRIDE)

- **Spoofing (Identity):** The use of `express-session` with MongoDB and `httpOnly` + `secure` mitigates session hijacking well. The absence of 2FA is a business risk.
- **Tampering:** Inputs are protected by `xss-clean` and `express-mongo-sanitize`. Images sent via Cloudinary prevent local file execution.
- **Repudiation:** The system needs a clearer audit trail. There is no evidence of detailed logs (e.g., `morgan`, pino/winston) for incoming requests.
- **Information Disclosure:** The use of `helmet` protects against common HTTP header leaks.
- **Denial of Service (DoS):** The `50MB` body parser limit is a severe risk for regular API requests.
- **Elevation of Privilege:** Auth routes have strict rate-limiting. No apparent vulnerability as long as the business logic is solid.

## 5. Proposed Fixes

1. **In `backend/server.js`:**
   Change from:
   ```javascript
   app.use(express.json({ limit: '50mb' }));
   app.use(express.urlencoded({ extended: true, limit: '50mb' }));
   ```
   To:
   ```javascript
   app.use(express.json({ limit: '1mb' }));
   app.use(express.urlencoded({ extended: true, limit: '1mb' }));
   ```

2. **In CSP inside `server.js`:**
   Change:
   ```javascript
   connectSrc: ["'self'", "*"],
   ```
   To list only the required domains.

## 6. Hardening And Improvements

- **Centralized Logging:** Add `morgan` or `pino` to ensure robust logging with PII and secrets masking.
- **Specific Validation:** `xss-clean` and `mongoSanitize` are heuristics. The ideal approach is to use a library like `zod` or `joi` to validate the exact schema on every route.
- **Anti-CSRF:** Integrate an Anti-CSRF token if the client uses stateful cookie authentication.

## 7. Scoring

| Domain | Score (0-100) | Observation |
|--------|---------------|-------------|
| Secrets & Credentials | 90 | Strict `.env` verification on startup. |
| Input Validation | 70 | Generic protection with sanitize, but massive payloads allowed. |
| Authentication & AuthZ | 85 | Correct session config with TTL and security flags, but lacks logs. |
| Data Protection | 85 | Good CSP and Helmet policies. |
| Resilience | 75 | Excellent rate-limit, but susceptible to DoS from large JSON payloads. |
| Monitoring | 40 | Absence of persistent auditable logs. |

**Final Score: 74**

## 8. Final Verdict

**Approved with Reservations**

**Technical Justification:** The backend presents mature environment protection configurations, security header middlewares, session management with MongoDB, and adaptable rate-limiting for production. However, it is *essential* to reduce the body-parser limit from 50mb to mitigate critical risks of DoS attacks.

**Conditions for Full Production:**
- Reduction of the parser limit (`limit: '1mb'`).
- Adjustment of `connectSrc` in CSP.
