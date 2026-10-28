from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.core.security import verify_password, create_access_token, get_password_hash
from app.models.models import User, UserRole
from app.schemas.schemas import Token, LoginRequest, RegisterRequest, UserOut
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/register", response_model=UserOut)
def register_user(
    reg_data: RegisterRequest,
    db: Session = Depends(get_db)
):
    cleaned_username = reg_data.username.strip().upper()
    cleaned_name = reg_data.display_name.strip()
    
    import re
    if not re.match(r"^[A-Z]{3}$", cleaned_username):
        raise HTTPException(status_code=400, detail="Username wajib tepat 3 huruf alfabet kapital (contoh: ABC)")
    if len(reg_data.password) < 4:
        raise HTTPException(status_code=400, detail="Password minimal 4 karakter")
    if not cleaned_name:
        raise HTTPException(status_code=400, detail="Nama lengkap tidak boleh kosong")

    existing = db.query(User).filter(User.username == cleaned_username).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Username '{cleaned_username}' sudah terdaftar. Silakan gunakan inisial lain.")

    # Create user with default is_active=False (Pending Approval) and default routine role
    new_user = User(
        username=cleaned_username,
        display_name=cleaned_name,
        password_hash=get_password_hash(reg_data.password),
        role=UserRole.ROUTINE,
        position=reg_data.position.strip() if reg_data.position else None,
        is_active=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login_for_access_token(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    input_username = login_data.username.strip()
    # Case-insensitive lookup or exact match with uppercase for 3-letter initials
    user = db.query(User).filter(
        (User.username == input_username) | (User.username == input_username.upper())
    ).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau kata sandi tidak valid",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun Anda masih dalam status PENDING atau Dinonaktifkan. Silakan hubungi Administrator untuk aktivasi dan penetapan peran."
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.username, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
