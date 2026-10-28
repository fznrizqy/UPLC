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

---

## ⚙️ Quick Start (Recommended)

### 1. Database Setup
Create the PostgreSQL database using `psql` or Command Prompt:
```cmd
"C:\Program Files\PostgreSQL\16\bin\createdb.exe" -U postgres -h localhost lab_elearning
```
*(Or in `psql`: `CREATE DATABASE lab_elearning;`)*

### 2. Configure Environment Variables
Copy the example environment file for the backend:
```bash
cp backend/.env.example backend/.env
```
Ensure `DATABASE_URL` in [backend/.env](file:///c:/Users/fauzan.rizqy/.gemini/antigravity/scratch/lab-elearning-vercel/backend/.env) matches your PostgreSQL credentials:
```ini
PROJECT_NAME="Lab E-Learning System"
DATABASE_URL=postgresql+psycopg2://postgres:admin@localhost:5432/lab_elearning
SECRET_KEY=lab_elearning_secret_key_development_lan_production_2026
HOST=0.0.0.0
PORT=8000
UPLOAD_MAX_FILE_SIZE_MB=200
UPLOAD_MAX_VIDEO_SIZE_MB=2000
```

### 3. One-Click Launch (`start.bat`)
Run the launcher from the project root:
```cmd
start.bat
```
`start.bat` will automatically:
1. Verify Python, Node.js, and npm.
2. Create and configure `backend/venv` and install `requirements.txt`.
3. Install frontend dependencies (`npm install`).
4. Apply database migrations (`alembic upgrade head`).
5. Seed default user accounts (`init_admin.py`).
6. Launch FastAPI backend and Next.js frontend via [supervisor.py](file:///c:/Users/fauzan.rizqy/.gemini/antigravity/scratch/lab-elearning-vercel/supervisor.py).
7. Print local LAN URLs and credentials in the console.

> **To stop the application**: Press `Ctrl+C` in the terminal window to terminate all services cleanly.

---

## 👥 Default User Accounts

The database comes pre-seeded with initial accounts for testing and evaluation:

| Role | Username | Password | Purpose & Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Full access: manage meetings, quizzes, scores, and user accounts |
| **Tim Pengembangan (R&D)** | `rnd1` | `rnd123` | Create & edit validation meetings, upload materials/videos, create quizzes |
| **Tim Rutin (Analyst)** | `analyst1` | `analyst123` | View meetings, download documents, stream video, take quizzes, view own scores |

*User accounts can be added or updated via the **Kelola User** interface by Admin.*

---

## 🌐 LAN & Remote Access Configuration

### Access URLs
- **Web App**: `http://<SERVER_IP>:3000` (e.g., `http://192.168.1.50:3000`)
- **Backend API**: `http://<SERVER_IP>:8000/api/v1`
- **Swagger Documentation**: `http://<SERVER_IP>:8000/docs`

### Windows Firewall
If team members on the same network cannot connect to the server, allow incoming traffic on ports 3000 and 8000:

Open PowerShell **as Administrator** on the Windows host and run:
```powershell
New-NetFirewallRule -DisplayName "UPLC Frontend (Port 3000)" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "UPLC Backend (Port 8000)" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow
```

---

## 📦 Uploading to GitHub

To push this project to a new GitHub repository:

```powershell
# 1. Initialize git in the root folder
git init

# 2. Stage all files
git add .

# 3. Commit
git commit -m "Initial commit: UPLC Lab E-Learning Platform"

# 4. Set default branch to main
git branch -M main

# 5. Link your GitHub repository
git remote add origin https://github.com/<your-username>/<your-repo-name>.git

# 6. Push to GitHub
git push -u origin main
```

---

## 🚀 Deploying to Vercel

This repository is pre-configured for **Vercel monorepo deployment**:
- **Frontend**: Next.js App Router built and served via Vercel Edge/Serverless.
- **Backend**: FastAPI served serverless via [api/index.py](file:///c:/Users/fauzan.rizqy/.gemini/antigravity/scratch/lab-elearning-vercel/api/index.py) mapped to `/api/v1/:path*` via [vercel.json](file:///c:/Users/fauzan.rizqy/.gemini/antigravity/scratch/lab-elearning-vercel/vercel.json).

### Steps to Deploy:
1. Push this repository to **GitHub**.
2. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..." > "Project"**.
3. Import your GitHub repository.
4. **Environment Variables**: Under Project Settings > Environment Variables, configure:
   - `DATABASE_URL`: Your cloud PostgreSQL connection string (e.g., from [Neon.tech](https://neon.tech), [Supabase](https://supabase.com), or Vercel Postgres).
   - `SECRET_KEY`: A secure random string for JWT authentication.
5. Click **Deploy**. Vercel will build the Next.js frontend and deploy the FastAPI serverless functions automatically!

---

## 💾 Backups

1. **Database Backup**:
   ```cmd
   "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" -U postgres -h localhost lab_elearning > backup_lab_elearning.sql
   ```
2. **Uploaded Materials & Media**:
   Backup the `storage/` folder (`storage/files`, `storage/videos`, and `storage/images`) to an external or network drive.
