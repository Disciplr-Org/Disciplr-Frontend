import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Text } from "../components/Text";
import { SafeLink } from "../components/SafeLink";
import { listAllActivity, type VaultActivityRecord } from "../services/vaultService";
import { formatDateTime, formatUsdc } from "../utils/format";
import { useOnRecovered } from "../hooks/useOnRecovered";
import { toCsv, downloadCsv } from "../utils/csv";
import { getExplorerTxUrl, isValidTxHash } from "../utils/explorer";
import { truncateMiddle } from "../utils/truncate";
import { useWallet } from "../hooks/useWallet";

type NetworkName = Parameters<typeof getExplorerTxUrl>[1] | string;

type ActivityExtras = {
  hash?: string;
  fee?: string | number;
  block?: string | number;
  from?: string;
  to?: string;
  memo?: string;
};

const LABEL: Record<VaultActivityRecord["type"], string> = {
  create: "Vault created",
  validate: "Milestone validated",
  release: "Funds released",
  redirect: "Funds redirected",
};

function TxHashCell({ hash, network }: { hash: string | undefined | null; network: NetworkName }) {
  if (!hash || typeof hash !== "string") return <span>—</span>;
  if (!isValidTxHash(hash)) return <span>{truncateMiddle(hash, 8, 6)}</span>;
  return (
    <SafeLink href={getExplorerTxUrl(hash, network)} title={hash}>
      {truncateMiddle(hash, 8, 6)}
    </SafeLink>
  );
}

/** Activity feed across all vaults. */
export default function Transactions() {
  const { network } = useWallet();
  const [rows, setRows] = useState<VaultActivityRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string>("");

  const load = () => {
    setError(null);
    listAllActivity()
      .then((r) => setRows([...r].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not load activity."));
  };

  useEffect(() => {
    load();
  }, []);

  useOnRecovered(load);

  const handleExport = () => {
    if (!rows || rows.length === 0) return;
    const csvRows = rows.map((r: VaultActivityRecord) => ({
      id: r.id,
      timestamp: r.timestamp,
      type: r.type,
      label: LABEL[r.type] ?? r.type,
      vault: r.vault,
      amount: r.amount,
      hash: (r as VaultActivityRecord & ActivityExtras).hash ?? "",
      status: r.status,
      fee: (r as VaultActivityRecord & ActivityExtras).fee ?? "",
      block: (r as VaultActivityRecord & ActivityExtras).block ?? "",
      from: (r as VaultActivityRecord & ActivityExtras).from ?? "",
      to: (r as VaultActivityRecord & ActivityExtras).to ?? "",
      memo: (r as VaultActivityRecord & ActivityExtras).memo ?? "",
    }));
    const csv = toCsv(csvRows, "transactions");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    downloadCsv(csv, `transactions-${stamp}.csv`);
    setExportMessage(`Exported ${rows.length} transactions.`);
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "var(--spacing-4)" }}>
      <Text role="title" as="h1">Transactions</Text>
      <p style={{ color: "var(--muted)" }}>Every create, validate, release and redirect across your vaults.</p>
      <button type="button" onClick={handleExport} disabled={!rows || rows.length === 0}>
        Export CSV
      </button>
      <div aria-live="polite">{exportMessage}</div>
      {error && <p role="alert">{error}</p>}
      {!rows && !error && <p aria-live="polite">Loading activity...</p>}
      {rows && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--muted)" }}>
                <th style={{ padding: 8 }}>When</th>
                <th style={{ padding: 8 }}>Event</th>
                <th style={{ padding: 8 }}>Vault</th>
                <th style={{ padding: 8, textAlign: "right" }}>Amount (USDC)</th>
                <th style={{ padding: 8 }}>Hash</th>
                <th style={{ padding: 8 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid var(--border, #8883)" }}>
                  <td style={{ padding: 8, whiteSpace: "nowrap" }}>{formatDateTime(r.timestamp)}</td>
                  <td style={{ padding: 8 }}>{LABEL[r.type] ?? r.type}</td>
                  <td style={{ padding: 8 }}>{r.vault}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>{formatUsdc(r.amount)}</td>
                  <td style={{ padding: 8, fontFamily: "monospace" }}>
                    <TxHashCell hash={(r as { hash?: string }).hash} network={network} />
                  </td>
                  <td style={{ padding: 8 }}>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p>No activity yet. <Link to="/vaults/create">Create a vault</Link>.</p>}
        </div>
      )}
    </div>
  );
}
