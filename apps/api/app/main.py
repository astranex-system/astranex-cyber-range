import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, assessment, admin

# Create tables on startup if not present
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AstraNex Cyber Range API",
    description="Backend API for AstraNex Defence Cyber Range Technical Assessment Platform",
    version="1.0.0"
)

ALLOWED_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "https://astranex-cyber-range.netlify.app,https://astranex-cyber-range.vercel.app,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in ALLOWED_ORIGINS if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(assessment.router)
app.include_router(admin.router)

@app.get("/")
def root():
    return {
        "status": "ONLINE",
        "system": "AstraNex Defence Cyber Range API Engine",
        "version": "1.0.0",
        "operation": "Operation Blackout"
    }
