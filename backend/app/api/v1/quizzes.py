from typing import List, Optional
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models.models import Quiz, QuizQuestion, QuizOption, QuizResult, QuizAnswer, User, UserRole
from app.schemas.schemas import (
    QuizOut, QuizCreate, QuizUpdate, QuizQuestionCreate, QuizQuestionOut,
    QuizSubmitRequest, QuizResultOut
)
from app.api.deps import get_current_user, get_current_admin, get_current_development_or_admin

router = APIRouter()

ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}

@router.post("/upload-image")
async def upload_quiz_image(
    file: UploadFile = File(...),
    manager: User = Depends(get_current_development_or_admin)
):
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Tipe file tidak didukung '{ext}'. Hanya gambar (PNG, JPG, JPEG, WEBP, GIF) yang diperbolehkan."
        )

    safe_filename = f"{uuid.uuid4().hex}{ext}"
    dest_path = settings.IMAGES_DIR / safe_filename

    max_bytes = settings.UPLOAD_MAX_IMAGE_SIZE_MB * 1024 * 1024
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Ukuran gambar melebihi batas maksimum {settings.UPLOAD_MAX_IMAGE_SIZE_MB}MB"
        )

    with open(dest_path, "wb") as f:
        f.write(content)

    return {
        "filename": safe_filename,
        "url": f"/api/v1/quizzes/images/{safe_filename}"
    }

@router.get("/images/{filename}")
def get_quiz_image(filename: str):
    # Prevent path traversal
    file_path = (settings.IMAGES_DIR / filename).resolve()
    if not str(file_path).startswith(str(settings.IMAGES_DIR.resolve())) or not file_path.exists():
        raise HTTPException(status_code=404, detail="Gambar tidak ditemukan")
    
    ext = file_path.suffix.lower()
    media_type = "image/png"
    if ext in [".jpg", ".jpeg"]:
        media_type = "image/jpeg"
    elif ext == ".webp":
        media_type = "image/webp"
    elif ext == ".gif":
        media_type = "image/gif"

    return FileResponse(path=str(file_path), media_type=media_type)

@router.get("", response_model=List[QuizOut])
def list_quizzes(
    meeting_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Quiz)
    if meeting_id:
        query = query.filter(Quiz.meeting_id == meeting_id)
    # If not admin or development, only show active quizzes
    if current_user.role not in (UserRole.ADMIN, UserRole.DEVELOPMENT):
        query = query.filter(Quiz.is_active == True)
    quizzes = query.order_by(Quiz.created_at.desc()).all()

    # Populate submissions_count for management view
    if current_user.role in (UserRole.ADMIN, UserRole.DEVELOPMENT):
        for q in quizzes:
            q.submissions_count = db.query(QuizResult).filter(QuizResult.quiz_id == q.id).count()

    # If routine user, strip out is_correct
    if current_user.role not in (UserRole.ADMIN, UserRole.DEVELOPMENT):
        for q in quizzes:
            for question in q.questions:
                for opt in question.options:
                    opt.is_correct = None
    return quizzes

@router.post("", response_model=QuizOut)
def create_quiz(
    quiz_in: QuizCreate,
    db: Session = Depends(get_db),
    manager: User = Depends(get_current_development_or_admin)
):
    quiz = Quiz(
        meeting_id=quiz_in.meeting_id,
        quiz_type=quiz_in.quiz_type,
        title=quiz_in.title,
        passing_score=quiz_in.passing_score,
        is_active=quiz_in.is_active
    )
    db.add(quiz)
    db.flush()

    if quiz_in.questions:
        for q_idx, q_data in enumerate(quiz_in.questions, start=1):
            question = QuizQuestion(
                quiz_id=quiz.id,
                question_text=q_data.question_text,
                image_url=q_data.image_url,
                question_type=q_data.question_type,
                order_num=q_data.order_num or q_idx
            )
            db.add(question)
            db.flush()

            for opt_data in q_data.options:
                option = QuizOption(
                    question_id=question.id,
                    option_text=opt_data.option_text,
                    is_correct=opt_data.is_correct
                )
                db.add(option)

    db.commit()
    db.refresh(quiz)
    return quiz

@router.get("/{quiz_id}", response_model=QuizOut)
def get_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if not quiz.is_active and current_user.role not in (UserRole.ADMIN, UserRole.DEVELOPMENT):
        raise HTTPException(
            status_code=403,
            detail="Kuis saat ini sedang dinonaktifkan oleh Tim Pengembangan. Silakan hubungi Tim terkait"
        )

    # Populate submissions_count for management view
    if current_user.role in (UserRole.ADMIN, UserRole.DEVELOPMENT):
        quiz.submissions_count = db.query(QuizResult).filter(QuizResult.quiz_id == quiz.id).count()

    # If student, do NOT expose correct answers before submission
    if current_user.role not in (UserRole.ADMIN, UserRole.DEVELOPMENT):
        for question in quiz.questions:
            for opt in question.options:
                opt.is_correct = None
    return quiz

@router.put("/{quiz_id}", response_model=QuizOut)
def update_quiz(
    quiz_id: int,
    quiz_in: QuizUpdate,
    db: Session = Depends(get_db),
    manager: User = Depends(get_current_development_or_admin)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    submissions_count = db.query(QuizResult).filter(QuizResult.quiz_id == quiz.id).count()

    # Safeguard check: If questions are being edited
    if quiz_in.questions is not None:
        if submissions_count > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Soal tidak dapat diubah karena sudah ada {submissions_count} peserta yang telah mengerjakan kuis ini."
            )
        if quiz.is_active and (quiz_in.is_active is None or quiz_in.is_active is True):
            raise HTTPException(
                status_code=400,
                detail="Kuis sedang aktif. Harap nonaktifkan kuis terlebih dahulu sebelum mengubah struktur soal."
            )

    old_passing_score = quiz.passing_score

    # Update basic metadata fields
    if quiz_in.title is not None:
        quiz.title = quiz_in.title
    if quiz_in.quiz_type is not None:
        quiz.quiz_type = quiz_in.quiz_type
    if quiz_in.passing_score is not None:
        quiz.passing_score = quiz_in.passing_score
    if quiz_in.is_active is not None:
        quiz.is_active = quiz_in.is_active

    # If passing score changed and there are existing submissions, auto-sync their passed status
    if quiz_in.passing_score is not None and quiz_in.passing_score != old_passing_score and submissions_count > 0:
        db.query(QuizResult).filter(QuizResult.quiz_id == quiz.id).update(
            {QuizResult.passed: QuizResult.score >= quiz.passing_score},
            synchronize_session=False
        )

    # If questions update provided and allowed (quiz inactive and 0 submissions)
    if quiz_in.questions is not None and submissions_count == 0:
        # Clear existing questions (cascade will remove options)
        for existing_q in quiz.questions:
            db.delete(existing_q)
        db.flush()

        # Add updated questions
        for q_idx, q_data in enumerate(quiz_in.questions, start=1):
            question = QuizQuestion(
                quiz_id=quiz.id,
                question_text=q_data.question_text,
                image_url=q_data.image_url,
                question_type=q_data.question_type,
                order_num=q_data.order_num or q_idx
            )
            db.add(question)
            db.flush()

            for opt_data in q_data.options:
                option = QuizOption(
                    question_id=question.id,
                    option_text=opt_data.option_text,
                    is_correct=opt_data.is_correct
                )
                db.add(option)

    db.commit()
    db.refresh(quiz)
    quiz.submissions_count = db.query(QuizResult).filter(QuizResult.quiz_id == quiz.id).count()
    return quiz

@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    manager: User = Depends(get_current_development_or_admin)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    db.delete(quiz)
    db.commit()
    return None

@router.post("/{quiz_id}/submit", response_model=QuizResultOut)
def submit_quiz(
    quiz_id: int,
    submit_req: QuizSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if not quiz.is_active:
        raise HTTPException(status_code=400, detail="Cannot submit to an inactive quiz")

    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz_id).all()
    if not questions:
        raise HTTPException(status_code=400, detail="Quiz has no questions")

    # Map user answers
    answer_map = {ans.question_id: ans.selected_option_id for ans in submit_req.answers}

    correct_count = 0
    total_questions = len(questions)

    # Prepare answers to record
    recorded_answers = []

    for q in questions:
        selected_opt_id = answer_map.get(q.id)
        if selected_opt_id:
            # Check correctness securely on backend
            correct_opt = db.query(QuizOption).filter(
                QuizOption.id == selected_opt_id,
                QuizOption.question_id == q.id,
                QuizOption.is_correct == True
            ).first()
            if correct_opt:
                correct_count += 1
            recorded_answers.append(QuizAnswer(
                question_id=q.id,
                selected_option_id=selected_opt_id
            ))
        else:
            recorded_answers.append(QuizAnswer(
                question_id=q.id,
                selected_option_id=None
            ))

    score = round((correct_count / total_questions) * 100)
    passed = score >= quiz.passing_score

    result = QuizResult(
        user_id=current_user.id,
        quiz_id=quiz.id,
        score=score,
        passed=passed
    )
    db.add(result)
    db.flush()

    for ans in recorded_answers:
        ans.result_id = result.id
        db.add(ans)

    db.commit()
    db.refresh(result)
    return result
