from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.timezone import get_jakarta_now_naive
from app.db.session import get_db
from app.models.models import Meeting, LearningFile, Recording, Quiz, UserRole, User, MeetingAttendance
from app.schemas.schemas import (
    MeetingOut, MeetingCreate, MeetingUpdate, DashboardStats,
    LearningFileOut, RecordingOut, QuizResultOut, AttendanceOut
)
from app.api.deps import get_current_user, get_current_admin, get_current_development_or_admin

router = APIRouter()

@router.get("/next-sharing-id")
def get_next_sharing_id(
    meeting_type: str = Query(..., description="Pre-Validation, Post-Validation, Sosialisasi, or Training"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    type_lower = meeting_type.lower()
    if "pre" in type_lower:
        prefix = "PRE"
    elif "post" in type_lower or "pos" in type_lower:
        prefix = "POS"
    elif "sosialisasi" in type_lower:
        prefix = "SOS"
    elif "training" in type_lower:
        prefix = "TRN"
    else:
        prefix = "SHR"

    meetings = db.query(Meeting).all()
    max_num = 0
    import re
    pattern = re.compile(rf"^{prefix}-(\d+)$", re.IGNORECASE)
    for m in meetings:
        if m.project_name:
            match = pattern.match(m.project_name.strip())
            if match:
                val = int(match.group(1))
                if val > max_num:
                    max_num = val
    next_num = max_num + 1
    next_id = f"{prefix}-{next_num:04d}"
    return {"next_sharing_id": next_id}

@router.get("", response_model=List[MeetingOut])
def list_meetings(
    meeting_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Meeting)
    if meeting_type:
        query = query.filter(Meeting.meeting_type == meeting_type)
    if search:
        query = query.filter(
            (Meeting.title.ilike(f"%{search}%")) |
            (Meeting.project_name.ilike(f"%{search}%")) |
            (Meeting.description.ilike(f"%{search}%"))
        )
    return query.order_by(Meeting.date_time.desc()).all()

@router.post("", response_model=MeetingOut)
def create_meeting(
    meeting_in: MeetingCreate,
    db: Session = Depends(get_db),
    manager: User = Depends(get_current_development_or_admin)
):
    meeting = Meeting(**meeting_in.model_dump())
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting

@router.get("/{meeting_id}", response_model=MeetingOut)
def get_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    attendances_count = db.query(MeetingAttendance).filter(MeetingAttendance.meeting_id == meeting_id).count()
    my_att = db.query(MeetingAttendance).filter(
        MeetingAttendance.meeting_id == meeting_id,
        MeetingAttendance.user_id == current_user.id
    ).first()
    
    meeting.attendances_count = attendances_count
    meeting.is_attended_by_me = my_att is not None
    return meeting

@router.post("/{meeting_id}/attend")
def attend_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # Validasi: Konfirmasi hadir hanya dapat dilakukan pada atau setelah tanggal sharing
    current_now = get_jakarta_now_naive()
    # Bandingkan tanggal pelaksanaan sesi (perbandingan berdasarkan tanggal atau waktu mulai)
    # Jika meeting.date_time berada di masa mendatang (tanggal hari ini < tanggal meeting), tolak
    if current_now.date() < meeting.date_time.date():
        formatted_date = meeting.date_time.strftime("%d %b %Y")
        raise HTTPException(
            status_code=400,
            detail=f"Konfirmasi hadir belum dibuka. Sesi sharing ini baru dijadwalkan pada {formatted_date}."
        )

    existing = db.query(MeetingAttendance).filter(
        MeetingAttendance.meeting_id == meeting_id,
        MeetingAttendance.user_id == current_user.id
    ).first()
    
    if existing:
        return {
            "status": "already_attended",
            "message": "Anda sudah mengonfirmasi kehadiran pada sharing ini.",
            "attended_at": existing.attended_at
        }

    att = MeetingAttendance(
        meeting_id=meeting.id,
        user_id=current_user.id
    )
    db.add(att)
    db.commit()
    db.refresh(att)
    
    return {
        "status": "success",
        "message": "Kehadiran berhasil dikonfirmasi.",
        "attended_at": att.attended_at
    }

@router.get("/{meeting_id}/attendances", response_model=List[AttendanceOut])
def get_meeting_attendances(
    meeting_id: int,
    db: Session = Depends(get_db),
    manager: User = Depends(get_current_development_or_admin)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    attendances = db.query(MeetingAttendance).filter(
        MeetingAttendance.meeting_id == meeting_id
    ).order_by(MeetingAttendance.attended_at.asc()).all()
    
    return attendances

@router.get("/attendances/all", response_model=List[AttendanceOut])
def get_all_attendances(
    meeting_id: Optional[int] = None,
    db: Session = Depends(get_db),
    manager: User = Depends(get_current_development_or_admin)
):
    query = db.query(MeetingAttendance)
    if meeting_id:
        query = query.filter(MeetingAttendance.meeting_id == meeting_id)
    return query.order_by(MeetingAttendance.attended_at.desc()).all()

@router.put("/{meeting_id}", response_model=MeetingOut)
def update_meeting(
    meeting_id: int,
    meeting_in: MeetingUpdate,
    db: Session = Depends(get_db),
    manager: User = Depends(get_current_development_or_admin)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    update_data = meeting_in.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(meeting, field, val)
        
    db.commit()
    db.refresh(meeting)
    return meeting

@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    manager: User = Depends(get_current_development_or_admin)
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    db.delete(meeting)
    db.commit()
    return None
