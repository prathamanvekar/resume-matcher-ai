# backend/routers/jobs.py

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

from database import get_db
from models.user import User
from models.job import Job
from models.resume import Resume
from models.application import Application
from routers.auth import get_current_user
from services.job_matcher import job_matcher
from services.cover_letter import cover_letter_generator
from agents.strategy_agent import strategy_agent
from agents.explainability_agent import explainability_agent
from agents.outcome_agent import outcome_agent

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])

class JobCreate(BaseModel):
    title: str
    company: Optional[str] = None
    description: str
    location: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    work_type: Optional[str] = None
    required_skills: Optional[List[str]] = None

class JobResponse(BaseModel):
    id: int
    title: str
    company: Optional[str]
    location: Optional[str]
    salary_min: Optional[float]
    salary_max: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


class JobActionPayload(BaseModel):
    resume_id: int
    job: Optional[Dict[str, Any]] = None


def _resolve_job(db: Session, job_id: int, job_snapshot: Optional[Dict[str, Any]] = None) -> Job:
    job = db.query(Job).filter(Job.id == job_id).first()
    if job:
        return job

    if not job_snapshot:
        raise HTTPException(status_code=404, detail="Job not found")

    external_ref = str(job_snapshot.get('job_id') or job_snapshot.get('id') or '')
    if external_ref:
        existing_external = db.query(Job).filter(
            Job.source == 'external',
            Job.source_url == external_ref
        ).first()
        if existing_external:
            return existing_external

    required_skills = job_snapshot.get('required_skills')
    if not isinstance(required_skills, list):
        required_skills = job_snapshot.get('skills')
    if not isinstance(required_skills, list):
        required_skills = []

    created_job = Job(
        title=job_snapshot.get('title') or 'Untitled Job',
        company=job_snapshot.get('company') or job_snapshot.get('company_name'),
        description=job_snapshot.get('description') or '',
        location=job_snapshot.get('location'),
        salary_min=job_snapshot.get('salary_min') or job_snapshot.get('min_salary'),
        salary_max=job_snapshot.get('salary_max') or job_snapshot.get('max_salary'),
        work_type=job_snapshot.get('work_type'),
        experience_level=job_snapshot.get('experience_level'),
        required_skills=required_skills,
        source='external',
        source_url=external_ref or None
    )

    db.add(created_job)
    db.commit()
    db.refresh(created_job)
    return created_job

@router.post("/add")
async def add_job(
    job_data: JobCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a job posting manually"""
    job = Job(
        title=job_data.title,
        company=job_data.company,
        description=job_data.description,
        location=job_data.location,
        salary_min=job_data.salary_min,
        salary_max=job_data.salary_max,
        work_type=job_data.work_type,
        required_skills=job_data.required_skills or [],
        source="manual"
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    return {"id": job.id, "message": "Job added successfully"}

@router.get("/search")
async def search_jobs(
    query: str = Query(..., min_length=3),
    k: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user)
):
    """Search for jobs using semantic search"""
    results = job_matcher.match_resume_to_jobs(query, [], k=k)

    return {
        "query": query,
        "count": len(results),
        "jobs": results
    }

@router.post("/match/{resume_id}")
async def match_jobs_to_resume(
    resume_id: int,
    k: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Find matching jobs for a resume"""
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Get matches
    results = job_matcher.match_resume_to_jobs(
        resume.original_text or '',
        resume.extracted_skills or [],
        k=k
    )

    return {
        "resume_id": resume_id,
        "count": len(results),
        "matches": results
    }

@router.get("/{job_id}")
async def get_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get job details"""
    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return job

@router.post("/{job_id}/analyze")
async def analyze_job_match(
    job_id: int,
    resume_id: Optional[int] = Query(default=None),
    payload: Optional[JobActionPayload] = Body(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze match between resume and job with detailed explanation"""
    resolved_resume_id = payload.resume_id if payload else resume_id
    if not resolved_resume_id:
        raise HTTPException(status_code=400, detail="resume_id is required")

    job = _resolve_job(db, job_id, payload.job if payload else None)

    resume = db.query(Resume).filter(
        Resume.id == resolved_resume_id,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Calculate match
    match_result = job_matcher.calculate_match_score(
        resume.extracted_skills or [],
        job.required_skills or [],
        resume.original_text or '',
        job.description or ''
    )

    # Get explanation
    explanation = explainability_agent.explain_match_score(
        match_result,
        {"title": job.title, "company": job.company}
    )

    return {
        "match": match_result,
        "explanation": explanation
    }

@router.post("/{job_id}/decide")
async def decide_application(
    job_id: int,
    resume_id: Optional[int] = Query(default=None),
    payload: Optional[JobActionPayload] = Body(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI decision on whether to apply"""
    resolved_resume_id = payload.resume_id if payload else resume_id
    if not resolved_resume_id:
        raise HTTPException(status_code=400, detail="resume_id is required")

    job = _resolve_job(db, job_id, payload.job if payload else None)

    resume = db.query(Resume).filter(
        Resume.id == resolved_resume_id,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Calculate match
    match_result = job_matcher.calculate_match_score(
        resume.extracted_skills or [],
        job.required_skills or [],
        resume.original_text or '',
        job.description or ''
    )

    # Get user preferences
    user_prefs = {
        'salary_min': current_user.salary_min,
        'salary_max': current_user.salary_max,
        'preferred_locations': current_user.preferred_locations or []
    }

    # Get decision
    decision = strategy_agent.decide_application(
        resume_data=resume.parsed_data or {},
        job_data={
            'title': job.title,
            'company': job.company,
            'location': job.location,
            'salary_max': job.salary_max,
            'description': job.description
        },
        match_score=match_result,
        user_preferences=user_prefs
    )

    # Predict outcome
    outcome = outcome_agent.predict_application_outcome(
        resume_data={'skills': resume.extracted_skills or []},
        job_data={'title': job.title, 'location': job.location or ''},
        match_score=match_result
    )

    return {
        "decision": decision,
        "outcome_prediction": outcome,
        "match_score": match_result
    }

@router.post("/{job_id}/cover-letter")
async def generate_cover_letter(
    job_id: int,
    resume_id: Optional[int] = Query(default=None),
    payload: Optional[JobActionPayload] = Body(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a cover letter for a job"""
    resolved_resume_id = payload.resume_id if payload else resume_id
    if not resolved_resume_id:
        raise HTTPException(status_code=400, detail="resume_id is required")

    job = _resolve_job(db, job_id, payload.job if payload else None)

    resume = db.query(Resume).filter(
        Resume.id == resolved_resume_id,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Calculate match for context
    match_result = job_matcher.calculate_match_score(
        resume.extracted_skills or [],
        job.required_skills or []
    )

    # Generate cover letter
    cover_letter = cover_letter_generator.generate(
        resume_data=resume.parsed_data or {'skills': resume.extracted_skills, 'name': current_user.full_name},
        job_data={
            'title': job.title,
            'company': job.company,
            'description': job.description
        },
        match_data=match_result
    )

    return {
        "cover_letter": cover_letter,
        "job_title": job.title,
        "company": job.company
    }

@router.post("/{job_id}/apply")
async def create_application(
    job_id: int,
    resume_id: Optional[int] = Query(default=None),
    payload: Optional[JobActionPayload] = Body(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create an application record"""
    resolved_resume_id = payload.resume_id if payload else resume_id
    if not resolved_resume_id:
        raise HTTPException(status_code=400, detail="resume_id is required")

    job = _resolve_job(db, job_id, payload.job if payload else None)

    resume = db.query(Resume).filter(
        Resume.id == resolved_resume_id,
        Resume.user_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Check if already applied
    existing = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.job_id == job_id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Already applied to this job")

    # Calculate match
    match_result = job_matcher.calculate_match_score(
        resume.extracted_skills or [],
        job.required_skills or []
    )

    # Get decision
    decision = strategy_agent.decide_application(
        resume_data=resume.parsed_data or {},
        job_data={'title': job.title, 'company': job.company, 'location': job.location},
        match_score=match_result
    )

    # Generate cover letter
    cover_letter = cover_letter_generator.generate(
        resume_data=resume.parsed_data or {},
        job_data={'title': job.title, 'company': job.company, 'description': job.description},
        match_data=match_result
    )

    # Predict callback
    outcome = outcome_agent.predict_application_outcome(
        resume_data={'skills': resume.extracted_skills or []},
        job_data={'title': job.title, 'location': job.location or ''},
        match_score=match_result
    )

    # Create application
    application = Application(
        user_id=current_user.id,
        resume_id=resolved_resume_id,
        job_id=job.id,
        match_score=match_result.get('overall_score'),
        match_breakdown=match_result,
        decision=decision['decision'],
        confidence=decision['confidence'],
        reasoning=decision,
        cover_letter=cover_letter,
        callback_probability=outcome.get('callback_probability'),
        status="applied",
        applied_at=datetime.utcnow()
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    return {
        "application_id": application.id,
        "status": "applied",
        "match_score": match_result.get('overall_score'),
        "callback_probability": outcome.get('callback_probability'),
        "cover_letter": cover_letter
    }
