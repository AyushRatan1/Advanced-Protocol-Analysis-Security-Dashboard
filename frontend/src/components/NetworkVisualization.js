import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiRefreshCw, FiSave, FiDownload, FiGrid, FiActivity } from 'react-icons/fi';
import axios from 'axios';
import './NetworkVisualization.css';
import predefinedTopologies from '../topologies';

const NetworkVisualization = () => {
  const [currentTopology, setCurrentTopology] = useState('linear');
  const [networkData, setNetworkData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(false);
  const [animationPaused, setAnimationPaused] = useState(false);

  useEffect(() => {
    loadTopology(currentTopology);
  }, [currentTopology]);

  const loadTopology = async (topologyKey) => {
    setLoading(true);
    try {
      const topology = predefinedTopologies[topologyKey];
      const networkData = {
        nodes: topology.nodes,
        links: topology.links
      };
      
      setNetworkData(networkData);
      
      // Send to backend
      await axios.post('/api/network/load-topology', {
        topology: topologyKey,
        data: networkData
      });
      
    } catch (error) {
      console.error('Error loading topology:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCurrentNetwork = async () => {
    try {
      await axios.post('/api/network/save', networkData);
    } catch (error) {
      console.error('Error saving network:', error);
    }
  };

  const refreshNetwork = () => {
    loadTopology(currentTopology);
  };

  const getCurrentTopologyInfo = () => {
    return predefinedTopologies[currentTopology];
  };

  const renderNetwork = () => {
    if (!networkData.nodes.length) return null;

    const svgWidth = 800;
    const svgHeight = 400;

    return (
      <svg width={svgWidth} height={svgHeight} className="network-svg">
        {/* Grid Background */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Links */}
        {networkData.links.map((link, index) => {
          const sourceNode = networkData.nodes.find(n => n.id === link.source);
          const targetNode = networkData.nodes.find(n => n.id === link.target);
          
          if (!sourceNode || !targetNode) return null;
          
          return (
            <g key={`link-${index}`}>
              <motion.line
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke="rgba(0, 212, 255, 0.8)"
                strokeWidth="3"
                className="network-link"
                initial={{ strokeDasharray: "5,5", strokeDashoffset: 10 }}
                animate={!animationPaused ? { 
                  strokeDashoffset: [10, 0],
                  stroke: ["rgba(0, 212, 255, 0.8)", "rgba(255, 107, 107, 0.8)", "rgba(0, 212, 255, 0.8)"]
                } : {}}
                transition={{ 
                  strokeDashoffset: { duration: 2, repeat: Infinity, ease: "linear" },
                  stroke: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                }}
              />
              {/* Cost Label */}
              <text
                x={(sourceNode.x + targetNode.x) / 2}
                y={(sourceNode.y + targetNode.y) / 2 - 10}
                fill="rgba(255, 230, 109, 0.9)"
                fontSize="12"
                fontWeight="600"
                textAnchor="middle"
                className="cost-label"
              >
                {link.cost}
              </text>
            </g>
          );
        })}
        
        {/* Nodes */}
        {networkData.nodes.map((node, index) => (
          <g key={`node-${node.id}`}>
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="25"
              fill="url(#nodeGradient)"
              stroke="rgba(0, 212, 255, 0.8)"
              strokeWidth="3"
              className="network-node"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.1 }}
            />
            <text
              x={node.x}
              y={node.y + 5}
              fill="white"
              fontSize="14"
              fontWeight="700"
              textAnchor="middle"
              className="node-label"
            >
              {node.id}
            </text>
            
            {/* Connection count indicator */}
            <circle
              cx={node.x + 20}
              cy={node.y - 20}
              r="8"
              fill="rgba(255, 107, 107, 0.8)"
              stroke="white"
              strokeWidth="2"
            />
            <text
              x={node.x + 20}
              y={node.y - 16}
              fill="white"
              fontSize="10"
              fontWeight="600"
              textAnchor="middle"
            >
              {node.connections.length}
            </text>
          </g>
        ))}
        
        {/* Gradient Definitions */}
        <defs>
          <radialGradient id="nodeGradient" cx="30%" cy="30%">
            <stop offset="0%" stopColor="rgba(0, 212, 255, 0.3)" />
            <stop offset="100%" stopColor="rgba(0, 150, 180, 0.8)" />
          </radialGradient>
        </defs>
      </svg>
    );
  };

  const topologyInfo = getCurrentTopologyInfo();

  return (
    <div className="network-visualization">
      <div className="network-header">
        <div className="header-content">
          <h2>Network Topology Selection</h2>
          <p>Choose from professionally designed network topologies</p>
        </div>
        <div className="header-controls">
          <motion.button
            className="control-btn secondary"
            onClick={() => setAnimationPaused(!animationPaused)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiActivity /> {animationPaused ? 'Resume' : 'Pause'} Animation
          </motion.button>
          <motion.button
            className="control-btn secondary"
            onClick={refreshNetwork}
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiRefreshCw /> Refresh
          </motion.button>
          <motion.button
            className="control-btn primary"
            onClick={saveCurrentNetwork}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiSave /> Save Network
          </motion.button>
        </div>
      </div>

      <div className="topology-selector">
        <h3><FiGrid /> Available Topologies</h3>
        <div className="topology-grid">
          {Object.entries(predefinedTopologies).map(([key, topology]) => (
            <motion.div
              key={key}
              className={`topology-card ${currentTopology === key ? 'active' : ''}`}
              onClick={() => setCurrentTopology(key)}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="topology-preview">
                <div className={`preview-icon ${key}`}>
                  {key === 'linear' && '━━━━'}
                  {key === 'star' && '✦'}
                  {key === 'mesh' && '⬢'}
                  {key === 'tree' && '🌳'}
                </div>
              </div>
              <div className="topology-info">
                <h4>{topology.name}</h4>
                <p>{topology.description}</p>
                <div className="topology-stats">
                  <span className="stat">
                    <strong>{topology.nodes.length}</strong> nodes
                  </span>
                  <span className="stat">
                    <strong>{topology.links.length}</strong> links
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="network-display">
        <div className="display-header">
          <div className="current-topology-info">
            <h3>{topologyInfo.name}</h3>
            <p>{topologyInfo.description}</p>
          </div>
          <div className="network-stats">
            <div className="stat-item">
              <span className="stat-value">{networkData.nodes.length}</span>
              <span className="stat-label">Nodes</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{networkData.links.length}</span>
              <span className="stat-label">Links</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {networkData.nodes.reduce((acc, node) => acc + node.connections.length, 0) / 2}
              </span>
              <span className="stat-label">Avg Degree</span>
            </div>
          </div>
        </div>
        
        <div className="network-canvas">
          {loading ? (
            <div className="loading-state">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <FiRefreshCw size={48} />
              </motion.div>
              <h3>Loading Network Topology...</h3>
              <p>Preparing {topologyInfo.name}</p>
            </div>
          ) : (
            renderNetwork()
          )}
        </div>
      </div>

      <div className="network-info-panel">
        <h3>Network Properties</h3>
        <div className="info-grid">
          <div className="info-card">
            <h4>Topology Type</h4>
            <p>{topologyInfo.name}</p>
          </div>
          <div className="info-card">
            <h4>Use Cases</h4>
            <p>
              {currentTopology === 'linear' && 'Basic routing, simple networks'}
              {currentTopology === 'star' && 'Centralized systems, hub networks'}
              {currentTopology === 'mesh' && 'High availability, redundant paths'}
              {currentTopology === 'tree' && 'Hierarchical systems, enterprise networks'}
            </p>
          </div>
          <div className="info-card">
            <h4>Complexity</h4>
            <p>
              {currentTopology === 'linear' && 'Low - Simple chain structure'}
              {currentTopology === 'star' && 'Medium - Central hub dependency'}
              {currentTopology === 'mesh' && 'High - Multiple interconnections'}
              {currentTopology === 'tree' && 'Medium - Hierarchical structure'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkVisualization;
