from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import DisruptionEvent, User
from ..schemas import EventCreate, EventOut
from ..security import require_admin
from ..services.claims import auto_create_claims

router = APIRouter(prefix="/api/events", tags=["Disruption Events"])


@router.get("", response_model=list[EventOut])
def list_events(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    return db.scalars(select(DisruptionEvent).order_by(DisruptionEvent.id.desc())).all()


@router.post("", response_model=EventOut)
def create_event(
    payload: EventCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    event = DisruptionEvent(
        event_type=payload.event_type,
        city=payload.city,
        affected_zones=", ".join(payload.affected_zones),
        reading=payload.reading,
        unit=payload.unit,
        severity=payload.severity,
        source=payload.source,
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # This is the key parametric-insurance trigger.
    auto_create_claims(event, db)
    return event
