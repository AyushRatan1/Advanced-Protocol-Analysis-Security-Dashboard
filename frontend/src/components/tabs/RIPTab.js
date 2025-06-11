import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTarget, FiRefreshCw, FiMapPin, FiPlay } from 'react-icons/fi';
import axios from 'axios';
import './RIPTab.css';

const RIPTab = () => {
  const [networkData, setNetworkData] = useState({ nodes: [], links: [] });
  const [sourceNode, setSourceNode] = useState('A');
  const [destNode, setDestNode] = useState('F');
  const [shortestPath, setShortestPath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    fetchNetworkData();
  }, []);

  const fetchNetworkData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/rip/network');
      if (response.data.success) {
        setNetworkData(response.data);
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

  const availableNodes = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="rip-tab">
      <div className="tab-header">
        <div className="header-content">
          <h2>RIP Routing Protocol</h2>
          <p>Routing Information Protocol - Distance Vector Algorithm</p>
        </div>
        <div className="header-actions">
          <motion.button
            className="action-btn secondary"
            onClick={fetchNetworkData}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
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
        <div className="routing-section">
          <div className="path-finder">
            <h3>Find Shortest Path</h3>
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
                  {availableNodes.map(node => (
                    <option key={node} value={node}>Node {node}</option>
                  ))}
                </select>
              </div>

              <motion.button
                className="action-btn primary"
                onClick={findShortestPath}
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
                          transition={{ delay: index * 0.1 + 0.05 }}
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

          <div className="network-topology">
            <h3>Network Topology</h3>
            <div className="topology-grid">
              {networkData.links.map((link, index) => (
                <motion.div
                  key={`${link.source}-${link.target}`}
                  className="link-info"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="link-nodes">
                    <span className="node">{link.source}</span>
                    <span className="connector">↔</span>
                    <span className="node">{link.target}</span>
                  </div>
                  <div className="link-distance">
                    Distance: <strong>{link.distance}</strong>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="routing-tables">
          <h3>Routing Tables</h3>
          <div className="tables-grid">
            {networkData.nodes.map((node, index) => (
              <motion.div
                key={node.id}
                className={`routing-table ${selectedNode === node.id ? 'active' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
              >
                <div className="table-header">
                  <h4>Node {node.id}</h4>
                  <div className="node-stats">
                    <span>{node.neighbors.length} neighbors</span>
                  </div>
                </div>
                
                <div className="table-content">
                  <table>
                    <thead>
                      <tr>
                        <th>Dest</th>
                        <th>Next Hop</th>
                        <th>Distance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(node.routing_table).map(([dest, info]) => (
                        <tr key={dest} className={dest === node.id ? 'self-row' : ''}>
                          <td className="dest-cell">{dest}</td>
                          <td className="hop-cell">{info.next_hop || '-'}</td>
                          <td className="distance-cell">
                            <span className={`distance ${info.distance === 0 ? 'self' : info.distance === -1 ? 'infinite' : 'normal'}`}>
                              {info.distance === -1 ? '∞' : info.distance}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="neighbors-info">
                  <strong>Direct Neighbors:</strong>
                  <div className="neighbors-list">
                    {node.neighbors.map(neighbor => (
                      <span key={neighbor} className="neighbor-tag">{neighbor}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="rip-info">
        <h3>RIP Algorithm Overview</h3>
        <div className="info-cards">
          <div className="info-card">
            <h4>Distance Vector</h4>
            <p>Each node maintains a routing table with the distance to every other node in the network.</p>
          </div>
          <div className="info-card">
            <h4>Bellman-Ford</h4>
            <p>Uses the Bellman-Ford algorithm to find shortest paths and detect routing loops.</p>
          </div>
          <div className="info-card">
            <h4>Periodic Updates</h4>
            <p>Nodes periodically share their distance vectors with immediate neighbors.</p>
          </div>
          <div className="info-card">
            <h4>Convergence</h4>
            <p>The network converges to optimal routing paths after several update iterations.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RIPTab;
