// The Budget page: annual Plan amounts for every Budget-category (B-prefixed)
// Chart of Accounts account. Used by pages/Budget.
import { BASE, authHeaders, j } from "./client";

export interface BudgetEntry {
  id: number;
  year: number;
  account_no: string;
  amount: number;
  notes: string;
  statement_description: string;
  category: string;
  statement_category: string;
  statement_item: string;
  statement_detail: string;
}

export const budgetApi = {
  list: (year: number) =>
    fetch(`${BASE}/api/budget?year=${year}`, { headers: authHeaders() }).then(j<BudgetEntry[]>),

  upsert: (accountNo: string, year: number, amount: number, notes: string) =>
    fetch(`${BASE}/api/budget/${accountNo}?year=${year}`, {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ amount, notes }),
    }).then(j<BudgetEntry>),
};
