import React from 'react';
import { Shield, ShieldAlert, ShieldBan, Radar } from 'lucide-react';
import './PerimeterStanding.css';

const PerimeterStanding = () => {
  return (
    <div className="perimeter-standing-container animate-fadeIn">
      <header className="ps-header">
        <h2 className="ps-title">
          <Radar size={32} />
          Perimeter Telemetry
        </h2>
        <p className="ps-subtitle">Tactical Standing Classifications & Security Grid Status</p>
      </header>

      <div className="ps-classifications-grid">
        
        {/* Secure Grid Card */}
        <div className="ps-card secure">
          <div className="ps-icon-wrapper">
            <Shield size={24} />
          </div>
          <div className="ps-card-content">
            <h3>
              Secure Grid
              <span className="ps-status-badge">No Restrictions</span>
            </h3>
            <p>
              Your Scout frequency is clear. Full transmission, channel creation, and voice access authorized across the basecamp.
            </p>
          </div>
        </div>

        {/* Caution Threshold Card */}
        <div className="ps-card caution">
          <div className="ps-icon-wrapper">
            <ShieldAlert size={24} />
          </div>
          <div className="ps-card-content">
            <h3>
              Caution Threshold
              <span className="ps-status-badge">Risk of Restriction</span>
            </h3>
            <p>
              Basecamp Ranger has flagged anomalies in your transmissions. Further infractions will trigger automatic localized lockdowns.
            </p>
          </div>
        </div>

        {/* Perimeter Quarantine Card */}
        <div className="ps-card quarantine">
          <div className="ps-icon-wrapper">
            <ShieldBan size={24} />
          </div>
          <div className="ps-card-content">
            <h3>
              Perimeter Quarantine
              <span className="ps-status-badge">Restricted</span>
            </h3>
            <p>
              Severe violation detected. Your transmission capabilities have been locked down by automated basecamp decrees.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PerimeterStanding;
