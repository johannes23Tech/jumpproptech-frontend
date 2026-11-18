import { useState, useEffect, type FormEvent } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { hasPermission } from '../config/roles';
import { Plus, QrCode, Copy, Check, Archive } from 'lucide-react';
import PremiumButton from '../components/PremiumButton';
import Modal from '../components/Modal';
import { PageBanner, SubmitButton } from '../components/FormFeedback';

type QrToken = {
  id: number;
  status: 'active' | 'expired' | 'revoked' | 'used';
  expires_at: string;
  created_at: string;
};

type GeneratedQr = {
  id: number;
  token: string;
  url: string;
  expires_at: string;
  unit_number: string;
};

export default function Units() {
  const { user } = useAuth();
  const canManage = hasPermission(user, 'units.manage');
  const canManageQr = hasPermission(user, 'qr.manage');

  const [units, setUnits] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [propertyId, setPropertyId] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [unitType, setUnitType] = useState('3x3m (1 Room)');
  const [rent, setRent] = useState('');
  const [status, setStatus] = useState('Vacant');
  const [tenantId, setTenantId] = useState('');
  const [isFurnished, setIsFurnished] = useState(false);
  const [includedItems, setIncludedItems] = useState('');
  const [prepaidMeter, setPrepaidMeter] = useState('');

  const [qrUnit, setQrUnit] = useState<any | null>(null);
  const [qrTokens, setQrTokens] = useState<QrToken[]>([]);
  const [generatedQr, setGeneratedQr] = useState<GeneratedQr | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');
  const [qrDays, setQrDays] = useState('14');
  const [copied, setCopied] = useState(false);

  const fetchData = async () => {
    try {
      const [unitsData, propertiesData, tenantsData] = await Promise.all([
        api.getUnits(), api.getProperties(), api.getTenants()
      ]);
      setUnits(unitsData);
      setProperties(propertiesData);
      setTenants(tenantsData);
      if (propertiesData.length > 0) setPropertyId(propertiesData[0].id.toString());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchData(); }, []);

  useEffect(() => {
    if (!propertyId) {
      setBuildings([]);
      setBuildingId('');
      return;
    }
    let active = true;
    api.getBuildings(Number(propertyId))
      .then((data) => {
        if (active) {
          setBuildings(Array.isArray(data) ? data : []);
          setBuildingId('');
        }
      })
      .catch(() => {
        if (active) setBuildings([]);
      });
    return () => { active = false; };
  }, [propertyId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.createUnit({
        property_id: Number(propertyId),
        building_id: buildingId ? Number(buildingId) : null,
        unit_number: unitNumber,
        size_dimensions: unitType,
        is_furnished: isFurnished,
        included_items: includedItems,
        prepaid_meter_number: prepaidMeter,
        monthly_rent: Number(rent),
        status: status,
        tenant_id: tenantId ? Number(tenantId) : null
      });
      setIsModalOpen(false);
      setUnitNumber(''); setRent(''); setIncludedItems(''); setTenantId(''); setPrepaidMeter('');
      setSuccessMessage('Unit added successfully.');
      await fetchData();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'The unit could not be saved. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openQr = async (unit: any) => {
    setQrUnit(unit);
    setGeneratedQr(null);
    setQrError('');
    setCopied(false);
    setQrLoading(true);
    try {
      const tokens = await api.getUnitQrTokens(unit.id);
      setQrTokens(Array.isArray(tokens) ? tokens : []);
    } catch (err) {
      setQrError(err instanceof Error ? err.message : 'QR codes could not be loaded.');
    } finally {
      setQrLoading(false);
    }
  };

  const generateQr = async () => {
    if (!qrUnit) return;
    setQrLoading(true);
    setQrError('');
    try {
      const data = await api.generateUnitQr({ unit_id: qrUnit.id, expires_in_days: Number(qrDays) });
      setGeneratedQr(data as GeneratedQr);
      const tokens = await api.getUnitQrTokens(qrUnit.id);
      setQrTokens(Array.isArray(tokens) ? tokens : []);
      await fetchData();
    } catch (err) {
      setQrError(err instanceof Error ? err.message : 'The QR code could not be generated.');
    } finally {
      setQrLoading(false);
    }
  };

  const revokeQr = async (token: QrToken) => {
    if (!window.confirm('Revoke this QR code? The link will stop working immediately.')) return;
    setQrLoading(true);
    setQrError('');
    try {
      await api.revokeUnitQr(token.id);
      setGeneratedQr(null);
      const tokens = await api.getUnitQrTokens(qrUnit?.id);
      setQrTokens(Array.isArray(tokens) ? tokens : []);
      await fetchData();
    } catch (err) {
      setQrError(err instanceof Error ? err.message : 'The QR code could not be revoked.');
    } finally {
      setQrLoading(false);
    }
  };

  const archiveUnit = async (unit: any) => {
    if (!window.confirm(`Archive unit ${unit.unit_number}? It will be hidden from the active register.`)) return;
    try {
      await api.updateUnit({ id: unit.id, archived: true });
      setSuccessMessage(`Unit ${unit.unit_number} archived.`);
      await fetchData();
    } catch (err) {
      setSuccessMessage('');
      console.error(err);
      window.alert(err instanceof Error ? err.message : 'The unit could not be archived.');
    }
  };

  const copyLink = async () => {
    if (!generatedQr) return;
    try {
      await navigator.clipboard.writeText(generatedQr.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy this onboarding link:', generatedQr.url);
    }
  };

  const activeToken = qrTokens.find((token) => token.status === 'active');

  return (
    <div className="animate-fade-in">
      {successMessage && <PageBanner message={successMessage} onDismiss={() => setSuccessMessage('')} />}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold">Units & Rooms</h2>
          <p className="text-sm text-gray-500">Each unit can have its own first-time onboarding QR link.</p>
        </div>
        {canManage && (
          <PremiumButton onClick={() => { setSubmitError(''); setSuccessMessage(''); setIsModalOpen(true); }} icon={<Plus size={18} />} disabled={properties.length === 0}>
            Add Unit
          </PremiumButton>
        )}
      </div>

      {loading ? <p className="text-gray-500">Loading...</p> : properties.length === 0 ? (
        <div className="bg-warning/10 text-warning p-4 rounded-lg mb-6 border border-warning/20">You need to add a Property first.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map((u) => (
            <div key={u.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-premium transition-shadow duration-300">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-display text-lg font-bold">{u.unit_number}</h3>
                  <p className="text-xs text-gray-500">
                    {u.property_name}{u.building_name ? ` · ${u.building_name}` : ''}
                  </p>
                </div>
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${u.status === 'Occupied' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{u.status}</span>
              </div>
              <div className="mt-4 space-y-1 text-sm text-gray-600">
                <p className="flex justify-between"><span>Rent:</span> <span className="font-bold text-black">R {u.monthly_rent}</span></p>
                <p className="flex justify-between"><span>Size:</span> <span>{u.size_dimensions}</span></p>
                {u.prepaid_meter_number && (
                  <p className="flex justify-between"><span>Prepaid meter:</span> <span>{u.prepaid_meter_number}</span></p>
                )}
                <p className="flex justify-between">
                  <span>QR onboarding:</span>
                  <span className={Number(u.active_qr_tokens) > 0 ? 'font-semibold text-success' : 'text-gray-400'}>
                    {Number(u.active_qr_tokens) > 0 ? 'Active' : 'Not generated'}
                  </span>
                </p>
              </div>

              {(canManageQr || canManage) && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
                  {canManageQr && (
                    <button
                      type="button"
                      onClick={() => void openQr(u)}
                      className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
                    >
                      <QrCode size={15} /> QR onboarding
                    </button>
                  )}
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => void archiveUnit(u)}
                      className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50"
                    >
                      <Archive size={15} /> Archive
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Unit"
        subtitle="Add to your workspace"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Unit Number</label>
            <input type="text" required value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} placeholder="e.g. Room 1 or A101" className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Property</label>
            <select required value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none text-gray-600">
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Building (Optional)</label>
            <select value={buildingId} onChange={(e) => setBuildingId(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none text-gray-600">
              <option value="">No building / stand-alone</option>
              {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Unit Type / Size</label>
            <select value={unitType} onChange={(e) => setUnitType(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none text-gray-600">
              <option>3x3m (1 Room)</option>
              <option>3x6m (2 Rooms)</option>
              <option>Apartment</option>
              <option>House</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Monthly Rent (ZAR)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R</span>
              <input type="number" required value={rent} onChange={(e) => setRent(e.target.value)} placeholder="0.00" className="w-full bg-white border border-gray-300 rounded-xl p-3.5 pl-9 text-sm focus:border-gold outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Occupancy Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none text-gray-600">
              <option>Vacant</option>
              <option>Occupied</option>
              <option>Maintenance</option>
            </select>
          </div>

          {status === 'Occupied' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                Tenant (Optional)
              </label>
              <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none text-gray-600">
                <option value="">No tenant assigned</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <input type="checkbox" id="furnished" checked={isFurnished} onChange={(e) => setIsFurnished(e.target.checked)} className="w-4 h-4 text-gold bg-gray-100 border-gray-300 rounded focus:ring-gold" />
            <label htmlFor="furnished" className="text-sm font-semibold text-gray-700">Includes Furniture</label>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Included Items (Optional)</label>
            <input type="text" value={includedItems} onChange={(e) => setIncludedItems(e.target.value)} placeholder="e.g. Bed, Prepaid Meter Box" className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Prepaid Meter Number (Optional)</label>
            <input type="text" value={prepaidMeter} onChange={(e) => setPrepaidMeter(e.target.value)} placeholder="Meter identifier" className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none" />
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors">Cancel</button>
            <SubmitButton loading={submitting} loadingText="Saving unit..." error={submitError}>
              Save Unit
            </SubmitButton>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={qrUnit !== null}
        onClose={() => { setQrUnit(null); setGeneratedQr(null); setQrTokens([]); }}
        title="Unit QR onboarding"
        subtitle={qrUnit ? `${qrUnit.property_name} · Unit ${qrUnit.unit_number}` : undefined}
      >
        <div className="space-y-5">
          <p className="text-sm text-gray-600">
            This QR opens a first-time tenant application for this unit. It is not a login password. Generating a
            new code immediately revokes the previous unused code.
          </p>

          {generatedQr ? (
            <div className="space-y-4">
              <div className="flex justify-center rounded-2xl border border-gray-200 bg-white p-5">
                <QRCodeSVG value={generatedQr.url} size={220} level="M" bgColor="#ffffff" fgColor="#0a0a0a" />
              </div>
              <p className="break-all rounded-lg bg-gray-50 p-3 text-xs text-gray-600">{generatedQr.url}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void copyLink()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold py-2.5 text-sm font-bold text-black hover:opacity-90"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy link'}
                </button>
                <button
                  type="button"
                  onClick={() => setGeneratedQr(null)}
                  className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Done
                </button>
              </div>
              <p className="text-xs text-gray-500">Expires {new Date(generatedQr.expires_at).toLocaleString()}. This link is shown once.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {qrError && <p className="rounded-lg bg-danger/10 p-3 text-sm text-danger">{qrError}</p>}

              <div className="flex items-end gap-3">
                <label className="block flex-1 text-sm font-semibold">
                  Valid for
                  <select
                    value={qrDays}
                    onChange={(event) => setQrDays(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white p-3 font-normal outline-none focus:border-gold"
                  >
                    <option value="1">1 day</option>
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => void generateQr()}
                  disabled={qrLoading}
                  className="rounded-xl bg-gold px-5 py-3 text-sm font-bold text-black hover:opacity-90 disabled:opacity-50"
                >
                  {qrLoading ? 'Working...' : activeToken ? 'Regenerate QR' : 'Generate QR'}
                </button>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Token history</p>
                {qrLoading ? (
                  <p className="text-sm text-gray-500">Loading...</p>
                ) : qrTokens.length === 0 ? (
                  <p className="text-sm text-gray-500">No QR code has been generated for this unit.</p>
                ) : (
                  <ul className="space-y-2">
                    {qrTokens.slice(0, 6).map((token) => (
                      <li key={token.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2 text-xs">
                        <span className="text-gray-500">Created {new Date(token.created_at).toLocaleDateString()}</span>
                        <span className={`rounded-full px-2 py-0.5 font-bold uppercase ${token.status === 'active' ? 'bg-success/10 text-success' : 'bg-gray-100 text-gray-500'}`}>
                          {token.status}
                        </span>
                        {token.status === 'active' && (
                          <button
                            type="button"
                            onClick={() => void revokeQr(token)}
                            className="font-bold text-danger hover:underline"
                          >
                            Revoke
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
