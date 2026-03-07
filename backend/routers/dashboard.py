# backend/routers/dashboard.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta

from database import get_db
from models.user import User
from models.resume import Resume
from models.application import Application, Feedback
from routers.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics"""
    # Count applications
    total_applications = db.query(Application).filter(
        Application.user_id == current_user.id
    ).count()

    # Count by status
    status_counts = db.query(
        Application.status,
        func.count(Application.id)
    ).filter(
        Application.user_id == current_user.id
    ).group_by(Application.status).all()

    status_dict = {status: count for status, count in status_counts}

    # Get interview count from feedback
    interviews = db.query(Feedback).join(Application).filter(
        Application.user_id == current_user.id,
        Feedback.got_interview == 1
    ).count()

    # Get offer count
    offers = db.query(Feedback).join(Application).filter(
        Application.user_id == current_user.id,
        Feedback.got_offer == 1
    ).count()

    # Average match score
    avg_match = db.query(func.avg(Application.match_score)).filter(
        Application.user_id == current_user.id
    ).scalar() or 0

    # Average callback probability
    avg_callback = db.query(func.avg(Application.callback_probability)).filter(
        Application.user_id == current_user.id
    ).scalar() or 0

    # Get resume count
    resume_count = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).count()

    # Best resume
    best_resume = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).order_by(Resume.ats_score.desc()).first()

    return {
        "total_applications": total_applications,
        "interviews": interviews,
        "offers": offers,
        "status_breakdown": status_dict,
        "average_match_score": round(avg_match, 1),
        "average_callback_probability": round(avg_callback, 1),
        "resume_count": resume_count,
        "best_resume": {
            "id": best_resume.id,
            "filename": best_resume.filename,
            "ats_score": best_resume.ats_score
        } if best_resume else None,
        "interview_rate": round(interviews / total_applications * 100, 1) if total_applications > 0 else 0,
        "offer_rate": round(offers / interviews * 100, 1) if interviews > 0 else 0
    }

@router.get("/applications")
async def get_application_history(
    limit: int = 50,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get application history"""
    from models.job import Job

    query = db.query(Application).filter(
        Application.user_id == current_user.id
    )

    if status:
        query = query.filter(Application.status == status)

    applications = query.order_by(
        Application.created_at.desc()
    ).limit(limit).all()

    results = []
    for app in applications:
        job = db.query(Job).filter(Job.id == app.job_id).first()
        results.append({
            "id": app.id,
            "job_title": job.title if job else "Unknown",
            "company": job.company if job else "Unknown",
            "match_score": app.match_score,
            "callback_probability": app.callback_probability,
            "decision": app.decision,
            "status": app.status,
            "applied_at": app.applied_at,
            "created_at": app.created_at
        })

    return results

@router.post("/feedback/{application_id}")
async def submit_feedback(
    application_id: int,
    got_interview: bool,
    got_offer: bool = False,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit feedback for an application"""
    application = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    # Check for existing feedback
    existing = db.query(Feedback).filter(
        Feedback.application_id == application_id
    ).first()

    if existing:
        # Update existing
        existing.got_interview = int(got_interview)
        existing.got_offer = int(got_offer)
        existing.notes = notes
    else:
        # Create new
        feedback = Feedback(
            application_id=application_id,
            got_interview=int(got_interview),
            got_offer=int(got_offer),
            notes=notes
        )
        db.add(feedback)

    # Update application status
    if got_offer:
        application.status = "offered"
    elif got_interview:
        application.status = "interviewing"

    db.commit()

    return {"message": "Feedback submitted successfully"}

@router.get("/insights")
async def get_career_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get personalized career insights"""
    from models.job import Job

    # Get all applications
    applications = db.query(Application).filter(
        Application.user_id == current_user.id
    ).all()

    if not applications:
        return {
            "message": "No applications yet. Start applying to get insights!",
            "insights": []
        }

    insights = []

    # Analyze successful applications
    successful = [a for a in applications if a.status in ['interviewing', 'offered']]
    if successful:
        avg_success_score = sum(a.match_score or 0 for a in successful) / len(successful)
        insights.append({
            "type": "success_pattern",
            "message": f"Your successful applications have an average match score of {avg_success_score:.0f}%. Aim for jobs above this threshold."
        })

    # Analyze common missing skills
    all_missing = []
    for app in applications:
        breakdown = app.match_breakdown or {}
        missing = breakdown.get('missing_skills', [])
        all_missing.extend(missing)

    if all_missing:
        from collections import Counter
        common_missing = Counter(all_missing).most_common(5)
        insights.append({
            "type": "skill_gap",
            "message": f"Most commonly missing skills: {', '.join(s[0] for s in common_missing[:3])}",
            "skills": [{"skill": s[0], "count": s[1]} for s in common_missing]
        })

    # Application timing insight
    insights.append({
        "type": "timing",
        "message": "Best time to apply is typically Tuesday-Thursday, 9 AM - 11 AM local time."
    })

    return {
        "total_applications": len(applications),
        "success_rate": len(successful) / len(applications) * 100 if applications else 0,
        "insights": insights
    }
