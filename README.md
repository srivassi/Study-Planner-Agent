# 📚 FlowState

An end-to-end, AI-powered study planning app for students that turns a syllabus into a **dynamic, adaptive study plan** with built-in **Pomodoro focus sessions**, **calendar scheduling**, and **flashcard-based learning**.

This project is designed as a **personal academic coach**, not just a to-do list.

---

## 🚀 What It Does

Given a syllabus, the Study Planner Agent automatically:

- Breaks the syllabus into manageable study tasks
- Estimates time and difficulty for each task
- Builds a realistic study plan
- Schedules tasks directly into a calendar
- Guides execution using Pomodoro focus sessions
- Tracks daily progress
- Automatically reschedules when you fall behind
- Reinforces learning with flashcards and spaced repetition

---

## 🧠 Core Idea

> **LLM decides *what* to study, rules decide *how*, scheduler decides *when*, and data remembers *everything*.**

The system combines AI reasoning with deterministic scheduling to stay reliable, explainable, and adaptive.

---

## ✨ Key Features

### 1️⃣ Syllabus → Plan (Planning Intelligence)
- Paste or upload syllabus (text / PDF)
- Automatic parsing into chapters and sections
- Task decomposition into atomic study units
- Time and difficulty estimation
- Deadline-aware prioritization

---

### 2️⃣ Smart Study Plan & Calendar
- Auto-generated daily and weekly study plans
- Calendar-based scheduling
- Respects user availability and max daily hours
- Built-in buffer / catch-up time
- Visual calendar and task list views

---

### 3️⃣ Pomodoro-Based Execution
- Integrated Pomodoro timer (25/5, customizable)
- Tasks automatically split into Pomodoro sessions
- Focus mode during sessions
- Long breaks supported
- Progress tracked at the session level

---

### 4️⃣ Adaptive Rescheduling (The “Agent”)
- Tracks completed vs missed Pomodoros
- Nightly or on-demand replanning
- Rebalances workload after missed sessions
- Prevents burnout with daily load limits
- Automatically recovers when you fall behind

---

### 5️⃣ Flashcards & Learning Reinforcement
- Auto-generate flashcards from completed tasks
- Integrates existing hackathon flashcard system
- Spaced repetition (SM-2 algorithm)
- Daily review queue based on weaknesses

---

### 6️⃣ Productivity & Motivation
- Daily progress summaries
- Pomodoro streak tracking
- Badges and micro-goals
- Light motivational nudges
- Focus-oriented UX

---

### 7️⃣ Progress Tracking & Analytics
- Task and Pomodoro completion metrics
- Time-on-task tracking
- Weekly productivity overview
- Visual progress indicators

---

## 🎯 Target Users
- High school and university students
- Students preparing for exams or finals
- Self-directed learners following structured curricula

---

## 🏗️ Tech Stack

### Frontend
- React Native (mobile-first)
- Zustand / Redux (state management)
- Calendar & Pomodoro UI
- Flashcards UI (hackathon project)

### Backend
- FastAPI (Python)
- PostgreSQL (persistent storage)
- Redis (caching & background jobs)
- SQLAlchemy + Alembic

### AI / Agent Layer
- LLM (OpenAI / open-source)
- Deterministic rule-based logic
- Custom scheduling & rescheduling engine

---

## 🧠 Agent Architecture

The agent is **not a single model**.

It is built from:
- **LLM** → understanding & task decomposition
- **Rules & heuristics** → Pomodoro logic, constraints
- **Scheduler** → calendar allocation
- **Database** → memory & progress
- **Orchestrator** → coordinates everything

---

## 🧪 MVP Scope (Hackathon-Ready)

- Syllabus input
- Task breakdown
- Pomodoro scheduling
- Calendar view
- Progress tracking
- Adaptive rescheduling
- Flashcards integration

---

## 🛣️ Development Philosophy

- AI for **reasoning**, not control
- Deterministic logic for **time & scheduling**
- Simple, explainable behavior
- Built to adapt daily, not just plan once

---

## 📌 Status
🚧 In active development (Hackathon MVP)

---

## 👥 Team
Built by Siddhi and Heza, for students like us.
