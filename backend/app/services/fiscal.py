"""Fiscal year helpers shared by Income Statement and General Ledger
reporting. CY/PY and "the current budget year" are always driven by the
treasurer-set `prior_year_end_date` AppSetting (Config tab), never by the
server's real-world date - same rule as the Reconciliation/Accrual ledger's
CY/PY columns."""

from __future__ import annotations

from datetime import date

from sqlalchemy.orm import Session

from ..models import AppSetting


def get_prior_year_end_date(db: Session) -> date:
    setting = db.get(AppSetting, "prior_year_end_date")
    if setting is None or not setting.value:
        return date(date.today().year - 1, 12, 31)
    return date.fromisoformat(setting.value)


def get_current_year(db: Session) -> int:
    """The calendar year budget figures should be entered/reported under -
    the year after the configured Prior Year Date (matches Config's
    "Current Year", derived from Current Year Date)."""
    return get_prior_year_end_date(db).year + 1


def is_cy(txn_date: date | None, cutoff: date) -> bool:
    return txn_date is not None and txn_date > cutoff
