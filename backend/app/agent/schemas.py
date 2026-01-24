from pydantic import BaseModel
from typing import List

class AgentInput(BaseModel):
    syllabus: str
    availability: dict

class Task(BaseModel):
    title: str
    estimated_minutes: int

class AgentOutput(BaseModel):
    tasks: List[Task]
