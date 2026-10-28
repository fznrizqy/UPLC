# UPLC : Unified Pharmacy Learning Center

> **Internal Laboratory E-Learning & Method Validation Platform**  
> A lightweight, secure, and production-ready knowledge-transfer platform designed specifically for laboratory teams on a Local Area Network (LAN) or hybrid environment.

---

## 📌 Overview

UPLC bridges the gap between the **R&D / Development Team** and the **Routine Analyst Team** through structured Pre-Validation and Post-Validation workflows:
- **Meeting & Protocol Hub**: Pre-validation & post-validation meeting records with agendas and discussion logs.
- **Document & Presentation Viewer**: In-browser PDF preview and downloads for protocols, SOPs, and slides (PPT/PPTX).
- **Video Recordings with Range Seeking**: Video streaming with HTTP 206 Partial Content support for smooth seeking in large recordings.
- **Evaluation Quizzes & Question Bank**: Quizzes with randomized questions, image support, time limits, automatic scoring, and passing thresholds.
- **Analytics & History**: Track completion status, attempt history, and scores for every routine analyst.
- **Role-Based Access Control (RBAC)**: Distinct permissions for Admin, Development (R&D), and Routine teams.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: Next.js 15+ (App Router, TypeScript, Tailwind CSS, Lucide icons, Axios).
- **Backend**: FastAPI (Python 3.10+), SQLAlchemy 2.0 ORM, Alembic migrations, Pydantic v2, Python-Jose (JWT), Passlib (Bcrypt).
- **Database**: PostgreSQL (or SQLite compatible for quick trials).
- **Storage**: Local filesystem storage with dedicated directories:
  - `storage/files/`: Validation protocols, PDFs, PPT/PPTX presentations.
  - `storage/videos/`: MP4, WebM meeting recordings.
  - `storage/images/`: Quiz question images and attachments.
- **Process Orchestration**: Python supervisor (`supervisor.py`) running both frontend and backend concurrently with clean process tree termination on Windows.

---

## 📋 System Prerequisites

Ensure the following tools are installed on the host machine:

1. **Python 3.10+**: Download from [python.org](https://www.python.org/downloads/windows/).  
   *(Make sure **"Add python.exe to PATH"** is checked during installation).*
2. **Node.js (v18+ or v20+ LTS)**: Download from [nodejs.org](https://nodejs.org/). Includes `npm`.
3. **PostgreSQL 14+**: Download from [EnterpriseDB](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads).
4. **Git**: [git-scm.com](https://git-scm.com/).
