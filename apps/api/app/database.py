import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DB_PATH = os.getenv("DATABASE_URL", "sqlite:///./astranex.db")

# Fix Heroku/Neon postgres:// scheme to postgresql:// for SQLAlchemy compatibility
if DB_PATH.startswith("postgres://"):
    DB_PATH = DB_PATH.replace("postgres://", "postgresql://", 1)

# For SQLite, check_same_thread=False is required for multi-threading in FastAPI
connect_args = {"check_same_thread": False} if DB_PATH.startswith("sqlite") else {}

# Connection pool settings for fast response times and pre-ping to prevent stale connections
engine_kwargs = {"connect_args": connect_args, "echo": False, "pool_pre_ping": True}
if not DB_PATH.startswith("sqlite"):
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
        "pool_recycle": 300
    })

engine = create_engine(DB_PATH, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
