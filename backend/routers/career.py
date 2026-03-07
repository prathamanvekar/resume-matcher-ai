# backend/routers/career.py

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from database import get_db
from models.user import User
from models.resume import Resume
from routers.auth import get_current_user
from services.skill_analyzer import skill_analyzer
from agents.career_agent import career_agent

router = APIRouter(prefix="/api/career", tags=["Career"])

class SkillGapRequest(BaseModel):
    target_role: str
    current_skills: Optional[List[str]] = None

class TransitionRequest(BaseModel):
    current_role: str
    target_role: str
    experience_years: Optional[int] = 0

@router.post("/skill-gap")
async def analyze_skill_gap(
    request: SkillGapRequest,
    resume_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze skill gap for a target role"""
    skills = request.current_skills or []

    # Get skills from resume if provided
    if resume_id:
        resume = db.query(Resume).filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id
        ).first()
        if resume:
            skills = resume.extracted_skills or []

    # Get skills from user profile if available
    if not skills and current_user.current_skills:
        skills = current_user.current_skills

    analysis = skill_analyzer.analyze_skill_gap(skills, request.target_role)

    return analysis

@router.post("/transition-plan")
async def create_transition_plan(
    request: TransitionRequest,
    resume_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a career transition plan"""
    skills = []

    # Get skills from resume if provided
    if resume_id:
        resume = db.query(Resume).filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id
        ).first()
        if resume:
            skills = resume.extracted_skills or []

    # Get skills from user profile
    if not skills and current_user.current_skills:
        skills = current_user.current_skills

    plan = career_agent.plan_career_transition(
        current_role=request.current_role,
        target_role=request.target_role,
        current_skills=skills,
        experience_years=request.experience_years
    )

    return plan

@router.get("/transition-paths/{current_role}")
async def get_transition_paths(
    current_role: str,
    current_user: User = Depends(get_current_user)
):
    """Get all possible career transitions from current role"""
    paths = skill_analyzer.get_career_transition_paths(current_role)

    return paths

@router.post("/roadmap")
async def generate_learning_roadmap(
    target_role: str,
    resume_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a learning roadmap for target role"""
    skills = []

    if resume_id:
        resume = db.query(Resume).filter(
            Resume.id == resume_id,
            Resume.user_id == current_user.id
        ).first()
        if resume:
            skills = resume.extracted_skills or []

    if not skills and current_user.current_skills:
        skills = current_user.current_skills

    roadmap = skill_analyzer.generate_learning_roadmap(skills, target_role)

    return roadmap

@router.get("/intermediate-roles")
async def suggest_intermediate_roles(
    current_role: str = Query(...),
    target_role: str = Query(...),
    current_user: User = Depends(get_current_user)
):
    """Suggest intermediate roles for career progression"""
    suggestions = career_agent.suggest_intermediate_roles(current_role, target_role)

    return {
        "current_role": current_role,
        "target_role": target_role,
        "intermediate_roles": suggestions
    }
