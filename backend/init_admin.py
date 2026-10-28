import sys
from app.db.session import SessionLocal
from app.models.models import User, UserRole
from app.core.security import get_password_hash

def init_db():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                display_name="Administrator Sistem",
                password_hash=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin)
            print("[+] Created default admin user: username='admin', password='admin123'")
        else:
            admin.display_name = "Administrator Sistem"

        dev_user = db.query(User).filter(User.username == "rnd1").first()
        if not dev_user:
            dev_user = User(
                username="rnd1",
                display_name="Tim Pengembangan (R&D)",
                password_hash=get_password_hash("rnd123"),
                role=UserRole.DEVELOPMENT,
                is_active=True
            )
            db.add(dev_user)
            print("[+] Created default development user: username='rnd1', password='rnd123'")

        routine = db.query(User).filter(User.username == "analyst1").first()
        if not routine:
            routine = User(
                username="analyst1",
                display_name="Fauzan Rizqy (Tim Rutin)",
                password_hash=get_password_hash("analyst123"),
                role=UserRole.ROUTINE,
                is_active=True
            )
            db.add(routine)
            print("[+] Created default routine user: username='analyst1', password='analyst123'")
        else:
            routine.display_name = "Fauzan Rizqy (Tim Rutin)"

        db.commit()
    except Exception as e:
        print(f"[-] Error seeding admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
