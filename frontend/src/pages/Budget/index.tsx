import { useEffect, useMemo, useState } from "react";
import { budgetApi, BudgetEntry } from "../../api/budget";
import { settingsApi } from "../../api/settings";
import { CurrencyCell, TextCell } from "../ledger/cells";

function currentYearFromCutoff(priorYearEndDate: string): number {
  const y = Number(priorYearEndDate.slice(0, 4));
  return Number.isFinite(y) ? y + 1 : new Date().getFullYear();
}

/** Annual Plan amounts for every Budget-category (B-prefixed) account -
 * matches the legacy sheet's Budget tab. Every account always shows a row
 * (amount 0 if unset) so this doubles as a checklist of what still needs a
 * number entered. Feeds the Income Statement's Plan column. */
export default function Budget() {
  const [year, setYear] = useState<number | null>(null);
  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    settingsApi
      .get("prior_year_end_date")
      .then((s) => setYear(currentYearFromCutoff(s.value)))
      .catch((err) => setError((err as Error).message));
  }, []);

  useEffect(() => {
    if (year == null) return;
    setLoading(true);
    budgetApi
      .list(year)
      .then(setEntries)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [year]);

  async function save(accountNo: string, patch: { amount?: number; notes?: string }) {
    const current = entries.find((e) => e.account_no === accountNo);
    if (!current || year == null) return;
    const amount = patch.amount ?? current.amount;
    const notes = patch.notes ?? current.notes;
    setEntries((prev) =>
      prev.map((e) => (e.account_no === accountNo ? { ...e, amount, notes } : e))
    );
    try {
      const updated = await budgetApi.upsert(accountNo, year, amount, notes);
      setEntries((prev) => prev.map((e) => (e.account_no === accountNo ? updated : e)));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const groups = useMemo(() => {
    const byCategory = new Map<string, BudgetEntry[]>();
    for (const e of entries) {
      const list = byCategory.get(e.statement_category) || [];
      list.push(e);
      byCategory.set(e.statement_category, list);
    }
    return Array.from(byCategory.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [entries]);

  const total = entries.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <p className="subtitle" style={{ marginTop: 0 }}>
        The annual Plan amount for every Budget-category account, matching
        the legacy sheet's Budget tab. Feeds the Income Statement's Plan
        column - every Budget account here shares its Statement Category /
        Statement Item names with the real Income/Expense account it plans
        for.
      </p>
      <div className="toolbar">
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <span>Year:</span>
          <input
            type="number"
            style={{ width: 90 }}
            value={year ?? ""}
            onChange={(e) => setYear(Number(e.target.value) || null)}
          />
        </label>
        <span className="pill">Total: ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
      {error && <div className="error">{error}</div>}

      {!loading &&
        groups.map(([category, rows]) => (
          <div className="card" key={category}>
            <h3 style={{ marginTop: 0 }}>{category}</h3>
            <table>
              <thead>
                <tr>
                  <th>Statement Item</th>
                  <th className="num">Amount</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.account_no}>
                    <td>
                      {e.statement_item || e.statement_description}
                      {e.statement_detail && (
                        <span style={{ color: "var(--muted)" }}> - {e.statement_detail}</span>
                      )}
                    </td>
                    <td className="num">
                      <CurrencyCell value={e.amount} onCommit={(v) => save(e.account_no, { amount: v })} />
                    </td>
                    <td>
                      <TextCell value={e.notes} onCommit={(v) => save(e.account_no, { notes: v })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );
}
