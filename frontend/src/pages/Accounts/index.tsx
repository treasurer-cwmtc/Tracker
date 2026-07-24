import { useEffect, useMemo, useState } from "react";
import { accountsApi, ChartAccount, StatementCategory, StatementItem } from "../../api/accounts";
import AddStatementCategoryForm from "./AddStatementCategoryForm";
import AddStatementItemForm from "./AddStatementItemForm";
import AddAccountForm from "./AddAccountForm";
import AccountRow from "./AccountRow";
import AccountDetailModal from "./AccountDetailModal";
import { ColGroup, ColResizeHandle, useColumnWidths } from "../../components/ColumnResize";
import { TextColumnFilter } from "../../components/ColumnFilter";

type SortKey =
  | "account_no"
  | "category"
  | "statement_category"
  | "statement_item"
  | "statement_detail"
  | "statement_description"
  | "grouping"
  | "tax_deductible"
  | "mandatory"
  | "youth_chaplain_share"
  | "missions";

function statementCategoryLabel(a: ChartAccount): string {
  return `${a.statement_category_no} · ${a.statement_category}`;
}

function statementItemLabel(a: ChartAccount): string {
  return `${a.statement_item_no} · ${a.statement_item}`;
}

function sortValue(a: ChartAccount, key: SortKey): string {
  switch (key) {
    case "account_no":
      return a.account_no;
    case "category":
      return a.category;
    case "statement_category":
      return statementCategoryLabel(a);
    case "statement_item":
      return statementItemLabel(a);
    case "statement_detail":
      return a.statement_detail;
    case "statement_description":
      return a.statement_description;
    case "grouping":
      return a.grouping;
    case "tax_deductible":
      return a.is_tax_deductible;
    case "mandatory":
      return a.is_mandatory;
    case "youth_chaplain_share":
      return a.is_youth_chaplain_share;
    case "missions":
      return a.is_missions;
  }
}

function SortableHeader({
  label,
  sortKey,
  activeSort,
  onSort,
  filter,
  resizeHandle,
}: {
  label: string;
  sortKey: SortKey;
  activeSort: { key: SortKey | null; dir: "asc" | "desc" };
  onSort: (key: SortKey) => void;
  filter?: React.ReactNode;
  resizeHandle?: React.ReactNode;
}) {
  const active = activeSort.key === sortKey;
  return (
    <th>
      <span
        onClick={() => onSort(sortKey)}
        style={{ cursor: "pointer", userSelect: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
      >
        {label}
        <span style={{ fontSize: 10, color: active ? "var(--primary)" : "var(--muted)" }}>
          {active ? (activeSort.dir === "asc" ? "▲" : "▼") : "⇅"}
        </span>
      </span>
      {filter}
      {resizeHandle}
    </th>
  );
}

const COLUMNS = [
  "account_no",
  "category",
  "statement_category",
  "statement_item",
  "statement_detail",
  "statement_description",
  "grouping",
  "tax_deductible",
  "mandatory",
  "youth_chaplain_share",
  "missions",
];

export default function Accounts() {
  const [accounts, setAccounts] = useState<ChartAccount[]>([]);
  const [statementCategories, setStatementCategories] = useState<StatementCategory[]>([]);
  const [statementItems, setStatementItems] = useState<StatementItem[]>([]);
  const [error, setError] = useState("");
  const [openAccount, setOpenAccount] = useState<ChartAccount | null>(null);
  const { widths, startResize } = useColumnWidths("accounts-list");
  const [sort, setSort] = useState<{ key: SortKey | null; dir: "asc" | "desc" }>({
    key: "account_no",
    dir: "asc",
  });
  const [accountNoFilter, setAccountNoFilter] = useState<Set<string> | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<Set<string> | null>(null);
  const [statementCategoryFilter, setStatementCategoryFilter] = useState<Set<string> | null>(null);
  const [statementItemFilter, setStatementItemFilter] = useState<Set<string> | null>(null);
  const [statementDetailFilter, setStatementDetailFilter] = useState<Set<string> | null>(null);
  const [statementDescriptionFilter, setStatementDescriptionFilter] = useState<Set<string> | null>(null);
  const [groupingFilter, setGroupingFilter] = useState<Set<string> | null>(null);
  const [taxDeductibleFilter, setTaxDeductibleFilter] = useState<Set<string> | null>(null);
  const [mandatoryFilter, setMandatoryFilter] = useState<Set<string> | null>(null);
  const [youthChaplainShareFilter, setYouthChaplainShareFilter] = useState<Set<string> | null>(null);
  const [missionsFilter, setMissionsFilter] = useState<Set<string> | null>(null);

  async function load() {
    try {
      const [a, sc, si] = await Promise.all([
        accountsApi.listAccounts(),
        accountsApi.listStatementCategories(),
        accountsApi.listStatementItems(),
      ]);
      setAccounts(a);
      setStatementCategories(sc);
      setStatementItems(si);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function onSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  }

  const accountNoOptions = useMemo(() => Array.from(new Set(accounts.map((a) => a.account_no))).sort(), [accounts]);
  const categoryOptions = useMemo(
    () => Array.from(new Set(accounts.map((a) => a.category))).filter(Boolean).sort(),
    [accounts]
  );
  const statementCategoryOptions = useMemo(
    () => Array.from(new Set(accounts.map(statementCategoryLabel))).sort(),
    [accounts]
  );
  const statementItemOptions = useMemo(
    () => Array.from(new Set(accounts.map(statementItemLabel))).sort(),
    [accounts]
  );
  const statementDetailOptions = useMemo(
    () => Array.from(new Set(accounts.map((a) => a.statement_detail || "—"))).sort(),
    [accounts]
  );
  const statementDescriptionOptions = useMemo(
    () => Array.from(new Set(accounts.map((a) => a.statement_description))).sort(),
    [accounts]
  );
  const groupingOptions = useMemo(
    () => Array.from(new Set(accounts.map((a) => a.grouping || "—"))).sort(),
    [accounts]
  );
  const taxDeductibleOptions = useMemo(
    () => Array.from(new Set(accounts.map((a) => a.is_tax_deductible))).sort(),
    [accounts]
  );
  const mandatoryOptions = useMemo(
    () => Array.from(new Set(accounts.map((a) => a.is_mandatory))).sort(),
    [accounts]
  );
  const youthChaplainShareOptions = useMemo(
    () => Array.from(new Set(accounts.map((a) => a.is_youth_chaplain_share))).sort(),
    [accounts]
  );
  const missionsOptions = useMemo(
    () => Array.from(new Set(accounts.map((a) => a.is_missions))).sort(),
    [accounts]
  );

  const filtered = useMemo(() => {
    let out = accounts.filter((a) => {
      if (accountNoFilter && !accountNoFilter.has(a.account_no)) return false;
      if (categoryFilter && !categoryFilter.has(a.category)) return false;
      if (statementCategoryFilter && !statementCategoryFilter.has(statementCategoryLabel(a))) return false;
      if (statementItemFilter && !statementItemFilter.has(statementItemLabel(a))) return false;
      if (statementDetailFilter && !statementDetailFilter.has(a.statement_detail || "—")) return false;
      if (statementDescriptionFilter && !statementDescriptionFilter.has(a.statement_description)) return false;
      if (groupingFilter && !groupingFilter.has(a.grouping || "—")) return false;
      if (taxDeductibleFilter && !taxDeductibleFilter.has(a.is_tax_deductible)) return false;
      if (mandatoryFilter && !mandatoryFilter.has(a.is_mandatory)) return false;
      if (youthChaplainShareFilter && !youthChaplainShareFilter.has(a.is_youth_chaplain_share)) return false;
      if (missionsFilter && !missionsFilter.has(a.is_missions)) return false;
      return true;
    });
    if (sort.key) {
      const key = sort.key;
      out = [...out].sort((a, b) => {
        const res = sortValue(a, key).localeCompare(sortValue(b, key));
        return sort.dir === "asc" ? res : -res;
      });
    }
    return out;
  }, [
    accounts,
    sort,
    accountNoFilter,
    categoryFilter,
    statementCategoryFilter,
    statementItemFilter,
    statementDetailFilter,
    statementDescriptionFilter,
    groupingFilter,
    taxDeductibleFilter,
    mandatoryFilter,
    youthChaplainShareFilter,
    missionsFilter,
  ]);

  return (
    <div>
      <h2 className="page-title">Chart of Accounts</h2>
      <p className="subtitle" style={{ marginTop: 0 }}>
        The Chart of Accounts is a 3-level hierarchy — Statement Category → Statement
        Item → Statement Detail (the account itself). Each level's number
        auto-increments within its parent and is generated for you; add levels
        top-down.
      </p>

      <AddStatementCategoryForm
        statementCategories={statementCategories}
        onCreated={load}
      />
      <AddStatementItemForm
        statementCategories={statementCategories}
        statementItems={statementItems}
        onCreated={load}
      />
      <AddAccountForm
        accounts={accounts}
        statementCategories={statementCategories}
        statementItems={statementItems}
        onCreated={load}
      />

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Accounts</h3>
        <div className="toolbar">
          <span style={{ color: "var(--muted)", fontSize: 13 }}>
            {filtered.length} of {accounts.length}
          </span>
        </div>
        {error && <div className="error">{error}</div>}
        <div className="table-wrap">
          <table className="resizable-cols">
            <ColGroup columns={COLUMNS} widths={widths} />
            <thead>
              <tr>
                <SortableHeader
                  label="Account No"
                  sortKey="account_no"
                  activeSort={sort}
                  onSort={onSort}
                  filter={
                    <TextColumnFilter
                      label="Account No"
                      options={accountNoOptions}
                      selected={accountNoFilter}
                      onChange={setAccountNoFilter}
                    />
                  }
                  resizeHandle={<ColResizeHandle col="account_no" startResize={startResize} />}
                />
                <SortableHeader
                  label="Type"
                  sortKey="category"
                  activeSort={sort}
                  onSort={onSort}
                  filter={
                    <TextColumnFilter
                      label="Type"
                      options={categoryOptions}
                      selected={categoryFilter}
                      onChange={setCategoryFilter}
                    />
                  }
                  resizeHandle={<ColResizeHandle col="category" startResize={startResize} />}
                />
                <SortableHeader
                  label="Statement Category"
                  sortKey="statement_category"
                  activeSort={sort}
                  onSort={onSort}
                  filter={
                    <TextColumnFilter
                      label="Statement Category"
                      options={statementCategoryOptions}
                      selected={statementCategoryFilter}
                      onChange={setStatementCategoryFilter}
                    />
                  }
                  resizeHandle={<ColResizeHandle col="statement_category" startResize={startResize} />}
                />
                <SortableHeader
                  label="Statement Item"
                  sortKey="statement_item"
                  activeSort={sort}
                  onSort={onSort}
                  filter={
                    <TextColumnFilter
                      label="Statement Item"
                      options={statementItemOptions}
                      selected={statementItemFilter}
                      onChange={setStatementItemFilter}
                    />
                  }
                  resizeHandle={<ColResizeHandle col="statement_item" startResize={startResize} />}
                />
                <SortableHeader
                  label="Statement Detail"
                  sortKey="statement_detail"
                  activeSort={sort}
                  onSort={onSort}
                  filter={
                    <TextColumnFilter
                      label="Statement Detail"
                      options={statementDetailOptions}
                      selected={statementDetailFilter}
                      onChange={setStatementDetailFilter}
                    />
                  }
                  resizeHandle={<ColResizeHandle col="statement_detail" startResize={startResize} />}
                />
                <SortableHeader
                  label="Statement Description"
                  sortKey="statement_description"
                  activeSort={sort}
                  onSort={onSort}
                  filter={
                    <TextColumnFilter
                      label="Statement Description"
                      options={statementDescriptionOptions}
                      selected={statementDescriptionFilter}
                      onChange={setStatementDescriptionFilter}
                    />
                  }
                  resizeHandle={<ColResizeHandle col="statement_description" startResize={startResize} />}
                />
                <SortableHeader
                  label="Grouping"
                  sortKey="grouping"
                  activeSort={sort}
                  onSort={onSort}
                  filter={
                    <TextColumnFilter
                      label="Grouping"
                      options={groupingOptions}
                      selected={groupingFilter}
                      onChange={setGroupingFilter}
                    />
                  }
                  resizeHandle={<ColResizeHandle col="grouping" startResize={startResize} />}
                />
                <SortableHeader
                  label="Tax Deductible"
                  sortKey="tax_deductible"
                  activeSort={sort}
                  onSort={onSort}
                  filter={
                    <TextColumnFilter
                      label="Tax Deductible"
                      options={taxDeductibleOptions}
                      selected={taxDeductibleFilter}
                      onChange={setTaxDeductibleFilter}
                    />
                  }
                  resizeHandle={<ColResizeHandle col="tax_deductible" startResize={startResize} />}
                />
                <SortableHeader
                  label="Mandatory"
                  sortKey="mandatory"
                  activeSort={sort}
                  onSort={onSort}
                  filter={
                    <TextColumnFilter
                      label="Mandatory"
                      options={mandatoryOptions}
                      selected={mandatoryFilter}
                      onChange={setMandatoryFilter}
                    />
                  }
                  resizeHandle={<ColResizeHandle col="mandatory" startResize={startResize} />}
                />
                <SortableHeader
                  label="Youth Chaplain Share"
                  sortKey="youth_chaplain_share"
                  activeSort={sort}
                  onSort={onSort}
                  filter={
                    <TextColumnFilter
                      label="Youth Chaplain Share"
                      options={youthChaplainShareOptions}
                      selected={youthChaplainShareFilter}
                      onChange={setYouthChaplainShareFilter}
                    />
                  }
                  resizeHandle={<ColResizeHandle col="youth_chaplain_share" startResize={startResize} />}
                />
                <SortableHeader
                  label="Missions"
                  sortKey="missions"
                  activeSort={sort}
                  onSort={onSort}
                  filter={
                    <TextColumnFilter
                      label="Missions"
                      options={missionsOptions}
                      selected={missionsFilter}
                      onChange={setMissionsFilter}
                    />
                  }
                  resizeHandle={<ColResizeHandle col="missions" startResize={startResize} />}
                />
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <AccountRow key={a.account_no} account={a} onClick={() => setOpenAccount(a)} />
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} style={{ color: "var(--muted)" }}>
                    No accounts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openAccount && (
        <AccountDetailModal
          account={openAccount}
          onClose={() => setOpenAccount(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}
