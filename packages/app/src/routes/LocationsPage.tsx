import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type StorageLocationRow } from '../api/client.js';

// The shelving system in the YF eBay room.
// Assignment itself happens in the extension's on-page bar, where the operator
// is standing at the shelf — this page exists to define the racks, correct a
// shelf that moved as a unit, and see what is where.

export function LocationsPage() {
  const qc = useQueryClient();
  const [showInactive, setShowInactive] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['locations', showInactive],
    queryFn: () => api.locations(showInactive),
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ['locations'] });
  const run = <T,>(p: Promise<T>, ok?: string) => {
    setErr(null);
    setNote(null);
    p.then(() => { invalidate(); if (ok) setNote(ok); })
     .catch((e: Error) => setErr(e.message));
  };

  const seed = useMutation({
    mutationFn: ({ from, to, shelves }: { from: string; to: string; shelves: number }) =>
      api.seedLocations(from, to, shelves),
  });

  const locations = data?.locations ?? [];
  // Group by section letter; free-form locations ("johns garage") collect
  // under their own heading rather than being forced into the grid.
  const byRow = new Map<string, StorageLocationRow[]>();
  for (const l of locations) {
    const key = l.row ?? '\u2014';
    if (!byRow.has(key)) byRow.set(key, []);
    byRow.get(key)!.push(l);
  }
  const totalItems = locations.reduce((n, l) => n + l.itemCount, 0);
  const unusedShelves = locations.filter((l) => l.active && l.itemCount === 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Shelf locations</h2>
        <p className="text-sm text-neutral-400 mt-1">
          A location is just a label — <code className="text-neutral-300">A-1</code> to match the
          printed shelf tags, or anything else you write on a shelf. Locations are created the
          moment someone uses one, so this list is what is actually in use. The database is the
          authority; each listing&apos;s eBay Custom Label is a copy that goes stale until that
          listing is revised.
        </p>
      </div>

      {err && <div className="text-sm text-red-400 border border-red-900 rounded p-2">{err}</div>}
      {note && <div className="text-sm text-green-400 border border-green-900 rounded p-2">{note}</div>}

      <SeedRack onSeed={(from, to, shelves) =>
        run(seed.mutateAsync({ from, to, shelves }), `Seeded ${from.toUpperCase()}-1 … ${to.toUpperCase()}-${shelves}.`)} />

      <AddOne onAdd={(code, label) =>
        run(api.createLocation({ code, label: label || undefined }), `${code} added.`)} />

      <MoveShelf locations={locations} onMove={(from, to) =>
        run(api.moveShelf(from, to), `Everything on ${from} moved to ${to}. Their live Custom Labels still say ${from} until each listing is revised.`)} />

      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-400">
          {isLoading ? 'Loading…' : `${locations.length} shelves · ${totalItems} items placed · ${unusedShelves} empty`}
        </div>
        <label className="text-xs text-neutral-400 flex items-center gap-2">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          show retired
        </label>
      </div>

      <div className="space-y-4">
        {[...byRow.entries()]
          .sort((a, b) => (a[0] === '\u2014' ? 1 : b[0] === '\u2014' ? -1 : a[0].localeCompare(b[0])))
          .map(([row, shelves]) => (
          <div key={row}>
            <div className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
              {row === '\u2014' ? 'Other locations' : `Section ${row}`}
            </div>
            <div className="flex flex-wrap gap-2">
              {shelves
                .sort((a, b) => (a.shelf ?? 0) - (b.shelf ?? 0) || a.code.localeCompare(b.code))
                .map((l) => (
                <div
                  key={l.id}
                  className={`border rounded px-3 py-2 min-w-28 ${
                    l.active ? 'border-neutral-700' : 'border-neutral-800 opacity-50'
                  }`}
                >
                  <div className="font-mono text-sm">{l.code}</div>
                  <div className="text-xs text-neutral-400">
                    {l.itemCount} item{l.itemCount === 1 ? '' : 's'}
                  </div>
                  {l.label && <div className="text-xs text-neutral-500 mt-0.5">{l.label}</div>}
                  <button
                    className="text-xs text-neutral-500 hover:text-neutral-300 underline mt-1"
                    onClick={() => run(
                      api.updateLocation(l.code, { active: !l.active }),
                      `${l.code} ${l.active ? 'retired' : 'restored'}.`,
                    )}
                  >
                    {l.active ? 'retire' : 'restore'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
        {!isLoading && locations.length === 0 && (
          <div className="text-sm text-neutral-500">
            No shelves yet — seed a rack above to get started.
          </div>
        )}
      </div>
    </div>
  );
}

function SeedRack({ onSeed }: { onSeed: (from: string, to: string, shelves: number) => void }) {
  const [from, setFrom] = useState('A');
  const [to, setTo] = useState('F');
  const [shelves, setShelves] = useState(6);
  const count = Math.max(0, to.toUpperCase().charCodeAt(0) - from.toUpperCase().charCodeAt(0) + 1) * shelves;
  return (
    <div className="border border-neutral-800 rounded p-3 space-y-2">
      <div className="text-sm font-medium">Seed printed shelf tags</div>
      <div className="text-xs text-neutral-500">
        Matches the labels the vendor kiosk prints (<code>shelf-labels.sh</code>, A–Z × 1–6).
        Creates {from.toUpperCase()}-1 … {to.toUpperCase()}-{shelves}. Existing ones are left alone.
        You do not need this for free-form locations — those appear the moment someone uses them.
      </div>
      <div className="flex items-center gap-2 text-sm">
        <input maxLength={1} value={from} onChange={(e) => setFrom(e.target.value)}
          className="w-12 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-center uppercase" />
        <span className="text-neutral-500">to</span>
        <input maxLength={1} value={to} onChange={(e) => setTo(e.target.value)}
          className="w-12 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-center uppercase" />
        <span className="text-neutral-500">×</span>
        <input type="number" min={1} max={99} value={shelves}
          onChange={(e) => setShelves(Number(e.target.value))}
          className="w-20 bg-neutral-900 border border-neutral-700 rounded px-2 py-1" />
        <span className="text-neutral-500">shelves</span>
        <button disabled={count <= 0} onClick={() => onSeed(from, to, shelves)}
          className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded px-3 py-1 disabled:opacity-40">
          Create {count}
        </button>
      </div>
    </div>
  );
}

function AddOne({ onAdd }: { onAdd: (code: string, label: string) => void }) {
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  return (
    <div className="border border-neutral-800 rounded p-3 space-y-2">
      <div className="text-sm font-medium">Add one shelf</div>
      <div className="flex items-center gap-2 text-sm">
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="A-1 or johns garage"
          className="w-56 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 font-mono" />
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="optional label"
          className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1" />
        <button disabled={!code.trim()}
          onClick={() => { onAdd(code.trim(), label.trim()); setCode(''); setLabel(''); }}
          className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded px-3 py-1 disabled:opacity-40">
          Add
        </button>
      </div>
    </div>
  );
}

function MoveShelf({
  locations,
  onMove,
}: {
  locations: StorageLocationRow[];
  onMove: (from: string, to: string) => void;
}) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const occupied = locations.filter((l) => l.itemCount > 0);
  return (
    <div className="border border-neutral-800 rounded p-3 space-y-2">
      <div className="text-sm font-medium">Move a whole shelf</div>
      <div className="text-xs text-neutral-500">
        For a shelf that physically moved as a unit. Updates every item on it.
      </div>
      <div className="flex items-center gap-2 text-sm">
        <select value={from} onChange={(e) => setFrom(e.target.value)}
          className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 font-mono">
          <option value="">from…</option>
          {occupied.map((l) => (
            <option key={l.id} value={l.code}>{l.code} ({l.itemCount})</option>
          ))}
        </select>
        <span className="text-neutral-500">→</span>
        <select value={to} onChange={(e) => setTo(e.target.value)}
          className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1 font-mono">
          <option value="">to…</option>
          {locations.filter((l) => l.active).map((l) => (
            <option key={l.id} value={l.code}>{l.code}</option>
          ))}
        </select>
        <button disabled={!from || !to || from === to} onClick={() => onMove(from, to)}
          className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded px-3 py-1 disabled:opacity-40">
          Move
        </button>
      </div>
    </div>
  );
}
