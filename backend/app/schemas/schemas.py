from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.models import UserRole, MeetingType, QuestionType

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    display_name: str
    role: UserRole = UserRole.ROUTINE
    position: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    role: Optional[UserRole] = None
    position: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserOut(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class TokenPayload(BaseModel):
    sub: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    display_name: str
    position: Optional[str] = None

# --- Meeting Schemas ---
class MeetingBase(BaseModel):
    title: str
    project_name: str
    meeting_type: MeetingType
    date_time: datetime
    location: Optional[str] = None
    meeting_url: Optional[str] = None
    description: Optional[str] = None

class MeetingCreate(MeetingBase):
    pass

class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    project_name: Optional[str] = None
    meeting_type: Optional[MeetingType] = None
    date_time: Optional[datetime] = None
    location: Optional[str] = None
    meeting_url: Optional[str] = None
    description: Optional[str] = None

# --- Learning File Schemas ---
class LearningFileOut(BaseModel):
    id: int
    meeting_id: int
    original_filename: str
    mime_type: str
    file_size: int
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Recording Schemas ---
class RecordingOut(BaseModel):
    id: int
    meeting_id: int
    title: str
    mime_type: str
    file_size: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- Quiz Schemas ---
class QuizOptionCreate(BaseModel):
    option_text: str
    is_correct: bool = False

class QuizOptionOut(BaseModel):
    id: int
    option_text: str
    # is_correct is intentionally excluded for routine users taking the quiz!
    is_correct: Optional[bool] = None

    class Config:
        from_attributes = True

class QuizQuestionCreate(BaseModel):
    question_text: str
    image_url: Optional[str] = None
    question_type: QuestionType = QuestionType.MULTIPLE_CHOICE
    order_num: int = 1
    options: List[QuizOptionCreate]

class QuizQuestionOut(BaseModel):
    id: int
    quiz_id: int
    question_text: str
    image_url: Optional[str] = None
    question_type: QuestionType
    order_num: int
    options: List[QuizOptionOut]

    class Config:
        from_attributes = True

class QuizBase(BaseModel):
    title: str
    quiz_type: MeetingType
    passing_score: int = 70
    is_active: bool = False

class QuizCreate(QuizBase):
    meeting_id: int
    questions: Optional[List[QuizQuestionCreate]] = []

class QuizOptionUpdate(BaseModel):
    id: Optional[int] = None
    option_text: str
    is_correct: bool = False

class QuizQuestionUpdate(BaseModel):
    id: Optional[int] = None
    question_text: str
    image_url: Optional[str] = None
    question_type: QuestionType = QuestionType.MULTIPLE_CHOICE
    order_num: Optional[int] = 1
    options: List[QuizOptionUpdate] = []

class QuizUpdate(BaseModel):
    title: Optional[str] = None
    quiz_type: Optional[MeetingType] = None
    passing_score: Optional[int] = None
    is_active: Optional[bool] = None
    questions: Optional[List[QuizQuestionUpdate]] = None

class QuizOut(QuizBase):
    id: int
    meeting_id: int
    created_at: datetime
    updated_at: datetime
    questions: Optional[List[QuizQuestionOut]] = None
    submissions_count: Optional[int] = 0

    class Config:
        from_attributes = True

# --- Quiz Submission & Results ---
class QuizAnswerSubmit(BaseModel):
    question_id: int
    selected_option_id: Optional[int] = None

class QuizSubmitRequest(BaseModel):
    answers: List[QuizAnswerSubmit]

class QuizResultOut(BaseModel):
    id: int
    user_id: int
    quiz_id: int
    score: int
    passed: bool
    created_at: datetime
    user: Optional[UserOut] = None
    quiz: Optional[QuizOut] = None

    class Config:
        from_attributes = True

# --- Attendance Schemas ---
class AttendanceOut(BaseModel):
    id: int
    meeting_id: int
    user_id: int
    attended_at: datetime
    user: Optional[UserOut] = None
    meeting: Optional[MeetingBase] = None

    class Config:
        from_attributes = True

# --- Meeting Detail Output (Nested) ---
class MeetingOut(MeetingBase):
    id: int
    created_at: datetime
    updated_at: datetime
    learning_files: List[LearningFileOut] = []
    recordings: List[RecordingOut] = []
    quizzes: List[QuizOut] = []
    attendances_count: Optional[int] = 0
    is_attended_by_me: Optional[bool] = False

    class Config:
        from_attributes = True

# --- Dashboard Stats Schemas ---
class DashboardStats(BaseModel):
    total_meetings: int
    upcoming_meetings_count: int
    total_materials: int
    total_recordings: int
    total_quizzes: int
    user_completed_quizzes: int
    user_passed_quizzes: int
    upcoming_meetings: List[MeetingOut]
    recent_materials: List[LearningFileOut]
    recent_recordings: List[RecordingOut]
    recent_user_results: List[QuizResultOut]
