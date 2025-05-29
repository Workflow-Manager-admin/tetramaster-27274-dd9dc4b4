import React from 'react';
import './App.css';
import TetraMaster from './TetraMaster';

function App() {
  return (
    <div className="app" style={{ background: "#222831", minHeight: "100vh" }}>
      <nav className="navbar">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div className="logo">
              <span className="logo-symbol">*</span> KAVIA AI
            </div>
            <button className="btn" tabIndex={-1} disabled style={{ opacity: 0.51 }}>
              TetraMaster
            </button>
          </div>
        </div>
      </nav>
      <main>
        <div className="container" style={{ maxWidth: "unset", width: "100%" }}>
          <TetraMaster />
        </div>
      </main>
    </div>
  );
}

export default App;