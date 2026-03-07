# backend/models/application.py

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Float, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)

    # Match analysis
    match_score = Column(Float)
    match_breakdown = Column(JSON)  # {skill_match, experience_match, etc.}

    # Decision
    decision = Column(String(20))  # APPLY, SKIP, SAVE
    confidence = Column(Float)
    reasoning = Column(JSON)  # Agent reasoning

    # Generated content
    cover_letter = Column(Text)

    # Predictions
    callback_probability = Column(Float)

    # Status tracking
    status = Column(String(50), default="pending")  # pending, applied, interviewing, offered, rejected

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    applied_at = Column(DateTime)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="applications")
    resume = relationship("Resume", back_populates="applications")
    feedback = relationship("Feedback", back_populates="application", uselist=False)


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), nullable=False)

    got_interview = Column(Integer)  # 0 or 1
    got_offer = Column(Integer)  # 0 or 1

    notes = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    application = relationship("Application", back_populates="feedback")


class AgentLog(Base):
    __tablename__ = "agent_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    agent_name = Column(String(100))
    action = Column(String(255))
    input_data = Column(JSON)
    output_data = Column(JSON)
    reasoning = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
