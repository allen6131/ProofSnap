from collections.abc import Generator
import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["JWT_SECRET"] = "test-secret"
os.environ["CORS_ORIGINS"] = "http://localhost:5173"

from app.db import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture()
def db_session() -> Generator:
    engine = create_engine(
        "sqlite+pysqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture()
def client(db_session) -> Generator[TestClient, None, None]:
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
