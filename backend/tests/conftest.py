import os

os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@localhost:5432/freestyle_test",
)
os.environ.setdefault("ENVIRONMENT", "test")
