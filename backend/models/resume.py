# backend/models/resume.py

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, ForeignKey, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # File info
    filename = Column(String(255), nullable=False)
    original_text = Column(Text)

    # Parsed data
    parsed_data = Column(JSON)  # {name, email, phone, skills, experience, education, etc.}
    extracted_skills = Column(JSON, default=list)
    predicted_category = Column(String(100))

    # ATS Score
    ats_score = Column(Float)
    ats_breakdown = Column(JSON)  # {length_score, skill_score, etc.}

    # Metadata
    target_role = Column(String(255))
    is_primary = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="resumes")
    versions = relationship("ResumeVersion", back_populates="resume")
    applications = relationship("Application", back_populates="resume")


class ResumeVersion(Base):
    __tablename__ = "resume_versions"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=False)

    version_number = Column(Integer, nullable=False)
    version_name = Column(String(255))  # e.g., "Data Scientist Optimized"

    # Content
    optimized_text = Column(Text)
    changes_made = Column(JSON)  # List of changes made

    # Scores
    ats_score = Column(Float)
    ats_breakdown = Column(JSON)
    improvement_notes = Column(Text)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    resume = relationship("Resume", back_populates="versions")
