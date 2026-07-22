// Tiny key/value app settings. Used by pages/Reconciliation (prior_year_end_date).
import { BASE, authHeaders, j } from "./client";

export interface AppSetting {
  key: string;
  value: string;
}

export const settingsApi = {
  get: (key: string) =>
    fetch(`${BASE}/api/settings/${key}`, { headers: authHeaders() }).then(j<AppSetting>),

  update: (key: string, value: string) =>
    fetch(`${BASE}/api/settings/${key}`, {
      method: "PUT",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ value }),
    }).then(j<AppSetting>),
};

/** The app's own "Current Year" (Config's Fiscal Year card), not the real
 * device date - this app deliberately never derives from today's real date
 * (see pages/Config). Used to pick which year's Google Drive folder a
 * newly-uploaded file (bank/stripe statement, campaign CSV) belongs in. */
export async function getCurrentFiscalYear(): Promise<number> {
  const s = await settingsApi.get("prior_year_end_date");
  const d = new Date(s.value + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1); // Current Year Date = Prior Year Date + 1 day
  return d.getUTCFullYear();
}
