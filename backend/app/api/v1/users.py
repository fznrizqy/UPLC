from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User, UserRole
from app.schemas.schemas import UserOut, UserCreate, UserUpdate
from app.core.security import get_password_hash
from app.api.deps import get_current_admin

router = APIRouter()

@router.get("", response_model=List[UserOut])
def list_users(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.order_by(User.created_at.desc()).all()

@router.post("", response_model=UserOut)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    cleaned_username = user_in.username.strip().upper()
    existing = db.query(User).filter(User.username == cleaned_username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")

    user = User(
        username=cleaned_username,
        display_name=user_in.display_name,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role,
        position=user_in.position,
        is_active=user_in.is_active
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.put("/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_in.display_name is not None:
        user.display_name = user_in.display_name
    if user_in.role is not None:
        user.role = user_in.role
    if user_in.position is not None:
        user.position = user_in.position
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    if user_in.password:
        user.password_hash = get_password_hash(user_in.password)

    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin)
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return None
