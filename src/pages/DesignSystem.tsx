import { useState } from 'react';
import { Building2, FileText, Home, Key, Search, Users } from 'lucide-react';
import {
  Badge,
  Card,
  CardHeader,
  Checkbox,
  DataTable,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Pagination,
  Select,
  StatCard,
  Tabs,
  Textarea,
  Toolbar,
  type Column,
} from '../components/ui';
import PremiumButton from '../components/PremiumButton';

type DemoRow = { id: number; tenant: string; unit: string; rent: number; status: string };

const ROWS: DemoRow[] = [
  { id: 1, tenant: 'John Mokoena', unit: 'UNIT 04', rent: 8500, status: 'Active' },
  { id: 2, tenant: 'Sarah Ndlovu', unit: 'UNIT 07', rent: 7200, status: 'Pending' },
  { id: 3, tenant: 'Thabo Dlamini', unit: 'UNIT 11', rent: 9100, status: 'Draft' },
];

const COLUMNS: Column<DemoRow>[] = [
  { key: 'tenant', header: 'Tenant', render: (row) => <span className="font-semibold">{row.tenant}</span>, sortValue: (row) => row.tenant },
  { key: 'unit', header: 'Unit', render: (row) => row.unit, sortValue: (row) => row.unit },
  { key: 'rent', header: 'Monthly rent', render: (row) => `R ${row.rent.toLocaleString('en-ZA')}`, sortValue: (row) => row.rent },
  { key: 'status', header: 'Status', render: (row) => <Badge tone={row.status === 'Active' ? 'success' : row.status === 'Pending' ? 'warning' : 'neutral'}>{row.status}</Badge> },
];

export default function DesignSystem() {
  const [tab, setTab] = useState('overview');
  const [page, setPage] = useState(1);
  const [checked, setChecked] = useState(true);
  const [sample, setSample] = useState('');

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration / Design System"
        title="Visual Language"
        description="Living reference for the shared components, tokens and interaction patterns used across Jump PropTech."
        actions={<Badge tone="gold" dot>Internal reference</Badge>}
      />

      <section className="space-y-4">
        <h3 className="font-display text-xl text-charcoal">Colour tokens</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ['Ink', '#0A0A0A'], ['Charcoal', '#171717'], ['Ivory', '#FAF7F2'],
            ['Gold', '#C5A059'], ['Success', '#2E7D32'], ['Danger', '#B3261E'],
          ].map(([label, colour]) => (
            <Card key={label} className="overflow-hidden">
              <div className="h-16" style={{ background: colour }} />
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-charcoal">{label}</p>
                <p className="font-mono text-[10px] text-gray-500">{colour}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-xl text-charcoal">Typography</h3>
        <Card className="space-y-3 p-5">
          <p className="font-display text-3xl text-charcoal">Fraunces — Display / Headings</p>
          <p className="text-2xl text-charcoal">Inter — Section headings</p>
          <p className="text-base text-gray-700">Body copy at 16px with a comfortable 1.65 line height.</p>
          <p className="text-xs text-gray-500">Small metadata, captions and helper text.</p>
        </Card>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-xl text-charcoal">Stat cards</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total leases" value="128" hint="Across 6 properties" icon={<FileText size={18} />} />
          <StatCard label="Occupancy" value="92%" hint="Up 3% this quarter" tone="success" icon={<Home size={18} />} />
          <StatCard label="Expiring soon" value="7" hint="Next 30 days" tone="warning" icon={<Key size={18} />} />
          <StatCard label="Arrears" value="R 24 500" hint="10 accounts" tone="danger" icon={<Users size={18} />} />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-xl text-charcoal">Buttons & badges</h3>
        <Card className="flex flex-wrap items-center gap-3 p-5">
          <PremiumButton size="sm">Primary action</PremiumButton>
          <PremiumButton size="sm" variant="secondary">Secondary</PremiumButton>
          <PremiumButton size="sm" variant="ghost">Ghost</PremiumButton>
          <PremiumButton size="sm" variant="danger">Danger</PremiumButton>
          <div className="ml-auto flex flex-wrap gap-2">
            <Badge>Neutral</Badge><Badge tone="gold">Gold</Badge><Badge tone="success" dot>Active</Badge>
            <Badge tone="warning">Warning</Badge><Badge tone="danger">Overdue</Badge>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-xl text-charcoal">Form controls</h3>
        <Card className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Property" required><Input placeholder="Enter a property name" /></Field>
          <Field label="Lease type"><Select options={[{ value: 'fixed', label: 'Fixed-term' }, { value: 'monthly', label: 'Month-to-month' }]} /></Field>
          <Field label="Notes" hint="Operational notes only"><Textarea rows={2} value={sample} onChange={(event) => setSample(event.target.value)} placeholder="Add a note…" /></Field>
          <Field label="Invalid example" error="This field is required."><Input error value="" readOnly placeholder="Required value" /></Field>
          <div className="sm:col-span-2">
            <Checkbox checked={checked} onChange={(event) => setChecked(event.target.checked)} label="Include deposit in this agreement" description="Adds deposit handling terms from the approved template." />
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-xl text-charcoal">Tabs, toolbar & pagination</h3>
        <Card>
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: 'overview', label: 'Overview', icon: <Home size={15} /> },
              { value: 'tenants', label: 'Tenants', icon: <Users size={15} /> },
              { value: 'properties', label: 'Properties', icon: <Building2 size={15} /> },
            ]}
          />
          <div className="p-5">
            <Toolbar className="mb-4">
              <Input placeholder="Search records…" className="max-w-xs" />
              <PremiumButton size="sm" variant="secondary">Filter</PremiumButton>
            </Toolbar>
            <p className="text-sm text-gray-600">Active tab: <span className="font-semibold capitalize">{tab}</span></p>
            <Pagination page={page} pageSize={1} total={3} onPage={setPage} />
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-xl text-charcoal">Data table</h3>
        <Card>
          <CardHeader title="Sample lease register" description="Sortable columns and consistent row density." />
          <div className="p-5">
            <DataTable columns={COLUMNS} rows={ROWS} rowKey={(row) => row.id} />
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-xl text-charcoal">Empty state</h3>
        <Card>
          <EmptyState
            icon={<Search size={22} />}
            title="Nothing to show yet"
            description="Empty states always tell the user what to do next, rather than showing a blank panel."
            action={<PremiumButton size="sm">Create first record</PremiumButton>}
          />
        </Card>
      </section>
    </div>
  );
}
