# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import engine, Base
from routers import auth_router, resume_router, jobs_router, career_router, dashboard_router
from ml.model_loader import model_loader
from ml.embeddings import embedding_service
from ml.faiss_search import faiss_search

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("🚀 Starting Career Intelligence Platform...")

    # Create database tables
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created")

    # Models are loaded automatically via singletons
    print("✅ ML models loaded")
    print("✅ Embedding service ready")
    print("✅ FAISS search ready")

    print("🎉 Application ready!")

    yield

    # Shutdown
    print("👋 Shutting down...")

# Create FastAPI app
app = FastAPI(
    title="AI Career Intelligence Platform",
    description="AI-powered resume screening and job matching system",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(resume_router)
app.include_router(jobs_router)
app.include_router(career_router)
app.include_router(dashboard_router)

# Health check
@app.get("/")
async def root():
    return {
        "message": "AI Career Intelligence Platform API",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "models_loaded": len(model_loader._models),
        "faiss_ready": faiss_search._index is not None
    }
