import { FileText, Download, Phone, ShieldAlert } from 'lucide-react';

export default function TenantDocuments() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="font-display text-xl font-bold mb-4">My Documents</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-ivory rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <FileText className="text-gold" />
              <div>
                <p className="font-bold">Signed Lease Agreement</p>
                <p className="text-xs text-gray-500">PDF • Uploaded by Landlord</p>
              </div>
            </div>
            <button className="text-gold hover:text-gold-light p-2"><Download size={20} /></button>
          </div>
          <div className="flex items-center justify-between p-4 bg-ivory rounded-lg border border-gray-200">
            <div className="flex items-center gap-3">
              <FileText className="text-gold" />
              <div>
                <p className="font-bold">House Rules & Welcome Pack</p>
                <p className="text-xs text-gray-500">PDF • Body Corporate Rules</p>
              </div>
            </div>
            <button className="text-gold hover:text-gold-light p-2"><Download size={20} /></button>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h2 className="font-display text-xl font-bold mb-4">Emergency Contacts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
            <ShieldAlert className="text-danger" />
            <div>
              <p className="font-bold">Security / Armed Response</p>
              <p className="text-sm text-gray-600">086 12 10 10</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
            <Phone className="text-gold" />
            <div>
              <p className="font-bold">Property Manager</p>
              <p className="text-sm text-gray-600">082 555 0101</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}