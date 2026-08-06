# 🧠 Sentio — Project Context & AI Handover Memory

> **ATTENTION AI AGENTS & DEVELOPERS**: Read this document first! It provides the complete technical memory, 20-module specification status, architectural patterns, schema summaries, and immediate next steps for Sentio.

---

## 📌 Current Implementation State

| Parameter               | Current Value                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| **Specification Basis** | Sentio Official 20-Module System Specification                                                    |
| **Current Git Branch**  | `feature/presentation`                                                                            |
| **Active Workspace**    | `/Users/sonet/Projects/Sentio`                                                                    |
| **Current Modules**     | **Module 6: Presentation Builder** (80%) → Transitioning to **Module 7: Live Session Management** |
| **Overall Progress**    | **41%**                                                                                           |
| **Last Updated**        | 2026-08-06                                                                                        |

---

## 🚦 20-Module Status Checklist

- [x] **Module 1**: Project Foundation & Infrastructure (100%)
- [x] **Module 2**: Identity & Access Management (100%)
- [x] **Module 3**: Public Website & SEO Management (100%)
- [x] **Module 4**: User Dashboard & Workspace (95%)
- [🔄] **Module 5**: Presentation Management (85%)
- [🔄] **Module 6**: Presentation Builder (80%)
- [ ] **Module 7**: Live Presentation & Real-Time Session Management (0%)
- [ ] **Module 8**: Audience Interaction System (0%)
- [ ] **Module 9**: Analytics & Audience Intelligence (0%)
- [ ] **Module 10**: AI Service Layer & AI Assistant (0%)
- [ ] **Module 11**: AI Analytics & Intelligent Recommendations (0%)
- [ ] **Module 12**: Report Generation & Export System (0%)
- [🔄] **Module 13**: File Management & Knowledge Base (40%)
- [🔄] **Module 14**: Notifications & Communication (70%)
- [ ] **Module 15**: Administration & Organization Management (0%)
- [🔄] **Module 16**: Security, Logging & Audit System (60%)
- [🔄] **Module 17**: Performance Optimization & Scalability (50%)
- [ ] **Module 18**: Testing & Quality Assurance (0%)
- [🔄] **Module 19**: Deployment, CI/CD & DevOps (60%)
- [🔄] **Module 20**: Documentation & Maintenance (75%)

---

## 🏛️ Architecture & Coding Patterns

### Workspace Structure & Paths

- **Frontend App**: Next.js 15 App Router located at `apps/frontend`. Paths use `@/` alias mapped to `apps/frontend/src/*`.
- **Backend API**: Node.js + Express.js + Socket.IO server located at `apps/backend`. Server entry point at `apps/backend/src/server.ts`.
- **Shared Package**: `@sentio/shared` located at `packages/shared`. Contains shared models, types, and socket event constants (`import { SOCKET_EVENTS } from "@sentio/shared"`).

### Real-Time WebSockets Engine

- Socket.IO server bound to the HTTP server instance in `apps/backend/src/server.ts`.
- Frontend custom hook `useSocket` (`apps/frontend/src/hooks/useSocket.ts`) manages socket connection lifecycle, room joining (`ROOM_JOIN`), slide changes (`SLIDE_CHANGE`), and response submissions (`SUBMIT_RESPONSE`).

### Database Models (MongoDB / Mongoose)

1. **User**: Name, email, password hash, role (`admin | presenter | participant`), avatar URL, refresh token.
2. **Presentation**: Title, description, 6-character access code, owner ID, slides array, settings, status (`draft | published | live | completed | archived`).
3. **Slide**: Presentation ID, order, type (`title | info | multiple-choice | open-ended | word-cloud | rating | quiz | image-poll | leaderboard | thank-you`), title, description, content payload, settings.
4. **Notification**: Recipient ID, title, message, type (`info | success | warning | error`), read status, navigation link.

---

## 🎨 Design System & UI Tokens

- **Palette**: Sleek obsidian dark mode background (`bg-zinc-950` / `bg-slate-900`), vibrant indigo & violet accents (`from-indigo-600 to-purple-600`, `bg-indigo-600`).
- **Cards & Modals**: Glassmorphism (`backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl`).
- **Icons**: Lucide React (`lucide-react`).
- **Animations**: Framer Motion (`framer-motion`) for page transitions, tab switches, and modal reveals.

---

## 🧩 Key Reusable Components & Hooks

- **`Logo.tsx`** (`apps/frontend/src/components/Logo.tsx`): Primary brand logo component.
- **`NotificationCenter.tsx`** (`apps/frontend/src/components/NotificationCenter.tsx`): Topbar notification dropdown widget.
- **`useAutoSave.ts`** (`apps/frontend/src/hooks/useAutoSave.ts`): Client-side debounced auto-save hook.
- **`useSocket.ts`** (`apps/frontend/src/hooks/useSocket.ts`): Socket.IO client initialization and event listener subscription hook.
- **Presentation Builder Components** (`apps/frontend/src/components/builder/`):
  - `SlideNavigator.tsx`: Left sidebar thumbnail strip & slide creator.
  - `SlideEditor.tsx`: Main canvas slide content editor.
  - `SlideConfiguration.tsx`: Right inspector sidebar for slide questions and timers.
  - `ThemeSettings.tsx`: Color palette and background visual theme picker.
  - `AddSlideModal.tsx`: Slide type picker modal dialog.

---

## 🚫 Common Mistakes to Avoid & Strict Rules

1. **NEVER edit `@sentio/shared` without rebuilding**:
   - Run `npm run build -w packages/shared` if types are updated, or keep `npm run dev` running.
2. **NEVER import socket events from node_modules relative paths**:
   - Always import directly from `@sentio/shared`.
3. **NEVER hardcode API endpoints**:
   - Use `process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"`.
4. **ALWAYS use debounced inputs for auto-saving**:
   - Do not trigger HTTP PUT requests on every single keystroke. Use `useAutoSave`.
5. **ALWAYS keep documentation synchronized**:
   - Any completed task must update `docs/DEVELOPMENT_WORKPLAN.md`, `docs/DEVELOPMENT_LOG.md`, `docs/PROJECT_CONTEXT.md`, and `docs/PROJECT_OVERVIEW.md`.

---

## 💸 Technical Debt & Known Refactors

1. **Slide Drag-and-Drop Reordering**: Currently, slides reorder via index shifts. Needs HTML5 drag handles or `@hello-pangea/dnd` in `SlideNavigator.tsx`.
2. **Azure Blob Storage Graceful Fallback**: Handle missing environment connection strings gracefully in local offline mode.
3. **Resend Email Templates**: Expand plain text fallback to full HTML responsive email layouts.

---

## 🎯 Immediate Next Steps

1. **Step 1**: Implement drag-and-drop handles for slide reordering in `SlideNavigator.tsx` (Module 6 polish).
2. **Step 2**: Create Host Presenter Control View (`apps/frontend/src/app/(dashboard)/presentations/[id]/host/page.tsx`) for Module 7.
3. **Step 3**: Wire Socket.IO `SLIDE_CHANGE` and `SESSION_START` event broadcasting between host and backend.
4. **Step 4**: Build Participant Join View (`apps/frontend/src/app/join/[code]/page.tsx`) for Module 8.
