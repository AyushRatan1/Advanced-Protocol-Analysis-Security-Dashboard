import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlay, FiRefreshCw, FiActivity, FiBarChart2, FiClock, FiSettings, FiWifi, FiNavigation } from 'react-icons/fi';
import axios from 'axios';
import predefinedTopologies from '../../topologies';
import './TCPTab.css';

const TCPTab = () => {
  const [simulationResults, setSimulationResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [graphImage, setGraphImage] = useState(null);
  const [availableNodes, setAvailableNodes] = useState([]);
  const [networkStats, setNetworkStats] = useState({});
  const [selectedTopology, setSelectedTopology] = useState('linear');
  
  // Form state
  const [formData, setFormData] = useState({
    sourceNode: 'A',
    destinationNode: 'B',
    dataSize: 50000,
    mss: 1460,
    initialCwnd: 1,
    ssthresh: 32,
    packetLossRate: 0.05,
    maxTime: 100
  });

  useEffect(() => {
    fetchNetworkData();
  }, []);

  const fetchNetworkData = async () => {
    try {
      const response = await axios.get('/api/network/topology');
      if (response.data.success && response.data.nodes) {
        setAvailableNodes(response.data.nodes);
        
        if (response.data.nodes.length > 0) {
          setFormData(prev => ({
            ...prev,
            sourceNode: response.data.nodes[0].id,
            destinationNode: response.data.nodes.length > 1 ? response.data.nodes[1].id : response.data.nodes[0].id
          }));
        }

        // Calculate network statistics
        const stats = {
          totalNodes: response.data.nodes.length,
          totalLinks: response.data.links.length,
          avgDegree: response.data.nodes.length > 0 
            ? (response.data.nodes.reduce((acc, node) => acc + node.connections.length, 0) / response.data.nodes.length).toFixed(1)
            : 0,
          maxDistance: response.data.links.length > 0 
            ? Math.max(...response.data.links.map(link => link.cost))
            : 0
        };
        setNetworkStats(stats);
      }
    } catch (error) {
      console.error('Error fetching network data:', error);
      setError('Failed to load network topology. Please ensure a network is configured.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Rate') || name.includes('Loss') ? parseFloat(value) : 
              name === 'sourceNode' || name === 'destinationNode' ? value :
              parseInt(value)
    }));
  };

  const handleTopologyChange = async (e) => {
    const key = e.target.value;
    setSelectedTopology(key);
    const topo = predefinedTopologies[key];
    if (topo) {
      try {
        await axios.post('/api/network/load-topology', {
          topology: key,
          data: {
            nodes: topo.nodes,
            links: topo.links
          }
        });
        await fetchNetworkData();
      } catch (err) {
        console.error('Error switching topology', err);
      }
    }
  };

  const runSimulation = async () => {
    if (!availableNodes.length) {
      setError('No network topology available. Please configure a network first.');
      return;
    }

    setLoading(true);
    setError(null);
    setSimulationResults(null);
    setGraphImage(null);

    try {
      const response = await axios.post('/api/tcp/simulate', {
        data_size: formData.dataSize,
        mss: formData.mss,
        initial_cwnd: formData.initialCwnd,
        ssthresh: formData.ssthresh,
        packet_loss_rate: formData.packetLossRate,
        max_time: formData.maxTime
      });

      if (response.data.success) {
        setSimulationResults(response.data.results);
        setGraphImage(response.data.plot);
      } else {
        setError(response.data.error || 'Simulation failed');
      }
    } catch (error) {
      console.error('Error running TCP simulation:', error);
      setError('Failed to run TCP simulation. Please check your parameters.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      sourceNode: availableNodes.length > 0 ? availableNodes[0].id : 'A',
      destinationNode: availableNodes.length > 1 ? availableNodes[1].id : 'B',
      dataSize: 50000,
      mss: 1460,
      initialCwnd: 1,
      ssthresh: 32,
      packetLossRate: 0.05,
      maxTime: 100
    });
    setSimulationResults(null);
    setGraphImage(null);
    setError(null);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
  };

  return (
    <div className="tcp-tab">
      <div className="tab-header">
        <div className="header-content">
          <h2>TCP Reno Simulation</h2>
          <p>Analyze congestion control behavior over your network topology</p>
        </div>
        <div className="header-controls">
          <select value={selectedTopology} onChange={handleTopologyChange} className="cyber-select" style={{ marginRight: '16px' }}>
            {Object.entries(predefinedTopologies).map(([k, t]) => (
              <option key={k} value={k}>{t.name}</option>
            ))}
          </select>
          <motion.button
            className="control-btn secondary"
            onClick={fetchNetworkData}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiRefreshCw /> Refresh Network
          </motion.button>
        </div>
      </div>

      {availableNodes.length === 0 ? (
        <div className="empty-network">
          <FiWifi size={48} />
          <h3>No Network Topology Found</h3>
          <p>Please create a network in the Network Overview tab first.</p>
          <motion.button
            className="action-btn primary"
            onClick={fetchNetworkData}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiRefreshCw /> Retry
          </motion.button>
        </div>
      ) : (
        <div className="tcp-content">
          {/* Network Status */}
          <div className="network-status-section">
            <h3><FiActivity /> Network Status</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <FiWifi />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{networkStats.totalNodes}</span>
                  <span className="stat-label">Nodes</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <FiBarChart2 />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{networkStats.totalLinks}</span>
                  <span className="stat-label">Links</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <FiActivity />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{networkStats.avgDegree}</span>
                  <span className="stat-label">Avg Degree</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <FiClock />
                </div>
                <div className="stat-info">
                  <span className="stat-value">{networkStats.maxDistance}</span>
                  <span className="stat-label">Max Cost</span>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Panel */}
          <div className="configuration-section">
            <h3><FiSettings /> TCP Configuration</h3>
            <div className="config-grid">
              <div className="config-group">
                <h4>Network Configuration</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Source Node</label>
                    <select
                      name="sourceNode"
                      value={formData.sourceNode}
                      onChange={handleInputChange}
                    >
                      {availableNodes.map(node => (
                        <option key={node.id} value={node.id}>{node.id}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Destination Node</label>
                    <select
                      name="destinationNode"
                      value={formData.destinationNode}
                      onChange={handleInputChange}
                    >
                      {availableNodes.map(node => (
                        <option key={node.id} value={node.id}>{node.id}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="config-group">
                <h4>Data Transmission</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Data Size (bytes)</label>
                    <input
                      type="range"
                      name="dataSize"
                      min="1000"
                      max="1000000"
                      step="1000"
                      value={formData.dataSize}
                      onChange={handleInputChange}
                    />
                    <span className="range-value">{formatBytes(formData.dataSize)}</span>
                  </div>
                  <div className="form-group">
                    <label>MSS (bytes)</label>
                    <input
                      type="range"
                      name="mss"
                      min="500"
                      max="9000"
                      step="100"
                      value={formData.mss}
                      onChange={handleInputChange}
                    />
                    <span className="range-value">{formData.mss}</span>
                  </div>
                </div>
              </div>

              <div className="config-group">
                <h4>TCP Parameters</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Initial CWND</label>
                    <input
                      type="range"
                      name="initialCwnd"
                      min="1"
                      max="10"
                      value={formData.initialCwnd}
                      onChange={handleInputChange}
                    />
                    <span className="range-value">{formData.initialCwnd} MSS</span>
                  </div>
                  <div className="form-group">
                    <label>SS Threshold</label>
                    <input
                      type="range"
                      name="ssthresh"
                      min="2"
                      max="100"
                      value={formData.ssthresh}
                      onChange={handleInputChange}
                    />
                    <span className="range-value">{formData.ssthresh} MSS</span>
                  </div>
                </div>
              </div>

              <div className="config-group">
                <h4>Network Conditions</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Packet Loss Rate</label>
                    <input
                      type="range"
                      name="packetLossRate"
                      min="0"
                      max="0.5"
                      step="0.01"
                      value={formData.packetLossRate}
                      onChange={handleInputChange}
                    />
                    <span className="range-value">{(formData.packetLossRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="form-group">
                    <label>Max Simulation Time</label>
                    <input
                      type="range"
                      name="maxTime"
                      min="10"
                      max="200"
                      value={formData.maxTime}
                      onChange={handleInputChange}
                    />
                    <span className="range-value">{formData.maxTime} RTTs</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="action-buttons">
              <motion.button
                className="action-btn primary"
                onClick={runSimulation}
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.05 }}
                whileTap={{ scale: loading ? 1 : 0.95 }}
              >
                {loading ? <FiRefreshCw className="spin" /> : <FiPlay />}
                {loading ? 'Running Simulation...' : 'Start Simulation'}
              </motion.button>
              <motion.button
                className="action-btn secondary"
                onClick={resetForm}
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.05 }}
                whileTap={{ scale: loading ? 1 : 0.95 }}
              >
                Reset
              </motion.button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <motion.div 
              className="error-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <FiActivity />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Results Section */}
          {simulationResults && (
            <motion.div 
              className="results-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
                             <h3><FiBarChart2 /> Simulation Results</h3>
              
              {/* Statistics Cards */}
              <div className="results-stats">
                <div className="result-card">
                  <div className="result-icon">
                    <FiActivity />
                  </div>
                  <div className="result-info">
                    <h4>Throughput</h4>
                    <p>{formatBytes(simulationResults.data_transmitted)} / {formatBytes(simulationResults.data_size)}</p>
                    <span className="result-percentage">
                      {((simulationResults.data_transmitted / simulationResults.data_size) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                <div className="result-card">
                  <div className="result-icon">
                    <FiClock />
                  </div>
                  <div className="result-info">
                    <h4>Time Taken</h4>
                    <p>{simulationResults.time_taken} RTTs</p>
                    <span className="result-percentage">
                      {formatTime(simulationResults.time_taken * 0.1)}
                    </span>
                  </div>
                </div>
                
                <div className="result-card">
                  <div className="result-icon">
                    <FiWifi />
                  </div>
                  <div className="result-info">
                    <h4>Packet Loss Events</h4>
                    <p>{simulationResults.packet_loss_events} events</p>
                    <span className="result-percentage">
                      {simulationResults.total_packets_sent > 0 
                        ? ((simulationResults.packets_lost / simulationResults.total_packets_sent) * 100).toFixed(2)
                        : '0'}% rate
                    </span>
                  </div>
                </div>
                
                                 <div className="result-card">
                   <div className="result-icon">
                     <FiBarChart2 />
                   </div>
                  <div className="result-info">
                    <h4>Final CWND</h4>
                    <p>{simulationResults.final_cwnd.toFixed(2)} MSS</p>
                    <span className="result-percentage">
                      SS Thresh: {simulationResults.final_ssthresh}
                    </span>
                  </div>
                </div>
              </div>

              {/* Graph Display */}
              {graphImage && (
                <div className="graph-container">
                  <h4>Congestion Window Timeline</h4>
                  <div className="graph-wrapper">
                    <img 
                      src={graphImage} 
                      alt="TCP Reno Simulation Graph" 
                      className="tcp-graph"
                    />
                  </div>
                </div>
              )}
              
              <div className="simulation-summary">
                <h4>Summary</h4>
                <div className="summary-grid">
                  <div className="summary-item">
                    <strong>Transmission Status:</strong>
                    <span className={simulationResults.transmission_complete ? 'success' : 'warning'}>
                      {simulationResults.transmission_complete ? 'Complete' : 'Incomplete'}
                    </span>
                  </div>
                  <div className="summary-item">
                    <strong>Total Packets Sent:</strong>
                    <span>{simulationResults.total_packets_sent.toLocaleString()}</span>
                  </div>
                  <div className="summary-item">
                    <strong>Packets Lost:</strong>
                    <span>{simulationResults.packets_lost}</span>
                  </div>
                  <div className="summary-item">
                    <strong>Data Transmitted:</strong>
                    <span>{formatBytes(simulationResults.data_transmitted)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default TCPTab;
