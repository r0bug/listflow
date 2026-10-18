import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type EarningsImportResult, type OrdersImportResult } from '../api/client.js';

type Kind = 'orders' | 'earnings';
type Result = OrdersImportResult | EarningsImportResult;

function summary(kind: Kind, r: Result): string {
  if (kind === 'orders') {
    const o = r as OrdersImportResult;
    return `${o.created} new · ${o.duplicates} already here · ${o.skipped} skipped · ${o.matchedToItems} matched to items${
      o.errors.length ? ` · ${o.errors.length} errors` : ''
    }`;
  }
  const e = r as EarningsImportResult;
  return `${e.rows} rows · ${e.updated} sales got fees · ${e.created} created · ${e.unmatched} unmatched · ${e.skipped} skipped`;
}

/** Seller Hub CSV import: preview (dry run) first, then import for real. */
export function SalesImportPanel() {
  const qc = useQueryClient();
  const accountsQ = useQuery({ queryKey: ['ebay-accounts'], queryFn: () => api.listEbayAccounts() });
  const accounts = accountsQ.data?.accounts ?? [];
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>('orders');
  const [accountId, setAccountId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [createMissing, setCreateMissing] = useState(false);
  const [preview, setPreview] = useState<Result | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ready = Boolean(file && accountId);

  async function run(dryRun: boolean) {
    if (!file || !accountId) return;
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const r = await api.importSalesCsv(kind, file, accountId, { dryRun, createMissing });
      if (dryRun) {
        setPreview(r);
      } else {
        setPreview(null);
        setDone(`Imported ${file.name}: ${summary(kind, r)}`);
        setFile(null);
        void qc.invalidateQueries({ queryKey: ['sales'] });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setPreview(null);
    setDone(null);
    setError(null);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm px-3 py-1 rounded border border-neutral-700 hover:bg-neutral-800"
      >
        Import CSV…
      </button>
    );
  }

  return (
    <div className="mb-4 p-3 rounded border border-neutral-800 bg-neutral-900/60 text-sm space-y-2">
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={kind}
          onChange={(e) => {
            setKind(e.target.value as Kind);
            reset();
          }}
          className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1"
        >
          <option value="orders">Orders report (creates sales)</option>
          <option value="earnings">Order earnings report (adds fees)</option>
        </select>
        <select
          value={accountId}
          onChange={(e) => {
            setAccountId(e.target.value);
            reset();
          }}
          className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1"
        >
          <option value="">— eBay account —</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.accountName}
            </option>
          ))}
        </select>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            reset();
          }}
        />
        {kind === 'earnings' && (
          <label className="flex items-center gap-1 text-neutral-400">
            <input type="checkbox" checked={createMissing} onChange={(e) => setCreateMissing(e.target.checked)} />
            create sales missing from the Orders import
          </label>
        )}
        <button
          disabled={!ready || busy}
          onClick={() => void run(true)}
          className="px-3 py-1 rounded bg-neutral-800 disabled:opacity-40"
        >
          Preview
        </button>
        <button
          disabled={!ready || busy || !preview}
          onClick={() => void run(false)}
          className="px-3 py-1 rounded bg-blue-700 text-white disabled:opacity-40"
          title={preview ? '' : 'Preview first'}
        >
          Import
        </button>
        <button onClick={() => setOpen(false)} className="text-neutral-500 ml-auto">
          Close
        </button>
      </div>
      {busy && <div className="text-neutral-400">Working…</div>}
      {preview && <div className="text-neutral-300">Preview (nothing saved yet): {summary(kind, preview)}</div>}
      {done && <div className="text-emerald-400">{done}</div>}
      {error && <div className="text-red-400">{error}</div>}
    </div>
  );
}
