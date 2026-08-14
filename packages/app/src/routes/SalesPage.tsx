import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, type SaleRow } from '../api/client.js';

const STATUS_STYLES: Record<SaleRow['attributionStatus'], string> = {
  PENDING: 'bg-amber-900/40 text-amber-300 border-amber-800',
  ATTRIBUTED: 'bg-emerald-900/40 text-emerald-300 border-emerald-800',
  HOUSE: 'bg-sky-900/40 text-sky-300 border-sky-800',
};

function StatusBadge({ status }: { status: SaleRow['attributionStatus'] }) {
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded border ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** TeamTime's group shape isn't pinned down; accept whatever label it sends. */
function groupLabel(g: { id: string; name?: string; label?: string; consignorName?: string }) {
  return g.name ?? g.label ?? g.consignorName ?? g.id;
}

export function SalesPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('PENDING');
  const [days, setDays] = useState(365);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lister, setLister] = useState('');
  const [group, setGroup] = useState('');
  const [note, setNote] = useState<string | null>(null);

  const salesQ = useQuery({
    queryKey: ['sales', status, days],
    queryFn: () =>
      api.listSales({
        attributionStatus: status === 'ALL' ? undefined : status,
        days,
        limit: 500,
      }),
  });
  const listersQ = useQuery({ queryKey: ['listers'], queryFn: () => api.listListers() });
  const groupsQ = useQuery({
    queryKey: ['consignment-groups'],
    queryFn: () => api.listConsignmentGroups(),
    retry: false,
  });

  const sales = useMemo(() => salesQ.data?.sales ?? [], [salesQ.data]);
  const listers = listersQ.data?.listers ?? [];
  const groups = groupsQ.data?.groups ?? [];
  const groupsUnavailable = groupsQ.isError || groupsQ.data?.source === 'unconfigured';

  const assign = useMutation({
    mutationFn: (body: { house?: boolean; listedById?: string | null; consignmentGroupId?: string | null }) =>
      api.bulkAttribution({ saleIds: [...selected], ...body }),
    onSuccess: (res) => {
      setNote(`Updated ${res.updated} of ${res.requested} sales.`);
      setSelected(new Set());
      void qc.invalidateQueries({ queryKey: ['sales'] });
    },
    onError: (err) => setNote(`Failed: ${(err as Error).message}`),
  });

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const allSelected = sales.length > 0 && selected.size === sales.length;

  if (salesQ.isLoading) return <div className="text-neutral-400">Loading…</div>;
  if (salesQ.error)
    return <div className="text-red-400">Error: {(salesQ.error as Error).message}</div>;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-2xl">Sales</h2>
        <div className="text-sm text-neutral-400">
          {salesQ.data?.totals.count ?? 0} sales · {usd.format(salesQ.data?.totals.gross ?? 0)} gross
        </div>
      </div>

      <div className="flex gap-3 items-center mb-4 text-sm">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setSelected(new Set());
          }}
          className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1"
        >
          <option value="PENDING">Unassigned</option>
          <option value="ATTRIBUTED">Assigned</option>
          <option value="HOUSE">House</option>
          <option value="ALL">All</option>
        </select>
        <select
          value={days}
          onChange={(e) => {
            setDays(Number(e.target.value));
            setSelected(new Set());
          }}
          className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1"
        >
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last year</option>
          <option value={3650}>All time</option>
        </select>
        {note && <span className="text-neutral-400">{note}</span>}
      </div>

      {groupsUnavailable && (
        <div className="mb-4 text-xs text-amber-300 border border-amber-900/60 bg-amber-950/30 rounded px-3 py-2">
          Consignor list unavailable — TeamTime's registry is unreachable or not configured. Lister
          assignment still works.
        </div>
      )}

      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 items-center border border-neutral-700 bg-neutral-900 rounded px-3 py-2 text-sm">
          <span className="text-neutral-300">{selected.size} selected</span>

          <select
            value={lister}
            onChange={(e) => setLister(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1"
          >
            <option value="">Listing agent…</option>
            {listers.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            disabled={groups.length === 0}
            className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 disabled:opacity-40"
          >
            <option value="">Customer…</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {groupLabel(g)}
              </option>
            ))}
          </select>

          <button
            disabled={(!lister && !group) || assign.isPending}
            onClick={() =>
              assign.mutate({
                ...(lister ? { listedById: lister } : {}),
                ...(group ? { consignmentGroupId: group } : {}),
              })
            }
            className="px-3 py-1 rounded bg-emerald-800 hover:bg-emerald-700 disabled:opacity-40"
          >
            Assign
          </button>
          <button
            disabled={assign.isPending}
            onClick={() => assign.mutate({ house: true })}
            className="px-3 py-1 rounded bg-sky-900 hover:bg-sky-800 disabled:opacity-40"
          >
            Mark house
          </button>
          <button
            disabled={assign.isPending}
            onClick={() => assign.mutate({ listedById: null, consignmentGroupId: null })}
            className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40"
          >
            Clear
          </button>
        </div>
      )}

      <div className="border border-neutral-800 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-400 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-3 py-2 w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() =>
                    setSelected(allSelected ? new Set() : new Set(sales.map((s) => s.id)))
                  }
                />
              </th>
              <th className="text-left px-3 py-2 font-medium">Sold</th>
              <th className="text-left px-3 py-2 font-medium">Item</th>
              <th className="text-left px-3 py-2 font-medium">SKU</th>
              <th className="text-right px-3 py-2 font-medium">Price</th>
              <th className="text-left px-3 py-2 font-medium">Status</th>
              <th className="text-left px-3 py-2 font-medium">Listing agent</th>
              <th className="text-left px-3 py-2 font-medium">Customer</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr
                key={s.id}
                className={`border-t border-neutral-800 hover:bg-neutral-900/50 ${
                  selected.has(s.id) ? 'bg-neutral-900/70' : ''
                }`}
              >
                <td className="px-3 py-2">
                  <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
                </td>
                <td className="px-3 py-2 text-neutral-400 whitespace-nowrap">
                  {new Date(s.soldAt).toLocaleDateString()}
                </td>
                <td className="px-3 py-2 text-neutral-100">
                  <div className="line-clamp-1">{s.title}</div>
                  <div className="text-xs text-neutral-500">
                    {s.ebayAccount?.accountName ?? '—'}
                    {s.salesRecordNumber ? ` · SRN ${s.salesRecordNumber}` : ''}
                  </div>
                </td>
                <td className="px-3 py-2 text-neutral-400">
                  {s.item?.sku ?? s.customLabel ?? <span className="text-neutral-600">—</span>}
                </td>
                <td className="px-3 py-2 text-right text-neutral-300 whitespace-nowrap">
                  {usd.format(s.itemPrice * s.quantity)}
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={s.attributionStatus} />
                </td>
                <td className="px-3 py-2 text-neutral-400">
                  {s.listedBy?.name ?? <span className="text-neutral-600">—</span>}
                </td>
                <td className="px-3 py-2 text-neutral-400">
                  {s.consignmentGroupId ? (
                    groupLabel(
                      groups.find((g) => g.id === s.consignmentGroupId) ?? {
                        id: s.consignmentGroupId,
                      },
                    )
                  ) : (
                    <span className="text-neutral-600">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sales.length === 0 && (
          <div className="text-neutral-500 px-3 py-6">No sales match this filter.</div>
        )}
      </div>
    </div>
  );
}
