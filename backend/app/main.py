from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import api_router
from app.db.session import engine, Base

# Auto create tables if db connection is ready
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"[*] Notice: Database table creation deferred or DB not yet connected: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow LAN origins dynamically
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "docs": f"{settings.API_V1_STR}/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}
