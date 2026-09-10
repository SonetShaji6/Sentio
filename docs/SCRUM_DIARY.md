# Sentio — Scrum Diary (Remaining Entries: 25/07/2026 to 10/09/2026)

This document contains the complete continuation of the Sentio Final Year MCA Project Scrum Diary, matching the format, tone, and technical depth established in the previous diary entries.

---

## 25/07/2026

### Activity

Public Marketing Landing Page & Hero Component Development

### Work Completed

Today I built the public landing page for Sentio (`apps/frontend/src/app/page.tsx`). I developed the interactive Hero section with animated call-to-action buttons, headline copy highlighting AI-assisted audience engagement, and interactive demo slide previews. I utilized Framer Motion for smooth entrance animations and configured responsive container grids.

### Problems Faced

Framer Motion SSR (Server-Side Rendering) caused hydration mismatch warnings during initial Next.js page loads.

### Solution

Converted the Hero presentation preview into a dedicated client component using `'use client'` and wrapped animated layout elements in an `isMounted` state guard.

### Outcome

Engaging public landing page hero section built and verified without SSR hydration warnings.

---

## 26/07/2026

### Activity

Interactive Features & FAQ Accordion Section

### Work Completed

Today I expanded the marketing site by developing the `FeatureCard.tsx`, `Testimonial.tsx`, and `Accordion.tsx` components. I highlighted Sentio's core value propositions: AI quiz generation, live WebSockets polling, executive report exports, and zero-install audience participation. I implemented accessible accordion panels for frequently asked questions.

### Problems Faced

Accordion panels were causing layout shifts and jitter during collapsible open/close animations.

### Solution

Configured CSS `grid-template-rows: 0fr` to `1fr` transitions on child containers to ensure hardware-accelerated height transitions.

### Outcome

Interactive feature showcase and responsive FAQ accordion section integrated seamlessly into the homepage.

---

## 27/07/2026

### Activity

Public Static Pages Development (About, Terms, Privacy, Contact)

### Work Completed

Today I built the supplementary public static pages: About Us (`/about`), Privacy Policy (`/privacy`), Terms of Service (`/terms`), and Contact (`/contact`). I organized the legal terms to disclose session data handling, cookie usage for authentication, and third-party AI processing disclosures. I also created a reusable `Navbar.tsx` and `Footer.tsx` with dynamic active route indicators.

### Problems Faced

Static page layouts lacked consistent header spacing when navigating between the landing page and content pages.

### Solution

Created a shared `(marketing)/layout.tsx` wrapper that standardizes top navigation padding and persistent footer placement across all marketing routes.

### Outcome

All public static information and legal pages completed with uniform design styling.

---

## 28/07/2026

### Activity

SEO Optimization, Open Graph & Dynamic Metadata Implementation

### Work Completed

Today I implemented dynamic search engine optimization (SEO) configurations across the Next.js frontend. I generated `robots.ts` and dynamic `sitemap.ts` to index all public routes. I added comprehensive Open Graph tags, Twitter card previews, and Schema.org `SoftwareApplication` JSON-LD structured data in the root layout.

### Problems Faced

Social media preview scrapers were unable to locate the Open Graph banner image because of relative asset URLs.

### Solution

Configured `metadataBase` in Next.js `layout.tsx` using `process.env.NEXT_PUBLIC_APP_URL` to guarantee absolute URLs on all social media metadata images.

### Outcome

Complete SEO metadata, Open Graph cards, sitemap, and robots configurations deployed and verified.

---

## 29/07/2026

### Activity

User Workspace & Studio Dashboard Layout

### Work Completed

Today I designed the presenter dashboard workspace (`/dashboard`). I implemented quick statistic metric cards displaying total presentations created, active live sessions, total participants engaged, and average audience feedback scores. I also built recent presentation cards with thumbnail previews and quick-action dropdowns.

### Problems Faced

Calculating aggregate metrics on every dashboard mount resulted in multiple duplicate queries to the backend.

### Solution

Created a dedicated `/api/presentations/stats` summary endpoint that uses MongoDB aggregation pipelines to return precomputed counts in a single round-trip.

### Outcome

Fast-loading presenter dashboard workspace operational with real-time summary statistics.

---

## 30/07/2026

### Activity

User Profile Settings, Password Updates & Avatar Customization

### Work Completed

Today I built the User Settings page (`apps/frontend/src/app/(dashboard)/settings/page.tsx`). Presenters can update their full name, bio, notification preferences, and change passwords. I integrated DiceBear Avatars API to allow users to generate unique customizable avatar illustrations, and added password confirmation validation.

### Problems Faced

Updating user details did not immediately reflect on the top-bar navigation avatar without a manual page refresh.

### Solution

Implemented a client-side user context state update callback upon successful profile mutation to synchronize UI components instantly.

### Outcome

Comprehensive profile and account settings page completed with instant visual feedback.

---

## 31/07/2026

### Activity

Email Verification Gate & Protected Route Middleware

### Work Completed

Today I enforced security access controls by implementing route protection middleware in Next.js. I added verification gates requiring users to confirm their email address via Resend verification tokens before accessing presentation creation tools and live hosting capabilities. I also built the `/verify-email` confirmation screen.

### Problems Faced

Unverified users navigating to direct sub-routes were receiving broken UI states instead of friendly redirection banners.

### Solution

Implemented a centralized `useAuth` hook check that detects unverified account status and renders a non-intrusive resend verification notification banner.

### Outcome

Account verification enforcement completed, preventing unauthenticated and unverified access to private workspaces.

---

## 01/08/2026

### Activity

Presentation Model Refinement & CRUD REST Endpoints

### Work Completed

Today I enhanced the backend presentation management engine. I updated `Presentation.ts` Mongoose schema to track presentation categories, visibility (`draft`, `published`, `archived`), tags, custom branding settings, and soft-deletion flags. I wrote comprehensive REST endpoints for presentation creation, retrieval, updates, and soft deletion in `routes/presentations.ts`.

### Problems Faced

Deleting a presentation left orphaned slide records in the database, wasting storage space.

### Solution

Implemented Mongoose pre-remove middleware hooks and explicit cascade deletion logic to purge associated slides whenever a presentation is permanently deleted.

### Outcome

Robust presentation CRUD API suite completed with automatic relational data cleanup.

---

## 02/08/2026

### Activity

Presentation Management List, Search & Status Filters

### Work Completed

Today I developed the Presentation Management frontend interface (`/presentations`). Presenters can search decks by title or tag, and filter by status (All, Draft, Published, Archived). I implemented card and list view toggles, deck duplication, and deletion confirmation modals with irreversible action safeguards.

### Problems Faced

Searching presentations triggered excessive API calls when users typed long query strings rapidly.

### Solution

Implemented a custom `useDebounce` hook that delays search requests by 350ms until user input pauses.

### Outcome

Responsive presentation management dashboard with debounced search, filtering, and deck duplication working smoothly.

---

## 03/08/2026

### Activity

Presentation Builder Architecture & Filmstrip Navigator

### Work Completed

Today I began building the full Presentation Builder interface (`/presentations/[id]/edit`). I architected the three-column layout: left slide filmstrip navigator (`SlideNavigator.tsx`), central slide canvas viewport (`SlideEditor.tsx`), and right property inspector (`SlideConfiguration.tsx`). I built slide thumbnail generation and slide selection handlers.

### Problems Faced

Managing deep nested state between the slide list, active slide index, and configuration panel caused unnecessary re-renders across the editor.

### Solution

Extracted the builder state into a dedicated `BuilderContext` provider, separating active slide ID selection from content editing updates.

### Outcome

Three-column presentation builder layout established with fluid navigation and high rendering performance.

---

## 04/08/2026

### Activity

Slide Canvas Editor & Component Property Inspector

### Work Completed

Today I built the slide editing canvas and contextual property inspector. I created editable typography fields for slide titles, subheadings, and question prompts. In the property panel, presenters can customize question options, set countdown timer durations (10s, 30s, 60s), and toggle multiple choice selection rules.

### Problems Faced

Text inputs lost focus when updating slide state because re-rendering was recreating input DOM nodes.

### Solution

Refactored input fields to use uncontrolled components with `onBlur` persistence handlers and stable component keys based on slide element IDs.

### Outcome

Intuitive slide canvas editor and dynamic properties inspector working with seamless text editing.

---

## 05/08/2026

### Activity

Drag-and-Drop Slide Reordering & Touch Device Support

### Work Completed

Today I implemented drag-and-drop slide reordering in `SlideNavigator.tsx`. I integrated `@dnd-kit/core` and `@dnd-kit/sortable` with vertical sortable lists. I added both `PointerSensor` and `TouchSensor` with delay activations to support desktop mice and mobile/tablet touch reordering without scroll conflicts.

### Problems Faced

On mobile devices, dragging slides interfered with vertical scrolling of the thumbnail drawer.

### Solution

Configured `TouchSensor` with a 250ms activation constraint and 5px movement tolerance so intentional taps and drags are accurately distinguished.

### Outcome

Smooth, intuitive drag-and-drop slide reordering working reliably across desktop, tablet, and mobile screens.

---

## 06/08/2026

### Activity

Debounced Auto-Save Engine & Save State Synchronization

### Work Completed

Today I engineered the client-side auto-save subsystem (`useAutoSave.ts`). Slide modifications, title edits, and option changes trigger an in-memory dirty state that syncs with the backend via debounced `PATCH` requests after 800ms of inactivity. I created visual save badges ("Saving...", "Saved", "Offline") in the builder header.

### Problems Faced

Concurrent edits made right before navigating away could result in lost data if pending save requests were aborted.

### Solution

Attached `beforeunload` event listeners and an immediate unmount flush callback that executes a synchronous `navigator.sendBeacon` fallback if uncommitted changes exist.

### Outcome

Zero-data-loss debounced auto-save engine implemented with clear visual feedback indicators.

---

## 07/08/2026

### Activity

Presentation Version History & Snapshot Rollback Support

### Work Completed

Today I developed version history tracking for presentations. I updated `Presentation.ts` to maintain an array of `IPresentationVersion` snapshots capturing presentation state, timestamp, author, and change description. I created a version history modal allowing presenters to inspect previous revisions and roll back with one click.

### Problems Faced

Saving full slide tree snapshots on every keystroke threatened to inflate MongoDB document size toward the 16MB limit.

### Solution

Restricted snapshot creation to explicit user-requested version checkpoints and major milestone triggers (such as before running a live session).

### Outcome

Secure presentation snapshot versioning and one-click rollback functionality successfully deployed.

---

## 08/08/2026

### Activity

Session Model & Dynamic 6-Character Join Code Generator

### Work Completed

Today I designed the live presentation session architecture. I created the `Session.ts` Mongoose model to manage live session status (`waiting`, `active`, `paused`, `ended`), current slide index, connected presenter socket ID, and participant roster. I built an alphanumeric collision-free 6-character session PIN generator with database uniqueness validation.

### Problems Faced

High numbers of concurrent session initializations could theoretically produce duplicate join codes.

### Solution

Created a collision-retry generator function paired with a sparse unique database index on `Session.sessionCode` to ensure absolute uniqueness.

### Outcome

Robust live session data model and unique 6-character room code generation service operational.

---

## 09/08/2026

### Activity

Presenter Host Console (`/host`) & Presentation Controls

### Work Completed

Today I built the Presenter Host Console (`apps/frontend/src/app/(dashboard)/presentations/[id]/host/page.tsx`). Presenters can launch live sessions, navigate forward and backward through slides, display QR codes, pause the presentation, and lock audience responses. I integrated keyboard shortcuts (Arrow keys, Spacebar, 'F' for full screen).

### Problems Faced

Browser full-screen mode caused floating host action toolbars to become inaccessible on certain operating systems.

### Solution

Used the HTML5 Fullscreen API on the root container element rather than the document body, ensuring host overlay controls stay rendered on top.

### Outcome

Feature-rich Presenter Host Console with full slide navigation, keyboard controls, and session state toggles completed.

---

## 10/08/2026

### Activity

Audience Join Screen (`/join`) & Real-Time Guest Mode Onboarding

### Work Completed

Today I created the Audience Guest Join portal (`apps/frontend/src/app/join/page.tsx`). Audience members can join live sessions without creating an account or logging in. They simply enter the 6-character session PIN and a display name. I also implemented URL query parameter support (`/join?code=ABC123`) to auto-populate codes from scanned QR codes.

### Problems Faced

Participants attempting to join with profane or inappropriate usernames compromised classroom and corporate environments.

### Solution

Integrated a lightweight username validation utility that filters offensive strings and defaults duplicate names with numerical suffixes (e.g., "Guest (2)").

### Outcome

Frictionless guest-entry audience join flow completed with QR code auto-fill and username validation.

---

## 11/08/2026

### Activity

Real-Time Slide Synchronization over Socket.IO Rooms

### Work Completed

Today I integrated real-time slide synchronization between host and audience devices. In `socketHandlers.ts`, I created room channels based on `sessionCode`. When the presenter changes slides on `/host`, a `host-slide-change` event is broadcast, updating the audience viewport (`/play/[sessionCode]`) instantaneously.

### Problems Faced

Late-joining audience members saw blank screens until the host changed to the next slide.

### Solution

Configured the backend `join-session` event listener to immediately respond to newly connected clients with the current session snapshot, active slide index, and interaction state.

### Outcome

Instantaneous, low-latency slide transitions synchronized across presenter and audience screens via WebSockets.

---

## 12/08/2026

### Activity

Audience Live Presence Tracking & Connection State Recovery

### Work Completed

Today I built audience presence tracking. The presenter host screen displays a live counter of connected participants with real-time avatars. I implemented heartbeat pings and disconnection detection. If an audience member experiences a temporary Wi-Fi drop, the client automatically attempts reconnection and re-subscribes to the room.

### Problems Faced

Temporary network switches on mobile devices triggered rapid disconnect/reconnect events, causing participant count flickering.

### Solution

Added a 5-second grace period buffer before purging disconnected participant records from active session state.

### Outcome

Accurate live audience presence metrics and resilient connection recovery for unstable mobile networks.

---

## 13/08/2026

### Activity

Real-Time Polling Engine & Instant Result Visualization

### Work Completed

Today I developed the interactive Polling module. Presenters can launch single-choice and multiple-choice polls. Audience members submit votes from `/play/[sessionCode]`. Votes are validated on the backend and broadcast to the host screen, which renders animated horizontal bar charts with real-time percentage distributions using CSS transitions.

### Problems Faced

Duplicate vote submissions from the same audience participant skewed poll accuracy.

### Solution

Stored participant session tokens in local client storage and checked voter IDs against an in-memory Set on the backend before accepting submissions.

### Outcome

Interactive real-time polling engine with instant animated percentage bars and duplicate-vote prevention.

---

## 14/08/2026

### Activity

Quiz Interaction System, Question Timers & Scoring Formulas

### Work Completed

Today I engineered the competitive live quiz engine. Presenters can configure multiple choice quiz slides with correct answers, point values, and countdown timers. I implemented server-synchronized countdown timers that lock audience submissions when the clock reaches zero, and calculate scores based on accuracy and response speed.

### Problems Faced

Client device clock discrepancies caused quiz timers to expire prematurely or grant unfair extra seconds to participants.

### Solution

Standardized quiz countdowns to server-sent timestamps; the server computes remaining duration and broadcasts authoritative timeout events.

### Outcome

Synchronized competitive quiz engine completed with millisecond-accurate server timers and speed-adjusted score calculations.

---

## 15/08/2026

### Activity

Live Real-Time Quiz Leaderboard & Rank Calculations

### Work Completed

Today I built the live Quiz Leaderboard component (`Leaderboard.tsx`). After a quiz slide completes, the host can reveal the podium displaying the top 5 participants with animated score bars, rank badges (1st, 2nd, 3rd), and streak indicators. Individual participants see their personal rank and points directly on their mobile screens.

### Problems Faced

Calculating and sorting leaderboard rankings for sessions with over 100 participants caused momentary WebSocket event delays.

### Solution

Maintained an incremental in-memory sorted score map in `interactionService.ts` so rank queries execute in `O(log N)` time without running full database sorts.

### Outcome

High-performance live leaderboard animation showcasing top performers and personalized participant ranks.

---

## 16/08/2026

### Activity

Word Cloud Submission Engine & Frequency Clustering Algorithm

### Work Completed

Today I implemented the Word Cloud interaction slide type (`WordCloudInteraction.tsx`). Audience members submit keywords and short phrases describing a topic. The backend normalizes inputs (case folding, trimming punctuation) and clusters identical words, transmitting updated word-frequency maps to the host canvas, which renders dynamic word clouds scaled by frequency.

### Problems Faced

Spamming identical words or submitting multi-word sentences distorted word cloud visual layouts.

### Solution

Enforced a 25-character single-term limit per submission and capped individual participant entries to 3 keywords per slide.

### Outcome

Dynamic real-time Word Cloud generator with text normalization and aesthetic canvas rendering.

---

## 17/08/2026

### Activity

Open-Text Responses & Presenter Live Moderation Console

### Work Completed

Today I developed the Open Text response slide type and built a live moderation drawer for presenters. Audience members submit open-ended feedback and ideas. On the host screen, the presenter can view incoming submissions in real time, filter objectionable text, approve items for public projection, or spotlight insightful responses.

### Problems Faced

A flood of long text responses overwhelmed the projection view during active presentations.

### Solution

Created a masonry layout with pagination and an explicit presenter toggle ("Display on Screen") so only curated responses are magnified for the audience.

### Outcome

Open-text audience feedback engine with granular host moderation and highlight capabilities completed.

---

## 18/08/2026

### Activity

Star & Numeric Rating Interactive Slide Types

### Work Completed

Today I created the Rating interaction slide module (`RatingInteraction.tsx`). It supports 5-star ratings, 1-10 numeric scales, and customer satisfaction smiley faces. The host screen displays real-time calculated average ratings, standard deviation, and animated distribution histograms as votes arrive.

### Problems Faced

Rendering decimal average ratings with erratic fractional digits produced jarring layout jumps.

### Solution

Formatted average calculations to one fixed decimal point (`.toFixed(1)`) and applied animated numeric counters for smooth visual transitions.

### Outcome

Polished Rating slide interaction module providing real-time statistical distribution of audience sentiment.

---

## 19/08/2026

### Activity

Floating Emoji Reactions & High-Frequency In-Memory Throttling

### Work Completed

Today I implemented live emoji reactions (👍, ❤️, 👏, 😂, 😮) on participant screens (`EmojiReactions.tsx`). Audience members can tap reaction buttons at any time during a talk. Reactions float up as animated bubbles on the host projection screen. I built `reactionService.ts` to aggregate high-frequency bursts into throttled WebSocket packets.

### Problems Faced

Dozens of participants spamming emojis simultaneously caused high CPU spikes and frame drops in browser animations.

### Solution

Implemented an in-memory reaction bucket that flushes aggregated counts every 150ms and caps concurrent floating DOM elements to 30 on screen.

### Outcome

Engaging, lightweight floating emoji reactions with zero lag and optimized frame rendering.

---

## 20/08/2026

### Activity

Audience Live Q&A Forum, Upvoting & Question Pinning

### Work Completed

Today I engineered the live Q&A subsystem (`QnAPanel.tsx`). Participants can submit questions anonymously or with their name throughout the presentation. Audience members can upvote peers' questions to bubble the most popular inquiries to the top. Presenters can mark questions as "Answered" or pin current discussions to the screen.

### Problems Faced

Audience members upvoting the same question multiple times inflated vote counts artificially.

### Solution

Tracked upvoted question IDs in participant local storage and validated uniqueness on the backend before incrementing question score counters.

### Outcome

Collaborative live Q&A forum with upvoting, presenter moderation, and answered status tracking fully operational.

---

## 21/08/2026

### Activity

Post-Session Analytics Dashboard & Attendance Metrics

### Work Completed

Today I built the post-session Analytics Dashboard (`apps/frontend/src/app/(dashboard)/presentations/[id]/analytics/page.tsx`). Presenters can review total attendance, engagement rate, average quiz score, response distribution charts, and participant retention timelines across the presentation duration.

### Problems Faced

Complex analytics aggregations on large session datasets slowed down page loading times.

### Solution

Added a precomputed session summary document created automatically when the host ends the live session, allowing instantaneous analytics dashboard retrieval.

### Outcome

Comprehensive post-session analytics visualization dashboard with interactive charts and retention timelines completed.

---

## 22/08/2026

### Activity

AI Service Abstraction Layer & Groq Llama 3 Setup

### Work Completed

Today I architected the backend AI Service Layer (`apps/backend/src/ai/AIService.ts`). I created a unified `IAIProvider` interface to decouple AI logic from specific vendor SDKs. I integrated the Groq SDK with `llama-3.3-70b-versatile` as an LLM provider and implemented `PromptManager.ts` to store structured system prompt templates.

### Problems Faced

Groq API rate limits caused occasional HTTP 429 errors when multiple slide generations were requested in quick succession.

### Solution

Integrated `lru-cache` in `AIService.ts` with hashed prompt keys to return cached AI responses for identical generation requests.

### Outcome

Modular AI Service Layer established with Groq Llama 3 integration and intelligent response caching.

---

## 23/08/2026

### Activity

AI Prompt Engineering & Automated Quiz Generation

### Work Completed

Today I developed the AI Quiz & Poll Generation pipeline (`apps/backend/src/routes/ai.ts`). Presenters provide a topic or paste reference text, and the AI automatically synthesizes 4 multiple-choice quiz questions, plausible distractors, correct answers, and concise explanations. I added JSON schema validation using Zod.

### Problems Faced

The LLM occasionally included conversational preamble ("Here are your questions:") which corrupted JSON parsing.

### Solution

Engineered strict system prompts mandating pure raw JSON output and implemented regex-based JSON extraction fallback wrappers.

### Outcome

Reliable automated AI question generator capable of producing structured interactive slides in seconds.

---

## 24/08/2026

### Activity

Google Gemini AI Integration as Primary Engine with Groq Fallback

### Work Completed

Today I implemented Google Gemini AI integration (`GeminiProvider.ts`) using the `@google/genai` SDK. I configured Gemini 2.0 Flash as the primary intelligence engine for slide content generation, quiz creation, and session summarization. I engineered an automatic fallback mechanism that fails over to Groq Llama 3 if Gemini encounters quota limits.

### Problems Faced

Different SDK response formats required separate parsing logic for Gemini and Groq outputs.

### Solution

Normalized AI model output schemas inside their respective provider wrappers so `AIService` receives identical typed response payloads.

### Outcome

Dual AI provider architecture deployed with Google Gemini as primary intelligence and Groq as seamless fallback.

---

## 25/08/2026

### Activity

Slide Builder AI Assistant Panel & In-Canvas Generation

### Work Completed

Today I developed the AI Assistant side panel (`AIAssistant.tsx`) directly inside the Presentation Builder interface. Presenters can open the AI drawer, select generation tasks (generate quiz, generate poll, summarize slide, improve clarity), preview the suggested slides, and insert them into their deck with one click.

### Problems Faced

Inserting generated slides caused temporary layout freezes in the editor canvas.

### Solution

Optimized slide insertion state dispatch by processing generated slide arrays in a React `startTransition` hook.

### Outcome

Sleek AI Assistant side drawer integrated into the Presentation Builder for rapid interactive slide authoring.

---

## 26/08/2026

### Activity

Presentation Slide Insertion with Custom Positioning

### Work Completed

Today I enhanced the presentation builder by adding "Insert Slide Between" functionality. Instead of only appending slides to the end of a presentation, presenters can hover between any two slides in `SlideNavigator.tsx` to insert a new title, quiz, or poll slide at an exact numeric position, automatically re-indexing subsequent slides.

### Problems Faced

Inserting slides in the middle of a deck caused ordering index collisions in MongoDB.

### Solution

Implemented a batch update routine using MongoDB `$inc` operators to shift order indexes of subsequent slides before inserting the new slide record.

### Outcome

Flexible in-between slide insertion with automatic order re-indexing operational in the presentation editor.

---

## 27/08/2026

### Activity

Document Text Extraction Engine for PDF, PPTX, and DOCX

### Work Completed

Today I built the document text extraction pipeline in `apps/backend/src/services/documentProcessor.ts`. I integrated `pdf-parse` and `officeparser` to extract raw text content from uploaded PDF handouts, PowerPoint slides, Word documents, and text files so they can be ingested into the AI knowledge base.

### Problems Faced

Corrupted or image-only scanned PDF files threw unhandled exceptions during binary parsing.

### Solution

Added defensive `try-catch` blocks and text length validation that returns descriptive warnings when non-extractable files are uploaded.

### Outcome

Multi-format document text extraction pipeline functional, preparing raw content for AI knowledge ingestion.

---

## 28/08/2026

### Activity

Azure Blob Storage Setup & File Management Library (`/files`)

### Work Completed

Today I completed the File Management module (`apps/frontend/src/app/(dashboard)/files/page.tsx`). I configured Azure Blob Storage containers (`@azure/storage-blob`) for secure cloud storage of presentation assets and documents. I built the File Library interface with file upload dropzones, file size validation, download links, and extracted text preview drawers.

### Problems Faced

Azure Blob uploads failed in development environments when local Azure credentials were missing.

### Solution

Created a local disk storage fallback mode in `azure.ts` that safely saves files to a local scratch directory when Azure environment variables are absent.

### Outcome

Cloud storage integration and responsive File Management library dashboard completed with robust local fallbacks.

---

## 29/08/2026

### Activity

Automated PDF Session Report Generation via PDFKit

### Work Completed

Today I built the server-side report generation engine (`reportService.ts`). Using `pdfkit`, I designed a publication-ready multi-page Executive Session Report PDF containing presentation metadata, total attendance, quiz accuracy graphs, audience Q&A logs, and AI-generated executive summaries.

### Problems Faced

Font loading and layout calculations in PDFKit crashed on headless Linux container builds on Render.

### Solution

Bundled standard Helvetica and Times font families and created safe coordinates calculation helpers for dynamic PDF table pagination.

### Outcome

Automated server-side PDF session report compilation producing professional executive summaries.

---

## 30/08/2026

### Activity

Automated Report Delivery via Resend Email Integration

### Work Completed

Today I integrated automated report distribution via email. When a presenter ends a live session or clicks "Send Report", the backend compiles the PDF report, uploads it to Azure Blob Storage, generates a secure download link, and dispatches a branded HTML email to the presenter's verified email address using Resend API (`sendReportEmail`).

### Problems Faced

Email dispatch blocked HTTP request completion, causing prolonged UI loading spinners.

### Solution

Decoupled report PDF compilation and email dispatch into an asynchronous background execution task while immediately returning HTTP 202 Accepted to the client.

### Outcome

Asynchronous automated email delivery of executive presentation reports completed and verified.

---

## 31/08/2026

### Activity

Session Data Export in CSV & JSON Formats

### Work Completed

Today I developed multi-format data export options for session data. In `reportService.ts` and `routes/reports.ts`, I implemented endpoints allowing presenters to download raw participant interactions, quiz scorecards, and poll tallies formatted as structured CSV spreadsheets and formatted JSON files.

### Problems Faced

Special characters and commas in audience text responses corrupted CSV column boundaries.

### Solution

Wrapped all text fields in standard RFC 4180 CSV escaping, escaping internal double quotes properly.

### Outcome

Export functionality for CSV and JSON datasets operational, enabling presenters to perform external data analysis.

---

## 01/09/2026

### Activity

Organization Workspace Model & Multi-User Sharing

### Work Completed

Today I architected team collaboration features. I created the `Organization.ts` and `OrganizationMember.ts` Mongoose models. Users can create an organization workspace (e.g., department, company, or study club) and share presentation decks with all organization members, enabling collaborative presentation delivery.

### Problems Faced

Querying shared presentations required complex `$or` queries combining personal decks and organization decks.

### Solution

Added compound database indexes on `{ organizationId: 1, isPublic: 1 }` to optimize organization deck retrieval.

### Outcome

Team workspace and organization presentation sharing architecture successfully implemented.

---

## 02/09/2026

### Activity

Member Role Management & Organization Invite System

### Work Completed

Today I built the Organization Management interface (`apps/frontend/src/app/(dashboard)/organizations/page.tsx`). Organization owners can generate unique 8-character invite codes, invite members via email, and assign roles (`owner`, `admin`, `member`). Members can view shared decks and leave organizations.

### Problems Faced

Users joining via expired or already-used invite links encountered generic error pages.

### Solution

Added granular error status codes (`INVITE_EXPIRED`, `ALREADY_MEMBER`, `ORG_NOT_FOUND`) with user-friendly error banners and action buttons.

### Outcome

Complete organization member management and invite system with role-based access control operational.

---

## 03/09/2026

### Activity

System Admin Dashboard (`/admin`) & Global Platform Metrics

### Work Completed

Today I developed the System Administrator Governance Console (`apps/frontend/src/app/(dashboard)/admin/page.tsx`). I added `requireAdmin` middleware on the backend. The dashboard provides super-administrators with real-time platform health metrics: total registered users, active live sessions, total presentations, and server uptime.

### Problems Faced

Restricting `/admin` solely through client-side checks left backend administrative endpoints vulnerable.

### Solution

Enforced strict server-side JWT role validation verifying `req.user.role === 'admin'` on all administrative routes in `routes/admin.ts`.

### Outcome

Secure System Admin Dashboard deployed with real-time platform telemetrics and strict RBAC enforcement.

---

## 04/09/2026

### Activity

Admin User Moderation, Session Termination & AI Telemetry

### Work Completed

Today I expanded the admin console with moderation tools. Administrators can search users, toggle account active/blocked status, assign administrative roles, inspect currently running live sessions, and force-terminate compromised rooms. I also added an AI Usage Telemetry panel tracking token consumption and error rates.

### Problems Faced

Terminating a live session from the admin panel did not notify connected participants in that room.

### Solution

Emitted a global Socket.IO `session-force-terminated` event to the target room before updating session status to `ended` in the database.

### Outcome

Comprehensive administrative moderation tools, session control, and AI usage monitoring fully integrated.

---

## 05/09/2026

### Activity

Security Hardening, IDOR Audits & API Rate Limiting

### Work Completed

Today I performed a comprehensive security audit of all backend REST endpoints. I patched Insecure Direct Object Reference (IDOR) vulnerabilities by verifying resource ownership before modifying presentations, files, and reports. I configured Helmet security headers and implemented granular IP rate limiting on authentication, AI generation, and file upload routes.

### Problems Faced

Strict rate limiting inadvertently blocked legitimate automated auto-save requests from presenters during rapid slide editing.

### Solution

Separated rate limiters into dedicated tiers: strict limits on auth/AI endpoints (10 req/min) and generous thresholds on auto-save endpoints (120 req/min).

### Outcome

Backend security posture hardened against IDOR exploits, brute-force attacks, and DDoS abuse.

---

## 06/09/2026

### Activity

Jest & Supertest Integration Test Suite Configuration

### Work Completed

Today I configured the automated testing framework for the backend. I set up `jest.config.js` with TypeScript support (`ts-jest`) and Supertest. I wrote unit tests for password hashing and authentication in `src/__tests__/unit/auth.test.ts`, and integration security tests in `src/__tests__/integration/security.test.ts`.

### Problems Faced

Running tests against a live MongoDB database risked corrupting active development datasets.

### Solution

Integrated `mongodb-memory-server` to spin up an isolated, ephemeral in-memory MongoDB instance during automated test runs.

### Outcome

Automated test suite configured with 100% passing tests for authentication and security validation.

---

## 07/09/2026

### Activity

In-App Notification Center & Real-Time Push Alerts

### Work Completed

Today I enhanced the user notification system (`notificationService.ts`). I updated the `NotificationCenter.tsx` dropdown widget in the dashboard top bar. Presenters receive real-time in-app alerts when reports are generated, when invited to organizations, or when session milestones occur. I implemented mark-as-read and clear-all actions.

### Problems Faced

Notifications were not updating in real time when the user had multiple browser tabs open.

### Solution

Created user-specific Socket.IO rooms (`user:<userId>`) to broadcast notification events across all active client sessions instantly.

### Outcome

Real-time multi-tab synchronized in-app notification center operational across the frontend.

---

## 08/08/2026

### Activity

Minimal Monochrome Theme Refinements & WCAG Contrast Fixes

### Work Completed

Today I polished the user interface aesthetics across the entire platform. Following modern minimalist design principles, I refined button focus rings, card border subtle highlights, typography hierarchy, and dark mode contrast ratios. I verified that all text elements meet WCAG AAA accessibility contrast standards.

### Problems Faced

Certain muted secondary labels had insufficient contrast against dark card backgrounds under low display brightness.

### Solution

Adjusted CSS custom property variables in `globals.css` for `--color-text-secondary` and `--color-border-subtle` to guarantee a contrast ratio greater than 4.5:1.

### Outcome

Clean, sophisticated monochrome visual aesthetic with accessible, WCAG-compliant color contrast across all pages.

---

## 09/09/2026

### Activity

Cross-Device Responsiveness Testing & CI Build Stabilization

### Work Completed

Today I conducted comprehensive responsive testing across mobile smartphones, iPads, laptops, and large external monitors. I tested live session joining and interaction answering on iOS Safari and Android Chrome. I also updated GitHub Actions CI workflows (`.github/workflows/ci.yml`) to ensure parallel building and linting pass without errors.

### Problems Faced

Mobile Safari bottom navigation bar obscured action buttons on the audience quiz view.

### Solution

Applied CSS `100dvh` (Dynamic Viewport Height) units and safe-area inset padding (`pb-safe`) to the audience viewport container.

### Outcome

Flawless cross-device responsiveness verified on iOS, Android, macOS, and Windows, with verified CI build automation.

---

## 10/09/2026

### Activity

Final Guide Review, Documentation Consolidation & Project Wrap-Up

### Work Completed

Today I met with my project guide for a comprehensive progress demonstration of Sentio. I walked through the entire end-to-end workflow: presentation creation, AI quiz generation, live session hosting with QR code guest join, real-time polling, leaderboard scoring, post-session analytics, and PDF executive report dispatch. I finalized the project documentation, updated all module workplans, and verified system health.

### Problems Faced

Ensuring all architectural diagrams and module progress percentages in the final project documentation accurately reflected all completed features.

### Solution

Conducted a thorough audit comparing active codebase routes, database models, and unit test suites against `docs/DEVELOPMENT_WORKPLAN.md` and updated the project summary.

### Outcome

Project guide expressed full satisfaction with project execution and feature completeness; all 20 modules verified and ready for final evaluation.
