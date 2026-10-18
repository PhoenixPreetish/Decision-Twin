# DecisionTwin AI: Intelligent Decision Simulation & Risk Analytics Platform

DecisionTwin AI is a high-performance decision-support and simulation platform designed to evaluate complex life decisions (Higher Education, Career Change, Job Selection, Entrepreneurship, Investment, Relocation) through machine learning prediction, 10,000-trial Monte Carlo simulations, multi-dimensional risk scoring, What-If parameter sensitivity analysis, and explainable AI (XAI) reports.

---

## 🚀 Architecture Overview

- **Frontend (`/client`)**: React 18, Vite, Tailwind CSS, Recharts, Lucide Icons, jsPDF.
- **Backend API (`/server`)**: Node.js, Express.js, MongoDB Atlas (Mongoose), JWT, Bcrypt, Rate Limiting, Built-in Fallback ML & Scoring Engine.
- **ML Microservice (`/ml-service`)**: Python/FastAPI, Gradient Boosting, Linear Regression, Decision Trees, Monte Carlo simulator, and Permutation Feature Importance.

---

## 🌐 Cloud Deployment Guide

### 1. Deploy Frontend to **Vercel**
1. Push this repository to GitHub.
2. Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Set the **Root Directory** to `client`.
5. Under **Environment Variables**, add:
   - `VITE_API_BASE_URL`: `https://your-backend-service.onrender.com/api` (or your Railway backend URL).
6. Click **Deploy**. Vercel will build and host your single-page application using `vercel.json` rewrite routing.

### 2. Deploy Backend to **Render**
1. Log in to [Render](https://render.com) and select **"New Blueprint Instance"** (or create a Web Service).
2. Connect your repository. Render will automatically detect `render.yaml`.
3. Fill in the environment variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A secure random secret string.
   - `CLIENT_URL`: `https://your-frontend.vercel.app`
4. Click **Apply / Deploy**.

### 3. Deploy Backend to **Railway**
1. Log in to [Railway](https://railway.app) and create a **New Project from GitHub Repo**.
2. Set the Root Directory to `/server`.
3. Add the required Environment Variables (`MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`).
4. Railway will automatically build and deploy the Node.js API with custom domain and SSL.

---

## 💻 Local Development Setup

### Prerequisites
- Node.js (v18+)
- Python (v3.10+) or Docker
- MongoDB Atlas or local MongoDB instance

### 1. Install all dependencies
```bash
npm run install:all
```

### 2. Environment Configuration
- Copy `server/.env.example` to `server/.env` and update `MONGODB_URI` and `JWT_SECRET`.
- Copy `client/.env.example` to `client/.env`.

### 3. Run concurrently
```bash
npm run dev
```
- Client runs on: `http://localhost:5173`
- Backend runs on: `http://localhost:5000`
