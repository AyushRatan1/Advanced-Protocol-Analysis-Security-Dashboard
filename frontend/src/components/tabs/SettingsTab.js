import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSave, FiRefreshCw, FiMonitor, FiEdit, FiBell, FiShield } from 'react-icons/fi';
import './SettingsTab.css';

const SettingsTab = () => {
  const [settings, setSettings] = useState({
    theme: 'dark',
    animations: true,
    notifications: true,
    autoRefresh: true,
    refreshInterval: 5000,
    gridOpacity: 0.1,
    glowEffects: true,
    particleBackground: false,
    soundEffects: false,
    apiTimeout: 30000,
    maxRetries: 3,
    debugMode: false
  });

  const [saved, setSaved] = useState(false);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = () => {
    // In a real app, this would save to localStorage or API
    localStorage.setItem('dcn-dashboard-settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetSettings = () => {
    setSettings({
      theme: 'dark',
      animations: true,
      notifications: true,
      autoRefresh: true,
      refreshInterval: 5000,
      gridOpacity: 0.1,
      glowEffects: true,
      particleBackground: false,
      soundEffects: false,
      apiTimeout: 30000,
      maxRetries: 3,
      debugMode: false
    });
  };

  return (
    <div className="settings-tab">
      <div className="tab-header">
        <div className="header-content">
          <h2>Dashboard Settings</h2>
          <p>Customize your network simulation dashboard experience</p>
        </div>
        <div className="header-actions">
          <motion.button
            className="action-btn secondary"
            onClick={resetSettings}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiRefreshCw /> Reset
          </motion.button>
          <motion.button
            className="action-btn primary"
            onClick={saveSettings}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {saved ? <FiRefreshCw /> : <FiSave />}
            {saved ? 'Saved!' : 'Save Settings'}
          </motion.button>
        </div>
      </div>

      <div className="settings-content">
        <div className="settings-sections">
          <div className="settings-section">
            <div className="section-header">
              <FiEdit className="section-icon" />
              <h3>Appearance</h3>
            </div>
            <div className="settings-grid">
              <div className="setting-item">
                <div className="setting-info">
                  <label>Theme</label>
                  <span className="setting-description">Choose your preferred color scheme</span>
                </div>
                <select
                  value={settings.theme}
                  onChange={(e) => handleSettingChange('theme', e.target.value)}
                  className="cyber-select"
                >
                  <option value="dark">Dark (Default)</option>
                  <option value="light">Light</option>
                  <option value="cyberpunk">Cyberpunk</option>
                  <option value="matrix">Matrix</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Animations</label>
                  <span className="setting-description">Enable smooth transitions and effects</span>
                </div>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="animations"
                    checked={settings.animations}
                    onChange={(e) => handleSettingChange('animations', e.target.checked)}
                  />
                  <label htmlFor="animations" className="toggle-label"></label>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Glow Effects</label>
                  <span className="setting-description">Add glowing borders and highlights</span>
                </div>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="glowEffects"
                    checked={settings.glowEffects}
                    onChange={(e) => handleSettingChange('glowEffects', e.target.checked)}
                  />
                  <label htmlFor="glowEffects" className="toggle-label"></label>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Grid Opacity</label>
                  <span className="setting-description">Adjust background grid visibility</span>
                </div>
                <div className="slider-container">
                  <input
                    type="range"
                    min="0"
                    max="0.3"
                    step="0.01"
                    value={settings.gridOpacity}
                    onChange={(e) => handleSettingChange('gridOpacity', parseFloat(e.target.value))}
                    className="cyber-slider"
                  />
                  <span className="slider-value">{Math.round(settings.gridOpacity * 100)}%</span>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Particle Background</label>
                  <span className="setting-description">Animated particles in background</span>
                </div>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="particleBackground"
                    checked={settings.particleBackground}
                    onChange={(e) => handleSettingChange('particleBackground', e.target.checked)}
                  />
                  <label htmlFor="particleBackground" className="toggle-label"></label>
                </div>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <div className="section-header">
              <FiMonitor className="section-icon" />
              <h3>System</h3>
            </div>
            <div className="settings-grid">
              <div className="setting-item">
                <div className="setting-info">
                  <label>Auto Refresh</label>
                  <span className="setting-description">Automatically refresh network data</span>
                </div>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="autoRefresh"
                    checked={settings.autoRefresh}
                    onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                  />
                  <label htmlFor="autoRefresh" className="toggle-label"></label>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Refresh Interval</label>
                  <span className="setting-description">How often to update data (seconds)</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.refreshInterval / 1000}
                  onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value) * 1000)}
                  className="cyber-input"
                  disabled={!settings.autoRefresh}
                />
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>API Timeout</label>
                  <span className="setting-description">Request timeout in milliseconds</span>
                </div>
                <input
                  type="number"
                  min="5000"
                  max="120000"
                  step="1000"
                  value={settings.apiTimeout}
                  onChange={(e) => handleSettingChange('apiTimeout', parseInt(e.target.value))}
                  className="cyber-input"
                />
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Max Retries</label>
                  <span className="setting-description">Maximum retry attempts for failed requests</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={settings.maxRetries}
                  onChange={(e) => handleSettingChange('maxRetries', parseInt(e.target.value))}
                  className="cyber-input"
                />
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Debug Mode</label>
                  <span className="setting-description">Show additional debugging information</span>
                </div>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="debugMode"
                    checked={settings.debugMode}
                    onChange={(e) => handleSettingChange('debugMode', e.target.checked)}
                  />
                  <label htmlFor="debugMode" className="toggle-label"></label>
                </div>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <div className="section-header">
              <FiBell className="section-icon" />
              <h3>Notifications</h3>
            </div>
            <div className="settings-grid">
              <div className="setting-item">
                <div className="setting-info">
                  <label>Enable Notifications</label>
                  <span className="setting-description">Show system notifications</span>
                </div>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="notifications"
                    checked={settings.notifications}
                    onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                  />
                  <label htmlFor="notifications" className="toggle-label"></label>
                </div>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Sound Effects</label>
                  <span className="setting-description">Play sounds for actions and notifications</span>
                </div>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="soundEffects"
                    checked={settings.soundEffects}
                    onChange={(e) => handleSettingChange('soundEffects', e.target.checked)}
                    disabled={!settings.notifications}
                  />
                  <label htmlFor="soundEffects" className="toggle-label"></label>
                </div>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <div className="section-header">
              <FiShield className="section-icon" />
              <h3>Security</h3>
            </div>
            <div className="settings-grid">
              <div className="setting-item">
                <div className="setting-info">
                  <label>Session Timeout</label>
                  <span className="setting-description">Auto-logout after inactivity (minutes)</span>
                </div>
                <select className="cyber-select">
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                  <option value="0">Never</option>
                </select>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <label>Clear Data on Exit</label>
                  <span className="setting-description">Remove sensitive data when closing</span>
                </div>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="clearOnExit"
                    defaultChecked={false}
                  />
                  <label htmlFor="clearOnExit" className="toggle-label"></label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-info">
          <div className="info-card">
            <h4>About DCN Dashboard</h4>
            <div className="info-content">
              <p><strong>Version:</strong> 1.0.0</p>
              <p><strong>Build:</strong> 2024.06.12</p>
              <p><strong>API Status:</strong> <span className="status-online">Online</span></p>
              <p><strong>Last Updated:</strong> {new Date().toLocaleString()}</p>
            </div>
          </div>

          <div className="info-card">
            <h4>Performance</h4>
            <div className="performance-metrics">
              <div className="metric">
                <span className="metric-label">Memory Usage:</span>
                <div className="metric-bar">
                  <div className="metric-fill" style={{ width: '45%' }}></div>
                </div>
                <span className="metric-value">45%</span>
              </div>
              <div className="metric">
                <span className="metric-label">CPU Usage:</span>
                <div className="metric-bar">
                  <div className="metric-fill" style={{ width: '23%' }}></div>
                </div>
                <span className="metric-value">23%</span>
              </div>
              <div className="metric">
                <span className="metric-label">Network:</span>
                <div className="metric-bar">
                  <div className="metric-fill" style={{ width: '67%' }}></div>
                </div>
                <span className="metric-value">67%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
