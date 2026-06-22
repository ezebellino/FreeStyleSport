import os

os.environ["DATABASE_URL"] = (
    "postgresql+psycopg://postgres:postgres@localhost:5432/freestyle_test"
)
os.environ["ENVIRONMENT"] = "test"
