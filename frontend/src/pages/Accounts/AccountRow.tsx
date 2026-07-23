import { ChartAccount } from "../../api/accounts";

/** A plain, clickable row - the full-detail view (all fields, editable
 * except account_no and the hierarchy) lives in AccountDetailModal, opened
 * by the parent on click. */
export default function AccountRow(props: { account: ChartAccount; onClick: () => void }) {
  const a = props.account;
  return (
    <tr onClick={props.onClick} style={{ cursor: "pointer" }}>
      <td>{a.account_no}</td>
      <td>{a.category}</td>
      <td>
        {a.statement_category_no} · {a.statement_category}
      </td>
      <td>
        {a.statement_item_no} · {a.statement_item}
      </td>
      <td>{a.statement_detail || "—"}</td>
      <td>{a.statement_description}</td>
      <td>{a.grouping || "—"}</td>
      <td>{a.is_tax_deductible}</td>
      <td>{a.is_mandatory}</td>
      <td>{a.is_youth_chaplain_share}</td>
      <td>{a.is_missions}</td>
    </tr>
  );
}
