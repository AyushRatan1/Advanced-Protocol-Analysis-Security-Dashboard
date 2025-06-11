import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiPlay, FiRefreshCw, FiBarChart, FiSettings } from 'react-icons/fi';
import axios from 'axios';
import './TCPTab.css';

const TCPTab = () => {
  const [config, setConfig] = useState({
    data_size: 10000,
    mss: 1460,
    initial_cwnd: 1,
    ssthresh: 65535,
    packet_loss_rate: 0.05,
    max_time: 100
  });
  
  const [results, setResults] = useState(null);
  const [plotImage, setPlotImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: parseFloat(value) || 0
    }));
  };

  const runSimulation = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/tcp/simulate', config);
      
      if (response.data.success) {
        setResults(response.data.results);
        setPlotImage(response.data.plot);
      } else {
        setError(response.data.error || 'Simulation failed');
      }
    } catch (err) {
      setError('Error connecting to API');
      console.error('TCP simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetConfig = () => {
    setConfig({
      data_size: 10000,
      mss: 1460,
      initial_cwnd: 1,
      ssthresh: 65535,
      packet_loss_rate: 0.05,
      max_time: 100
    });
    setResults(null);
    setPlotImage('');
  };

  const getStateColor = (state) => {
    switch (state) {
      case 'slow_start': return '#4ecdc4';
      case 'congestion_avoidance': return '#ffe66d';
      case 'fast_recovery': return '#ff6b6b';
      default: return '#6c7293';
    }
  };

  return (
    <div className="tcp-tab">
      <div className="tab-header">
        <div className="header-content">
          <h2>TCP Reno Simulation</h2>
          <p>Congestion Control Algorithm - Slow Start, Congestion Avoidance & Fast Recovery</p>
        </div>
        <div className="header-actions">
          <motion.button
            className="action-btn secondary"
            onClick={resetConfig}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiRefreshCw /> Reset
          </motion.button>
        </div>
      </div>

      {error && (
        <motion.div 
          className="error-message"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.div>
      )}

      <div className="tcp-content">
        <div className="simulation-controls">
          <div className="controls-header">
            <h3><FiSettings /> Simulation Parameters</h3>
          </div>
          
          <div className="controls-grid">
            <div className="control-group">
              <label>Data Size (bytes)</label>
              <input
                type="number"
                value={config.data_size}
                onChange={(e) => handleConfigChange('data_size', e.target.value)}
                className="cyber-input"
                min="1"
                max="1000000"
              />
              <span className="control-hint">Amount of data to transmit</span>
            </div>

            <div className="control-group">
              <label>MSS (bytes)</label>
              <input
                type="number"
                value={config.mss}
                onChange={(e) => handleConfigChange('mss', e.target.value)}
                className="cyber-input"
                min="1"
                max="9000"
              />
              <span className="control-hint">Maximum Segment Size</span>
            </div>

            <div className="control-group">
              <label>Initial CWND</label>
              <input
                type="number"
                value={config.initial_cwnd}
                onChange={(e) => handleConfigChange('initial_cwnd', e.target.value)}
                className="cyber-input"
                min="1"
                max="100"
              />
              <span className="control-hint">Initial congestion window size</span>
            </div>

            <div className="control-group">
              <label>SSThresh</label>
              <input
                type="number"
                value={config.ssthresh}
                onChange={(e) => handleConfigChange('ssthresh', e.target.value)}
                className="cyber-input"
                min="1"
                max="100000"
              />
              <span className="control-hint">Slow start threshold</span>
            </div>

            <div className="control-group">
              <label>Packet Loss Rate</label>
              <input
                type="number"
                step="0.01"
                value={config.packet_loss_rate}
                onChange={(e) => handleConfigChange('packet_loss_rate', e.target.value)}
                className="cyber-input"
                min="0"
                max="1"
              />
              <span className="control-hint">Probability of packet loss (0-1)</span>
            </div>

            <div className="control-group">
              <label>Max Time Steps</label>
              <input
                type="number"
                value={config.max_time}
                onChange={(e) => handleConfigChange('max_time', e.target.value)}
                className="cyber-input"
                min="10"
                max="1000"
              />
              <span className="control-hint">Maximum simulation duration</span>
            </div>
          </div>

          <motion.button
            className="action-btn primary large"
            onClick={runSimulation}
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.05 }}
            whileTap={{ scale: loading ? 1 : 0.95 }}
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <FiRefreshCw />
                </motion.div>
                Running Simulation...
              </>
            ) : (
              <>
                <FiPlay /> Run TCP Simulation
              </>
            )}
          </motion.button>
        </div>

        {results && (
          <motion.div 
            className="simulation-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="results-header">
              <h3><FiBarChart /> Simulation Results</h3>
              <div className="transmission-status">
                <span className={`status-badge ${results.transmission_complete ? 'success' : 'warning'}`}>
                  {results.transmission_complete ? 'Complete' : 'Incomplete'}
                </span>
              </div>
            </div>

            <div className="results-stats">
              <div className="stat-card">
                <div className="stat-value">{results.data_transmitted}</div>
                <div className="stat-label">Bytes Transmitted</div>
                <div className="stat-total">of {results.data_size}</div>
              </div>

              <div className="stat-card">
                <div className="stat-value">{results.time_steps}</div>
                <div className="stat-label">Time Steps</div>
                <div className="stat-total">Duration</div>
              </div>

              <div className="stat-card">
                <div className="stat-value">{results.total_packets_sent}</div>
                <div className="stat-label">Packets Sent</div>
                <div className="stat-total">Total</div>
              </div>

              <div className="stat-card">
                <div className="stat-value">{results.packets_lost}</div>
                <div className="stat-label">Packets Lost</div>
                <div className="stat-total">
                  {((results.packets_lost / results.total_packets_sent) * 100).toFixed(2)}%
                </div>
              </div>
            </div>

            {plotImage && (
              <div className="plot-container">
                <h4>Congestion Window Evolution</h4>
                <div className="plot-image">
                  <img 
                    src={`data:image/png;base64,${plotImage}`} 
                    alt="TCP Reno Simulation Plot"
                    style={{ width: '100%', height: 'auto', borderRadius: '10px' }}
                  />
                </div>
              </div>
            )}

            <div className="detailed-stats">
              <div className="stats-section">
                <h4>State Distribution</h4>
                <div className="state-stats">
                  {results.state_history && 
                    Object.entries(
                      results.state_history.reduce((acc, state) => {
                        acc[state] = (acc[state] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([state, count]) => (
                      <div key={state} className="state-item">
                        <div 
                          className="state-color"
                          style={{ backgroundColor: getStateColor(state) }}
                        />
                        <span className="state-name">
                          {state.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="state-count">
                          {count} steps ({((count / results.state_history.length) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    ))
                  }
                </div>
              </div>

              <div className="stats-section">
                <h4>Performance Metrics</h4>
                <div className="metrics-grid">
                  <div className="metric-item">
                    <span className="metric-label">Throughput:</span>
                    <span className="metric-value">
                      {(results.data_transmitted / results.time_steps).toFixed(2)} bytes/step
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Efficiency:</span>
                    <span className="metric-value">
                      {((results.data_transmitted / results.data_size) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Loss Rate:</span>
                    <span className="metric-value">
                      {((results.packets_lost / results.total_packets_sent) * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Max CWND:</span>
                    <span className="metric-value">
                      {Math.max(...results.cwnd_history).toFixed(2)} MSS
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="tcp-info">
        <h3>TCP Reno Algorithm</h3>
        <div className="info-phases">
          <div className="phase-card slow-start">
            <h4>Slow Start</h4>
            <p>Exponential growth phase where CWND doubles each RTT until reaching SSThresh.</p>
          </div>
          <div className="phase-card congestion-avoidance">
            <h4>Congestion Avoidance</h4>
            <p>Linear growth phase where CWND increases by 1 MSS per RTT.</p>
          </div>
          <div className="phase-card fast-recovery">
            <h4>Fast Recovery</h4>
            <p>Recovery phase triggered by 3 duplicate ACKs, avoiding timeout.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TCPTab;
