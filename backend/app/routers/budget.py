from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import BudgetEntry, ChartOfAccount
from ..schemas import BudgetEntryOut, BudgetEntryUpsert
from ..services.fiscal import get_current_year

router = APIRouter(prefix="/api/budget", tags=["budget"], dependencies=[Depends(get_current_user)])


def _to_out(coa: ChartOfAccount, year: int, entry: BudgetEntry | None) -> BudgetEntryOut:
    return BudgetEntryOut(
        id=entry.id if entry else 0,
        year=year,
        account_no=coa.account_no,
        amount=entry.amount if entry else 0.0,
        notes=entry.notes if entry else "",
        statement_description=coa.statement_description,
        category=coa.category,
        statement_category=coa.statement_category,
        statement_item=coa.statement_item,
        statement_detail=coa.statement_detail,
    )


@router.get("", response_model=list[BudgetEntryOut])
def list_budget(year: int | None = None, db: Session = Depends(get_db)) -> list[BudgetEntryOut]:
    """Every Budget-category account for `year` (default: the Config tab's
    current year), with whatever amount/notes have been entered so far -
    always the full account list, not just rows that have been set."""
    if year is None:
        year = get_current_year(db)
    accounts = list(
        db.scalars(
            select(ChartOfAccount)
            .where(ChartOfAccount.category == "Budget")
            .order_by(ChartOfAccount.statement_category_no, ChartOfAccount.statement_item_no)
        )
    )
    existing = {
        e.account_no: e
        for e in db.scalars(select(BudgetEntry).where(BudgetEntry.year == year))
    }
    return [_to_out(coa, year, existing.get(coa.account_no)) for coa in accounts]


@router.put("/{account_no}", response_model=BudgetEntryOut)
def upsert_budget(
    account_no: str, year: int, payload: BudgetEntryUpsert, db: Session = Depends(get_db)
) -> BudgetEntryOut:
    coa = db.get(ChartOfAccount, account_no)
    if coa is None or coa.category != "Budget":
        raise HTTPException(status_code=404, detail="Budget account not found.")
    entry = db.scalar(
        select(BudgetEntry).where(BudgetEntry.year == year, BudgetEntry.account_no == account_no)
    )
    if entry is None:
        entry = BudgetEntry(year=year, account_no=account_no, amount=payload.amount, notes=payload.notes)
        db.add(entry)
    else:
        entry.amount = payload.amount
        entry.notes = payload.notes
    db.commit()
    db.refresh(entry)
    return _to_out(coa, year, entry)
