import { useState, useEffect, type FormEvent } from 'react';
import { api } from '../utils/api';
import { Plus, Building2, MapPin } from 'lucide-react';
import PremiumButton from '../components/PremiumButton';
import { PageBanner, SubmitButton } from '../components/FormFeedback';
import Modal from '../components/Modal';

type PropertyTypeValue = 'Apartment Block' | 'House' | 'Precast Structure' | 'Backroom';

const PROPERTY_TYPES: { value: PropertyTypeValue; label: string; hint: string }[] = [
  { value: 'Apartment Block', label: 'Apartment / Flat', hint: 'Apartments or flats (e.g. 1–2 bedroom units).' },
  { value: 'House', label: 'Residential House', hint: 'Standalone house; bedrooms/bathrooms are set per unit.' },
  { value: 'Precast Structure', label: 'Precast Room(s)', hint: 'Precast rooms (e.g. 3×3 m or 6×3 m units).' },
  { value: 'Backroom', label: 'Backroom', hint: 'Backroom / micro-housing on a residential property.' },
];

const SA_PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal',
  'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape',
];

const emptyForm = {
  name: '',
  address: '',
  city: '',
  suburb: '',
  province: '',
  postalCode: '',
  propertyType: 'Apartment Block' as PropertyTypeValue,
  description: '',
};

export default function Properties() {
  const [properties, setProperties] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [form, setForm] = useState(emptyForm);

  const setField = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const selectedType = PROPERTY_TYPES.find((t) => t.value === form.propertyType);

  const fetchProperties = async () => {
    try {
      const data = await api.getProperties();
      setProperties(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProperties(); }, []);

  const openModal = () => {
    setSubmitError('');
    setSuccessMessage('');
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.createProperty({
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        province: form.province,
        suburb: form.suburb.trim(),
        postal_code: form.postalCode.trim(),
        property_type: form.propertyType,
        description: form.description.trim(),
      });
      setIsModalOpen(false);
      setForm(emptyForm);
      setSuccessMessage('Property added successfully.');
      await fetchProperties();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'The property could not be saved. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {successMessage && <PageBanner message={successMessage} onDismiss={() => setSuccessMessage('')} />}
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-2xl font-bold">My Properties</h2>
        <PremiumButton onClick={openModal} icon={<Plus size={18} />}>
          Add Property
        </PremiumButton>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : properties.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-gray-200 text-center shadow-sm">
          <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">No properties added yet.</p>
          <button onClick={openModal} className="text-gold font-bold hover:underline">Add your first property</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((p) => (
            <div key={p.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-premium transition-shadow duration-300">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-display text-lg font-bold">{p.name}</h3>
                <span className="text-[10px] uppercase font-bold bg-gold/10 text-gold px-2 py-1 rounded-full">
                  {PROPERTY_TYPES.find((t) => t.value === p.property_type)?.label || p.property_type}
                </span>
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin size={14} />
                <span>
                  {[p.address, p.suburb, p.city].filter(Boolean).join(', ') || 'No address details'}
                </span>
              </p>
              {p.description && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{p.description}</p>}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Property"
        subtitle="Register a company-owned property or site"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 text-sm text-gray-700">
            <p className="font-semibold text-gray-900 mb-1">What are you adding?</p>
            <p>
              Add a property/site to the JUMP PROPTECH portfolio. After saving, you can add buildings (if needed),
              rentable units/rooms, and generate the unit QR for tenant onboarding.
            </p>
          </div>

          <section className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Property details</h4>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Property / site name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="e.g. Sunrise Apartments, 12 Main Street House"
                className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">A clear name staff will recognise in the portfolio register.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                What type of property is this? <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={form.propertyType}
                onChange={(e) => setField('propertyType', e.target.value as PropertyTypeValue)}
                className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none text-gray-700"
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {selectedType && (
                <p className="text-xs text-gray-500 mt-1">{selectedType.hint}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Supported stock: apartments/flats, residential houses, precast rooms, and backrooms. Unit configuration
                (bedrooms, bathrooms, size) is set per rentable unit.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Location & address</h4>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Street address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={255}
                value={form.address}
                onChange={(e) => setField('address', e.target.value)}
                placeholder="e.g. 42 Oxford Road"
                className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Suburb / area <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.suburb}
                  onChange={(e) => setField('suburb', e.target.value)}
                  placeholder="e.g. Rosebank"
                  className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  City / town <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setField('city', e.target.value)}
                  placeholder="e.g. Johannesburg"
                  className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Province <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.province}
                  onChange={(e) => setField('province', e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none text-gray-700"
                >
                  <option value="">Select a province</option>
                  {SA_PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Postal code</label>
                <input
                  type="text"
                  value={form.postalCode}
                  onChange={(e) => setField('postalCode', e.target.value)}
                  placeholder="e.g. 2196"
                  className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none"
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Additional information</h4>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Notes / description <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                maxLength={2000}
                placeholder="Any useful context for staff (access notes, stand/erf, structure details, etc.). Photos and supporting documents can be added to units/records."
                className="w-full bg-white border border-gray-300 rounded-xl p-3.5 text-sm focus:border-gold outline-none h-28 resize-none"
              />
            </div>
          </section>

          <div className="flex gap-4 pt-4 border-t border-gray-200 mt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-3.5 text-gray-600 font-bold hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <SubmitButton loading={submitting} loadingText="Saving property..." error={submitError}>
              Save Property
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}