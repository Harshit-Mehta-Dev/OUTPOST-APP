# Outpost App Architecture Overview

## The Stack
- **Frontend**: React (Vite) hosted on Cloudflare Pages.
- **Backend**: Node.js/Express monolithic microservices structure hosted on Render.
- **Database**: MongoDB (Primary Object Store) + Supabase (Message Backup & Real-time Edge).
- **Cache & Pub/Sub**: Redis (Upstash/Render) for Socket.io adapter orchestration and Express API rate limiting.

## Core Services
1. **Chat Service (`chatService.js`)**: Handles real-time WebSockets, message compression, polling, and AI routing.
2. **Auth Service (`authService.js`)**: Manages Supabase/JWT authentication, rate-limiting on login/register endpoints, and cryptographic operations.
3. **API Service (`apiService.js`)**: Handles general CRUD operations for Campsites and Help Desk.

## Security Posture
- **Helmet**: Secures HTTP headers.
- **Rate Limiters**: Redis-backed limiters prevent DDoS and Brute Force attacks. (Layered: Global, Auth, Data, Action).
- **Data Sanitization**: `express-mongo-sanitize` & `xss-clean` prevent NoSQL injection and XSS.
- **Scout Vault**: Custom E2EE (End-to-End Encryption) utility for encrypting chat messages before MongoDB storage.

*This file is restricted to your local machine and will not be pushed to GitHub.*
