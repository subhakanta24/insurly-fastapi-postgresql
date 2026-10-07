from decimal import Decimal
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Claim, DisruptionEvent, Policy, User
from ..schemas import DashboardOut
from ..security import require_admin

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardOut)
def summary(
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    workers = db.scalar(select(func.count(User.id)).where(User.role == "worker")) or 0
    active_policies = db.scalar(
        select(func.count(Policy.id)).where(Policy.status == "active")
    ) or 0
    events = db.scalar(select(func.count(DisruptionEvent.id))) or 0
    claims = db.scalar(select(func.count(Claim.id))) or 0
    total_payout = db.scalar(select(func.coalesce(func.sum(Claim.payout_amount), 0))) or Decimal("0")

    return {
        "workers": workers,
        "active_policies": active_policies,
        "events": events,
        "claims": claims,
        "total_payout": total_payout,
    }
