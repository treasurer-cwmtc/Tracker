"""Budget page tests: every Budget-category account is listed for a year,
with amounts upserted in place."""

from test_auth import auth_header, client


def test_list_includes_every_budget_account_with_zero_default():
    h = auth_header()
    r = client.get("/api/budget", headers=h, params={"year": 2026})
    assert r.status_code == 200, r.text
    rows = r.json()
    assert rows, "expected the seeded Budget-category accounts"
    assert all(row["category"] == "Budget" for row in rows)
    by_account = {row["account_no"]: row for row in rows}
    assert "B101310" in by_account
    assert by_account["B101310"]["amount"] == 0.0
    assert by_account["B101310"]["id"] == 0


def test_upsert_then_relist_reflects_amount():
    h = auth_header()
    put = client.put(
        "/api/budget/B101310",
        headers=h,
        params={"year": 2026},
        json={"amount": 215850.0, "notes": "Pledge campaign target"},
    )
    assert put.status_code == 200, put.text
    assert put.json()["amount"] == 215850.0
    assert put.json()["statement_category"] == "Income"
    assert put.json()["statement_item"] == "Pledges"

    r = client.get("/api/budget", headers=h, params={"year": 2026})
    by_account = {row["account_no"]: row for row in r.json()}
    assert by_account["B101310"]["amount"] == 215850.0
    assert by_account["B101310"]["notes"] == "Pledge campaign target"

    # A different year is unaffected.
    other_year = client.get("/api/budget", headers=h, params={"year": 2025})
    by_account_2025 = {row["account_no"]: row for row in other_year.json()}
    assert by_account_2025["B101310"]["amount"] == 0.0


def test_upsert_rejects_non_budget_account():
    h = auth_header()
    r = client.put(
        "/api/budget/I101010",
        headers=h,
        params={"year": 2026},
        json={"amount": 100.0},
    )
    assert r.status_code == 404
