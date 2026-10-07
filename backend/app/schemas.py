from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6)
    role: str = "worker"
    zone: str = "Patia"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: EmailStr
    role: str
    zone: str
    is_active: bool


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


class PolicyCreate(BaseModel):
    worker_id: int
    event_type: str
    trigger_threshold: Decimal
    threshold_unit: str
    payout_amount: Decimal
    status: str = "active"


class PolicyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    worker_id: int
    policy_number: str
    event_type: str
    trigger_threshold: Decimal
    threshold_unit: str
    payout_amount: Decimal
    status: str
    start_date: datetime
    end_date: datetime | None


class EventCreate(BaseModel):
    event_type: str
    city: str
    affected_zones: list[str]
    reading: Decimal
    unit: str
    severity: str = "high"
    source: str = "Admin"


class EventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    event_type: str
    city: str
    affected_zones: str
    reading: Decimal
    unit: str
    severity: str
    source: str
    created_at: datetime


class PayoutOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    claim_id: int
    amount: Decimal
    status: str
    transaction_reference: str
    processed_at: datetime


class ClaimOut(BaseModel):
    id: int
    worker_id: int
    worker_name: str
    policy_number: str
    event_type: str
    status: str
    fraud_score: int
    fraud_reason: str | None
    payout_amount: Decimal
    auto_processed: bool
    created_at: datetime
    payout: PayoutOut | None


class DashboardOut(BaseModel):
    workers: int
    active_policies: int
    events: int
    claims: int
    total_payout: Decimal
