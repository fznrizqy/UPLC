from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.session import get_db
from app.models.models import Meeting, LearningFile, Recording, Quiz, QuizResult, User
from app.schemas.schemas import DashboardStats
from app.api.deps import get_current_user
from app.core.timezone import get_jakarta_now_naive

router = APIRouter()

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = get_jakarta_now_naive()
    total_meetings = db.query(Meeting).count()
    upcoming_meetings_count = db.query(Meeting).filter(Meeting.date_time >= now).count()
    total_materials = db.query(LearningFile).count()
    total_recordings = db.query(Recording).count()
    total_quizzes = db.query(Quiz).filter(Quiz.is_active == True).count()

    # User's quiz stats: calculate using only the LATEST attempt per unique quiz
    all_user_results = db.query(QuizResult).filter(
        QuizResult.user_id == current_user.id
    ).order_by(QuizResult.created_at.desc()).all()

    # Group by quiz_id and keep only the latest result
    latest_by_quiz = {}
    for r in all_user_results:
        if r.quiz_id not in latest_by_quiz:
            latest_by_quiz[r.quiz_id] = r

    unique_latest_results = list(latest_by_quiz.values())
    user_completed_quizzes = len(unique_latest_results)
    user_passed_quizzes = len([r for r in unique_latest_results if r.passed])

    upcoming_meetings = db.query(Meeting).filter(Meeting.date_time >= now).order_by(Meeting.date_time.asc()).limit(5).all()
    recent_materials = db.query(LearningFile).order_by(LearningFile.created_at.desc()).limit(5).all()
    recent_recordings = db.query(Recording).order_by(Recording.created_at.desc()).limit(5).all()
    recent_user_results = all_user_results[:5]

    return {
        "total_meetings": total_meetings,
        "upcoming_meetings_count": upcoming_meetings_count,
        "total_materials": total_materials,
        "total_recordings": total_recordings,
        "total_quizzes": total_quizzes,
        "user_completed_quizzes": user_completed_quizzes,
        "user_passed_quizzes": user_passed_quizzes,
        "upcoming_meetings": upcoming_meetings,
        "recent_materials": recent_materials,
        "recent_recordings": recent_recordings,
        "recent_user_results": recent_user_results
    }
