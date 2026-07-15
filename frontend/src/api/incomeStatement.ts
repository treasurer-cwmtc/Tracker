// The Income Statement report: Plan (Budget) vs Actuals (Reconciliation +
// Accrual, CY only), grouped by Statement Category -> Statement Item. Used
// by pages/IncomeStatement.
import { BASE, authHeaders, j } from "./client";

export interface IncomeStatementRow {
  label: string;
  plan: number;
  actuals: number;
  variance: number;
}

export interface IncomeStatementGroup {
  statement_category: string;
  rows: IncomeStatementRow[];
  subtotal: IncomeStatementRow;
}

export interface IncomeStatement {
  year: number;
  income_groups: IncomeStatementGroup[];
  income_total: IncomeStatementRow;
  expense_groups: IncomeStatementGroup[];
  expense_total: IncomeStatementRow;
}

export const incomeStatementApi = {
  get: () => fetch(`${BASE}/api/income-statement`, { headers: authHeaders() }).then(j<IncomeStatement>),
};
