from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
from app.core.supabase import get_supabase_client
from pydantic import BaseModel
from typing import List, Optional, Dict
import anthropic
import os
import io
import json
import re

try:
    import pypdf
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

router = APIRouter(prefix="/questions")


# ─── Models ──────────────────────────────────────────────────

class GenerateRequest(BaseModel):
    user_id: str
    course_id: str
    pdf_url: str
    pdf_name: Optional[str] = None
    title: Optional[str] = None


class GradeRequest(BaseModel):
    question_text: str
    user_answer: str
    topic: str


# ─── Helpers ─────────────────────────────────────────────────

def _extract_pdf_text(file_bytes: bytes) -> str:
    reader = pypdf.PdfReader(io.BytesIO(file_bytes))
    return "\n\n".join(
        f"[Page {i+1}]\n{page.extract_text() or ''}"
        for i, page in enumerate(reader.pages)
    )


def _fetch_url_pdf_text(pdf_url: str) -> str:
    try:
        import requests as _requests
        r = _requests.get(pdf_url, timeout=30)
        r.raise_for_status()
        return _extract_pdf_text(r.content)
    except Exception:
        return ""


def _parse_questions(raw: str) -> list:
    cleaned = re.sub(r'```(?:json)?\s*|\s*```', '', raw).strip()
    # direct parse
    try:
        result = json.loads(cleaned)
        if isinstance(result, list):
            return result
        if isinstance(result, dict) and "questions" in result:
            return result["questions"]
    except Exception:
        pass
    # find array
    m = re.search(r'\[[\s\S]*\]', cleaned)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            pass
    return []


def _call_claude(prompt: str, max_tokens: int = 8000) -> str:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set")
    client = anthropic.Anthropic(api_key=api_key)
    msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    return msg.content[0].text.strip()


# ─── Extract from past paper ─────────────────────────────────

@router.post("/extract")
def extract_from_past_paper(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    course_id: str = Form(...),
    title: str = Form(...),
    source_label: str = Form(default=""),   # e.g. "2025"
):
    if not HAS_PYPDF:
        raise HTTPException(status_code=500, detail="pypdf not available")

    content = file.file.read()
    try:
        pdf_text = _extract_pdf_text(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {e}")

    if not pdf_text.strip():
        raise HTTPException(status_code=400, detail="No text could be extracted from the PDF")

    prompt = f"""You are processing an exam past paper. Extract every question from this paper exactly as written — preserve the original wording faithfully. Do not paraphrase.

For each question:
- Assign a topic (e.g. "SQL", "ER Modelling", "Transactions & Concurrency", "Normalisation") based on the content
- If a question has sub-parts (a, b, c), extract each sub-part as a separate question but keep the parent context in the question text
- Generate a thorough model answer (as a professor would write it)
- Add a brief explanation of the key concepts being tested

Return ONLY a JSON array, no other text:
[
  {{
    "topic": "Topic name",
    "question_text": "Exact question text from the paper",
    "model_answer": "Detailed model answer",
    "explanation": "Key concepts this question tests"
  }}
]

Source label (year/paper identifier): "{source_label or title}"

Exam paper content:
{pdf_text[:80000]}"""

    raw = _call_claude(prompt)
    questions = _parse_questions(raw)

    if not questions:
        raise HTTPException(status_code=500, detail="Could not extract questions from this PDF")

    supabase = get_supabase_client()
    bank = supabase.table("question_banks").insert({
        "user_id": user_id,
        "course_id": course_id,
        "title": title,
        "source_type": "past_paper",
        "source_label": source_label or title,
    }).execute()

    if not bank.data:
        raise HTTPException(status_code=400, detail="Failed to create question bank")

    bank_id = bank.data[0]["id"]
    rows = [
        {
            "bank_id": bank_id,
            "topic": q.get("topic", "General"),
            "question_text": q.get("question_text", ""),
            "model_answer": q.get("model_answer", ""),
            "explanation": q.get("explanation", ""),
            "source_label": source_label or title,
            "order_index": i,
        }
        for i, q in enumerate(questions)
        if q.get("question_text")
    ]

    supabase.table("questions").insert(rows).execute()
    return {"bank": bank.data[0], "count": len(rows)}


# ─── Generate from notes PDF ─────────────────────────────────

@router.post("/generate")
def generate_question_bank(body: GenerateRequest):
    pdf_text = _fetch_url_pdf_text(body.pdf_url)
    if not pdf_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from this PDF")

    prompt = f"""You are creating an exam-style question bank from lecture notes.

Generate a comprehensive set of exam questions that cover all major topics in this material. Questions should:
- Be at exam difficulty level (not trivial recall)
- Mix question types: definition, explain/discuss, apply/analyse, compare/contrast
- Group naturally by topic

For each question provide a model answer and explanation of what's being tested.

Return ONLY a JSON array, no other text:
[
  {{
    "topic": "Topic name",
    "question_text": "Exam question",
    "model_answer": "Detailed model answer",
    "explanation": "Key concepts tested"
  }}
]

Lecture notes:
{pdf_text[:80000]}"""

    raw = _call_claude(prompt)
    questions = _parse_questions(raw)

    if not questions:
        raise HTTPException(status_code=500, detail="Could not generate questions from this PDF")

    supabase = get_supabase_client()
    title = body.title or (body.pdf_name or "Generated Questions")
    bank = supabase.table("question_banks").insert({
        "user_id": body.user_id,
        "course_id": body.course_id,
        "title": title,
        "source_type": "generated",
        "source_label": None,
    }).execute()

    if not bank.data:
        raise HTTPException(status_code=400, detail="Failed to create question bank")

    bank_id = bank.data[0]["id"]
    rows = [
        {
            "bank_id": bank_id,
            "topic": q.get("topic", "General"),
            "question_text": q.get("question_text", ""),
            "model_answer": q.get("model_answer", ""),
            "explanation": q.get("explanation", ""),
            "source_label": None,
            "order_index": i,
        }
        for i, q in enumerate(questions)
        if q.get("question_text")
    ]

    supabase.table("questions").insert(rows).execute()
    return {"bank": bank.data[0], "count": len(rows)}


# ─── List banks ──────────────────────────────────────────────

@router.get("/banks")
def get_banks(user_id: str = Query(...), course_id: str = Query(...)):
    supabase = get_supabase_client()
    banks = (
        supabase.table("question_banks")
        .select("*")
        .eq("user_id", user_id)
        .eq("course_id", course_id)
        .order("created_at", desc=True)
        .execute()
        .data or []
    )
    if not banks:
        return []

    bank_ids = [b["id"] for b in banks]
    counts = (
        supabase.table("questions")
        .select("bank_id")
        .in_("bank_id", bank_ids)
        .execute()
        .data or []
    )
    count_map: Dict[str, int] = {}
    for row in counts:
        count_map[row["bank_id"]] = count_map.get(row["bank_id"], 0) + 1

    for b in banks:
        b["question_count"] = count_map.get(b["id"], 0)

    return banks


# ─── Get questions in a bank ─────────────────────────────────

@router.get("/banks/{bank_id}")
def get_bank_questions(bank_id: str):
    supabase = get_supabase_client()
    bank = supabase.table("question_banks").select("*").eq("id", bank_id).execute()
    if not bank.data:
        raise HTTPException(status_code=404, detail="Bank not found")

    questions = (
        supabase.table("questions")
        .select("*")
        .eq("bank_id", bank_id)
        .order("topic")
        .order("order_index")
        .execute()
        .data or []
    )

    # Group by topic
    topics: Dict[str, list] = {}
    for q in questions:
        t = q["topic"]
        if t not in topics:
            topics[t] = []
        topics[t].append(q)

    return {"bank": bank.data[0], "topics": topics}


# ─── Delete bank ─────────────────────────────────────────────

@router.delete("/banks/{bank_id}")
def delete_bank(bank_id: str):
    supabase = get_supabase_client()
    supabase.table("questions").delete().eq("bank_id", bank_id).execute()
    supabase.table("question_banks").delete().eq("id", bank_id).execute()
    return {"ok": True}


# ─── Grade answer ─────────────────────────────────────────────

@router.post("/grade")
def grade_answer(body: GradeRequest):
    prompt = f"""You are an examiner grading a student's answer to an exam question.

Topic: {body.topic}

Question:
{body.question_text}

Student's answer:
{body.user_answer}

Grade this answer strictly on its own merits — the depth of understanding demonstrated, accuracy, and completeness. Do not compare to a model answer.

Respond with a JSON object:
{{
  "grade": "Excellent" | "Good" | "Developing" | "Insufficient",
  "score": 1-4,
  "feedback": "2-3 sentences of specific, constructive feedback",
  "what_was_good": "What the student got right",
  "what_to_improve": "What was missing or could be stronger"
}}"""

    raw = _call_claude(prompt, max_tokens=1024)
    cleaned = re.sub(r'```(?:json)?\s*|\s*```', '', raw).strip()
    try:
        result = json.loads(cleaned)
    except Exception:
        m = re.search(r'\{[\s\S]*\}', cleaned)
        if m:
            try:
                result = json.loads(m.group(0))
            except Exception:
                raise HTTPException(status_code=500, detail="Could not parse grading response")
        else:
            raise HTTPException(status_code=500, detail="Could not parse grading response")

    return result
