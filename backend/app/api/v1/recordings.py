import os
import re
import uuid
import aiofiles
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Request, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.models.models import Recording, Meeting, User
from app.schemas.schemas import RecordingOut
from app.api.deps import get_current_user, get_current_admin, get_current_development_or_admin

router = APIRouter()

ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".webm", ".mkv", ".mov"}

def is_safe_path(base_dir: Path, target_path: Path) -> bool:
    try:
        target_path.resolve().relative_to(base_dir.resolve())
        return True
    except ValueError:
        return False

@router.get("", response_model=List[RecordingOut])
def list_recordings(
    meeting_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Recording)
    if meeting_id:
        query = query.filter(Recording.meeting_id == meeting_id)
    return query.order_by(Recording.created_at.desc()).all()

@router.post("/upload", response_model=RecordingOut)
async def upload_recording(
    meeting_id: int = Form(...),
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    manager: User = Depends(get_current_development_or_admin)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported video type '{ext}'. Allowed types: MP4, WebM, MKV, MOV."
        )

    safe_filename = f"{uuid.uuid4().hex}{ext}"
    dest_path = settings.VIDEOS_DIR / safe_filename

    max_bytes = settings.UPLOAD_MAX_VIDEO_SIZE_MB * 1024 * 1024
    total_size = 0

    try:
        # Stream chunks to local disk to avoid reading entire video into RAM
        async with aiofiles.open(dest_path, "wb") as out_file:
            while chunk := await file.read(2 * 1024 * 1024):  # 2MB chunks
                total_size += len(chunk)
                if total_size > max_bytes:
                    raise HTTPException(
                        status_code=413,
                        detail=f"Video exceeds maximum allowed size of {settings.UPLOAD_MAX_VIDEO_SIZE_MB}MB"
                    )
                await out_file.write(chunk)
    except Exception as e:
        if dest_path.exists():
            os.remove(dest_path)
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Failed to save video: {str(e)}")

    content_type = file.content_type or "video/mp4"
    if ext == ".mp4":
        content_type = "video/mp4"
    elif ext == ".webm":
        content_type = "video/webm"

    db_rec = Recording(
        meeting_id=meeting_id,
        title=title,
        stored_filename=safe_filename,
        mime_type=content_type,
        file_size=total_size
    )
    db.add(db_rec)
    db.commit()
    db.refresh(db_rec)
    return db_rec

@router.get("/{recording_id}/stream")
async def stream_recording(
    recording_id: int,
    request: Request,
    token: Optional[str] = None, # can be passed as query param for html5 video tags
    db: Session = Depends(get_db)
):
    # Verify token from query or header
    from app.api.deps import oauth2_scheme
    auth_header = request.headers.get("authorization")
    token_str = None
    if auth_header and auth_header.startswith("Bearer "):
        token_str = auth_header.split(" ")[1]
    elif token:
        token_str = token

    if not token_str:
        raise HTTPException(status_code=401, detail="Authentication required to stream recording")
        
    try:
        from jose import jwt
        payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username = payload.get("sub")
        user = db.query(User).filter(User.username == username, User.is_active == True).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    db_rec = db.query(Recording).filter(Recording.id == recording_id).first()
    if not db_rec:
        raise HTTPException(status_code=404, detail="Recording not found")

    file_path = settings.VIDEOS_DIR / db_rec.stored_filename
    if not is_safe_path(settings.VIDEOS_DIR, file_path) or not file_path.exists():
        raise HTTPException(status_code=404, detail="Video file not found on disk")

    file_size = os.path.getsize(file_path)
    range_header = request.headers.get("range")

    # Support HTTP 206 Partial Content (Range requests) for seeking in browser HTML5 player
    if range_header:
        range_match = re.match(r"bytes=(\d+)-(\d*)", range_header)
        if range_match:
            start_str, end_str = range_match.groups()
            start = int(start_str)
            end = int(end_str) if end_str else file_size - 1
            if start >= file_size:
                return Response(status_code=416, headers={"Content-Range": f"bytes */{file_size}"})

            end = min(end, file_size - 1)
            chunk_length = end - start + 1

            def iterfile():
                with open(file_path, "rb") as f:
                    f.seek(start)
                    bytes_remaining = chunk_length
                    while bytes_remaining > 0:
                        chunk_size = min(bytes_remaining, 1024 * 1024)
                        data = f.read(chunk_size)
                        if not data:
                            break
                        bytes_remaining -= len(data)
                        yield data

            headers = {
                "Content-Range": f"bytes {start}-{end}/{file_size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(chunk_length),
                "Content-Type": db_rec.mime_type or "video/mp4",
            }
            return StreamingResponse(iterfile(), status_code=206, headers=headers)

    # Full response if no Range header provided
    def full_iter():
        with open(file_path, "rb") as f:
            while chunk := f.read(1024 * 1024):
                yield chunk

    headers = {
        "Accept-Ranges": "bytes",
        "Content-Length": str(file_size),
        "Content-Type": db_rec.mime_type or "video/mp4",
    }
    return StreamingResponse(full_iter(), status_code=200, headers=headers)

@router.delete("/{recording_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recording(
    recording_id: int,
    db: Session = Depends(get_db),
    manager: User = Depends(get_current_development_or_admin)
):
    db_rec = db.query(Recording).filter(Recording.id == recording_id).first()
    if not db_rec:
        raise HTTPException(status_code=404, detail="Recording not found")

    file_path = settings.VIDEOS_DIR / db_rec.stored_filename
    if file_path.exists() and is_safe_path(settings.VIDEOS_DIR, file_path):
        try:
            os.remove(file_path)
        except OSError:
            pass

    db.delete(db_rec)
    db.commit()
    return None
