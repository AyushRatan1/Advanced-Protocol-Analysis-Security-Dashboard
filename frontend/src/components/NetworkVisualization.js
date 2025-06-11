import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiPlay, FiPause, FiSettings } from 'react-icons/fi';
import axios from 'axios';
import './NetworkVisualization.css';

const NetworkVisualization = () => {
  const canvasRef = useRef(null);
  const [networkData, setNetworkData] = useState({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Network positions for nodes A-F
  const nodePositions = {
    'A': { x: 150, y: 200 },
    'B': { x: 300, y: 150 },
    'C': { x: 150, y: 350 },
    'D': { x: 400, y: 250 },
    'E': { x: 300, y: 400 },
    'F': { x: 550, y: 300 }
  };

  useEffect(() => {
    fetchNetworkData();
  }, []);

  useEffect(() => {
    if (networkData.nodes.length > 0) {
      drawNetwork();
    }
  }, [networkData, selectedNode, isAnimating]);

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

  const drawNetwork = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.fillStyle = 'rgba(10, 10, 15, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid(ctx, canvas.width, canvas.height);

    // Draw links first (so they appear behind nodes)
    networkData.links.forEach(link => {
      drawLink(ctx, link);
    });

    // Draw nodes
    networkData.nodes.forEach(node => {
      drawNode(ctx, node);
    });

    // Draw node labels
    networkData.nodes.forEach(node => {
      drawNodeLabel(ctx, node);
    });
  };

  const drawGrid = (ctx, width, height) => {
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let x = 0; x < width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    for (let y = 0; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  const drawLink = (ctx, link) => {
    const sourcePos = nodePositions[link.source];
    const targetPos = nodePositions[link.target];
    
    if (!sourcePos || !targetPos) return;

    ctx.strokeStyle = selectedNode === link.source || selectedNode === link.target 
      ? '#00d4ff' : 'rgba(0, 212, 255, 0.4)';
    ctx.lineWidth = selectedNode === link.source || selectedNode === link.target ? 3 : 2;
    
    // Draw animated line
    ctx.beginPath();
    ctx.moveTo(sourcePos.x, sourcePos.y);
    ctx.lineTo(targetPos.x, targetPos.y);
    ctx.stroke();

    // Draw distance label
    const midX = (sourcePos.x + targetPos.x) / 2;
    const midY = (sourcePos.y + targetPos.y) / 2;
    
    ctx.fillStyle = '#ffe66d';
    ctx.font = '12px JetBrains Mono';
    ctx.textAlign = 'center';
    ctx.fillText(link.distance.toString(), midX, midY - 5);

    // Draw data flow animation
    if (isAnimating) {
      drawDataFlow(ctx, sourcePos, targetPos);
    }
  };

  const drawDataFlow = (ctx, source, target) => {
    const time = Date.now() * 0.003;
    const progress = (Math.sin(time) + 1) / 2;
    
    const x = source.x + (target.x - source.x) * progress;
    const y = source.y + (target.y - source.y) * progress;
    
    ctx.fillStyle = '#4ecdc4';
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowColor = '#4ecdc4';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  const drawNode = (ctx, node) => {
    const pos = nodePositions[node.id];
    if (!pos) return;

    const isSelected = selectedNode === node.id;
    const time = Date.now() * 0.002;
    const pulse = Math.sin(time) * 0.1 + 1;

    // Draw node glow
    if (isSelected || isAnimating) {
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 20 * pulse;
    }

    // Draw main node
    ctx.fillStyle = isSelected ? '#00d4ff' : '#ff6b6b';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, isSelected ? 25 * pulse : 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw inner circle
    ctx.fillStyle = isSelected ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, isSelected ? 15 : 12, 0, Math.PI * 2);
    ctx.fill();

    // Draw node border
    ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, isSelected ? 25 * pulse : 20, 0, Math.PI * 2);
    ctx.stroke();
  };

  const drawNodeLabel = (ctx, node) => {
    const pos = nodePositions[node.id];
    if (!pos) return;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(node.id, pos.x, pos.y + 5);
  };

  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if click is on a node
    let clickedNode = null;
    for (const node of networkData.nodes) {
      const pos = nodePositions[node.id];
      if (pos) {
        const distance = Math.sqrt((x - pos.x) ** 2 + (y - pos.y) ** 2);
        if (distance <= 25) {
          clickedNode = node.id;
          break;
        }
      }
    }

    setSelectedNode(clickedNode);
  };

  const getSelectedNodeInfo = () => {
    if (!selectedNode) return null;
    return networkData.nodes.find(node => node.id === selectedNode);
  };

  if (loading) {
    return (
      <div className="network-loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <FiRefreshCw size={40} />
        </motion.div>
        <p>Loading network topology...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="network-error">
        <p>Error: {error}</p>
        <button onClick={fetchNetworkData} className="retry-button">
          <FiRefreshCw /> Retry
        </button>
      </div>
    );
  }

  const selectedNodeInfo = getSelectedNodeInfo();

  return (
    <div className="network-visualization">
      <div className="network-header">
        <h2>Network Topology Overview</h2>
        <div className="network-controls">
          <motion.button
            className={`control-button ${isAnimating ? 'active' : ''}`}
            onClick={() => setIsAnimating(!isAnimating)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isAnimating ? <FiPause /> : <FiPlay />}
          </motion.button>
          <motion.button
            className="control-button"
            onClick={fetchNetworkData}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiRefreshCw />
          </motion.button>
          <motion.button
            className="control-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiSettings />
          </motion.button>
        </div>
      </div>

      <div className="network-content">
        <div className="network-canvas-container">
          <canvas
            ref={canvasRef}
            className="network-canvas"
            onClick={handleCanvasClick}
          />
        </div>

        <div className="network-sidebar">
          <div className="network-stats">
            <h3>Network Statistics</h3>
            <div className="stat-grid">
              <div className="stat-box">
                <span className="stat-value">{networkData.nodes.length}</span>
                <span className="stat-label">Nodes</span>
              </div>
              <div className="stat-box">
                <span className="stat-value">{networkData.links.length}</span>
                <span className="stat-label">Links</span>
              </div>
            </div>
          </div>

          {selectedNodeInfo && (
            <motion.div
              className="node-details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3>Node {selectedNodeInfo.id} Details</h3>
              <div className="node-info">
                <p><strong>Neighbors:</strong> {selectedNodeInfo.neighbors.join(', ')}</p>
                <div className="routing-table">
                  <h4>Routing Table</h4>
                  <div className="table-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Dest</th>
                          <th>Next Hop</th>
                          <th>Distance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(selectedNodeInfo.routing_table).map(([dest, info]) => (
                          <tr key={dest}>
                            <td>{dest}</td>
                            <td>{info.next_hop || '-'}</td>
                            <td>{info.distance === -1 ? '∞' : info.distance}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkVisualization;
