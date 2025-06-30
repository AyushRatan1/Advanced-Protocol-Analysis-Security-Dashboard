import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FiPlay, FiRefreshCw, FiShield, FiTarget, FiActivity, FiDownload, FiGrid } from 'react-icons/fi';
import axios from 'axios';
import predefinedTopologies from '../../topologies';
import './SimulationTab.css';

const SimulationTab = () => {
  const [config, setConfig] = useState({
    plaintext: 'HELLO NETWORK SECURITY WORLD',
    key: 'NETWORK',
    source_node: 'A',
    destination_node: 'F',
    packet_loss_rate: 0.05
  });
  
  const [selectedTopology, setSelectedTopology] = useState('linear');
  const [networkData, setNetworkData] = useState(predefinedTopologies['linear']);
  const [results, setResults] = useState(null);
  const [plotImage, setPlotImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [simulationStep, setSimulationStep] = useState(0);

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const runFullSimulation = async () => {
    setLoading(true);
    setError('');
    setSimulationStep(0);

    // Simulate step-by-step progress
    const steps = ['Encrypting message...', 'Finding route...', 'Simulating TCP...', 'Decrypting...'];
    const stepInterval = setInterval(() => {
      setSimulationStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    try {
      const response = await axios.post('/api/simulation/full', config);
      
      clearInterval(stepInterval);
      
      if (response.data.success) {
        setResults(response.data.results);
        setPlotImage(response.data.plot);
        setSimulationStep(steps.length);
      } else {
        setError(response.data.error || 'Simulation failed');
      }
    } catch (err) {
      clearInterval(stepInterval);
      setError('Error connecting to API');
      console.error('Full simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!results) return;
    
    const report = {
      timestamp: new Date().toISOString(),
      configuration: config,
      results: results,
      summary: {
        encryption_successful: !!results.encrypted_text,
        routing_successful: !!results.path,
        transmission_successful: results.success,
        path_cost: results.path_cost,
        tcp_efficiency: results.tcp_results ? 
          ((results.tcp_results.data_transmitted / results.tcp_results.data_size) * 100).toFixed(2) + '%' : 'N/A'
      }
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network_simulation_report_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const availableNodes = useMemo(() => networkData.nodes.map(n => n.id), [networkData]);
  const simulationSteps = [
    'Encrypting message...',
    'Finding optimal route...',
    'Simulating TCP transmission...',
    'Decrypting at destination...'
  ];

  const handleTopologyChange = async (e) => {
    const key = e.target.value;
    setSelectedTopology(key);
    const topo = predefinedTopologies[key];
    if (!topo) return;
    setNetworkData(topo);

    // Update routing dropdown defaults if nodes differ
    setConfig(prev => ({
      ...prev,
      source_node: topo.nodes[0].id,
      destination_node: topo.nodes[topo.nodes.length - 1].id
    }));

    try {
      await axios.post('/api/network/load-topology', {
        topology: key,
        data: {
          nodes: topo.nodes,
          links: topo.links
        }
      });
    } catch (err) {
      console.error('Error loading topology:', err);
    }
  };

  const renderNetwork = () => {
    if (!networkData?.nodes?.length) return null;
    const svgWidth = 600;
    const svgHeight = 300;
    return (
      <svg width={svgWidth} height={svgHeight} className="network-svg">
        {networkData.links.map((link, idx) => {
          const s = networkData.nodes.find(n => n.id === link.source);
          const t = networkData.nodes.find(n => n.id === link.target);
          if (!s || !t) return null;
          return (
            <g key={idx}>
              <line x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke="#00d4ff" strokeWidth="2" />
              <text x={(s.x+t.x)/2} y={(s.y+t.y)/2 - 6} fill="#ffe66d" fontSize="11" textAnchor="middle">{link.cost ?? link.distance ?? 1}</text>
            </g>
          );
        })}
        {networkData.nodes.map((node, idx) => (
          <g key={idx}>
            <circle cx={node.x} cy={node.y} r="18" fill="url(#gradSim)" stroke="#00d4ff" strokeWidth="2" />
            <text x={node.x} y={node.y+5} fill="#fff" fontSize="13" fontWeight="700" textAnchor="middle">{node.id}</text>
          </g>
        ))}
        <defs>
          <radialGradient id="gradSim" cx="30%" cy="30%">
            <stop offset="0%" stopColor="rgba(0,212,255,0.3)" />
            <stop offset="100%" stopColor="rgba(0,150,180,0.8)" />
          </radialGradient>
        </defs>
      </svg>
    );
  };

  return (
    <div className="simulation-tab">
      <div className="tab-header">
        <div className="header-content">
          <h2>Full Network Simulation</h2>
          <p>End-to-end secure network transmission with Playfair encryption, RIP routing, and TCP Reno</p>
        </div>
        <div className="header-actions">
          <select value={selectedTopology} onChange={handleTopologyChange} className="cyber-select" style={{ marginRight: 16 }}>
            {Object.entries(predefinedTopologies).map(([k,t]) => (<option key={k} value={k}>{t.name}</option>))}
          </select>
          {results && (
            <motion.button
              className="action-btn secondary"
              onClick={downloadReport}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiDownload /> Export Report
            </motion.button>
          )}
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

      <div className="simulation-content">
        {/* Network preview */}
        <div className="network-preview" style={{ background:'rgba(0,0,0,0.25)', borderRadius:12, padding:20, textAlign:'center' }}>
          <h3 style={{color:'var(--text-primary)', marginBottom:12}}><FiGrid/> {predefinedTopologies[selectedTopology].name} Preview</h3>
          {renderNetwork()}
        </div>

        <div className="simulation-config">
          <h3>Simulation Configuration</h3>
          
          <div className="config-sections">
            <div className="config-section encryption">
              <div className="section-header">
                <FiShield className="section-icon" />
                <h4>Encryption Layer</h4>
              </div>
              <div className="config-inputs">
                <div className="input-group">
                  <label>Message to Transmit</label>
                  <textarea
                    value={config.plaintext}
                    onChange={(e) => handleConfigChange('plaintext', e.target.value.toUpperCase())}
                    className="cyber-textarea"
                    rows="2"
                    placeholder="Enter message to transmit..."
                  />
                </div>
                <div className="input-group">
                  <label>Encryption Key</label>
                  <input
                    type="text"
                    value={config.key}
                    onChange={(e) => handleConfigChange('key', e.target.value.toUpperCase())}
                    className="cyber-input"
                    placeholder="Enter encryption key..."
                  />
                </div>
              </div>
            </div>

            <div className="config-section routing">
              <div className="section-header">
                <FiTarget className="section-icon" />
                <h4>Routing Layer</h4>
              </div>
              <div className="config-inputs">
                <div className="input-row">
                  <div className="input-group">
                    <label>Source Node</label>
                    <select
                      value={config.source_node}
                      onChange={(e) => handleConfigChange('source_node', e.target.value)}
                      className="cyber-select"
                    >
                      {availableNodes.map(node => (
                        <option key={node} value={node}>Node {node}</option>
                      ))}
                    </select>
                  </div>
                  <div className="path-arrow">→</div>
                  <div className="input-group">
                    <label>Destination Node</label>
                    <select
                      value={config.destination_node}
                      onChange={(e) => handleConfigChange('destination_node', e.target.value)}
                      className="cyber-select"
                    >
                      {availableNodes.map(node => (
                        <option key={node} value={node}>Node {node}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="config-section transport">
              <div className="section-header">
                <FiActivity className="section-icon" />
                <h4>Transport Layer</h4>
              </div>
              <div className="config-inputs">
                <div className="input-group">
                  <label>Packet Loss Rate</label>
                  <div className="slider-container">
                    <input
                      type="range"
                      min="0"
                      max="0.5"
                      step="0.01"
                      value={config.packet_loss_rate}
                      onChange={(e) => handleConfigChange('packet_loss_rate', parseFloat(e.target.value))}
                      className="cyber-slider"
                    />
                    <span className="slider-value">{(config.packet_loss_rate * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <motion.button
            className="action-btn primary large"
            onClick={runFullSimulation}
            disabled={loading || !config.plaintext || !config.key}
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
                {simulationSteps[simulationStep] || 'Processing...'}
              </>
            ) : (
              <>
                <FiPlay /> Run Full Simulation
              </>
            )}
          </motion.button>

          {loading && (
            <div className="progress-container">
              <div className="progress-steps">
                {simulationSteps.map((step, index) => (
                  <motion.div
                    key={index}
                    className={`progress-step ${index <= simulationStep ? 'active' : ''} ${index < simulationStep ? 'completed' : ''}`}
                    initial={{ opacity: 0.3 }}
                    animate={{ 
                      opacity: index <= simulationStep ? 1 : 0.3,
                      scale: index === simulationStep ? 1.05 : 1
                    }}
                  >
                    <div className="step-indicator">
                      {index < simulationStep ? '✓' : index + 1}
                    </div>
                    <span className="step-text">{step}</span>
                  </motion.div>
                ))}
              </div>
              <div className="progress-bar">
                <motion.div
                  className="progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${((simulationStep + 1) / simulationSteps.length) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
        </div>

        {results && (
          <motion.div 
            className="simulation-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="results-header">
              <h3>Simulation Results</h3>
              <div className={`simulation-status ${results.success ? 'success' : 'failed'}`}>
                {results.success ? 'Success' : 'Failed'}
              </div>
            </div>

            <div className="results-overview">
              <div className="result-card encryption">
                <div className="card-header">
                  <FiShield />
                  <h4>Encryption</h4>
                </div>
                <div className="card-content">
                  <div className="result-item">
                    <span className="label">Original:</span>
                    <span className="value">{results.plaintext}</span>
                  </div>
                  <div className="result-item">
                    <span className="label">Encrypted:</span>
                    <span className="value encrypted">{results.encrypted_text}</span>
                  </div>
                  <div className="result-item">
                    <span className="label">Decrypted:</span>
                    <span className="value">{results.decrypted_text}</span>
                  </div>
                </div>
              </div>

              <div className="result-card routing">
                <div className="card-header">
                  <FiTarget />
                  <h4>Routing</h4>
                </div>
                <div className="card-content">
                  <div className="result-item">
                    <span className="label">Path:</span>
                    <div className="path-visualization">
                      {results.path && results.path.map((node, index) => (
                        <React.Fragment key={node}>
                          <span className="path-node">{node}</span>
                          {index < results.path.length - 1 && <span className="path-arrow">→</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  <div className="result-item">
                    <span className="label">Total Cost:</span>
                    <span className="value">{results.path_cost}</span>
                  </div>
                </div>
              </div>

              <div className="result-card transport">
                <div className="card-header">
                  <FiActivity />
                  <h4>TCP Transmission</h4>
                </div>
                <div className="card-content">
                  {results.tcp_results && (
                    <>
                      <div className="result-item">
                        <span className="label">Data Transmitted:</span>
                        <span className="value">
                          {results.tcp_results.data_transmitted} / {results.tcp_results.data_size} bytes
                        </span>
                      </div>
                      <div className="result-item">
                        <span className="label">Packets Lost:</span>
                        <span className="value">
                          {results.tcp_results.packets_lost} / {results.tcp_results.total_packets_sent}
                        </span>
                      </div>
                      <div className="result-item">
                        <span className="label">Time Steps:</span>
                        <span className="value">{results.tcp_results.time_steps}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {plotImage && (
              <div className="tcp-plot">
                <h4>TCP Congestion Window Evolution</h4>
                <div className="plot-container">
                  <img 
                    src={`data:image/png;base64,${plotImage}`} 
                    alt="TCP Reno Simulation Plot"
                    style={{ width: '100%', height: 'auto', borderRadius: '10px' }}
                  />
                </div>
              </div>
            )}

            <div className="simulation-summary">
              <h4>Simulation Summary</h4>
              <div className="summary-metrics">
                <div className="metric">
                  <span className="metric-label">Encryption Success:</span>
                  <span className={`metric-value ${results.encrypted_text ? 'success' : 'failed'}`}>
                    {results.encrypted_text ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Route Found:</span>
                  <span className={`metric-value ${results.path ? 'success' : 'failed'}`}>
                    {results.path ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Transmission Complete:</span>
                  <span className={`metric-value ${results.tcp_results?.transmission_complete ? 'success' : 'failed'}`}>
                    {results.tcp_results?.transmission_complete ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Overall Success:</span>
                  <span className={`metric-value ${results.success ? 'success' : 'failed'}`}>
                    {results.success ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SimulationTab;
