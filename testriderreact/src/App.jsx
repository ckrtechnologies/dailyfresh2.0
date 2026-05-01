import React from 'react';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Daily Fresh</h1>
        <p>Rider Dashboard Boilerplate</p>
      </header>
      <main className="app-content">
        <div className="welcome-card">
          <h2>Welcome Back!</h2>
          <p>This is a clean start for your rider tracking application.</p>
          <div className="placeholder-content">
            <p>Ready to implement real-time tracking, maps, and order management.</p>
          </div>
          <button className="primary-button">Get Started</button>
        </div>
      </main>
      <footer className="app-footer">
        &copy; 2026 Daily Fresh
      </footer>
    </div>
  );
}

export default App;
