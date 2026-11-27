import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CalendarClock,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { api } from '../utils/api';

// Minimal shapes: only fields actually consumed by the calculations below.
type Property = { id: number; name: string };
type Unit = { id: number; property_id: number; property_name?: string; status?: string | null };
type Tenant = { id: number; unit_id?: number | null; monthly_rent?: string | number | null };
type Tenancy = {
  id: number;
  unit_id?: number | null;
  status?: string | null;
  monthly_rent?: string | number | null;
};
type Lease = {
  id: number;
  tenant_name?: string | null;
  property_name?: string | null;
  unit_number?: string | null;
  status?: string | null;
  end_date?: string | null;
  monthly_rent?: string | number | null;
};
type ArrearsRow = {
  id: number;
  tenant_name?: string | null;
  property_name?: string | null;
  unit_number?: string | null;
  month_for?: string | null;
  due_date?: string | null;
  amount?: string | number | null;
};
type Ticket = { id: number; status?: string | null; category?: string | null };

type Dataset = {
  properties: Property[];
  units: Unit[];
  tenants: Tenant[];
  tenancies: Tenancy[];
  leases: Lease[];
  arrears: ArrearsRow[];
  maintenance: Ticket[];
};

const EMPTY_DATA: Dataset = {
  properties: [], units: [], tenants: [], tenancies: [], leases: [], arrears: [], maintenance: [],
};

const DATASET_KEYS = [
  'properties', 'units', 'tenants', 'tenancies', 'leases', 'arrears', 'maintenance',
] as const;
type DatasetKey = (typeof DATASET_KEYS)[number];

const DATASET_LABELS: Record<DatasetKey, string> = {
  properties: 'Properties',
  units: 'Units',
  tenants: 'Tenants',
  tenancies: 'Tenancies',
  leases: 'Leases',
  arrears: 'Arrears',
  maintenance: 'Maintenance',
};

const DAY_MS = 86_400_000;

function requireArray<T>(value: unknown): T[] {
  if (!Array.isArray(value)) throw new Error('The service returned an unexpected response format.');
  return value as T[];
}

function fulfilled<T>(result: PromiseSettledResult<unknown>, fallback: T): T {
  return result.status === 'fulfilled' ? (result.value as T) : fallback;
}

function money(value: string | number | null | undefined): string {
  const amount = Number(value ?? 0);
  const safe = Number.isFinite(amount) ? amount : 0;
  return `R ${safe.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function totalOf(values: (string | number | null | undefined)[]): number {
  return values.reduce((sum, value) => {
    const amount = Number(value ?? 0);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysUntil(value: string | null | undefined, today: Date): number | null {
  const date = parseDate(value);
  if (!date) return null;
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((date.getTime() - startOfToday.getTime()) / DAY_MS);
}

function isActiveLease(status?: string | null): boolean {
  const value = String(status ?? '').toLowerCase();
  return value === 'active' || value === 'expiring_soon';
}

type QueueRow = {
  id: string;
  kind: 'Arrears' | 'Lease expiry';
  party: string;
  location: string;
  detail: string;
  value: string;
  order: number;
};

const where = (property?: string | null, unit?: string | null): string =>
  [property, unit ? `Unit ${unit}` : null].filter(Boolean).join(' · ') || '—';

export default function Analytics() {
  const [data, setData] = useState<Dataset>(EMPTY_DATA);
  const [failed, setFailed] = useState<DatasetKey[]>([]);
  const [errors, setErrors] = useState<Partial<Record<DatasetKey, string>>>({});
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => new Date(), []);

  const load = async () => {
    setLoading(true);
    const settled = await Promise.allSettled([
      api.getProperties().then((raw) => requireArray<Property>(raw)),
      api.getUnits().then((raw) => requireArray<Unit>(raw)),
      api.getTenants().then((raw) => requireArray<Tenant>(raw)),
      api.getTenancies().then((raw) => requireArray<Tenancy>(raw)),
      api.getLeases().then((raw) => requireArray<Lease>(raw)),
      api.getArrears().then((raw) =>
        requireArray<ArrearsRow>(Array.isArray(raw) ? raw : raw?.arrears ?? raw?.records)),
      api.getMaintenanceData().then((raw) => {
        if (!raw || !Array.isArray(raw.tickets)) {
          throw new Error('Maintenance data was returned in an unexpected format.');
        }
        return raw.tickets as Ticket[];
      }),
    ]);

    const nextErrors: Partial<Record<DatasetKey, string>> = {};
    settled.forEach((result, index) => {
      if (result.status === 'rejected') {
        nextErrors[DATASET_KEYS[index]] = result.reason instanceof Error
          ? result.reason.message
          : 'The request failed.';
      }
    });

    setData({
      properties: fulfilled<Property[]>(settled[0], []),
      units: fulfilled<Unit[]>(settled[1], []),
      tenants: fulfilled<Tenant[]>(settled[2], []),
      tenancies: fulfilled<Tenancy[]>(settled[3], []),
      leases: fulfilled<Lease[]>(settled[4], []),
      arrears: fulfilled<ArrearsRow[]>(settled[5], []),
      maintenance: fulfilled<Ticket[]>(settled[6], []),
    });
    setFailed(DATASET_KEYS.filter((_, index) => settled[index].status === 'rejected'));
    setErrors(nextErrors);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const has = (key: DatasetKey): boolean => !failed.includes(key);

  const summary = useMemo(() => {
    const activeTenancies = has('tenancies')
      ? data.tenancies.filter((item) =>
        item.unit_id !== null && item.unit_id !== undefined &&
        String(item.status ?? '').toLowerCase() !== 'ended')
      : null;
    const activeLeases = has('leases')
      ? data.leases.filter((item) => isActiveLease(item.status))
      : null;

    const tenantLinked = data.tenants.filter((item) =>
      item.unit_id !== null && item.unit_id !== undefined);

    // Prefer explicit unit status; fall back to tenant-to-unit links if the
    // unit feed has no status information. Never guess a denominator.
    const unitStatusAvailable = data.units.some((unit) => Boolean(unit.status));
    let occupancy: { value: number; occupied: number; total: number; basis: string } | null = null;
    if (has('units') && (unitStatusAvailable || has('tenants'))) {
      const occupied = unitStatusAvailable
        ? data.units.filter((unit) => String(unit.status ?? '').toLowerCase() === 'occupied').length
        : tenantLinked.length;
      occupancy = {
        value: data.units.length ? Math.round((occupied / data.units.length) * 100) : 0,
        occupied,
        total: data.units.length,
        basis: unitStatusAvailable ? 'Unit status' : 'Tenant-to-unit links',
      };
    }

    let rentRoll: { value: number; source: string } | null = null;
    if (activeTenancies) {
      rentRoll = { value: totalOf(activeTenancies.map((item) => item.monthly_rent)), source: 'Active tenancies' };
    } else if (activeLeases) {
      rentRoll = { value: totalOf(activeLeases.map((item) => item.monthly_rent)), source: 'Active leases' };
    } else if (has('tenants')) {
      rentRoll = { value: totalOf(tenantLinked.map((item) => item.monthly_rent)), source: 'Tenants with a unit' };
    }

    const arrears = has('arrears')
      ? { total: totalOf(data.arrears.map((item) => item.amount)), count: data.arrears.length }
      : null;

    const openMaintenance = has('maintenance')
      ? data.maintenance.filter((ticket) => {
        const status = String(ticket.status ?? '').toLowerCase();
        return !['resolved', 'closed', 'cancelled'].includes(status);
      }).length
      : null;

    let expiring: { d30: number; d60: number } | null = null;
    if (has('leases')) {
      const active = data.leases.filter((lease) => isActiveLease(lease.status));
      const days = active
        .map((lease) => daysUntil(lease.end_date, today))
        .filter((value): value is number => value !== null && value >= 0 && value <= 60);
      expiring = {
        d30: days.filter((value) => value <= 30).length,
        d60: days.length,
      };
    }

    return {
      properties: has('properties') ? data.properties.length : null,
      units: has('units') ? data.units.length : null,
      occupancy,
      activeTenancies: activeTenancies?.length ?? activeLeases?.length ?? null,
      rentRoll,
      arrears,
      openMaintenance,
      expiring,
    };
  }, [data, failed, today]);

  const queue = useMemo(() => {
    const rows: QueueRow[] = [];
    if (has('arrears')) {
      data.arrears.forEach((item, index) => rows.push({
        id: `arrears-${item.id ?? index}`,
        kind: 'Arrears',
        party: item.tenant_name || 'Tenant',
        location: where(item.property_name, item.unit_number),
        detail: item.month_for ? `Rent for ${item.month_for}` : 'Outstanding obligation',
        value: money(item.amount),
        order: 1000,
      }));
    }
    if (has('leases')) {
      data.leases.forEach((item, index) => {
        const days = daysUntil(item.end_date, today);
        if (!isActiveLease(item.status) || days === null || days < 0 || days > 60) return;
        rows.push({
          id: `lease-${item.id ?? index}`,
          kind: 'Lease expiry',
          party: item.tenant_name || 'Tenant',
          location: where(item.property_name, item.unit_number),
          detail: `Expires ${item.end_date} · ${days} day${days === 1 ? '' : 's'}`,
          value: item.end_date ?? '—',
          order: days,
        });
      });
    }
    return rows.sort((a, b) => a.order - b.order);
  }, [data, failed, today]);

  const occupancyRows = useMemo(() => {
    if (!has('units')) return null;
    const names = new Map(data.properties.map((property) => [property.id, property.name]));
    const unitStatusAvailable = data.units.some((unit) => Boolean(unit.status));
    if (!unitStatusAvailable && !has('tenants')) return null;
    const linkedUnitIds = new Set(
      data.tenants
        .filter((tenant) => tenant.unit_id !== null && tenant.unit_id !== undefined)
        .map((tenant) => Number(tenant.unit_id)),
    );
    const groups = new Map<number, { name: string; total: number; occupied: number }>();
    for (const unit of data.units) {
      const propertyId = Number(unit.property_id);
      const name = names.get(propertyId) || unit.property_name || `Property #${propertyId}`;
      const group = groups.get(propertyId) ?? { name, total: 0, occupied: 0 };
      group.total += 1;
      const occupied = unitStatusAvailable
        ? String(unit.status ?? '').toLowerCase() === 'occupied'
        : linkedUnitIds.has(Number(unit.id));
      if (occupied) group.occupied += 1;
      groups.set(propertyId, group);
    }
    return Array.from(groups.values()).map((group) => ({
      ...group,
      percent: group.total ? Math.round((group.occupied / group.total) * 100) : 0,
    }));
  }, [data, failed]);

  const stats: { label: string; value: string; note: string; icon: LucideIcon }[] = [
    { label: 'Properties', value: summary.properties === null ? '—' : String(summary.properties), note: 'Registered sites', icon: Building2 },
    { label: 'Units', value: summary.units === null ? '—' : String(summary.units), note: 'Rentable units / rooms', icon: KeyRound },
    { label: 'Occupancy', value: summary.occupancy ? `${summary.occupancy.value}%` : '—', note: summary.occupancy ? `${summary.occupancy.occupied} of ${summary.occupancy.total} · ${summary.occupancy.basis}` : 'Unavailable', icon: Users },
    { label: 'Active tenancies', value: summary.activeTenancies === null ? '—' : String(summary.activeTenancies), note: 'Unit-linked, not ended', icon: Users },
    { label: 'Monthly rent roll', value: summary.rentRoll ? money(summary.rentRoll.value) : '—', note: summary.rentRoll?.source ?? 'Unavailable', icon: TrendingUp },
    { label: 'Total arrears', value: summary.arrears ? money(summary.arrears.total) : '—', note: summary.arrears ? `${summary.arrears.count} overdue record(s)` : 'Unavailable', icon: Wallet },
    { label: 'Open maintenance', value: summary.openMaintenance === null ? '—' : String(summary.openMaintenance), note: 'Tickets not resolved', icon: Wrench },
    { label: 'Expiring leases', value: summary.expiring ? `${summary.expiring.d30} / ${summary.expiring.d60}` : '—', note: 'Next 30 / 60 days', icon: CalendarClock },
  ];

  const firstError = failed.map((key) => errors[key]).find(Boolean);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Portfolio insight</p>
          <h2 className="mt-1 font-display text-2xl text-charcoal md:text-3xl">Analytics</h2>
          <p className="mt-1 text-sm text-gray-600">
            Live figures calculated from portfolio, tenancy, rent and maintenance records.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-charcoal shadow-sm hover:border-gold disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {failed.length > 0 && (
        <div role="alert" className="rounded-2xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">
          <p className="font-semibold">
            Could not load: {failed.map((key) => DATASET_LABELS[key]).join(', ')}.
          </p>
          <p className="mt-1 text-xs">Figures from these sources show — instead of an estimate.</p>
          {firstError && <p className="mt-1 text-xs opacity-80">{firstError}</p>}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 shadow-premium">
          Loading portfolio analytics…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {stats.map(({ label, value, note, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-premium">
                <div className="flex items-center gap-2 text-gold">
                  <Icon size={16} />
                  <p className="text-[11px] font-bold uppercase tracking-wider">{label}</p>
                </div>
                <p className="mt-2 font-display text-xl text-charcoal md:text-2xl">{value}</p>
                <p className="mt-1 text-[11px] text-gray-500">{note}</p>
              </div>
            ))}
          </div>

          <section className="rounded-2xl border border-gray-200 bg-white shadow-premium">
            <div className="border-b border-gray-200 px-5 py-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-gold" />
                <div>
                  <h3 className="font-display text-lg text-charcoal">Action queue</h3>
                  <p className="text-xs text-gray-500">
                    Arrears and active leases expiring within 60 days. Showing {Math.min(queue.length, 12)} of {queue.length} item(s).
                  </p>
                </div>
              </div>
            </div>
            {failed.includes('arrears') && failed.includes('leases') ? (
              <p className="p-6 text-sm text-danger">Arrears and lease data are unavailable.</p>
            ) : queue.length === 0 ? (
              <div className="p-10 text-center">
                <CheckCircle2 size={28} className="mx-auto text-success" />
                <p className="mt-2 text-sm font-semibold text-charcoal">Nothing needs attention in the loaded data.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-ivory text-[11px] uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Tenant</th>
                      <th className="px-5 py-3">Property / unit</th>
                      <th className="px-5 py-3">Detail</th>
                      <th className="px-5 py-3">Amount / date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.slice(0, 12).map((row) => (
                      <tr key={row.id} className="border-t border-gray-100 hover:bg-ivory/60">
                        <td className="px-5 py-3">
                          <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${row.kind === 'Arrears' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                            {row.kind}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-semibold text-charcoal">{row.party}</td>
                        <td className="px-5 py-3 text-gray-600">{row.location}</td>
                        <td className="px-5 py-3 text-gray-600">{row.detail}</td>
                        <td className="px-5 py-3 font-semibold text-charcoal">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white shadow-premium">
            <div className="border-b border-gray-200 px-5 py-4">
              <h3 className="font-display text-lg text-charcoal">Occupancy by property</h3>
              <p className="text-xs text-gray-500">Occupied units as a share of registered units per property.</p>
            </div>
            {occupancyRows === null ? (
              <p className="p-6 text-sm text-danger">Unit occupancy data is unavailable.</p>
            ) : occupancyRows.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-500">No units have been registered yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-ivory text-[11px] uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-5 py-3">Property</th>
                      <th className="px-5 py-3">Occupied</th>
                      <th className="px-5 py-3">Units</th>
                      <th className="px-5 py-3 w-1/3">Occupancy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {occupancyRows.map((row) => (
                      <tr key={row.name} className="border-t border-gray-100">
                        <td className="px-5 py-3 font-semibold text-charcoal">{row.name}</td>
                        <td className="px-5 py-3 text-gray-600">{row.occupied}</td>
                        <td className="px-5 py-3 text-gray-600">{row.total}</td>
                        <td className="px-5 py-3">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-ivory-dark">
                            <div className="h-full rounded-full bg-gold" style={{ width: `${row.percent}%` }} />
                          </div>
                          <p className="mt-1 text-[11px] font-semibold text-gold">{row.percent}%</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
