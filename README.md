# TrendRadar AI – Social Trend Intelligence Platform

**TrendRadar AI** is an AI-powered social trend intelligence, explainable content opportunity scoring, and multi-platform performance analytics platform built for **Gravia** (a prediction-market intelligence company).

## Core Capabilities

1. **Trend Discovery & Signal Watchlist**:
   - Monitor topics and keywords across **Prediction Markets**, **Macro & Finance**, **Cryptocurrency**, **Global Events**, **Internet Culture**, and **Social Media Trends**.
   - Record emerging trends manually or ingest live public stories from the **Official Hacker News Public API** (`POST /api/trends/ingest-official-feed`).
   - All sample records are explicitly labeled as `Sample Demo Data` so demo baselines are never confused with live real-time feeds.

2. **Epistemic AI Trend Analysis (`@google/genai`)**:
   - Powered server-side by `gemini-3.8-flash`.
   - Strictly separates **01. Verified Factual Baseline & Source Provenance**, **02. Analytical Drivers & Prediction Market Relevance**, and **03. Forward Projections & Content Execution Brief** (recommended platform, content angle, and copyable hook).

3. **Explainable Content Opportunity Scoring**:
   - Transparent 5-factor weighted model:
     - **Trend Relevance** (25%)
     - **Relevance to Gravia Brand** (25%)
     - **Signal Recency & Urgency** (20%)
     - **Target Audience Interest** (15%)
     - **Engagement Potential** (15%)
   - Interactive factor calibration sliders and visual contribution charts persisted in PostgreSQL.

4. **Multi-Platform Social Media Analytics & CSV Ingestion**:
   - Tracks **Reach**, **Impressions**, **Likes**, **Comments**, **Shares**, **Engagement Rate**, **Click-Through Rate**, and **Audience Retention** across **X**, **Instagram**, **TikTok**, **YouTube**, and **LinkedIn**.
   - Supports manual metric entry, downloadable CSV templates, and bulk CSV uploads (`POST /api/metrics/csv-upload`), with strict provenance tagging (`Sample Demo Data`, `Manual Entry`, `CSV Upload`).

5. **Interactive Performance Dashboard**:
   - Recharts visualizations for Reach & Impressions Velocity, Engagement & CTR Trends, Platform-Wise Efficiency, Category Breakdown, and Top-Performing Content Leaderboards with Date Window, Weekly/Monthly Cohort, and Platform filters.

6. **AI Strategic Recommendation Engine**:
   - Synthesizes recorded PostgreSQL trend scores and social performance telemetry via Gemini AI (`POST /api/recommendations/generate`) across 5 strategic categories: `Topic Next`, `Platform Priority`, `Format Winner`, `Underperforming Theme`, and `Next Experiment`.

7. **Editorial Content Calendar & Publishing Checklist**:
   - Schedule content ideas directly from trends or AI recommendations, manage workflow statuses (`Ideation`, `Drafting`, `Review`, `Scheduled`, `Published`), and track interactive compliance/publishing checklists persisted in PostgreSQL.

## Technical Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Recharts, Lucide Icons.
- **Backend**: Express + TypeScript (`server.ts`), Firebase Admin Auth verification (`src/middleware/auth.ts`), `@google/genai` SDK (`src/lib/gemini-service.ts`).
- **Database**: Cloud SQL for PostgreSQL with Drizzle ORM (`src/db/schema.ts`, `src/db/repository.ts`, `src/db/index.ts`).

## Running Locally

1. Configure environment variables in `.env` (refer to `.env.example` for `GEMINI_API_KEY`, `SQL_HOST`, `SQL_DB_NAME`, `SQL_USER`, `SQL_PASSWORD`, `SQL_ADMIN_USER`, and `SQL_ADMIN_PASSWORD`).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the full-stack server on port 3000:
   ```bash
   npm run dev
   ```
