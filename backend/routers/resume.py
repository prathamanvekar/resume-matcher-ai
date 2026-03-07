# backend/routers/resume.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import os
import shutil
from datetime import datetime, date

from database import get_db
from models.user import User
from models.resume import Resume, ResumeVersion
from models.application import Application, Feedback
from routers.auth import get_current_user
from services.resume_parser import resume_parser
from services.ats_scorer import ats_scorer
from agents.resume_optimizer import resume_optimizer
from agents.explainability_agent import explainability_agent
from ml.model_loader import model_loader

router = APIRouter(prefix="/api/resume", tags=["Resume"])

# Ensure uploads directory exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class ResumeResponse(BaseModel):
    id: int
    filename: str
    ats_score: Optional[float]
    predicted_category: Optional[str]
    extracted_skills: Optional[List[str]]
    parsed_data: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True

class ATSReportResponse(BaseModel):
    total_score: float
    passed: bool
    breakdown: dict
    recommendations: List[str]
    explanation: dict


def _strip_internal_parsed_fields(data: dict) -> dict:
    if not data:
        return {}
    return {
        key: value
        for key, value in data.items()
        if not str(key).startswith('_')
    }


def _json_safe(value):
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, dict):
        return {k: _json_safe(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_json_safe(item) for item in value]
    if isinstance(value, tuple):
        return [_json_safe(item) for item in value]
    if isinstance(value, set):
        return [_json_safe(item) for item in value]
    return value

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    target_role: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload and parse a resume"""
    # Validate file type
    allowed_extensions = ['.pdf', '.docx', '.doc', '.txt']
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Use: {allowed_extensions}")

    # Save file
    file_path = os.path.join(UPLOAD_DIR, f"{current_user.id}_{datetime.now().timestamp()}{ext}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Parse resume
        parsed_data = resume_parser.parse(file_path)

        if 'error' in parsed_data:
            raise HTTPException(status_code=400, detail=parsed_data['error'])

        # Calculate ATS score
        ats_result = ats_scorer.score(
            parsed_data.get('cleaned_text', ''),
            parsed_data.get('skills', [])
        )

        # Predict category
        category = None
        tfidf = model_loader.get_tfidf()
        classifier = model_loader.get_category_classifier()
        if tfidf and classifier:
            text_vector = tfidf.transform([parsed_data.get('cleaned_text', '')])
            category = classifier.predict(text_vector)[0]

        # Create resume record
        resume = Resume(
            user_id=current_user.id,
            filename=file.filename,
            original_text=parsed_data.get('raw_text'),
            parsed_data=parsed_data,
            extracted_skills=parsed_data.get('skills', []),
            predicted_category=category,
            ats_score=ats_result['total_score'],
            ats_breakdown=ats_result['breakdown'],
            target_role=target_role,
            is_primary=1 if not db.query(Resume).filter(Resume.user_id == current_user.id).first() else 0
        )

        db.add(resume)
        db.commit()
        db.refresh(resume)

        return {
            "id": resume.id,
            "filename": resume.filename,
            "parsed_data": parsed_data,
            "ats_score": ats_result,
            "predicted_category": category,
            "message": "Resume uploaded and parsed successfully"
        }

    finally:
        # Clean up uploaded file
        if os.path.exists(file_path):
            os.remove(file_path)

@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get resume details"""
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    parsed = _strip_internal_parsed_fields(resume.parsed_data or {})
    needs_enrichment = (
        not parsed.get('name')
        or not parsed.get('education')
        or not parsed.get('work_experience')
        or (parsed.get('experience_years') or 0) <= 0
    )

    if needs_enrichment and resume.original_text:
        reparsed = resume_parser.parse_text(resume.original_text)
        if 'error' not in reparsed:
            merged = dict(parsed)
            for key, value in reparsed.items():
                if key in ['raw_text', 'cleaned_text', 'word_count', 'parsing_method']:
                    if key not in merged:
                        merged[key] = value
                    continue

                current_value = merged.get(key)
                if current_value in (None, '', []) or (key == 'experience_years' and (current_value or 0) <= 0):
                    merged[key] = value

            metadata = {
                key: value
                for key, value in (resume.parsed_data or {}).items()
                if str(key).startswith('_')
            }
            resume.parsed_data = _json_safe({**merged, **metadata})
            if not resume.extracted_skills:
                resume.extracted_skills = merged.get('skills', [])
            db.commit()
            db.refresh(resume)

    return resume

@router.get("/{resume_id}/ats-report", response_model=ATSReportResponse)
async def get_ats_report(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed ATS report for a resume"""
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Recalculate ATS score
    ats_result = ats_scorer.score(
        resume.original_text or '',
        resume.extracted_skills or []
    )

    # Get explanation
    explanation = explainability_agent.explain_ats_score(ats_result)

    return {
        "total_score": ats_result['total_score'],
        "passed": ats_result['passed'],
        "breakdown": ats_result['breakdown'],
        "recommendations": ats_result['recommendations'],
        "explanation": explanation
    }

@router.post("/{resume_id}/optimize")
async def optimize_resume(
    resume_id: int,
    target_role: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Optimize resume for better ATS score"""
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # Get current ATS score
    current_ats = ats_scorer.score(
        resume.original_text or '',
        resume.extracted_skills or []
    )

    # Optimize
    result = resume_optimizer.optimize(
        resume.original_text or '',
        target_role=target_role or resume.target_role,
        current_score=current_ats
    )

    # Save as new version
    version_count = db.query(ResumeVersion).filter(
        ResumeVersion.resume_id == resume_id
    ).count()

    version = ResumeVersion(
        resume_id=resume_id,
        version_number=version_count + 1,
        version_name=f"{target_role or 'Optimized'} v{version_count + 1}",
        optimized_text=result['optimized_text'],
        changes_made=result['changes'],
        ats_score=result['final_score'],
        ats_breakdown=result.get('final_breakdown', {}),
        improvement_notes=f"Improved from {result['original_score']} to {result['final_score']}"
    )

    db.add(version)
    db.commit()
    db.refresh(version)

    parsed_data = dict(resume.parsed_data or {})
    if parsed_data.get('_base_original_text') is None:
        parsed_data['_base_original_text'] = resume.original_text
        parsed_data['_base_ats_score'] = resume.ats_score
        parsed_data['_base_ats_breakdown'] = resume.ats_breakdown
        parsed_data['_base_parsed_data'] = _strip_internal_parsed_fields(parsed_data)
        parsed_data['_base_extracted_skills'] = resume.extracted_skills or []
        parsed_data['_base_created_at'] = resume.created_at
        resume.parsed_data = _json_safe(parsed_data)
        db.commit()

    return {
        "version_id": version.id,
        "original_score": result['original_score'],
        "final_score": result['final_score'],
        "improvement": result['improvement'],
        "changes": result['changes']
    }

@router.get("/{resume_id}/versions")
async def get_resume_versions(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all versions of a resume"""
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    versions = db.query(ResumeVersion).filter(
        ResumeVersion.resume_id == resume_id
    ).order_by(ResumeVersion.version_number.desc()).all()

    parsed = resume.parsed_data or {}
    active_version_id = parsed.get('_active_version_id')

    original_score = parsed.get('_base_ats_score', resume.ats_score)
    original_created_at = parsed.get('_base_created_at', resume.created_at)

    return {
        "original": {
            "ats_score": original_score,
            "created_at": original_created_at,
            "is_active": active_version_id is None
        },
        "active_version_id": active_version_id,
        "versions": [
            {
                "id": v.id,
                "version_number": v.version_number,
                "version_name": v.version_name,
                "ats_score": v.ats_score,
                "improvement_notes": v.improvement_notes,
                "created_at": v.created_at,
                "is_active": v.id == active_version_id
            }
            for v in versions
        ]
    }


@router.post("/{resume_id}/versions/apply")
async def apply_resume_version(
    resume_id: int,
    version_id: Optional[int] = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Apply an optimized version to become the active resume. Pass no version_id to restore original."""
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    parsed_data = _json_safe(dict(resume.parsed_data or {}))
    if parsed_data.get('_base_original_text') is None:
        parsed_data['_base_original_text'] = resume.original_text
        parsed_data['_base_ats_score'] = resume.ats_score
        parsed_data['_base_ats_breakdown'] = resume.ats_breakdown
        parsed_data['_base_parsed_data'] = _strip_internal_parsed_fields(parsed_data)
        parsed_data['_base_extracted_skills'] = resume.extracted_skills or []
        parsed_data['_base_created_at'] = resume.created_at

    if version_id is None:
        resume.original_text = parsed_data.get('_base_original_text', resume.original_text)
        resume.ats_score = parsed_data.get('_base_ats_score', resume.ats_score)
        resume.ats_breakdown = parsed_data.get('_base_ats_breakdown', resume.ats_breakdown)
        resume.extracted_skills = parsed_data.get('_base_extracted_skills', resume.extracted_skills)
        base_parsed = parsed_data.get('_base_parsed_data', {})
        resume.parsed_data = _json_safe({
            **base_parsed,
            **{k: v for k, v in parsed_data.items() if str(k).startswith('_')},
            '_active_version_id': None
        })
        db.commit()
        return {"message": "Original resume restored", "active_version_id": None}

    version = db.query(ResumeVersion).filter(
        ResumeVersion.id == version_id,
        ResumeVersion.resume_id == resume_id
    ).first()

    if not version:
        raise HTTPException(status_code=404, detail="Resume version not found")

    optimized_text = version.optimized_text or ''
    reparsed = resume_parser.parse_text(optimized_text)
    if 'error' in reparsed:
        raise HTTPException(status_code=400, detail="Could not parse selected version")

    ats_result = ats_scorer.score(
        reparsed.get('cleaned_text', ''),
        reparsed.get('skills', [])
    )

    resume.original_text = optimized_text
    resume.parsed_data = _json_safe({
        **_strip_internal_parsed_fields(reparsed),
        **{k: v for k, v in parsed_data.items() if str(k).startswith('_')},
        '_active_version_id': version.id
    })
    resume.extracted_skills = reparsed.get('skills', [])
    resume.ats_score = ats_result.get('total_score', version.ats_score)
    resume.ats_breakdown = ats_result.get('breakdown', version.ats_breakdown)

    db.commit()

    return {
        "message": "Version applied successfully",
        "active_version_id": version.id,
        "ats_score": resume.ats_score
    }

@router.get("/")
async def list_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all resumes for current user"""
    resumes = db.query(Resume).filter(
        Resume.user_id == current_user.id
    ).order_by(Resume.created_at.desc()).all()

    return [
        {
            "id": r.id,
            "filename": r.filename,
            "ats_score": r.ats_score,
            "predicted_category": r.predicted_category,
            "is_primary": r.is_primary,
            "created_at": r.created_at
        }
        for r in resumes
    ]


@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a resume and related versions/applications for current user"""
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.user_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    was_primary = resume.is_primary == 1

    applications = db.query(Application).filter(
        Application.resume_id == resume_id,
        Application.user_id == current_user.id
    ).all()

    application_ids = [app.id for app in applications]
    if application_ids:
        db.query(Feedback).filter(Feedback.application_id.in_(application_ids)).delete(synchronize_session=False)

    db.query(Application).filter(
        Application.resume_id == resume_id,
        Application.user_id == current_user.id
    ).delete(synchronize_session=False)

    db.query(ResumeVersion).filter(ResumeVersion.resume_id == resume_id).delete(synchronize_session=False)
    db.delete(resume)
    db.commit()

    if was_primary:
        replacement = db.query(Resume).filter(
            Resume.user_id == current_user.id
        ).order_by(Resume.created_at.desc()).first()
        if replacement:
            replacement.is_primary = 1
            db.commit()

    return {"message": "Resume deleted successfully"}
