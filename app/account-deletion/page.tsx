'use client';

import React, { useState } from 'react';

export default function AccountDeletion() {
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    reason: '',
    confirm: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.confirm) {
      alert('Please confirm that you understand the deletion is permanent.');
      return;
    }

    // For quick publishing: Opens email client with pre-filled request.
    // TODO: Replace with real backend (Supabase Edge Function, Resend, etc.)
    const subject = encodeURIComponent('Account and Data Deletion Request');
    const body = encodeURIComponent(
      `Phone: ${formData.phone}\n` +
      `Email: ${formData.email || 'Not provided'}\n` +
      `Reason: ${formData.reason || 'Not provided'}\n\n` +
      `I confirm I want my Zara Thrift account and all associated data permanently deleted.`
    );

    window.location.href = `mailto:support@yourdomain.com?subject=${subject}&body=${body}`;

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <h1 className="text-3xl font-bold mb-6">Request Received</h1>
        <p className="mb-4">
          Your deletion request has been prepared in your email client. Please send the email to complete the process.
        </p>
        <p className="text-sm text-gray-600 mb-8">
          We will process your request within 30 days (or sooner). All your account data, orders, and location history will be permanently deleted.
        </p>
        <button 
          onClick={() => {
            setSubmitted(false);
            setFormData({ phone: '', email: '', reason: '', confirm: false });
          }} 
          className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Account &amp; Data Deletion Request</h1>

      <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="font-medium text-yellow-800">Important</p>
        <p className="text-sm text-yellow-700">
          Deleting your account is permanent. All personal data, order history, delivery tracking information, 
          and associated records will be removed and cannot be recovered.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">
            Phone Number (required - used for login)
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            placeholder="+234 80 XXX XXXX"
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email (optional)
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div>
          <label htmlFor="reason" className="block text-sm font-medium mb-1">
            Reason for deletion (optional)
          </label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            rows={4}
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Tell us why you're deleting your account..."
          />
        </div>

        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="confirm"
            name="confirm"
            checked={formData.confirm}
            onChange={handleChange}
            required
            className="mt-1"
          />
          <label htmlFor="confirm" className="text-sm">
            I understand that deleting my account is permanent and all my data (including order history and 
            delivery tracking information) will be permanently removed.
          </label>
        </div>

        <button 
          type="submit" 
          className="w-full bg-red-600 text-white py-3 rounded font-medium hover:bg-red-700 transition-colors"
        >
          Request Account Deletion
        </button>
      </form>

      <p className="mt-8 text-xs text-gray-500">
        This form prepares an email to our support team. For a fully automated solution, connect this to 
        a backend (Supabase Edge Function + RLS deletion, or Resend + database cleanup). We process requests 
        manually within 30 days.
      </p>

      <div className="mt-6 text-sm">
        <p>Alternative contact:</p>
        <a 
          href="https://wa.me/23480XXXXXXXX?text=Hi%20Zara%20Thrift%2C%20I%20want%20to%20delete%20my%20account." 
          className="text-blue-600 hover:underline"
        >
          Message us on WhatsApp
        </a>
      </div>
    </div>
  );
}
