import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from app.db.session import Base
from app.core.timezone import get_jakarta_now_naive

class UserRole(str, enum.Enum):
    ADMIN = "admin"                 # Administrator (full administrative control)
    DEVELOPMENT = "development"     # Tim Pengembangan (R&D Team: manage meetings, materials, quizzes)
    ROUTINE = "routine"             # Tim Rutin (Student / Analyst: learner access)

class MeetingType(str, enum.Enum):
    PRE_VALIDATION = "Pre-Validation"
    POST_VALIDATION = "Post-Validation"
    SOSIALISASI = "Sosialisasi"
    TRAINING = "Training"

class QuestionType(str, enum.Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(100), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.ROUTINE, nullable=False)
    position = Column(String(100), nullable=True) # Jabatan (e.g. Analis Kimia, Staff R&D, dll)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=get_jakarta_now_naive, nullable=False)
    updated_at = Column(DateTime, default=get_jakarta_now_naive, onupdate=get_jakarta_now_naive, nullable=False)

    quiz_results = relationship("QuizResult", back_populates="user", cascade="all, delete-orphan")
    attendances = relationship("MeetingAttendance", back_populates="user", cascade="all, delete-orphan")

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    project_name = Column(String(200), nullable=False)
    meeting_type = Column(SQLEnum(MeetingType), nullable=False)
    date_time = Column(DateTime, nullable=False)
    location = Column(String(255), nullable=True)
    meeting_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_jakarta_now_naive, nullable=False)
    updated_at = Column(DateTime, default=get_jakarta_now_naive, onupdate=get_jakarta_now_naive, nullable=False)

    learning_files = relationship("LearningFile", back_populates="meeting", cascade="all, delete-orphan")
    recordings = relationship("Recording", back_populates="meeting", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="meeting", cascade="all, delete-orphan")
    attendances = relationship("MeetingAttendance", back_populates="meeting", cascade="all, delete-orphan")

class LearningFile(Base):
    __tablename__ = "learning_files"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    original_filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False) # bytes
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=get_jakarta_now_naive, nullable=False)

    meeting = relationship("Meeting", back_populates="learning_files")

class Recording(Base):
    __tablename__ = "recordings"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    stored_filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False) # bytes
    created_at = Column(DateTime, default=get_jakarta_now_naive, nullable=False)

    meeting = relationship("Meeting", back_populates="recordings")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    quiz_type = Column(SQLEnum(MeetingType), nullable=False)
    title = Column(String(200), nullable=False)
    passing_score = Column(Integer, default=70, nullable=False) # e.g. 70 out of 100
    is_active = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=get_jakarta_now_naive, nullable=False)
    updated_at = Column(DateTime, default=get_jakarta_now_naive, onupdate=get_jakarta_now_naive, nullable=False)

    meeting = relationship("Meeting", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan", order_by="QuizQuestion.order_num")
    results = relationship("QuizResult", back_populates="quiz", cascade="all, delete-orphan")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    question_text = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)
    question_type = Column(SQLEnum(QuestionType), default=QuestionType.MULTIPLE_CHOICE, nullable=False)
    order_num = Column(Integer, default=1, nullable=False)

    quiz = relationship("Quiz", back_populates="questions")
    options = relationship("QuizOption", back_populates="question", cascade="all, delete-orphan")
    answers = relationship("QuizAnswer", back_populates="question", cascade="all, delete-orphan")

class QuizOption(Base):
    __tablename__ = "quiz_options"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False)
    option_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False, nullable=False)

    question = relationship("QuizQuestion", back_populates="options")

class QuizResult(Base):
    __tablename__ = "quiz_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    score = Column(Integer, nullable=False) # 0 to 100
    passed = Column(Boolean, nullable=False)
    created_at = Column(DateTime, default=get_jakarta_now_naive, nullable=False)

    user = relationship("User", back_populates="quiz_results")
    quiz = relationship("Quiz", back_populates="results")
    answers = relationship("QuizAnswer", back_populates="result", cascade="all, delete-orphan")

class QuizAnswer(Base):
    __tablename__ = "quiz_answers"

    id = Column(Integer, primary_key=True, index=True)
    result_id = Column(Integer, ForeignKey("quiz_results.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False)
    selected_option_id = Column(Integer, ForeignKey("quiz_options.id", ondelete="CASCADE"), nullable=True)

    result = relationship("QuizResult", back_populates="answers")
    question = relationship("QuizQuestion", back_populates="answers")
    selected_option = relationship("QuizOption")

class MeetingAttendance(Base):
    __tablename__ = "meeting_attendances"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    attended_at = Column(DateTime, default=get_jakarta_now_naive, nullable=False)

    meeting = relationship("Meeting", back_populates="attendances")
    user = relationship("User", back_populates="attendances")
