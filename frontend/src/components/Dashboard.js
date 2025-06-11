import React, { useState, useEffect } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { FiActivity, FiShield, FiWifi, FiCpu, FiSettings, FiMonitor, FiSun, FiMoon } from 'react-icons/fi';
import PlayfairTab from './tabs/PlayfairTab';
import RIPTab from './tabs/RIPTab';
import TCPTab from './tabs/TCPTab';
import SimulationTab from './tabs/SimulationTab';
import NetworkVisualization from './NetworkVisualization';
import SettingsTab from './tabs/SettingsTab';
import './Dashboard.css';

const Dashboard = () => {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`dashboard-container ${darkMode ? 'dark-theme' : 'light-theme'}`}>
      <div className="dashboard-header">
        <div className="header-content">
          <div className="brand-section">
            <FiMonitor className="brand-icon" />
            <div className="brand-text">
              <h1>DCN Network Simulation</h1>
              <p>Advanced Protocol Analysis & Security Dashboard</p>
            </div>
          </div>
          <button className="theme-toggle" onClick={toggleTheme}>
            {darkMode ? <FiSun /> : <FiMoon />}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </div>

      <div className="dashboard-main">
        <Tabs className="dashboard-tabs" selectedTabClassName="active-tab">
          <TabList className="tab-list">
            <Tab className="tab-item">
              <FiMonitor className="tab-icon" />
              <span className="tab-label">Network Overview</span>
            </Tab>
            <Tab className="tab-item">
              <FiShield className="tab-icon" />
              <span className="tab-label">Playfair Cipher</span>
            </Tab>
            <Tab className="tab-item">
              <FiWifi className="tab-icon" />
              <span className="tab-label">RIP Routing</span>
            </Tab>
            <Tab className="tab-item">
              <FiActivity className="tab-icon" />
              <span className="tab-label">TCP Reno</span>
            </Tab>
            <Tab className="tab-item">
              <FiCpu className="tab-icon" />
              <span className="tab-label">Full Simulation</span>
            </Tab>
            <Tab className="tab-item">
              <FiSettings className="tab-icon" />
              <span className="tab-label">Settings</span>
            </Tab>
          </TabList>

          <div className="tab-content-area">
            <TabPanel>
              <div className="tab-content">
                <NetworkVisualization />
              </div>
            </TabPanel>

            <TabPanel>
              <div className="tab-content">
                <PlayfairTab />
              </div>
            </TabPanel>

            <TabPanel>
              <div className="tab-content">
                <RIPTab />
              </div>
            </TabPanel>

            <TabPanel>
              <div className="tab-content">
                <TCPTab />
              </div>
            </TabPanel>

            <TabPanel>
              <div className="tab-content">
                <SimulationTab />
              </div>
            </TabPanel>

            <TabPanel>
              <div className="tab-content">
                <SettingsTab darkMode={darkMode} toggleTheme={toggleTheme} />
              </div>
            </TabPanel>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
