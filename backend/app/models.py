from datetime import datetime
from decimal import Decimal
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20), default="worker")
    zone: Mapped[str] = mapped_column(String(120), default="Patia")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    policies = relationship("Policy", back_populates="worker", cascade="all, delete-orphan")
    claims = relationship("Claim", back_populates="worker", cascade="all, delete-orphan")


class Policy(Base):
    __tablename__ = "policies"

    id: Mapped[int] = mapped_column(primary_key=True)
    worker_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    policy_number: Mapped[str] = mapped_column(String(50), unique=True)
    event_type: Mapped[str] = mapped_column(String(50))
    trigger_threshold: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    threshold_unit: Mapped[str] = mapped_column(String(30))
    payout_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    status: Mapped[str] = mapped_column(String(20), default="active")
    start_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    end_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    worker = relationship("User", back_populates="policies")
    claims = relationship("Claim", back_populates="policy")


class DisruptionEvent(Base):
    __tablename__ = "disruption_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_type: Mapped[str] = mapped_column(String(50))
    city: Mapped[str] = mapped_column(String(100))
    affected_zones: Mapped[str] = mapped_column(Text)
    reading: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    unit: Mapped[str] = mapped_column(String(30))
    severity: Mapped[str] = mapped_column(String(20))
    source: Mapped[str] = mapped_column(String(100), default="Admin")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    claims = relationship("Claim", back_populates="event")


class Claim(Base):
    __tablename__ = "claims"

    id: Mapped[int] = mapped_column(primary_key=True)
    worker_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    policy_id: Mapped[int] = mapped_column(ForeignKey("policies.id"))
    event_id: Mapped[int] = mapped_column(ForeignKey("disruption_events.id"))
    status: Mapped[str] = mapped_column(String(30), default="approved")
    fraud_score: Mapped[int] = mapped_column(Integer, default=0)
    fraud_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    payout_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=0)
    auto_processed: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    worker = relationship("User", back_populates="claims")
    policy = relationship("Policy", back_populates="claims")
    event = relationship("DisruptionEvent", back_populates="claims")
    payout = relationship("Payout", back_populates="claim", uselist=False, cascade="all, delete-orphan")


class Payout(Base):
    __tablename__ = "payouts"

    id: Mapped[int] = mapped_column(primary_key=True)
    claim_id: Mapped[int] = mapped_column(ForeignKey("claims.id"), unique=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    status: Mapped[str] = mapped_column(String(30), default="processed")
    transaction_reference: Mapped[str] = mapped_column(String(80), unique=True)
    processed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    claim = relationship("Claim", back_populates="payout")
