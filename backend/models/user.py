# backend/models/user.py

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))

    # Career preferences
    target_role = Column(String(255))
    preferred_locations = Column(JSON, default=list)  # List of locations
    salary_min = Column(Integer)
    salary_max = Column(Integer)
    career_goals = Column(Text)
    current_skills = Column(JSON, default=list)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    resumes = relationship("Resume", back_populates="user")
    applications = relationship("Application", back_populates="user")
