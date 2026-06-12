# 🛡️ Security Policy

At **Outpost**, we take the security and privacy of our communities extremely seriously. This document outlines our security protocols, reporting procedures, and supported versions.

## Supported Versions

We only provide security updates and patches for the latest active release on the `main` branch. 

| Version | Supported          | Description                                  |
| ------- | ------------------ | -------------------------------------------- |
| 1.x.x   | :white_check_mark: | Active deployment (Cloudflare & Render)      |
| < 1.0   | :x:                | Deprecated / Pre-release                     |

## Reporting a Vulnerability

If you discover a security vulnerability within Outpost, please do **NOT** open a public issue. Instead, follow these steps:

1. **Email us directly:** Send a detailed report to the core maintainers.
2. **Include Details:** Provide a clear description of the vulnerability, steps to reproduce it, and any potential impact (e.g., XSS, RBAC bypass, data leak).
3. **Wait for confirmation:** We will acknowledge receipt of your vulnerability report within **48 hours**.

> [!IMPORTANT]
> We ask that you give us a reasonable amount of time (typically 7-14 days) to patch the vulnerability before disclosing it publicly.

## System Constraints & Security Layers

Outpost employs several layers of defense to protect user data:

- **AI Basecamp Ranger:** An automated system that scans and drops toxic/malicious messages in real-time before they reach the database.
- **Role-Based Access Control (RBAC):** Strict permissions dividing Commanders (Admins) and Scouts (Members). Users cannot delete messages or modify camps without the correct clearance code.
- **Rate Limiting:** IP-based rate limiting on all API routes to prevent Brute Force and DDoS attacks.
- **Payload Limits:** Maximum media upload size is hard-capped at **50MB** at the WebSocket layer to prevent memory exhaustion attacks.
- **Sanitization:** All database inputs are sanitized using `express-mongo-sanitize` and `xss-clean` to prevent NoSQL injection and Cross-Site Scripting.

## Dependency Security

We actively monitor our NPM dependency tree. If a high-severity CVE is found in a dependency, we will patch it and deploy a hotfix immediately.
