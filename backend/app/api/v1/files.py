import os
import uuid
import aiofiles
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Response, Request
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.models.models import LearningFile, Meeting, User
from app.schemas.schemas import LearningFileOut
from app.api.deps import get_current_user, get_current_admin, get_current_development_or_admin

router = APIRouter()

ALLOWED_MIME_TYPES = {
    "application/pdf": ".pdf",
    "application/vnd.ms-powerpoint": ".ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx"
}

ALLOWED_EXTENSIONS = {".pdf", ".ppt", ".pptx"}

def is_safe_path(base_dir: Path, target_path: Path) -> bool:
    try:
        target_path.resolve().relative_to(base_dir.resolve())
        return True
    except ValueError:
        return False

@router.get("", response_model=List[LearningFileOut])
def list_files(
    meeting_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(LearningFile)
    if meeting_id:
        query = query.filter(LearningFile.meeting_id == meeting_id)
    return query.order_by(LearningFile.created_at.desc()).all()

@router.post("/upload", response_model=LearningFileOut)
async def upload_file(
    meeting_id: int = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    manager: User = Depends(get_current_development_or_admin)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed types: PDF, PPT, PPTX."
        )

    # Secure random filename on local disk to prevent collisions and path traversal
    safe_filename = f"{uuid.uuid4().hex}{ext}"
    dest_path = settings.FILES_DIR / safe_filename

    # Stream write in chunks and validate max file size
    max_bytes = settings.UPLOAD_MAX_FILE_SIZE_MB * 1024 * 1024
    total_size = 0

    try:
        async with aiofiles.open(dest_path, "wb") as out_file:
            while chunk := await file.read(1024 * 1024):  # 1MB chunk
                total_size += len(chunk)
                if total_size > max_bytes:
                    raise HTTPException(
                        status_code=413,
                        detail=f"File exceeds maximum allowed size of {settings.UPLOAD_MAX_FILE_SIZE_MB}MB"
                    )
                await out_file.write(chunk)
    except Exception as e:
        if dest_path.exists():
            os.remove(dest_path)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    content_type = file.content_type or "application/octet-stream"
    if ext == ".pdf":
        content_type = "application/pdf"
    elif ext == ".pptx":
        content_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    elif ext == ".ppt":
        content_type = "application/vnd.ms-powerpoint"

    db_file = LearningFile(
        meeting_id=meeting_id,
        original_filename=file.filename,
        stored_filename=safe_filename,
        mime_type=content_type,
        file_size=total_size,
        description=description
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file

@router.get("/{file_id}/download")
def download_file(
    file_id: int,
    token: Optional[str] = None,
    request: Request = None,
    db: Session = Depends(get_db)
):
    # Verify token from query parameter or Authorization header
    token_str = None
    if request:
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token_str = auth_header.split(" ")[1]
    if not token_str and token:
        token_str = token

    if not token_str:
        raise HTTPException(status_code=401, detail="Authentication required to download file")

    try:
        from jose import jwt
        payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username = payload.get("sub")
        user = db.query(User).filter(User.username == username, User.is_active == True).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    db_file = db.query(LearningFile).filter(LearningFile.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    file_path = settings.FILES_DIR / db_file.stored_filename
    if not is_safe_path(settings.FILES_DIR, file_path) or not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on storage")

    return FileResponse(
        path=str(file_path),
        filename=db_file.original_filename,
        media_type=db_file.mime_type
    )

@router.get("/{file_id}/preview")
def preview_file(
    file_id: int,
    token: Optional[str] = None,
    request: Request = None,
    db: Session = Depends(get_db)
):
    # Verify token from query parameter (for iframe) or Authorization header
    token_str = None
    if request:
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token_str = auth_header.split(" ")[1]
    if not token_str and token:
        token_str = token

    if not token_str:
        raise HTTPException(status_code=401, detail="Authentication required to preview file")

    try:
        from jose import jwt
        payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username = payload.get("sub")
        user = db.query(User).filter(User.username == username, User.is_active == True).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    db_file = db.query(LearningFile).filter(LearningFile.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    file_path = settings.FILES_DIR / db_file.stored_filename
    if not is_safe_path(settings.FILES_DIR, file_path) or not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on storage")

    # In-browser preview (inline disposition) with PDF content type
    return FileResponse(
        path=str(file_path),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{db_file.original_filename}"',
            "Content-Type": "application/pdf"
        }
    )

@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    manager: User = Depends(get_current_development_or_admin)
):
    db_file = db.query(LearningFile).filter(LearningFile.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    file_path = settings.FILES_DIR / db_file.stored_filename
    if file_path.exists() and is_safe_path(settings.FILES_DIR, file_path):
        try:
            os.remove(file_path)
        except OSError:
            pass

    db.delete(db_file)
    db.commit()
    return None
