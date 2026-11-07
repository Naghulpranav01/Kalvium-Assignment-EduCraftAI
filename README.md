# EduCraft AI · Curriculum Architecture & Dual QC Validation Studio done by Naghul Pranav K R

> **An enterprise-grade, pedagogical AI platform that architects, audits, and delivers 45-minute technical masterclasses with multi-source academic research, dual-layer Quality Control validation, 3D WebGL knowledge visualization, and browser-native audio narration. Engineered & Designed by Naghul Pranav K R.**

---

## 📑 Table of Contents
1. [Executive Overview](#-executive-overview)
2. [Key Capabilities & Industry Features](#-key-capabilities--industry-features)
3. [System Architecture](#-system-architecture)
4. [Dual-Layer Quality Control (QC) Engine](#-dual-layer-quality-control-qc-engine)
5. [The 45-Minute Lesson Framework](#-the-45-minute-lesson-framework)
6. [Interactive Subsystems](#-interactive-subsystems)
   - [Web Speech API Audio Narration](#web-speech-api-audio-narration)
   - [Three.js 3D Knowledge Core](#threejs-3d-knowledge-core)
   - [Dynamic AI Mastery Quiz Generator](#dynamic-ai-mastery-quiz-generator)
   - [jsPDF Professional Export Engine](#jspdf-professional-export-engine)
7. [Design System & Low-Fatigue Palette](#-design-system--low-fatigue-palette)
8. [Security & Key Management Architecture](#-security--key-management-architecture)
9. [Technology Stack](#-technology-stack)
10. [API Reference](#-api-reference)
11. [Getting Started & Local Setup](#-getting-started--local-setup)
12. [Production Deployment](#-production-deployment)

---

## 🎯 Executive Overview

EduCraft AI solves a critical bottleneck in higher education and corporate engineering onboarding: **the gap between raw technical documentation and pedagogically sound, time-budgeted instruction.**

Given only a **Lesson Title** and **Learning Objective**, EduCraft AI:
1. Conducts cross-domain research spanning canonical academic textbooks (O'Reilly, Addison-Wesley, MIT Press), authoritative standards (IETF RFCs, MDN Web Docs), and curated video lectures (YouTube).
2. Synthesizes a structured 45-minute curriculum strictly partitioned into 5 pedagogical phases with instructor speaker notes and interactive challenges.
3. Automatically runs the output through **two independent Quality Control (QC) auditor layers**:
   - **QC Layer 1**: Rigorous scientific and factual accuracy audit with source verification.
   - **QC Layer 2**: Instructional quality, cognitive scaffolding, and 45-minute pacing feasibility audit.
4. Delivers the curriculum in dual modes: **Instructor-Led Teaching** and **Student Self-Learning**, complemented by 3D conceptual modeling and instant audio narration.

---

## 🌟 Key Capabilities & Industry Features

- **Strict 45-Minute Pacing Budget**: Every lesson is architected around an exact 45:00 timeframe divided into 5 phases (Hook, Core Mechanics, Taxonomy/Edge Cases, Hands-on Lab, and Formative Synthesis).
- **Dual Independent QC Layers**: Emulates a university academic review board with itemized critiques, severity flags (HIGH/MEDIUM/LOW), and 1-click automatic diff application.
- **Canonical Research Citations**: Direct clickable links to Open Library archives, publisher editions, official RFCs, and timestamp-indexed YouTube clips.
- **Embedded Multimedia Playback**: Allows students to view recommended YouTube video segments directly inside the lesson without tab-switching.
- **Web Speech API Audio Narration**: Built-in 'Read Aloud' player with speed multipliers (1x, 1.25x, 1.5x), animated audio waveform visualizer, pause/resume, and Markdown normalization.
- **Interactive Three.js 3D Engine**: WebGL visualization of the lesson's conceptual nucleus, procedural gyroscope rings, orbiting phase nodes, and dual QC verification halos.
- **Dynamic AI Lesson Mastery Quiz**: Psychometrically calibrated 5-question formative diagnostic testing edge cases and comprehension with instant feedback.
- **Enterprise PDF Export (jsPDF)**: Multi-page, studio-branded vector PDF generation including schedules, markdown text, quizzes, citations, and QC certificates.
- **Voice Dictation & Video Analysis**: Spoken lesson drafting via audio transcription (`gemini-3.5-transcribe`) and multimodal video analysis (`gemini-4-argon`).

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        USER / INSTRUCTOR CLIENT                        │
│   (React 19 SPA · Tailwind CSS v4 · Focused Low-Fatigue Palette)       │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ HTTP (Proxy Routes)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     EXPRESS SERVER-SIDE GATEWAY                        │
│                 (server.ts · Port 3000 · Protected Keys)               │
└──────────────────┬─────────────────┬─────────────────┬─────────────────┘
                   │                 │                 │
                   ▼                 ▼                 ▼
         ┌──────────────────┐┌───────────────┐┌──────────────────┐
         │ /api/lesson/*    ││ /api/qc/*     ││ /api/quiz/*      │
         │ - Synthesizer    ││ - QC Layer 1  ││ - Dynamic MCQ    │
         │ - Apply Fixes    ││ - QC Layer 2  ││ - Explanations   │
         └─────────┬────────┘└───────┬───────┘└────────┬─────────┘
                   │                 │                 │
                   └─────────────────┼─────────────────┘
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    GEMINI INTELLIGENCE RESILIENCE LAYER                │
│            (GoogleGenAI SDK · ThinkingLevel.HIGH · Auto-Fallback)      │
├────────────────────────────────────────────────────────────────────────┤
│  Primary: gemini-4-argon (Deep Research & Complex Instructional Logic) │
│  Fallback: gemini-3.8-flash (High-Throughput Reasoning with Thinking)  │
│  Liveness: gemini-3.1-flash-lite (Spike & 503 Resiliency Engine)       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Dual-Layer Quality Control (QC) Engine

A hallmark of EduCraft AI is its **two-stage independent validation pipeline**, ensuring instructional materials meet publication standards before entering a classroom.

### QC Layer 1: Research & Factual Accuracy
- **Auditor Persona**: Lead Scientific Fact-Checker & Technical Standards Auditor.
- **Evaluation Criteria**:
  - Verification of technical claims against modern specifications (e.g., RFC 9110 vs legacy RFC 2616).
  - Detection of oversimplifications or misleading edge cases (e.g., URI character boundaries, idempotency nuances).
  - Citation authenticity check across books, journals, and RFC documents.
- **Automated Remediation**: Generates precise `autoFixPayload` objects containing `sectionId`, `findText`, and `replacementText` for surgical 1-click updates.

### QC Layer 2: Instructional Quality & Objective Alignment
- **Auditor Persona**: Director of Instructional Design & Pedagogy.
- **Evaluation Criteria**:
  - **Objective Alignment %**: Verifies that every clause of the stated Learning Objective is explicitly taught and assessed.
  - **Cognitive Scaffolding**: Inspects progressive difficulty from mental hooks to code labs.
  - **45-Minute Timing Feasibility**: Rates pacing as `EXCELLENT`, `TIGHT`, `OVERLOADED`, or `TOO_BRIEF`.
- **Automated Remediation**: Generates structured suggestions and supplementary paragraphs that can be injected individually or batch-applied across the entire lesson plan.

---

## ⏱️ The 45-Minute Lesson Framework

Every synthesized curriculum adheres strictly to a 45-minute modular structure:

| Phase | Time Window | Duration | Pedagogical Objective |
| :--- | :--- | :--- | :--- |
| **Phase 1** | `00:00 - 05:00` | 5 Min | **Hook & Mental Models**: Real-world analogy, motivation, and system architecture. |
| **Phase 2** | `05:00 - 18:00` | 13 Min | **Core Theoretical Mechanics**: Formal specifications, rules, and contrast tables. |
| **Phase 3** | `18:00 - 28:00` | 10 Min | **Taxonomy & Diagnostic Flowcharts**: Categorization, classifications, and troubleshooting. |
| **Phase 4** | `28:00 - 38:00` | 10 Min | **Hands-on Workshop**: CLI experiments, code walkthroughs, and debugging labs. |
| **Phase 5** | `38:00 - 45:00` | 7 Min | **Formative Knowledge Check**: 5-question mastery assessment, RFC review, and synthesis. |

---

## 💻 Interactive Subsystems

### Web Speech API Audio Narration
- Provides an auditory learning channel for learners and self-paced students.
- Implements `window.speechSynthesis` with speech rate multipliers (`1.0x`, `1.25x`, `1.5x`).
- Strips markdown syntax (code blocks, headers, asterisks, blockquotes) into flowing conversational speech.
- Includes animated waveform equalizer feedback and automatic state cleanup on page transitions.

### Three.js 3D Knowledge Core
- High-performance WebGL 3D pedagogical visualizer built with Three.js.
- Features standard `OrbitControls` with smooth damping and three instant camera presets (`Isometric`, `Top View`, `Core Focus`).
- Visualizes the lesson nucleus, procedural gyroscope rings, orbiting phase nodes, and dual QC audit halos with physical PBR materials.
- Container-level `ResizeObserver` ensures zero layout flickering or memory leaks.

### Dynamic AI Mastery Quiz Generator
- Generates a 5-question multiple choice formative diagnostic dynamically aligned with current section content via `/api/quiz/generate`.
- Immediate feedback mode highlights correct options, strikes out incorrect picks, and reveals pedagogical explanations.
- Tracks score tallies with retake capability.

### jsPDF Professional Export Engine
- Client-side vector PDF generation that compiles the full 45-minute lesson, timing schedules, instructor notes, interactive exercises, quizzes, citations, and QC certificates into a studio-formatted document.
- Automatic page-break calculation and running header/footer numbering.

---

## 🎨 Design System & Low-Fatigue Palette

EduCraft AI uses a **Focused & Low-Fatigue Palette** engineered to reduce eye strain during prolonged technical reading and curriculum design sessions:

| Token | Hex Code | Visual Application |
| :--- | :--- | :--- |
| **Canvas Deep** | `#0b121f` | Main application background, terminal embeds, code blocks |
| **Surface Dark** | `#131f33` | Primary cards, lesson stages, sidebar panels |
| **Border Muted** | `#1e2f4a` | Card borders, grid dividers, subtle separators |
| **Accent Teal** | `#0d9488` | Primary action buttons, progress bars, active phases |
| **Accent Sky** | `#38bdf8` | Secondary badges, textbook links, active highlights |
| **Amber Warning** | `#f59e0b` | Instructor notes, timing alerts, review items |
| **Text Primary** | `#f1f5f9` | Primary headings, code text, active labels |
| **Text Muted** | `#94a3b8` | Metadata descriptions, secondary citations, author text |

---

## 🔒 Security & Key Management Architecture

1. **Zero Client-Side Exposure**: API keys are never bundled, transmitted, or accessible in browser runtime code.
2. **Server-Side Proxy Pattern**: All requests to the Gemini API are executed via server-side Express routes (`/api/*`).
3. **Environment Isolation**: Keys are loaded strictly from server-side environment variables (`process.env.GEMINI_API_KEY`).
4. **Resilience & Graceful Degradation**: If rate limits or transient Google Cloud 503 errors occur, the backend executes exponential backoff retries and switches across model fallback tiers.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion
- **3D Graphics**: Three.js (r187), OrbitControls
- **Document Generation**: jsPDF (v4+)
- **Audio & Accessibility**: Web Speech API (`SpeechSynthesis`)
- **Backend**: Node.js, Express, tsx
- **AI & Reasoning**: `@google/genai` TypeScript SDK (ThinkingLevel.HIGH)
- **Icons**: Lucide React

---

## 📡 API Reference

### 1. `POST /api/lesson/generate`
Generates a structured 45-minute lesson plan and research citations.
- **Request Body**:
  ```json
  {
    "title": "HTTP Requests and Responses",
    "objective": "Explain GET and POST methods and distinguish between 2xx, 4xx, and 5xx response status categories.",
    "audience": "Undergraduate Computer Science",
    "enableThinking": true
  }
  ```
- **Response**: `{ success: true, lesson: LessonPlan, modelUsed: string }`

### 2. `POST /api/qc/layer1`
Executes QC Layer 1 (Research & Factual Accuracy Audit).
- **Request Body**: `{ "lesson": LessonPlan, "enableThinking": true }`
- **Response**: `{ success: true, report: QCLayer1Report }`

### 3. `POST /api/qc/layer2`
Executes QC Layer 2 (Instructional Quality & Pacing Audit).
- **Request Body**: `{ "lesson": LessonPlan, "enableThinking": true }`
- **Response**: `{ success: true, report: QCLayer2Report }`

### 4. `POST /api/lesson/apply-fixes`
Synthesizes selected or all QC audit fixes into the lesson structure.
- **Request Body**: `{ "currentLesson": LessonPlan, "selectedRecommendations": Array }`
- **Response**: `{ success: true, updatedLesson: LessonPlan }`

### 5. `POST /api/quiz/generate`
Dynamically crafts a 5-question multiple choice formative quiz.
- **Request Body**: `{ "title": string, "objective": string, "sections": Array }`
- **Response**: `{ success: true, questions: QuizQuestion[] }`

### 6. `POST /api/audio/transcribe`
Transcribes spoken voice dictation into Lesson Title & Learning Objective.
- **Request Body**: `{ "audioBase64": string, "mimeType": "audio/webm" }`
- **Response**: `{ success: true, transcript: string }`

### 7. `POST /api/video/analyze`
Extracts timestamps, definitions, and suitability for a 45-minute class.
- **Request Body**: `{ "videoUrl": string, "topicContext": string }`
- **Response**: `{ success: true, analysis: VideoAnalysisResult }`

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- Node.js (v20+ recommended)
- npm or yarn

### Installation
```bash
# 1. Clone repository
git clone <repo-url>
cd educraft-ai

# 2. Install dependencies
npm install

# 3. Configure environment variables
# Copy .env.example to .env and insert your Gemini API Key:
cp .env.example .env
```

Ensure `.env` contains:
```env
GEMINI_API_KEY="your-gemini-api-key"
PORT=3000
```

### Running Locally
```bash
# Start development server on http://localhost:3000
npm run dev
```

### Verification & Linting
```bash
# Verify TypeScript compilation and lint checks
npm run lint

# Build production bundle
npm run build
```

---

## 📦 Production Deployment

The project is structured as a full-stack Node.js Express server that serves Vite-built static assets in production while providing backend API endpoints.

```bash
# Build frontend assets
npm run build

# Start production server
npm start
```

---

*EduCraft AI · Curriculum Architecture & Dual QC Validation Studio done by Naghul Pranav K R*
