import sys
from datetime import datetime, timedelta
from app.db.session import SessionLocal
from app.models.models import Meeting, MeetingType, LearningFile, Quiz, QuizQuestion, QuizOption, User, UserRole
from app.core.security import get_password_hash

def seed_sample_lab_data():
    db = SessionLocal()
    try:
        # Check if meeting already exists
        existing = db.query(Meeting).first()
        if existing:
            print("[i] Sample data already exists, skipping seed.")
            return

        print("[*] Seeding sample pharmaceutical method validation meetings & quizzes...")

        # 1. Pre-Validation Meeting
        meeting_pre = Meeting(
            title="Sosialisasi Validasi Metode Penetapan Kadar Parasetamol Tablet",
            project_name="VAL-HPLC-PCT-001",
            meeting_type=MeetingType.PRE_VALIDATION,
            date_time=datetime.utcnow() + timedelta(days=2),
            meeting_url="https://meet.google.com/abc-defg-hij",
            description="Pembahasan rancangan protokol validasi metode uji kadar zat aktif Parasetamol menggunakan instrumen HPLC Reverse Phase C18. Parameter: Presisi, Akurasi, Linearitas, dan Robustness."
        )
        db.add(meeting_pre)

        # 2. Post-Validation Meeting
        meeting_post = Meeting(
            title="Evaluasi Hasil Uji Disolusi Terdisolusi & Penetapan Kadar Metformin",
            project_name="VAL-DIS-MET-002",
            meeting_type=MeetingType.POST_VALIDATION,
            date_time=datetime.utcnow() + timedelta(days=5),
            meeting_url="https://meet.google.com/xyz-uvwx-rst",
            description="Kajian laporan hasil transfer validasi metode disolusi multi-point Metformin HCl bersama Tim Analis Rutin Laboratorium Quality Control."
        )
        db.add(meeting_post)
        db.flush()

        # 3. Add Pre-Validation Quiz
        quiz_pre = Quiz(
            meeting_id=meeting_pre.id,
            quiz_type=MeetingType.PRE_VALIDATION,
            title="Kuis Pemahaman Protokol Uji Presisi & Linearitas HPLC",
            passing_score=70,
            is_active=True
        )
        db.add(quiz_pre)
        db.flush()

        q1 = QuizQuestion(
            quiz_id=quiz_pre.id,
            question_text="Berapakah kriteria penerimaan RSD (Relative Standard Deviation) untuk pengujian presisi keterulangan (repeatability) penetapan kadar zat aktif farmasi menurut USP/ICH?",
            order_num=1
        )
        db.add(q1)
        db.flush()

        db.add_all([
            QuizOption(question_id=q1.id, option_text="RSD <= 2.0%", is_correct=True),
            QuizOption(question_id=q1.id, option_text="RSD <= 5.0%", is_correct=False),
            QuizOption(question_id=q1.id, option_text="RSD <= 10.0%", is_correct=False),
            QuizOption(question_id=q1.id, option_text="RSD boleh berapa saja asalkan linier", is_correct=False),
        ])

        q2 = QuizQuestion(
            quiz_id=quiz_pre.id,
            question_text="Koefisien korelasi determinasi (R^2) yang umum dipersyaratkan pada kurva kalibrasi linearitas HPLC adalah minimal...",
            order_num=2
        )
        db.add(q2)
        db.flush()

        db.add_all([
            QuizOption(question_id=q2.id, option_text="R^2 >= 0.999 atau r >= 0.995", is_correct=True),
            QuizOption(question_id=q2.id, option_text="R^2 >= 0.800", is_correct=False),
            QuizOption(question_id=q2.id, option_text="R^2 >= 0.900", is_correct=False),
            QuizOption(question_id=q2.id, option_text="R^2 <= 0.500", is_correct=False),
        ])

        # 4. Add Post-Validation Quiz
        quiz_post = Quiz(
            meeting_id=meeting_post.id,
            quiz_type=MeetingType.POST_VALIDATION,
            title="Kuis Evaluasi Prosedur Uji Disolusi Tahap Pasca Validasi",
            passing_score=80,
            is_active=True
        )
        db.add(quiz_post)
        db.flush()

        q3 = QuizQuestion(
            quiz_id=quiz_post.id,
            question_text="Pada uji disolusi sediaan padat, toleransi suhu media disolusi yang diatur dalam bejana adalah...",
            order_num=1
        )
        db.add(q3)
        db.flush()

        db.add_all([
            QuizOption(question_id=q3.id, option_text="37 ± 0.5 derajat Celsius", is_correct=True),
            QuizOption(question_id=q3.id, option_text="25 ± 2.0 derajat Celsius", is_correct=False),
            QuizOption(question_id=q3.id, option_text="40 ± 1.0 derajat Celsius", is_correct=False),
            QuizOption(question_id=q3.id, option_text="Suhu ruangan tanpa pengatur suhu", is_correct=False),
        ])

        db.commit()
        print("[+] Successfully seeded sample meetings and evaluation quizzes!")
    except Exception as e:
        print(f"[-] Error seeding sample data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_sample_lab_data()
