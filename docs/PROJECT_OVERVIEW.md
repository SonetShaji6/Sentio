# 🌌 Sentio — Official System Architecture & Project Specification Overview

> **Sentio** is an AI-powered real-time audience engagement SaaS platform that transforms passive lectures, workshops, and keynotes into interactive, data-driven experiences.

---

## 📜 Specification & Source of Truth Traceability

This document represents the living state of the official **Sentio 20-Module System Specification**. It maintains exact traceability between the original project specification, system architecture, database models, API contracts, frontend/backend implementations, and future roadmap.

---

## 🎯 Project Vision & Purpose

Sentio bridges the gap between presenters (educators, corporate trainers, keynote speakers, event hosts) and audiences by unifying interactive polling, quizzes, open text Q&A, and real-time word clouds with provider-abstracted AI intelligence (powered by Groq Cloud API).

### Problem Statement vs Sentio Solution

- **Traditional Tools**: Fragmented, manual question creation, static bar charts, lack of in-session real-time AI assistance, post-session reports requiring manual data aggregation.
- **Sentio Platform**: End-to-end monorepo web application featuring live slide synchronization (<100ms WebSocket latency), AI question generation, automated sentiment analysis, smart post-session reports exported to PDF/CSV, and cloud file management.

---

## 🏛️ System Architecture

### Monorepo Architecture (`npm` Workspaces)

Sentio uses a monorepo structure containing frontend, backend, and shared packages:

```
Sentio/
├── docs/                         # Official System Documentation & Memory System
│   ├── PROJECT_OVERVIEW.md       # High-level architecture & specification reference
│   ├── DEVELOPMENT_WORKPLAN.md   # Master roadmap tracking all 20 specification modules
│   ├── DEVELOPMENT_LOG.md        # Chronological development journal & decision log
│   └── PROJECT_CONTEXT.md        # Living technical memory & AI handover guide
├── apps/
│   ├── frontend/                 # Next.js 15 App Router + React 19 + Tailwind CSS v4
│   └── backend/                  # Node.js + Express.js + Socket.IO v4 Backend API
└── packages/
    └── shared/                   # Shared TypeScript interfaces, types, & Socket.IO event taxonomy
```

### High-Level Architectural Flow Diagram

```mermaid
flowchart TD
    subgraph Clients["Presentation & Audience Clients"]
        P[🎙️ Presenter View / Dashboard]
        A[📱 Audience Participant Client (Guest/Auth)]
    end

    subgraph FrontendApp["apps/frontend (Next.js 15)"]
        UI[React 19 Components + Tailwind CSS + Framer Motion]
        SKC[Socket.IO Client - useSocket hook]
        AUT[Auth Context - lib/auth.ts]
    end

    subgraph SharedPkg["packages/shared"]
        TYPES[TypeScript Types & Shared Interfaces]
        EVENTS[Socket Event Constants - socket.events.ts]
    end

    subgraph BackendApp["apps/backend (Express.js + Socket.IO)"]
        API[REST API Routes]
        SVR[Socket.IO Real-Time Server]
        SEC[Security Middleware: Helmet, JWT, Rate Limiting]
        AIS[AI Service Layer: Groq Provider & Prompt Manager]
        AZS[Azure Blob Storage Integration Service]
        EMS[Resend Email Notification Service]
    end

    subgraph ExternalServices["Cloud Infrastructure & External APIs"]
        MDB[(🍃 MongoDB Atlas)]
        AZB[(☁️ Azure Blob Storage)]
        GROQ[⚡ Groq AI Cloud API]
        RESEND[✉️ Resend Email API]
    end

    P --> UI
    A --> UI
    UI --> SKC <-->|WebSockets| SVR
    UI --> AUT <-->|REST API| API
    FrontendApp -.-> SharedPkg
    BackendApp -.-> SharedPkg
    API --> SEC
    API --> MDB
    API --> AIS --> GROQ
    API --> AZS --> AZB
    API --> EMS --> RESEND
    SVR --> MDB
```

---

## 🛠️ Complete Technology Stack

| Layer                    | Technology                          | Specification Details                                                     |
| ------------------------ | ----------------------------------- | ------------------------------------------------------------------------- |
| **Monorepo Engine**      | `npm` Workspaces                    | Cross-package dependency resolution & build orchestration                 |
| **Frontend Framework**   | Next.js 15 (App Router)             | Server-Side Rendering (SSR), Static Generation (SSG), React 19            |
| **Styling & UI**         | Tailwind CSS v4, Lucide Icons       | Responsive glassmorphic dark mode, accessible icon system                 |
| **Animations**           | Framer Motion                       | Smooth page transitions, modal overlays, slide deck cards                 |
| **Backend Framework**    | Node.js, Express.js                 | REST API endpoints, custom middleware, error handling                     |
| **Real-Time WebSockets** | Socket.IO v4                        | Instant slide sync, live response streaming, audience counting            |
| **Database**             | MongoDB Atlas, Mongoose v8          | Flexible document storage for Users, Presentations, Slides, Notifications |
| **Cloud Asset Storage**  | Azure Blob Storage                  | Presentation PDFs, cover images, uploaded assets, exported reports        |
| **AI Service Provider**  | Groq Cloud SDK (`groq-sdk`)         | Provider-abstracted AI service layer for fast LLM inference               |
| **Transactional Email**  | Resend (`resend`)                   | Account verification, password reset, email notifications                 |
| **DevOps & Hosting**     | Vercel (Frontend), Render (Backend) | Continuous integration from GitHub, global edge delivery                  |

---

## 🗄️ Core Database Models (MongoDB / Mongoose)

1. **`User` Model** (`apps/backend/src/models/User.ts`):
   - `name`: Full Name (String, Required)
   - `email`: Email Address (String, Unique, Lowercase)
   - `password`: Hashed Password (String, Bcrypt)
   - `role`: Role-based Access (`"admin" | "presenter" | "participant"`, Default: `"presenter"`)
   - `avatar`: Profile Picture URL (String, Azure Blob)
   - `refreshToken`: Invalidation Token (String, Hashed)

2. **`Presentation` Model** (`apps/backend/src/models/Presentation.ts`):
   - `title`: Presentation Title (String, Required)
   - `description`: Overview Description (String)
   - `code`: 6-Character Unique Access Code (String, Uppercase, Indexed)
   - `owner`: Presenter ID (Ref: `User`)
   - `slides`: Array of Slide References (Ref: `Slide`)
   - `settings`: `{ theme, allowAnonymous, requireEmail, showResultsImmediately }`
   - `status`: Lifecycle State (`"draft" | "published" | "live" | "completed" | "archived"`)
   - `currentSlideIndex`: Active Slide Index (Number, Default: 0)

3. **`Slide` Model** (`apps/backend/src/models/Slide.ts`):
   - `presentation`: Parent Presentation ID (Ref: `Presentation`)
   - `order`: Sequential Position (Number)
   - `type`: Interactive Slide Type (`"title" | "info" | "multiple-choice" | "open-ended" | "word-cloud" | "rating" | "quiz" | "image-poll" | "leaderboard" | "thank-you"`)
   - `title`: Slide Headline (String)
   - `description`: Subtext / Question Prompt (String)
   - `content`: Mixed Payload (Options, correct answer, media URL, rating scales)
   - `settings`: `{ timeLimit, showResults, autoAdvance }`

4. **`Notification` Model** (`apps/backend/src/models/Notification.ts`):
   - `recipient`: User ID (Ref: `User`)
   - `title`, `message`: Text strings
   - `type`: Categorization (`"info" | "success" | "warning" | "error"`)
   - `read`: Boolean Status (Default: false)
   - `link`: Target Navigation Link (String)

---

## 🔐 Identity & Access Control (IAM)

- **Token Strategy**: Short-lived Access Token (15 min) in memory/authorization header + long-lived Refresh Token (7 days) stored in HTTP-only, secure, SameSite cookies.
- **Roles**:
  - `Administrator`: System metrics, user blocking, content moderation, AI usage monitoring.
  - `Presenter`: Create/manage presentations, host live sessions, view analytics reports, invoke AI tools.
  - `Participant`: Frictionless guest join via 6-digit access code or QR code, answer polls/quizzes, ask Q&A.

---

## 🧭 Complete 20-Module System Scope

1. **Module 1: Project Foundation & Infrastructure** (Monorepo, Node.js, TS, ESLint, Vercel/Render CI/CD).
2. **Module 2: Identity & Access Management** (Auth, JWT, HTTP-only cookies, Resend email recovery, profile management).
3. **Module 3: Public Website & SEO Management** (Landing page, features, dynamic metadata, sitemap, robots.txt).
4. **Module 4: User Dashboard & Workspace** (Presenter portal, active presentations, NotificationCenter, user settings).
5. **Module 5: Presentation Management** (CRUD operations, 6-digit session codes, search/filter, auto-save, cloud storage).
6. **Module 6: Presentation Builder** (Slide authoring, 11 slide types, question configuration, theme customization).
7. **Module 7: Live Presentation & Real-Time Session Management** (Host controls, Socket.IO sync, guest join, presence).
8. **Module 8: Audience Interaction System** (Live polls, quizzes, word clouds, Q&A, emoji reactions, feedback).
9. **Module 9: Analytics & Audience Intelligence** (Participation, performance, engagement metrics, charts, CSV exports).
10. **Module 10: AI Service Layer & AI Assistant** (Groq LLM SDK, prompt manager, AI question & quiz generator, chat).
11. **Module 11: AI Analytics & Intelligent Recommendations** (Sentiment analysis, engagement score, AI recommendations).
12. **Module 12: Report Generation & Export System** (Session reports, PDF export, Azure Blob upload).
13. **Module 13: File Management & Knowledge Base** (PDF/PPTX document upload, Azure Blob integration, AI knowledge base).
14. **Module 14: Notifications & Communication** (In-app notification center, Resend email alerts, browser push notifications).
15. **Module 15: Administration & Organization Management** (Admin dashboard, user management, AI usage monitoring).
16. **Module 16: Security, Logging & Audit System** (Helmet, CORS, rate limiting, audit logs, health checks `/health`).
17. **Module 17: Performance Optimization & Scalability** (Database indexing, debounced auto-save, code splitting).
18. **Module 18: Testing & Quality Assurance** (Unit, API, integration, UI, performance latency testing).
19. **Module 19: Deployment, CI/CD & DevOps** (GitHub Actions, Vercel frontend, Render backend, Atlas MongoDB).
20. **Module 20: Documentation, Maintenance & Future Enhancements** (SRS, SDD, user guides, mobile app roadmap).
