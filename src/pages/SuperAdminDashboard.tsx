import { useEffect, useMemo, useState } from 'react';
import { api } from '../utils/api';
import { roleLabel, isSuperAdminUser } from '../config/roles';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, Users, Activity, MonitorSmartphone, QrCode, KeyRound, Download,
  Search, RefreshCw, AlertTriangle, CheckCircle2, XCircle, Clock, Filter
} from 'lucide-react';

type Tab = 'overview' | 'accounts' | 'monitoring' | 'sessions' | 'tokens' | 'permissions' | 'exports';

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: ShieldCheck },
  { id: 'accounts', label: 'Accounts', icon: Users },
  { id: 'monitoring', label: 'Monitoring', icon: Activity },
  { id: 'sessions', label: 'Sessions & Devices', icon: MonitorSmartphone },
  { id: 'tokens', label: 'QR Tokens', icon: QrCode },
  { id: 'permissions', label: 'Access Audit', icon: KeyRound },
  { id: 'exports', label: 'Data & Exports', icon: Download },
];

const fmt = (v?: string | null) => (v ? new Date(v).toLocaleString() : '—');
const badge = (text: string, tone: 'ok' | 'warn' | 'bad' | 'neutral' = 'neutral') => {
  const cls = tone === 'ok' ? 'bg-success/10 text-success'
    : tone === 'warn' ? 'bg-warning/10 text-warning'
    : tone === 'bad' ? 'bg-danger/10 text-danger'
    : 'bg-gray-100 text-gray-600';
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${cls}`}>{text}</span>;
};

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');

  const [overview, setOverview] = useState<any>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState('');

  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountsTotal, setAccountsTotal] = useState(0);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [acctQ, setAcctQ] = useState('');
  const [acctType, setAcctType] = useState('all');
  const [acctStatus, setAcctStatus] = useState('all');
  const [acctMsg, setAcctMsg] = useState('');
  const [acctErr, setAcctErr] = useState('');
  const [acctActionId, setAcctActionId] = useState<number | null>(null);

  const [audit, setAudit] = useState<any[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditQ, setAuditQ] = useState('');
  const [auditAction, setAuditAction] = useState('');
  const [auditOutcome, setAuditOutcome] = useState('');
  const [auditFrom, setAuditFrom] = useState('');
  const [auditTo, setAuditTo] = useState('');

  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsTotal, setSessionsTotal] = useState(0);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('active');
  const [sessionNote, setSessionNote] = useState('');

  const [tokens, setTokens] = useState<any[]>([]);
  const [tokensTotal, setTokensTotal] = useState(0);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [tokenStatus, setTokenStatus] = useState('all');

  const [perm, setPerm] = useState<any>(null);
  const [permLoading, setPermLoading] = useState(false);

  const [exportMsg, setExportMsg] = useState('');
  const [exportErr, setExportErr] = useState('');

  const loadOverview = async () => {
    setOverviewLoading(true); setOverviewError('');
    try { setOverview(await api.getControlCenterOverview()); }
    catch (e) { setOverviewError(e instanceof Error ? e.message : 'Overview could not be loaded.'); }
    finally { setOverviewLoading(false); }
  };

  const loadAccounts = async () => {
    setAccountsLoading(true); setAcctErr('');
    try {
      const data = await api.getControlCenterAccounts({ q: acctQ, type: acctType, status: acctStatus, limit: 100 });
      setAccounts(Array.isArray(data?.accounts) ? data.accounts : []);
      setAccountsTotal(Number(data?.total || 0));
    } catch (e) { setAcctErr(e instanceof Error ? e.message : 'Accounts could not be loaded.'); }
    finally { setAccountsLoading(false); }
  };

  const loadAudit = async () => {
    setAuditLoading(true);
    try {
      const data = await api.getControlCenterAudit({ q: auditQ, action: auditAction, outcome: auditOutcome, from: auditFrom, to: auditTo, limit: 100 });
      setAudit(Array.isArray(data?.events) ? data.events : []);
      setAuditTotal(Number(data?.total || 0));
    } catch { /* shown as empty */ }
    finally { setAuditLoading(false); }
  };

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const data = await api.getControlCenterSessions({ status: sessionStatus, limit: 100 });
      setSessions(Array.isArray(data?.sessions) ? data.sessions : []);
      setSessionsTotal(Number(data?.total || 0));
      setSessionNote(typeof data?.note === 'string' ? data.note : '');
    } catch { /* ignore */ }
    finally { setSessionsLoading(false); }
  };

  const loadTokens = async () => {
    setTokensLoading(true);
    try {
      const data = await api.getControlCenterTokens({ status: tokenStatus, limit: 100 });
      setTokens(Array.isArray(data?.tokens) ? data.tokens : []);
      setTokensTotal(Number(data?.total || 0));
    } catch { /* ignore */ }
    finally { setTokensLoading(false); }
  };

  const loadPerms = async () => {
    setPermLoading(true);
    try { setPerm(await api.getControlCenterPermissions()); } catch { /* ignore */ }
    finally { setPermLoading(false); }
  };

  useEffect(() => { if (tab === 'overview') void loadOverview(); }, [tab]);
  useEffect(() => { if (tab === 'accounts') void loadAccounts(); }, [tab]);
  useEffect(() => { if (tab === 'monitoring') void loadAudit(); }, [tab]);
  useEffect(() => { if (tab === 'sessions') void loadSessions(); }, [tab, sessionStatus]);
  useEffect(() => { if (tab === 'tokens') void loadTokens(); }, [tab, tokenStatus]);
  useEffect(() => { if (tab === 'permissions') void loadPerms(); }, [tab]);

  const doAccountAction = async (account: any, action: string, extra: any = {}) => {
    const labels: Record<string, string> = {
      activate: 'Activate this account?',
      deactivate: 'Deactivate this account and revoke its sessions?',
      force_logout: 'Revoke all sessions for this account?',
      reset_mfa: 'Reset MFA and revoke sessions for this account?',
      trigger_password_reset: 'Send a password reset link to this account?',
      change_role: `Change staff role to "${extra.staff_role}" and revoke sessions?`,
    };
    if (!window.confirm(labels[action] || 'Perform this action?')) return;
    setAcctActionId(account.id); setAcctMsg(''); setAcctErr('');
    try {
      const res = await api.controlCenterAccountAction({ id: account.id, action, ...extra });
      setAcctMsg(res?.message || 'Action completed.');
      await loadAccounts();
    } catch (e) { setAcctErr(e instanceof Error ? e.message : 'Action failed.'); }
    finally { setAcctActionId(null); }
  };

  const revokeSessionUser = async (s: any) => {
    if (!window.confirm(`Revoke sessions for ${s.user_email || s.user_name}? (tokens rotated for user)`)) return;
    try { await api.controlCenterSessionAction({ action: 'revoke_user', user_id: s.user_id }); await loadSessions(); }
    catch (e) { window.alert(e instanceof Error ? e.message : 'Could not revoke sessions.'); }
  };

  const revokeToken = async (t: any) => {
    if (!window.confirm(`Revoke QR token #${t.id}?`)) return;
    try { await api.controlCenterTokenAction({ action: 'revoke', id: t.id }); await loadTokens(); }
    catch (e) { window.alert(e instanceof Error ? e.message : 'Could not revoke token.'); }
  };

  const doExport = async (type: 'accounts' | 'audit', format: 'csv' | 'json') => {
    setExportMsg(''); setExportErr('');
    try {
      await api.downloadControlCenterExport(type, format);
      setExportMsg(`Export started: ${type} (${format.toUpperCase()}).`);
    } catch (e) { setExportErr(e instanceof Error ? e.message : 'Export failed.'); }
  };

  const overviewCounts = overview?.counts || {};
  const auth24h = overview?.auth_24h || {};

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl border border-gold/30 bg-gradient-to-r from-charcoal via-black to-charcoal p-6 shadow-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-gold p-3"><ShieldCheck size={30} className="text-black" /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-light">Super Administrator</p>
              <h1 className="font-display text-3xl font-bold text-ivory">Control Center</h1>
              <p className="text-sm text-gray-300">System, security, accounts and sensitive controls.</p>
            </div>
          </div>
          <div className="text-right text-xs text-gray-400">
            <p>Signed in as <span className="text-ivory font-semibold">{user?.full_name}</span></p>
            <p>{isSuperAdminUser(user) ? 'Super Administrator access' : ''}</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} type="button" onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${active ? 'bg-gold text-black' : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'}`}>
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          {overviewError && <div className="rounded-xl border border-danger/20 bg-danger/10 p-4 text-sm text-danger">{overviewError}</div>}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              ['Total accounts', overviewCounts.total_users ?? '—'],
              ['Staff', overviewCounts.staff_users ?? '—'],
              ['Tenants', overviewCounts.tenant_users ?? '—'],
              ['MFA enabled', overviewCounts.mfa_enabled_users ?? '—'],
              ['Active users', overviewCounts.active_users ?? '—'],
              ['Inactive users', overviewCounts.inactive_users ?? '—'],
              ['Properties', overviewCounts.properties ?? '—'],
              ['Units', overviewCounts.units ?? '—'],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</p>
                <p className="mt-1 font-display text-2xl font-bold text-black">{String(value)}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="font-display text-lg font-bold mb-3">Auth events (24h)</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="flex items-center gap-2"><CheckCircle2 size={14} className="text-success" /> Success</span><span className="font-bold">{auth24h.success ?? 0}</span></div>
                <div className="flex justify-between"><span className="flex items-center gap-2"><XCircle size={14} className="text-danger" /> Failure</span><span className="font-bold">{auth24h.failure ?? 0}</span></div>
                <div className="flex justify-between"><span className="flex items-center gap-2"><AlertTriangle size={14} className="text-warning" /> Denied</span><span className="font-bold">{auth24h.denied ?? 0}</span></div>
              </div>
              <p className="mt-3 text-xs text-gray-500">Tracked active sessions: <span className="font-semibold text-black">{overview?.active_sessions_tracked ?? '—'}</span></p>
            </div>
            <div className="md:col-span-2 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-lg font-bold">Recent security & admin events</h3>
                <button type="button" onClick={() => void loadOverview()} className="text-xs font-bold text-gold-dark hover:underline inline-flex items-center gap-1"><RefreshCw size={12} /> Refresh</button>
              </div>
              {overviewLoading ? <p className="text-sm text-gray-500">Loading...</p> : (
                <div className="space-y-2 max-h-72 overflow-auto pr-1">
                  {(overview?.recent_security_events || []).map((e: any) => (
                    <div key={e.id} className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 p-3 text-xs">
                      <div>
                        <p className="font-semibold text-black">{e.action}</p>
                        <p className="text-gray-500">{e.actor_email || 'system'} · {e.ip || '—'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {badge(e.outcome, e.outcome === 'success' ? 'ok' : e.outcome === 'denied' ? 'warn' : 'bad')}
                        <p className="text-gray-400 mt-1">{fmt(e.created_at)}</p>
                      </div>
                    </div>
                  ))}
                  {(!overview?.recent_security_events || overview.recent_security_events.length === 0) && <p className="text-sm text-gray-500">No recent events.</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'accounts' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="flex-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Search accounts</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input value={acctQ} onChange={(e) => setAcctQ(e.target.value)} placeholder="Name, email, phone, id"
                    className="w-full rounded-xl border border-gray-300 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-gold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Type</label>
                <select value={acctType} onChange={(e) => setAcctType(e.target.value)} className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm">
                  <option value="all">All</option><option value="staff">Staff</option><option value="tenant">Tenants</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Status</label>
                <select value={acctStatus} onChange={(e) => setAcctStatus(e.target.value)} className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm">
                  <option value="all">All</option><option value="active">Active</option><option value="inactive">Inactive</option>
                </select>
              </div>
              <button type="button" onClick={() => void loadAccounts()} className="rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-black hover:opacity-90 inline-flex items-center gap-2"><Filter size={14} /> Apply</button>
            </div>
            <p className="mt-2 text-xs text-gray-500">Total: {accountsTotal}. Sensitive actions are audited. Secrets (passwords/MFA secrets/codes) are never shown.</p>
            {acctMsg && <p className="mt-2 text-sm text-success">{acctMsg}</p>}
            {acctErr && <p className="mt-2 text-sm text-danger">{acctErr}</p>}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Account</th>
                    <th className="px-4 py-3 text-left">Role / Type</th>
                    <th className="px-4 py-3 text-left">Status & Security</th>
                    <th className="px-4 py-3 text-left">Activity</th>
                    <th className="px-4 py-3 text-left">Sensitive actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {accountsLoading ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading accounts...</td></tr>
                  ) : accounts.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No accounts found.</td></tr>
                  ) : accounts.map((a) => (
                    <tr key={a.id} className="align-top">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-black">{a.full_name || '—'} <span className="text-gray-400 font-normal">#{a.id}</span></p>
                        <p className="text-xs text-gray-500">{a.email}</p>
                        {a.phone && <p className="text-xs text-gray-500">{a.phone}</p>}
                        {a.tenant && (a.tenant.property_name || a.tenant.unit_number) && (
                          <p className="text-xs text-gray-400 mt-1">{a.tenant.property_name || ''}{a.tenant.unit_number ? ` · Unit ${a.tenant.unit_number}` : ''}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <p className="font-semibold text-black">{roleLabel(a.effective_role)}</p>
                        <p className="text-gray-500">{a.account_type}</p>
                      </td>
                      <td className="px-4 py-3 text-xs space-y-1">
                        <div>{badge(a.is_active ? 'Active' : 'Inactive', a.is_active ? 'ok' : 'bad')}</div>
                        <div>{badge(a.mfa_enabled ? 'MFA on' : 'MFA off', a.mfa_enabled ? 'ok' : 'warn')}</div>
                        {a.mfa_recovery_configured ? <div>{badge('Recovery set', 'neutral')}</div> : null}
                        <p className="text-gray-400">Token v{a.token_version ?? 0}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        <p><span className="text-gray-400">Last login:</span> {fmt(a.last_login_at)}</p>
                        <p><span className="text-gray-400">Last activity:</span> {fmt(a.last_activity_at)}</p>
                        <p className="truncate max-w-[220px]" title={a.last_login_user_agent || ''}><span className="text-gray-400">IP:</span> {a.last_login_ip || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <button disabled={acctActionId === a.id} onClick={() => void doAccountAction(a, a.is_active ? 'deactivate' : 'activate')} className="rounded-md border border-gray-300 px-2 py-1 text-[11px] font-bold hover:bg-gray-50 disabled:opacity-50">{a.is_active ? 'Deactivate' : 'Activate'}</button>
                          <button disabled={acctActionId === a.id} onClick={() => void doAccountAction(a, 'force_logout')} className="rounded-md border border-gray-300 px-2 py-1 text-[11px] font-bold hover:bg-gray-50 disabled:opacity-50">Force logout</button>
                          <button disabled={acctActionId === a.id} onClick={() => void doAccountAction(a, 'reset_mfa')} className="rounded-md border border-gray-300 px-2 py-1 text-[11px] font-bold hover:bg-gray-50 disabled:opacity-50">Reset MFA</button>
                          <button disabled={acctActionId === a.id} onClick={() => void doAccountAction(a, 'trigger_password_reset')} className="rounded-md border border-gray-300 px-2 py-1 text-[11px] font-bold hover:bg-gray-50 disabled:opacity-50">Password reset</button>
                          {a.account_type === 'staff' && a.id !== user?.id && (
                            <select disabled={acctActionId === a.id} defaultValue="" onChange={(e) => { const v = e.target.value; if (v) { void doAccountAction(a, 'change_role', { staff_role: v }); e.target.value = ''; } }}
                              className="rounded-md border border-gray-300 px-2 py-1 text-[11px] font-bold bg-white">
                              <option value="">Change role…</option>
                              {['super_administrator','administrator','property_manager','finance_accountant','maintenance_manager','maintenance_technician','reception_support','auditor'].map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'monitoring' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Search</label>
                <input value={auditQ} onChange={(e) => setAuditQ(e.target.value)} placeholder="action, email, ip, id…" className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Action contains</label>
                <input value={auditAction} onChange={(e) => setAuditAction(e.target.value)} placeholder="auth. / admin." className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Outcome</label>
                <select value={auditOutcome} onChange={(e) => setAuditOutcome(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm">
                  <option value="">All</option><option value="success">Success</option><option value="failure">Failure</option><option value="denied">Denied</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">From</label>
                <input type="date" value={auditFrom} onChange={(e) => setAuditFrom(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">To</label>
                <input type="date" value={auditTo} onChange={(e) => setAuditTo(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm" />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => void loadAudit()} className="rounded-xl bg-gold px-4 py-2 text-sm font-bold text-black">Apply filters</button>
              <button type="button" onClick={() => { setAuditQ(''); setAuditAction('auth.'); setAuditOutcome(''); setAuditFrom(''); setAuditTo(''); }} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold">Auth events</button>
              <button type="button" onClick={() => { setAuditQ(''); setAuditAction(''); setAuditOutcome('denied'); setAuditFrom(''); setAuditTo(''); }} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold">Denied / security</button>
            </div>
            <p className="mt-2 text-xs text-gray-500">Audit/activity, auth events and security signals (who did what/when). Total: {auditTotal}.</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-auto max-h-[520px]">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 uppercase tracking-wider text-gray-500 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Time</th>
                    <th className="px-3 py-2 text-left">Actor</th>
                    <th className="px-3 py-2 text-left">Action</th>
                    <th className="px-3 py-2 text-left">Entity</th>
                    <th className="px-3 py-2 text-left">Outcome</th>
                    <th className="px-3 py-2 text-left">IP / Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {auditLoading ? <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-500">Loading events...</td></tr>
                  : audit.length === 0 ? <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-500">No events found.</td></tr>
                  : audit.map((e) => (
                    <tr key={e.id} className="align-top">
                      <td className="px-3 py-2 whitespace-nowrap text-gray-600">{fmt(e.created_at)}</td>
                      <td className="px-3 py-2"><p className="font-semibold text-black">{e.actor_name || e.actor_email || '—'}</p><p className="text-gray-400">{e.actor_email || ''}</p></td>
                      <td className="px-3 py-2 font-semibold text-black">{e.action}</td>
                      <td className="px-3 py-2 text-gray-600">{e.entity_type || '—'} {e.entity_id ? `#${e.entity_id}` : ''}</td>
                      <td className="px-3 py-2">{badge(e.outcome, e.outcome === 'success' ? 'ok' : e.outcome === 'denied' ? 'warn' : 'bad')}</td>
                      <td className="px-3 py-2 text-gray-500 max-w-[260px]"><p>{e.ip || '—'}</p><p className="truncate" title={e.user_agent || ''}>{e.user_agent || ''}</p></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'sessions' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="font-display text-lg font-bold">Sessions & devices</h3>
              <p className="text-xs text-gray-500">Tracked issued sessions (active devices) with revocation controls. Total: {sessionsTotal}.</p>
              {sessionNote && <p className="text-xs text-gray-400 mt-1">{sessionNote}</p>}
            </div>
            <div className="flex gap-2 items-end">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">View</label>
                <select value={sessionStatus} onChange={(e) => setSessionStatus(e.target.value)} className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm">
                  <option value="active">Active</option><option value="revoked">Revoked</option><option value="expired">Expired</option><option value="all">All</option>
                </select>
              </div>
              <button type="button" onClick={() => void loadSessions()} className="rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-black">Refresh</button>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">User</th>
                    <th className="px-3 py-2 text-left">Device / IP</th>
                    <th className="px-3 py-2 text-left">Issued / Expires</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sessionsLoading ? <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-500">Loading sessions...</td></tr>
                  : sessions.length === 0 ? <tr><td colSpan={5} className="px-3 py-8 text-center text-gray-500">No sessions found for this view.</td></tr>
                  : sessions.map((s) => (
                    <tr key={s.id}>
                      <td className="px-3 py-2"><p className="font-semibold text-black">{s.user_name}</p><p className="text-gray-500">{s.user_email}</p><p className="text-gray-400">{roleLabel(s.user_role)}</p></td>
                      <td className="px-3 py-2 text-gray-600 max-w-[280px]"><p>{s.ip || '—'}</p><p className="truncate" title={s.user_agent || ''}>{s.user_agent || '—'}</p></td>
                      <td className="px-3 py-2 text-gray-600"><p>Issued {fmt(s.issued_at)}</p><p>Expires {fmt(s.expires_at)}</p><p className="text-gray-400">Seen {fmt(s.last_seen_at)}</p></td>
                      <td className="px-3 py-2">{s.revoked_at ? badge(`Revoked`, 'bad') : (new Date(s.expires_at) > new Date() ? badge('Active', 'ok') : badge('Expired', 'neutral'))}{s.revoke_reason ? <p className="text-gray-400 mt-1">{s.revoke_reason}</p> : null}</td>
                      <td className="px-3 py-2">{!s.revoked_at && new Date(s.expires_at) > new Date() ? <button type="button" onClick={() => void revokeSessionUser(s)} className="rounded-md border border-danger/30 text-danger px-2 py-1 font-bold hover:bg-danger/10">Revoke user sessions</button> : <span className="text-gray-400">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'tokens' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="font-display text-lg font-bold">QR / onboarding token oversight</h3>
              <p className="text-xs text-gray-500">All unit onboarding tokens across the portfolio. Total: {tokensTotal}.</p>
            </div>
            <div className="flex gap-2 items-end">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Status</label>
                <select value={tokenStatus} onChange={(e) => setTokenStatus(e.target.value)} className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm">
                  <option value="all">All</option><option value="active">Active</option><option value="used">Used</option><option value="expired">Expired</option><option value="revoked">Revoked</option>
                </select>
              </div>
              <button type="button" onClick={() => void loadTokens()} className="rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-black">Refresh</button>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Token</th>
                    <th className="px-3 py-2 text-left">Unit / Property</th>
                    <th className="px-3 py-2 text-left">Created</th>
                    <th className="px-3 py-2 text-left">Expires / Used</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tokensLoading ? <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-500">Loading tokens...</td></tr>
                  : tokens.length === 0 ? <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-500">No tokens found.</td></tr>
                  : tokens.map((t) => (
                    <tr key={t.id}>
                      <td className="px-3 py-2"><p className="font-semibold text-black">#{t.id}</p><p className="text-gray-400">by {t.created_by_name || '—'}</p></td>
                      <td className="px-3 py-2"><p className="font-semibold text-black">Unit {t.unit_number}</p><p className="text-gray-500">{t.property_name}{t.building_name ? ` · ${t.building_name}` : ''}</p></td>
                      <td className="px-3 py-2 text-gray-600">{fmt(t.created_at)}</td>
                      <td className="px-3 py-2 text-gray-600"><p>Exp {fmt(t.expires_at)}</p><p>{t.used_at ? `Used ${fmt(t.used_at)}` : '—'}</p></td>
                      <td className="px-3 py-2">{badge(t.status, t.status === 'active' ? 'ok' : t.status === 'revoked' ? 'bad' : 'neutral')}</td>
                      <td className="px-3 py-2">{t.status === 'active' ? <button type="button" onClick={() => void revokeToken(t)} className="rounded-md border border-danger/30 text-danger px-2 py-1 font-bold hover:bg-danger/10">Revoke</button> : <span className="text-gray-400">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'permissions' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="font-display text-lg font-bold mb-1">Role & permission audit</h3>
            <p className="text-xs text-gray-500 mb-4">Canonical roles, granted permissions, account distribution and recent access/role changes.</p>
            {permLoading ? <p className="text-sm text-gray-500">Loading…</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(perm?.roles || []).map((r: any) => (
                  <div key={r.role} className="rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-black">{r.label}</p>
                      <span className="text-xs font-bold text-gray-500">{r.user_count} users</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(r.permissions) ? r.permissions : []).slice(0, 24).map((p: string) => (
                        <span key={p} className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">{p}</span>
                      ))}
                      {Array.isArray(r.permissions) && r.permissions.length > 24 && <span className="text-[10px] text-gray-400">+{r.permissions.length - 24} more</span>}
                      {(!r.permissions || r.permissions.length === 0) && <span className="text-[10px] text-gray-400">No staff permissions</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="font-display text-lg font-bold mb-3">Recent role/access changes</h3>
            <div className="space-y-2 max-h-72 overflow-auto">
              {(perm?.recent_changes || []).map((e: any) => (
                <div key={e.id} className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 p-3 text-xs">
                  <div>
                    <p className="font-semibold text-black">{e.action}</p>
                    <p className="text-gray-500">{e.actor_email || 'system'} · {e.entity_type} {e.entity_id ? `#${e.entity_id}` : ''}</p>
                  </div>
                  <div className="text-right shrink-0">{badge(e.outcome, e.outcome === 'success' ? 'ok' : 'bad')}<p className="text-gray-400 mt-1">{fmt(e.created_at)}</p></div>
                </div>
              ))}
              {(!perm?.recent_changes || perm.recent_changes.length === 0) && <p className="text-sm text-gray-500">No recent changes recorded.</p>}
            </div>
          </div>
        </div>
      )}

      {tab === 'exports' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-display text-lg font-bold mb-1">Data & exports</h3>
            <p className="text-sm text-gray-500 mb-4">Controlled, audited exports. Sensitive secrets are excluded. Exports are logged in the audit trail.</p>
            {exportMsg && <p className="mb-3 text-sm text-success">{exportMsg}</p>}
            {exportErr && <p className="mb-3 text-sm text-danger">{exportErr}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-gray-100 p-4">
                <p className="font-bold mb-1">Accounts registry</p>
                <p className="text-xs text-gray-500 mb-3">All accounts with safe profile/role/security metadata (no passwords, MFA secrets or recovery codes).</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => void doExport('accounts', 'csv')} className="rounded-lg bg-gold px-3 py-2 text-sm font-bold text-black">Export CSV</button>
                  <button type="button" onClick={() => void doExport('accounts', 'json')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold">Export JSON</button>
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 p-4">
                <p className="font-bold mb-1">Audit log</p>
                <p className="text-xs text-gray-500 mb-3">Security, auth and activity events (who did what/when). Includes IP/user-agent metadata.</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => void doExport('audit', 'csv')} className="rounded-lg bg-gold px-3 py-2 text-sm font-bold text-black">Export CSV</button>
                  <button type="button" onClick={() => void doExport('audit', 'json')} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold">Export JSON</button>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 text-sm text-gray-700 flex items-start gap-2">
            <Clock size={16} className="text-gold mt-0.5" />
            <p>Session/device tracking records logins issued after tracking was enabled. Token version rotation globally invalidates older sessions (used for force logout, MFA/reset/role changes). QR onboarding tokens are first-time, single-use, expiring and revocable.</p>
          </div>
        </div>
      )}
    </div>
  );
}
