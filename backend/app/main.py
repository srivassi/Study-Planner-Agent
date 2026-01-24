from fastapi import FastAPI

app = FastAPI(title="Study Planner Agent")

@app.get("/health")
def health():
    return {"status": "ok"}
