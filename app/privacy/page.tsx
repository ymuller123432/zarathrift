import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      
      <p className="mb-6 text-sm text-gray-600">
        <strong>Effective Date:</strong> June 9, 2026<br />
        <strong>Last Updated:</strong> June 9, 2026
      </p>

      <p className="mb-8">
        Zara Thrift ("we", "us", or "our") operates the Zara Thrift mobile application (the "App"). 
        This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
        when you use our App. Please read this policy carefully. If you do not agree with the terms 
        of this Privacy Policy, please do not access the App.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4">1. Information We Collect</h2>
      <p className="mb-4">We collect information about you in the following ways:</p>

      <h3 className="text-xl font-semibold mt-6 mb-3">Personal Information</h3>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Full name, phone number, delivery address, city, and state when you register or place an order.</li>
        <li>Phone number for authentication via OTP (one-time password) and for driver login.</li>
        <li>Order details, including purchased items, payment confirmations (receipt uploads), and delivery notes.</li>
      </ul>

      <h3 className="text-xl font-semibold mt-6 mb-3">Location Information</h3>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>
          <strong>Drivers only:</strong> Precise location (GPS coordinates, speed) is collected when a logged-in driver 
          activates live tracking for an assigned order. This includes foreground and background location updates 
          (even when the app is closed or the device is locked) so customers can view real-time delivery progress 
          and bike movements.
        </li>
        <li>Location data is collected only with your explicit permission and only while you are actively tracking 
          a delivery. Customers viewing order tracking do not share their own location.</li>
      </ul>

      <h3 className="text-xl font-semibold mt-6 mb-3">Usage and Technical Information</h3>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Device information, app usage analytics, and crash reports (to improve the service and fix issues).</li>
        <li>Optional payment receipt images uploaded for order verification.</li>
      </ul>

      <p className="mb-4">
        We do not collect sensitive data such as credit card details (payments are manual via bank transfer or 
        cash on delivery, confirmed via WhatsApp).
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4">2. How We Use Your Information</h2>
      <p className="mb-4">We use the information we collect to:</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Process orders, manage deliveries, and provide real-time tracking updates to customers (including live GPS and delivery updates from drivers).</li>
        <li>Enable driver features such as order assignment, live location sharing, and background tracking.</li>
        <li>Authenticate users via phone OTP and manage driver logins.</li>
        <li>Verify payments (via receipt uploads) and communicate order status, payment instructions, and support via WhatsApp.</li>
        <li>Improve the App, provide customer support, and ensure reliable nationwide delivery (Lagos, Abuja, and other areas).</li>
        <li>Comply with legal obligations and prevent fraud.</li>
      </ul>

      <h2 className="text-2xl font-semibold mt-10 mb-4">3. How We Share Your Information</h2>
      <p className="mb-4">We share information only in limited, necessary ways:</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>
          <strong>With customers:</strong> When you are a driver actively tracking an order, your live location 
          (latitude, longitude, speed, timestamps, and notes) is shared with the specific customer who placed 
          that order via the in-app Track screen and delivery updates. This enables real-time visibility into 
          bike movements and estimated delivery.
        </li>
        <li>
          <strong>Via WhatsApp:</strong> Order confirmations, payment details (e.g., Moniepoint account info), 
          receipts, and support messages are exchanged through WhatsApp.
        </li>
        <li>
          <strong>With service providers:</strong> We may share data with Supabase (for database and authentication) 
          and other infrastructure providers necessary to operate the App. These providers are bound by 
          confidentiality obligations.
        </li>
        <li>
          We do not sell, rent, or share your personal information with third parties for their marketing purposes.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mt-10 mb-4">4. Data Retention</h2>
      <p className="mb-4">
        We retain your information only as long as necessary to provide the services, fulfill orders, 
        comply with legal requirements, resolve disputes, and enforce our agreements. Location and delivery 
        update data is typically retained for a limited period after order completion (e.g., for support 
        and records) and then deleted or anonymized.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4">5. Your Rights</h2>
      <p className="mb-4">Depending on your location, you may have the right to:</p>
      <ul className="list-disc pl-6 mb-4 space-y-1">
        <li>Access the personal data we hold about you.</li>
        <li>Request correction or deletion of your data.</li>
        <li>Withdraw consent (e.g., stop location tracking by ending driver mode).</li>
        <li>Request a copy of your data or object to certain processing.</li>
      </ul>

      <h3 className="text-lg font-semibold mt-4 mb-2">Data Deletion Requests</h3>
      <p className="mb-4">
        You can request that your account and all associated data (including orders, delivery tracking history, 
        and location updates) be permanently deleted at any time. We will process valid requests within 30 days.
      </p>
      <p className="mb-4">
        <Link href="/account-deletion" className="text-blue-600 underline font-medium">
          Submit an Account and Data Deletion Request
        </Link>
      </p>
      <p className="mb-4">
        To exercise these rights, please contact us using the details below. We will respond within a 
        reasonable time and in accordance with applicable law.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4">6. Data Security</h2>
      <p className="mb-4">
        We implement reasonable technical and organizational measures to protect your information against 
        unauthorized access, alteration, disclosure, or destruction. However, no system is completely secure, 
        and we cannot guarantee absolute security.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4">7. Children's Privacy</h2>
      <p className="mb-4">
        Our App is not intended for children under 13 (or the applicable age of digital consent in your 
        jurisdiction). We do not knowingly collect personal information from children.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4">8. Changes to This Policy</h2>
      <p className="mb-4">
        We may update this Privacy Policy from time to time. We will notify you of material changes by 
        posting the new policy on this page and updating the "Last Updated" date. Your continued use of 
        the App after changes constitutes acceptance of the updated policy.
      </p>

      <h2 className="text-2xl font-semibold mt-10 mb-4">9. Contact Us</h2>
      <p className="mb-4">
        If you have questions about this Privacy Policy or your data, please contact us:
      </p>
      <ul className="list-none mb-4 space-y-1">
        <li>WhatsApp: +234 80 XXX XXXX (replace with your number)</li>
        <li>Email: support@yourdomain.com (replace with your email)</li>
        <li>
          Contact Form: <Link href="/contact" className="text-blue-600 underline">Submit a message via our Contact Form</Link>
        </li>
        <li>Website: https://yourdomain.com (replace with your website)</li>
      </ul>

      <p className="text-sm text-gray-500 mt-12">
        This is a simple, ready-to-use template tailored for Zara Thrift. Replace all placeholders 
        (phone number, email, domain) with your actual details before publishing. Host it at 
        https://yourdomain.com/privacy for App Store Connect.
      </p>
    </div>
  );
}
