# Deployment Guide

This project is split into two parts: a **Python FastAPI Backend** and a **React (Vite) Frontend**.

## 1. Backend Deployment (Render)

1.  **Create a New Web Service** on [Render](https://render.com/).
2.  **Connect your GitHub Repository** and select the `deployment-ready` branch.
3.  **Configure Build Settings**:
    - **Runtime**: `Python 3`
    - **Build Command**: `pip install -r backend/requirements.txt`
    - **Start Command**: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.main:app --bind 0.0.0.0:$PORT`
    - **Root Directory**: Leave blank (or set to `.` if you are connecting the whole repo).
4.  **Add Environment Variables**:
    - `OPENAI_API_KEY`: Your OpenAI API key.
    - `PYTHON_VERSION`: `3.10` or higher.
5.  **Copy the Service URL** (e.g., `https://adaptive-dsa-tutor-backend.onrender.com`).

---

## 2. Frontend Deployment (Vercel)

1.  **Create a New Project** on [Vercel](https://vercel.com/).
2.  **Connect your GitHub Repository** and select the `deployment-ready` branch.
3.  **Configure Settings**:
    - **Framework Preset**: `Vite`
    - **Root Directory**: `frontend`
    - **Build Command**: `npm run build`
    - **Output Directory**: `dist`
4.  **Add Environment Variables**:
    - `VITE_API_URL`: Paste your Render Backend URL (without the trailing slash).
5.  **Deploy!**

---

## Final Checks
- Ensure the Backend is fully deployed before testing the Frontend.
- If you see CORS errors, ensure `backend/main.py` has `allow_origins=["*"]` (which it currently does).
- Your session data is stored in `backend/session_data.json` on Render. Note that Render's disk is ephemeral; for permanent storage, consider connecting a database.
