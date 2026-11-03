import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="min-h-screen bg-ivory p-6 md:p-12">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-premium border border-gray-200">
        <Link to="/login" className="text-gold font-bold hover:underline mb-6 inline-block">&larr; Back to Login</Link>
        <h1 className="font-display text-3xl font-bold mb-6 text-black">Terms of Service</h1>
        <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
          <p><strong>1. Acceptance of Terms</strong><br/>By accessing Jump PropTech, you agree to these terms. If you do not agree, please do not use the platform.</p>
          <p><strong>2. Use of Platform</strong><br/>Jump PropTech provides property management software. Landlords are responsible for the accuracy of the data they upload. Tenants are responsible for maintaining the confidentiality of their login credentials.</p>
          <p><strong>3. Payments</strong><br/>Jump PropTech does not process rent payments directly. Any rent tracked on the platform is recorded manually by the Landlord.</p>
          <p><strong>4. Limitation of Liability</strong><br/>Jump PropTech is not liable for disputes between Landlords and Tenants, or for any data loss resulting from network failures.</p>
        </div>
      </div>
    </div>
  );
}