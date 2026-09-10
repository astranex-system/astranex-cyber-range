import os
from fastapi import FastAPI, Request, Response
from fastapi.responses import PlainTextResponse
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

SECURITY_TXT_CONTENT = """# RFC 9116 Official Security Disclosure Standard
Contact: mailto:astranexdefence@gmail.com
Contact: https://astranex-cyber-range.netlify.app/security
Expires: 2027-12-31T23:59:59.000Z
Encryption: https://astranex-cyber-range.netlify.app/pgp-key.txt
Preferred-Languages: en
Canonical: https://astranex-cyber-range.netlify.app/.well-known/security.txt
Policy: https://astranex-cyber-range.netlify.app/security-policy
"""

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

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

@app.get("/security.txt", response_class=PlainTextResponse)
@app.get("/.well-known/security.txt", response_class=PlainTextResponse)
def get_security_txt():
    return PlainTextResponse(content=SECURITY_TXT_CONTENT, media_type="text/plain")

@app.get("/")
def root():
    return {
        "status": "ONLINE",
        "system": "AstraNex Defence Cyber Range API Engine",
        "version": "1.0.0",
        "operation": "Operation Blackout"
    }
