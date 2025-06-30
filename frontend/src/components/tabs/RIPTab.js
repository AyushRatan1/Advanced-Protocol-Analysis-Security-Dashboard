import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTarget, FiRefreshCw, FiMapPin, FiPlay, FiActivity, FiNavigation, FiGrid } from 'react-icons/fi';
import axios from 'axios';
import predefinedTopologies from '../../topologies';
import './RIPTab.css';

const RIPTab = () => {
  const [networkData, setNetworkData] = useState({ nodes: [], links: [] });
  const [sourceNode, setSourceNode] = useState('');
  const [destNode, setDestNode] = useState('');
  const [shortestPath, setShortestPath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedTopology, setSelectedTopology] = useState('linear');

  useEffect(() => {
    fetchNetworkData();
  }, []);

  useEffect(() => {
    // Set default source and destination when network data changes
    if (networkData?.nodes?.length > 0 && !sourceNode) {
      setSourceNode(networkData.nodes[0].id);
    }
    if (networkData?.nodes?.length > 1 && !destNode) {
      setDestNode(networkData.nodes[networkData.nodes.length - 1].id);
    }
  }, [networkData, sourceNode, destNode]);

  const fetchNetworkData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/network/topology');
      if (response.data.success) {
        setNetworkData(response.data);
        setError('');
      } else {
        setError('Failed to fetch network data');
      }
    } catch (err) {
      setError('Error connecting to API');
      console.error('Network fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const findShortestPath = async () => {
    if (!sourceNode || !destNode) {
      setError('Please select both source and destination nodes');
      return;
    }

    if (sourceNode === destNode) {
      setError('Source and destination cannot be the same');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/rip/shortest-path', {
        source: sourceNode,
        destination: destNode
      });

      if (response.data.success) {
        setShortestPath(response.data);
        setError('');
      } else {
        setError(response.data.error || 'Failed to find path');
      }
    } catch (err) {
      setError('Error connecting to API');
      console.error('Path finding error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getNodeInfo = (nodeId) => {
    return networkData.nodes.find(node => node.id === nodeId);
  };

  const getAvailableNodes = () => {
    return networkData?.nodes?.map(node => node.id).sort() || [];
  };

  const calculateNetworkStats = () => {
    const totalNodes = networkData?.nodes?.length || 0;
    const totalLinks = networkData?.links?.length || 0;
    const avgDegree = totalNodes > 0 ? (totalLinks * 2) / totalNodes : 0;
    const maxDistance = networkData?.links?.length > 0 
      ? Math.max(...networkData.links.map(l => l.distance || l.cost || 0)) 
      : 0;
    
    return { totalNodes, totalLinks, avgDegree: avgDegree.toFixed(1), maxDistance };
  };

  // When dropdown changes, load topology and refresh
  const handleTopologyChange = async (e) => {
    const topoKey = e.target.value;
    setSelectedTopology(topoKey);
    if (predefinedTopologies[topoKey]) {
      const data = predefinedTopologies[topoKey];
      const payload = {
        topology: topoKey,
        data: {
          nodes: data.nodes,
          links: data.links
        }
      };
      try {
        await axios.post('/api/network/load-topology', payload);
        await fetchNetworkData();
      } catch (err) {
        console.error('Error loading topology:', err);
      }
    }
  };

  // Simple network render (SVG similar to overview)
  const renderNetwork = () => {
    if (!networkData?.nodes?.length) return null;
    const svgWidth = 800;
    const svgHeight = 400;

    return (
      <svg width={svgWidth} height={svgHeight} className="network-svg">
        {/* Links */}
        {networkData.links.map((link, idx) => {
          const src = networkData.nodes.find((n) => n.id === link.source);
          const dst = networkData.nodes.find((n) => n.id === link.target);
          if (!src || !dst) return null;
          return (
            <g key={`link-${idx}`}>
              <line x1={src.x} y1={src.y} x2={dst.x} y2={dst.y} stroke="#00d4ff" strokeWidth="2" />
              <text x={(src.x + dst.x) / 2} y={(src.y + dst.y) / 2 - 8} fill="#ffe66d" fontSize="12" fontWeight="600" textAnchor="middle">
                {link.cost ?? link.distance ?? 1}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {networkData.nodes.map((node) => (
          <g key={node.id}>
            <circle cx={node.x} cy={node.y} r="20" fill="url(#gradNode)" stroke="#00d4ff" strokeWidth="2" />
            <text x={node.x} y={node.y + 5} fill="#ffffff" fontSize="14" fontWeight="700" textAnchor="middle">
              {node.id}
            </text>
          </g>
        ))}

        <defs>
          <radialGradient id="gradNode" cx="30%" cy="30%">
            <stop offset="0%" stopColor="rgba(0, 212, 255, 0.3)" />
            <stop offset="100%" stopColor="rgba(0, 150, 180, 0.8)" />
          </radialGradient>
        </defs>
      </svg>
    );
  };

  if (loading && (!networkData?.nodes || networkData.nodes.length === 0)) {
    return (
      <div className="rip-tab">
        <div className="loading-container">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="loading-spinner"
          >
            <FiRefreshCw size={40} />
          </motion.div>
          <p>Loading network data...</p>
        </div>
      </div>
    );
  }

  const availableNodes = getAvailableNodes();
  const stats = calculateNetworkStats();

  return (
    <div className="rip-tab">
      <div className="tab-header">
        <div className="header-content">
          <h2>RIP Routing Protocol</h2>
          <p>Routing Information Protocol - Distance Vector Algorithm</p>
        </div>
        <div className="header-actions">
          {/* Topology Selector */}
          <select value={selectedTopology} onChange={handleTopologyChange} className="cyber-select">
            {Object.entries(predefinedTopologies).map(([key, topo]) => (
              <option key={key} value={key}>{topo.name}</option>
            ))}
          </select>

          <motion.button
            className="action-btn secondary"
            onClick={fetchNetworkData}
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.05 }}
            whileTap={{ scale: loading ? 1 : 0.95 }}
          >
            <FiRefreshCw /> Refresh Network
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

      <div className="rip-content">
        {/* Network Statistics */}
        <div className="network-stats-section">
          <h3><FiActivity /> Network Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.totalNodes}</div>
              <div className="stat-label">Total Nodes</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.totalLinks}</div>
              <div className="stat-label">Total Links</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.avgDegree}</div>
              <div className="stat-label">Avg Degree</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.maxDistance}</div>
              <div className="stat-label">Max Distance</div>
            </div>
          </div>
        </div>

        {availableNodes.length === 0 ? (
          <div className="empty-network">
            <FiNavigation size={48} />
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
          <>
            <div className="routing-section">
              <div className="path-finder">
                <h3><FiNavigation /> Find Shortest Path</h3>
                <div className="path-controls">
                  <div className="node-selector">
                    <label>
                      <FiMapPin /> Source Node
                    </label>
                    <select
                      value={sourceNode}
                      onChange={(e) => setSourceNode(e.target.value)}
                      className="cyber-select"
                    >
                      <option value="">Select Source</option>
                      {availableNodes.map(node => (
                        <option key={node} value={node}>Node {node}</option>
                      ))}
                    </select>
                  </div>

                  <div className="path-arrow">
                    <FiTarget />
                  </div>

                  <div className="node-selector">
                    <label>
                      <FiTarget /> Destination Node
                    </label>
                    <select
                      value={destNode}
                      onChange={(e) => setDestNode(e.target.value)}
                      className="cyber-select"
                    >
                      <option value="">Select Destination</option>
                      {availableNodes.map(node => (
                        <option key={node} value={node}>Node {node}</option>
                      ))}
                    </select>
                  </div>

                  <motion.button
                    className="action-btn primary"
                    onClick={findShortestPath}
                    disabled={loading || !sourceNode || !destNode}
                    whileHover={{ scale: (loading || !sourceNode || !destNode) ? 1 : 1.05 }}
                    whileTap={{ scale: (loading || !sourceNode || !destNode) ? 1 : 0.95 }}
                  >
                    {loading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <FiRefreshCw />
                        </motion.div>
                        Finding...
                      </>
                    ) : (
                      <>
                        <FiPlay /> Find Path
                      </>
                    )}
                  </motion.button>
                </div>

                {shortestPath && (
                  <motion.div 
                    className="path-result"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="result-header">
                      <h4>Shortest Path Found</h4>
                      <div className="path-stats">
                        <span className="stat">
                          <strong>Hops:</strong> {shortestPath.path ? shortestPath.path.length - 1 : 0}
                        </span>
                        <span className="stat">
                          <strong>Total Cost:</strong> {shortestPath.cost}
                        </span>
                      </div>
                    </div>
                    <div className="path-visualization">
                      {shortestPath.path && shortestPath.path.map((node, index) => (
                        <React.Fragment key={node}>
                          <motion.div
                            className="path-node"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            {node}
                          </motion.div>
                          {index < shortestPath.path.length - 1 && (
                            <motion.div
                              className="path-arrow-viz"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: (index + 0.5) * 0.1 }}
                            >
                              →
                            </motion.div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Routing Tables */}
            <div className="routing-tables-section">
              <h3>Routing Tables</h3>
              <div className="tables-grid">
                {networkData?.nodes?.map((node, idx) => (
                  <motion.div 
                    key={node.id}
                    className={`routing-table-card ${selectedNode === node.id ? 'selected' : ''}`}
                    onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                    whileHover={{ scale: 1.02 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <div className="table-header">
                      <h4>Node {node.id}</h4>
                      <div className="node-connections">
                        {(node.neighbors ? node.neighbors.length : (node.connections ? node.connections.length : 0))} connections
                      </div>
                    </div>
                    <div className="routing-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Destination</th>
                            <th>Next Hop</th>
                            <th>Distance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(node.routing_table || {}).map(([dest, info]) => (
                            <tr key={dest} className={dest === node.id ? 'self-route' : ''}>
                              <td className="dest-cell">{dest}</td>
                              <td className="hop-cell">{info.next_hop || '-'}</td>
                              <td className="distance-cell">
                                {info.distance === -1 ? '∞' : info.distance}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RIPTab;
