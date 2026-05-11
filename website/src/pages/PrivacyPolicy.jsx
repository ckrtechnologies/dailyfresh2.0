import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="policy-page">
      <nav className="glass" style={{ padding: '1rem 0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" className="btn-outline" style={{ padding: '0.5rem', borderRadius: '50%' }}>
            <ChevronLeft size={20} />
          </Link>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Privacy Policy</h2>
        </div>
      </nav>

      <main className="container section animate-fade">
        <div className="glass" style={{ padding: '3rem', borderRadius: '24px' }}>
          <h1 style={{ marginBottom: '2rem', fontSize: '2.5rem' }}>Privacy Policy for DailyFresh Kolkata</h1>
          <p style={{ color: 'var(--gray)', marginBottom: '2rem' }}>Last updated: May 11, 2026</p>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>1. Introduction</h2>
            <p>Welcome to DailyFresh Kolkata. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website or use our mobile application (the "Service") and tell you about your privacy rights.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>2. Data We Collect</h2>
            <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
            <ul style={{ marginLeft: '2rem', marginTop: '1rem' }}>
              <li><strong>Identity Data:</strong> first name, last name, username or similar identifier.</li>
              <li><strong>Contact Data:</strong> billing address, delivery address, email address and telephone numbers.</li>
              <li><strong>Location Data:</strong> precise location data to facilitate deliveries and show serviceable areas.</li>
              <li><strong>Transaction Data:</strong> details about payments to and from you and other details of products you have purchased from us.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>3. How We Use Your Data</h2>
            <p>We use your data to provide our services, including:</p>
            <ul style={{ marginLeft: '2rem', marginTop: '1rem' }}>
              <li>To register you as a new customer.</li>
              <li>To process and deliver your orders.</li>
              <li>To manage our relationship with you.</li>
              <li>To enable you to partake in a prize draw, competition or complete a survey.</li>
              <li>To use data analytics to improve our website, products/services, marketing, and customer experiences.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>4. Location Permissions</h2>
            <p>Our mobile app requires access to your location even when the app is in the background to provide accurate real-time delivery tracking and ensure you are within our serviceable zones. You can enable or disable this through your device settings.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>5. Data Security</h2>
            <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed.</p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>6. Contact Us</h2>
            <p>If you have any questions about this privacy policy or our privacy practices, please contact us at:</p>
            <p style={{ marginTop: '1rem', fontWeight: 600 }}>Email: support@dailyfreshkolkata.in</p>
            <p style={{ fontWeight: 600 }}>Phone: +91 8207226709</p>
          </section>
        </div>
      </main>

      <footer style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--gray)' }}>
        <div className="container">
          <p>© 2026 DailyFresh Kolkata. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
