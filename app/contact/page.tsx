'use client';

import React, { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // For quick publishing: Open email client with pre-filled message
    // Replace 'support@yourdomain.com' with your actual email
    const subject = encodeURIComponent(`Support request from ${formData.name}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    );
    
    window.location.href = `mailto:support@yourdomain.com?subject=${subject}&body=${body}`;
    
    // Show success message (user can still send via their email client)
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <h1 className="text-3xl font-bold mb-6">Thank You!</h1>
        <p className="mb-4">
          Your message has been prepared in your email client. Please send it to complete your request.
        </p>
        <p className="text-sm text-gray-600">
          (For a better experience in production, we recommend connecting this form to an email service 
          like Resend, Formspree, or a custom API route.)
        </p>
        <button 
          onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', message: '' }); }} 
          className="mt-6 px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Contact Us</h1>
      
      <p className="mb-8 text-gray-700">
        Have a question about an order, delivery tracking, or the app? Reach out via WhatsApp for the 
        fastest response, or use the form below. We typically respond within 24 hours.
      </p>

      <div className="mb-8 p-4 bg-gray-100 rounded">
        <p className="font-medium">Quick WhatsApp Support:</p>
        <a 
          href="https://wa.me/23480XXXXXXXX?text=Hi%20Zara%20Thrift%2C%20I%20need%20help%20with%20my%20order." 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Chat with us on WhatsApp (+234 80 XXX XXXX)
        </a>
        <p className="text-xs text-gray-600 mt-1">(Replace number with yours)</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">Message</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={6}
            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Tell us about your order, delivery issue, or question..."
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-black text-white py-3 rounded font-medium hover:bg-gray-800 transition-colors"
        >
          Send Message (opens email)
        </button>
      </form>

      <p className="mt-8 text-xs text-gray-500">
        This is a simple quick-to-publish contact form. For production use with better UX (no email client 
        popup), replace the submit handler with a real service like Formspree, Resend + API route, or 
        Vercel serverless functions. The WhatsApp link above is often the fastest for Nigerian users.
      </p>
    </div>
  );
}
