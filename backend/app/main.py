from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import Base, engine
from .routers import auth, workers, policies, events, claims, dashboard

# For this learning project we create tables automatically.
# Production projects should normally use Alembic migrations.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Insurly API",
    version="1.0.0",
    description="Parametric insurance backend built with FastAPI and PostgreSQL.",
)

origins = [item.strip() for item in settings.cors_origins.split(",") if item.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(workers.router)
app.include_router(policies.router)
app.include_router(events.router)
app.include_router(claims.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {"message": "Insurly API is running", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}
