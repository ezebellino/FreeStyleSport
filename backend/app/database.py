from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from fastapi import Depends
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

print("DATABASE_URL:", SQLALCHEMY_DATABASE_URL)

def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()