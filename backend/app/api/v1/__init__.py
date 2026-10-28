from fastapi import APIRouter
from app.api.v1 import auth, meetings, files, recordings, quizzes, results, users, dashboard

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(meetings.router, prefix="/meetings", tags=["Meetings"])
api_router.include_router(files.router, prefix="/files", tags=["Materials"])
api_router.include_router(recordings.router, prefix="/recordings", tags=["Recordings"])
api_router.include_router(quizzes.router, prefix="/quizzes", tags=["Quizzes"])
api_router.include_router(results.router, prefix="/results", tags=["Results"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
