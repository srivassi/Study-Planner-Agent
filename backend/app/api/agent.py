from fastapi import APIRouter
from app.agent.orchestrator import StudyPlannerAgent
from app.agent.schemas import AgentInput

router = APIRouter(prefix="/agent")

agent = StudyPlannerAgent()

@router.post("/run")
def run_agent(input: AgentInput):
    return agent.run(
        syllabus=input.syllabus,
        availability=input.availability
    )
