import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-ivory p-6 md:p-12">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-premium border border-gray-200">
        <Link to="/login" className="text-gold font-bold hover:underline mb-6 inline-block">&larr; Back to Login</Link>
        <h1 className="font-display text-3xl font-bold mb-2 text-black">Privacy Policy (POPIA)</h1>
        <p className="text-xs text-gray-500 mb-6">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
          <p><strong>1. Information Officer</strong><br/>In compliance with the Protection of Personal Information Act (POPIA), our Information Officer is [Your Name/Company Name]. Contact: [Your Email Address].</p>
          
          <p><strong>2. What Data We Collect</strong><br/>
          We collect your name, email, phone number, and (for tenants) identity documents and vehicle registration details. We also collect maintenance photos uploaded by tenants.</p>
          
          <p><strong>3. How We Use Your Data</strong><br/>
          Your data is used strictly for managing your lease, tracking rent, and communicating about property maintenance. We do not sell your data to third parties.</p>
          
          <p><strong>4. Your Rights (Right to be Forgotten)</strong><br/>
          Under POPIA, you have the right to request the correction or deletion of your personal information. You can delete your account directly from your Profile page, which will permanently remove your personal data from our active databases.</p>
          
          <p><strong>5. Data Security</strong><br/>
          All identity documents and maintenance photos are stored using secure, private cloud storage (Cloudinary). Your password is encrypted and cannot be viewed by our staff.</p>
        </div>
      </div>
    </div>
  );
}