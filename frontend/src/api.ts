const BASE = import.meta.env.VITE_API_BASE || "";

const TOKEN_KEY = "recon_token";

export const auth = {
  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const t = auth.token;
  return t ? { ...extra, Authorization: `Bearer ${t}` } : extra;
}

export interface ChartAccount {
  account_no: string;
  category: string;
  statement_category: string;
  statement_item: string;
  statement_detail: string;
  statement_description: string;
  is_tax_deductible: string;
  is_mandatory: string;
}

export interface Rule {
  id: number;
  rule_type: "bank_keyword" | "stripe_fund";
  pattern: string;
  account_no: string;
  priority: number;
  active: boolean;
  created_at: string;
}

export interface ReconLine {
  id: number;
  source: "stripe" | "bank";
  transaction_date: string;
  date_posted: string;
  description: string;
  statement_description: string;
  account_no: string;
  category: string;
  method: string;
  amount: number;
  reference: string;
  bank_description: string;
  matched: boolean;
  notes: string;
}

export interface ReconRun {
  id: number;
  created_at: string;
  bank_filename: string;
  stripe_filename: string;
  bank_line_count: number;
  stripe_line_count: number;
  matched_payout_count: number;
  unmatched_stripe_bank_count: number;
  notes: string;
  lines: ReconLine[];
}

export interface User {
  id: number;
  username: string;
  is_admin: boolean;
  active: boolean;
  created_at: string;
}

export class AuthError extends Error {}

async function j<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    auth.clear();
    throw new AuthError("Session expired. Please log in again.");
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = typeof body.detail === "string" ? body.detail : detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  login: async (username: string, password: string) => {
    const body = new URLSearchParams({ username, password });
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = await j<{ access_token: string }>(res);
    auth.set(data.access_token);
    return data;
  },

  me: () => fetch(`${BASE}/api/auth/me`, { headers: authHeaders() }).then(j<User>),

  changePassword: (current_password: string, new_password: string) =>
    fetch(`${BASE}/api/auth/change-password`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ current_password, new_password }),
    }).then(j<void>),

  listUsers: () =>
    fetch(`${BASE}/api/auth/users`, { headers: authHeaders() }).then(j<User[]>),

  createUser: (username: string, password: string, is_admin: boolean) =>
    fetch(`${BASE}/api/auth/users`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ username, password, is_admin }),
    }).then(j<User>),

  deactivateUser: (id: number) =>
    fetch(`${BASE}/api/auth/users/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    }).then(j<void>),

  listAccounts: (category?: string) =>
    fetch(`${BASE}/api/accounts${category ? `?category=${category}` : ""}`, {
      headers: authHeaders(),
    }).then(j<ChartAccount[]>),

  uploadAccounts: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return fetch(`${BASE}/api/accounts/upload`, {
      method: "POST",
      headers: authHeaders(),
      body: fd,
    }).then(j<{ loaded: number }>);
  },

  listRules: (ruleType?: string) =>
    fetch(`${BASE}/api/rules${ruleType ? `?rule_type=${ruleType}` : ""}`, {
      headers: authHeaders(),
    }).then(j<Rule[]>),

  createRule: (r: Partial<Rule>) =>
    fetch(`${BASE}/api/rules`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(r),
    }).then(j<Rule>),

  updateRule: (id: number, r: Partial<Rule>) =>
    fetch(`${BASE}/api/rules/${id}`, {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(r),
    }).then(j<Rule>),

  deleteRule: (id: number) =>
    fetch(`${BASE}/api/rules/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    }).then(j<void>),

  reconcile: (bankFile: File, stripeFile: File) => {
    const fd = new FormData();
    fd.append("bank_file", bankFile);
    fd.append("stripe_file", stripeFile);
    return fetch(`${BASE}/api/reconcile`, {
      method: "POST",
      headers: authHeaders(),
      body: fd,
    }).then(j<ReconRun>);
  },

  exportUrl: (runId: number) => `${BASE}/api/runs/${runId}/export.csv`,

  downloadExport: async (runId: number) => {
    const res = await fetch(`${BASE}/api/runs/${runId}/export.csv`, {
      headers: authHeaders(),
    });
    if (res.status === 401) {
      auth.clear();
      throw new AuthError("Session expired. Please log in again.");
    }
    if (!res.ok) throw new Error("Export failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reconciliation_run_${runId}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
