# 📧 Unsub.AI `v1.0.0`
> **Intelligent Gmail Newsletter Scanner, Automated Unsubscribe Hub & Career-Safe Inbox Protection powered by Google Gemini 3.7 Flash.**

---

## 🌟 Overview

**Unsub.AI** is a modern, privacy-first web application engineered to liberate your Gmail inbox from marketing clutter, cold outbound emails, and dormant subscriptions. Powered by **Google Gemini 3.7 Flash** and **Gmail REST APIs**, Unsub.AI scans your unopened and low-engagement messages, aggregates sender patterns, extracts one-click unsubscribe links, and protects essential career and billing emails.

---

## ✨ Key Features

### 🔍 Deep Gmail Scanning & Aggregation
- **Configurable Timeframes**: Scan the last 7 days, 30 days, 90 days, 6 months, or 1 year.
- **Header Parsing**: Automatically extracts `List-Unsubscribe` (`mailto:` and `https://` web links) and `List-Unsubscribe-Post` headers for RFC-compliant one-click unsubscribing.
- **Smart Grouping**: Groups hundreds of individual emails by sender domain and verified addresses with total & unread counts.

### 🛡️ Career & Financial Safety Safeguards
- **Zero-Accident Job Alert Protection**: Built-in heuristic engine automatically identifies job platforms (**LinkedIn Jobs, Indeed, Greenhouse, Lever, Workday, Handshake, Otta, ZipRecruiter**) and recruiter communications.
- **Guaranteed Safe Prioritization**: Job alerts and financial receipts/invoices are strictly marked as **Low Priority** (`💼 Job Alert` badge) and excluded from destructive bulk-clean actions.

### 🤖 Gemini 3.7 Flash AI Insights & Assistant
- **AI Priority Scoring**: Gemini 3.7 Flash categorizes senders into *E-Commerce*, *Newsletters*, *Updates*, *Billing*, or *Job Alerts* with tailored unsubscribe recommendations.
- **Built-in Gemini Assistant**: An interactive AI chat panel with live agentic CRUD tools that analyzes your scanned inbox, answers questions, and helps formulate custom filtering strategies.

### 📊 Interactive Inbox Health Dashboard
- **Visual Analytics**: Interactive Recharts breakdown displaying Category Distribution, Email vs. Sender ratios, and Unread Metrics.
- **Inbox Cleanliness Score**: Real-time health gauge scoring your inbox clutter level.

### ⚡ Power-User Features
- **Fuzzy Search & Filtering**: Multi-field search across sender names, email domains, subject lines, snippets, and categories.
- **Bulk Safe Cleanup**: Multi-select senders to batch-move unwanted newsletters to Trash or archive them in seconds.
- **Audit Logging**: Comprehensive timestamped action history for all unsubscribes and deletions.
- **Keyboard Shortcuts**: Navigate with `J`/`K`, toggle selections with `X`, preview with `P`, and unsubscribe with `U`.
- **Dark / Light Mode**: Adaptive glassmorphism UI built with Tailwind CSS.

---

## 🔒 Privacy & Architecture

Unsub.AI is architected with **Zero Server Credential Storage**:

```
[ Browser Client ] ──(Google Identity Services / OAuth Popup)──> [ Google Auth ]
        │
        ├──(Access Token via Memory/Session)──> [ Gmail API Direct Proxy ]
        │
        └──(Anonymized Metadata Only)─────────> [ Gemini API / Server Route ]
```

1. **Client-Side OAuth**: Your Google OAuth token is obtained via Google Identity Services (`initTokenClient`) and retained only in client memory during the active session.
2. **Server-Side API Key Isolation**: Gemini API keys (`GEMINI_API_KEY`) remain strictly protected in server environment variables.
3. **No Database Logging of Emails**: Message bodies and personal identifiers are never permanently stored on external servers.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** 18.x or higher
- **Google Cloud Console** project with:
  - **Gmail API** enabled
  - OAuth 2.0 Client ID (Web Application) with authorized JavaScript origins

### 2. Environment Setup

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Configure the following variables:

```env
# Gemini API Key (Required for AI Categorization and Chatbot)
GEMINI_API_KEY=your_gemini_api_key_here

# Google OAuth Client ID (Required for Gmail Sign-In)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

### 3. Installation & Run

```bash
# Install dependencies
npm install

# Start the local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15+ (App Router)](https://nextjs.org/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) & Lucide Icons |
| **AI Engine** | [Google GenAI SDK](https://www.npmjs.com/package/@google/genai) (`gemini-3.7-flash`) |
| **Data Viz** | [Recharts](https://recharts.org/) |
| **Authentication**| Google Identity Services (GIS) OAuth 2.0 |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `J` / `K` | Navigate up / down through sender list |
| `X` | Select / Deselect focused sender card |
| `U` | Trigger Unsubscribe on focused sender |
| `P` | Open Email Preview modal |
| `T` | Move emails to Trash |
| `/` | Focus search bar |
| `?` | Show Keyboard Shortcuts cheat sheet |
| `Esc` | Close any open modal |

---

## 📄 License

This project is licensed under the MIT License.
