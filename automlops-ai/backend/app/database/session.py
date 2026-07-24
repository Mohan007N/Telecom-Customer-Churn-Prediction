"""
Database Session Management
Supports both SQLite (local dev) and PostgreSQL (production).
"""

from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# SQLite needs check_same_thread=False for FastAPI
connect_args = {}
if "sqlite" in settings.DATABASE_URL_SYNC:
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL_SYNC,
    pool_pre_ping=True,
    connect_args=connect_args
)

# Enable WAL mode for SQLite (better concurrent read performance)
if "sqlite" in settings.DATABASE_URL_SYNC:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for database sessions"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
