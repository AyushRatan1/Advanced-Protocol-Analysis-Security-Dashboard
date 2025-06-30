const predefinedTopologies = {
  linear: {
    name: "Linear Network",
    description: "Simple chain topology - best for step-by-step routing demonstrations",
    nodes: [
      { id: 'A', x: 150, y: 200, connections: ['B'] },
      { id: 'B', x: 300, y: 200, connections: ['A', 'C'] },
      { id: 'C', x: 450, y: 200, connections: ['B', 'D'] },
      { id: 'D', x: 600, y: 200, connections: ['C'] }
    ],
    links: [
      { source: 'A', target: 'B', cost: 1 },
      { source: 'B', target: 'C', cost: 1 },
      { source: 'C', target: 'D', cost: 1 }
    ]
  },
  star: {
    name: "Star Network",
    description: "Central hub topology - demonstrates centralized routing",
    nodes: [
      { id: 'Hub', x: 375, y: 200, connections: ['A', 'B', 'C', 'D', 'E'] },
      { id: 'A', x: 375, y: 100, connections: ['Hub'] },
      { id: 'B', x: 500, y: 150, connections: ['Hub'] },
      { id: 'C', x: 500, y: 250, connections: ['Hub'] },
      { id: 'D', x: 375, y: 300, connections: ['Hub'] },
      { id: 'E', x: 250, y: 250, connections: ['Hub'] }
    ],
    links: [
      { source: 'Hub', target: 'A', cost: 1 },
      { source: 'Hub', target: 'B', cost: 2 },
      { source: 'Hub', target: 'C', cost: 1 },
      { source: 'Hub', target: 'D', cost: 2 },
      { source: 'Hub', target: 'E', cost: 1 }
    ]
  },
  mesh: {
    name: "Mesh Network",
    description: "Interconnected topology - multiple paths for redundancy",
    nodes: [
      { id: 'A', x: 200, y: 150, connections: ['B', 'C', 'D'] },
      { id: 'B', x: 400, y: 150, connections: ['A', 'C', 'E'] },
      { id: 'C', x: 300, y: 250, connections: ['A', 'B', 'D', 'E'] },
      { id: 'D', x: 200, y: 350, connections: ['A', 'C', 'E'] },
      { id: 'E', x: 400, y: 350, connections: ['B', 'C', 'D'] }
    ],
    links: [
      { source: 'A', target: 'B', cost: 3 },
      { source: 'A', target: 'C', cost: 2 },
      { source: 'A', target: 'D', cost: 4 },
      { source: 'B', target: 'C', cost: 1 },
      { source: 'B', target: 'E', cost: 2 },
      { source: 'C', target: 'D', cost: 1 },
      { source: 'C', target: 'E', cost: 3 },
      { source: 'D', target: 'E', cost: 2 }
    ]
  },
  tree: {
    name: "Tree Network",
    description: "Hierarchical topology - simulates enterprise network structure",
    nodes: [
      { id: 'Root', x: 375, y: 100, connections: ['L1A', 'L1B'] },
      { id: 'L1A', x: 250, y: 200, connections: ['Root', 'L2A', 'L2B'] },
      { id: 'L1B', x: 500, y: 200, connections: ['Root', 'L2C', 'L2D'] },
      { id: 'L2A', x: 150, y: 300, connections: ['L1A'] },
      { id: 'L2B', x: 350, y: 300, connections: ['L1A'] },
      { id: 'L2C', x: 450, y: 300, connections: ['L1B'] },
      { id: 'L2D', x: 600, y: 300, connections: ['L1B'] }
    ],
    links: [
      { source: 'Root', target: 'L1A', cost: 1 },
      { source: 'Root', target: 'L1B', cost: 1 },
      { source: 'L1A', target: 'L2A', cost: 2 },
      { source: 'L1A', target: 'L2B', cost: 1 },
      { source: 'L1B', target: 'L2C', cost: 1 },
      { source: 'L1B', target: 'L2D', cost: 3 }
    ]
  }
};

export default predefinedTopologies; 