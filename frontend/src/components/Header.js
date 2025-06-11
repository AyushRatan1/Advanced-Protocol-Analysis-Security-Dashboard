import React from 'react';
import { FiMonitor, FiActivity } from 'react-icons/fi';
import './Header.css';

const Header = ({ systemStats }) => {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <FiMonitor className="logo-icon" />
          <span>DCN Dashboard</span>
        </div>
        
        <div className="status-indicator">
          <div className="status-dot"></div>
          <span>System Online</span>
        </div>
      </div>

      <div className="header-right">
        <div className="system-stats">
          <div className="stat-item">
            <span className="stat-label">CPU</span>
            <div className="stat-bar">
              <div 
                className="stat-fill cpu" 
                style={{ width: `${systemStats.cpu}%` }}
              ></div>
            </div>
            <span className="stat-value">{systemStats.cpu}%</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">Memory</span>
            <div className="stat-bar">
              <div 
                className="stat-fill memory" 
                style={{ width: `${systemStats.memory}%` }}
              ></div>
            </div>
            <span className="stat-value">{systemStats.memory}%</span>
          </div>

          <div className="stat-item">
            <span className="stat-label">Network</span>
            <div className="stat-bar">
              <div 
                className="stat-fill network" 
                style={{ width: `${systemStats.network}%` }}
              ></div>
            </div>
            <span className="stat-value">{systemStats.network}%</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
