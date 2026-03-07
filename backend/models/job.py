# backend/models/job.py

from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Float
from datetime import datetime
from database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)

    # Job details
    title = Column(String(500), nullable=False)
    company = Column(String(255))
    description = Column(Text)
    location = Column(String(255))

    # Salary
    salary_min = Column(Float)
    salary_max = Column(Float)
    salary_currency = Column(String(10), default="USD")
    pay_period = Column(String(50))  # YEARLY, MONTHLY, HOURLY

    # Job attributes
    work_type = Column(String(50))  # Full-time, Part-time, Contract
    experience_level = Column(String(50))  # Entry, Mid, Senior, Executive
    remote_allowed = Column(Integer, default=0)

    # Skills
    required_skills = Column(JSON, default=list)

    # Source
    source = Column(String(50), default="manual")  # manual, linkedin, etc.
    source_url = Column(String(500))

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
