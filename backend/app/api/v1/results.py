import csv
import io
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import QuizResult, Quiz, User, UserRole, Meeting
from app.schemas.schemas import QuizResultOut
from app.api.deps import get_current_user, get_current_admin, get_current_development_or_admin

router = APIRouter()

@router.get("/my-results", response_model=List[QuizResultOut])
def get_my_results(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = db.query(QuizResult).filter(QuizResult.user_id == current_user.id).order_by(QuizResult.created_at.desc()).all()
    return results

@router.get("/all", response_model=List[QuizResultOut])
def get_all_results(
    meeting_id: Optional[int] = None,
    quiz_id: Optional[int] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db),
    manager: User = Depends(get_current_development_or_admin)
):
    query = db.query(QuizResult).join(Quiz)
    if meeting_id:
        query = query.filter(Quiz.meeting_id == meeting_id)
    if quiz_id:
        query = query.filter(QuizResult.quiz_id == quiz_id)
    if user_id:
        query = query.filter(QuizResult.user_id == user_id)

    return query.order_by(QuizResult.created_at.desc()).all()

@router.get("/export-csv")
def export_results_csv(
    meeting_id: Optional[int] = None,
    quiz_id: Optional[int] = None,
    db: Session = Depends(get_db),
    manager: User = Depends(get_current_development_or_admin)
):
    query = db.query(QuizResult).join(Quiz).join(User)
    if meeting_id:
        query = query.filter(Quiz.meeting_id == meeting_id)
    if quiz_id:
        query = query.filter(QuizResult.quiz_id == quiz_id)

    results = query.order_by(QuizResult.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Result ID", "User Display Name", "Username", "Meeting Title",
        "Quiz Title", "Quiz Type", "Score", "Passing Score", "Passed", "Submission Date"
    ])

    for r in results:
        meeting_title = r.quiz.meeting.title if r.quiz and r.quiz.meeting else "N/A"
        writer.writerow([
            r.id,
            r.user.display_name if r.user else "N/A",
            r.user.username if r.user else "N/A",
            meeting_title,
            r.quiz.title if r.quiz else "N/A",
            r.quiz.quiz_type.value if r.quiz else "N/A",
            f"{r.score}%",
            f"{r.quiz.passing_score}%" if r.quiz else "N/A",
            "PASS" if r.passed else "FAIL",
            r.created_at.strftime("%Y-%m-%d %H:%M:%S")
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=quiz_results.csv"}
    )
