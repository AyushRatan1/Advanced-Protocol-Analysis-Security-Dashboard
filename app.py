from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import base64
import io
import os
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
from playfair_cipher import encrypt, decrypt, display_matrix, prepare_key
from rip_simulator import RIPNetwork, create_sample_network
from tcp_reno_simulator import TCPRenoSimulator
from main import simulate_network_transmission
import logging

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global variable to store the current network
current_network = None
custom_network_data = None

# Global network state
current_network = {
    'nodes': [],
    'links': []
}

def ensure_network():
    """Ensure we have a network loaded"""
    global current_network, custom_network_data
    if current_network is None:
        load_sample_network()
    return current_network

def load_sample_network():
    """Load the default sample network"""
    global current_network, custom_network_data
    current_network = create_sample_network()
    current_network.initialize_routing_tables()
    current_network.simulate_rip()
    
    # Store default network data
    custom_network_data = {
        'nodes': [
            {'id': 'A', 'label': 'Node A', 'neighbors': []},
            {'id': 'B', 'label': 'Node B', 'neighbors': []},
            {'id': 'C', 'label': 'Node C', 'neighbors': []},
            {'id': 'D', 'label': 'Node D', 'neighbors': []},
            {'id': 'E', 'label': 'Node E', 'neighbors': []},
            {'id': 'F', 'label': 'Node F', 'neighbors': []}
        ],
        'links': [
            {'source': 'A', 'target': 'B', 'distance': 1},
            {'source': 'A', 'target': 'C', 'distance': 3},
            {'source': 'B', 'target': 'D', 'distance': 2},
            {'source': 'C', 'target': 'D', 'distance': 1},
            {'source': 'C', 'target': 'E', 'distance': 5},
            {'source': 'D', 'target': 'E', 'distance': 2},
            {'source': 'D', 'target': 'F', 'distance': 3},
            {'source': 'E', 'target': 'F', 'distance': 1}
        ],
        'positions': {
            'A': {'x': 150, 'y': 200},
            'B': {'x': 300, 'y': 150},
            'C': {'x': 150, 'y': 350},
            'D': {'x': 400, 'y': 250},
            'E': {'x': 300, 'y': 400},
            'F': {'x': 550, 'y': 300}
        }
    }

def create_network_from_data(network_data):
    """Create a RIPNetwork from custom data"""
    network = RIPNetwork()
    
    # Add all nodes
    for node_data in network_data['nodes']:
        network.add_node(node_data['id'])
    
    # Add all links (support both 'distance' and 'cost' keys)
    for link in network_data['links']:
        distance = link.get('distance', link.get('cost', 1))
        network.add_bidirectional_link(
            link['source'],
            link['target'],
            distance
        )
    
    return network

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "message": "DCN API is running"})

@app.route('/api/network/topology', methods=['GET'])
def get_network_topology():
    """Get the current network topology and routing information."""
    try:
        # If stored as dict, build a temporary RIP graph to compute routing tables.
        if isinstance(current_network, dict):
            graph = create_network_from_data(current_network)
            graph.initialize_routing_tables()
            graph.simulate_rip()

            # Preserve positions from original data, if any
            pos_lookup = {node['id']: node for node in current_network['nodes']}

            enriched_nodes = []
            for node_id, node_obj in graph.nodes.items():
                original = pos_lookup.get(node_id, {})
                enriched_nodes.append({
                    'id': node_id,
                    'neighbors': [{'id': n_id, 'distance': node_obj.neighbors[n_id]} for n_id in node_obj.neighbors],
                    'routing_table': node_obj.routing_table,
                    'x': original.get('x'),
                    'y': original.get('y')
                })

            return jsonify({
                'success': True,
                'nodes': enriched_nodes,
                'links': current_network['links']
            })
        else:
            # current_network is already a RIPNetwork object
            graph = current_network
            graph.initialize_routing_tables()
            graph.simulate_rip()
            nodes_resp = []
            for node_id, node_obj in graph.nodes.items():
                nodes_resp.append({
                    'id': node_id,
                    'neighbors': [{'id': n_id, 'distance': node_obj.neighbors[n_id]} for n_id in node_obj.neighbors],
                    'routing_table': node_obj.routing_table
                })
            return jsonify({
                'success': True,
                'nodes': nodes_resp,
                'links': []  # links not directly stored in RIPNetwork, could extend if needed
            })
    except Exception as e:
        logging.error(f"Error getting network topology: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/network/save', methods=['POST'])
def save_network():
    """Save the current network configuration"""
    try:
        global custom_network_data
        data = request.get_json()
        
        custom_network_data = {
            'nodes': data.get('nodes', []),
            'links': data.get('links', []),
            'positions': data.get('positions', {})
        }
        
        # Update the current network
        global current_network
        current_network = {
            'nodes': custom_network_data['nodes'],
            'links': custom_network_data['links']
        }
        
        # Optionally validate by building RIP network (not stored globally)
        try:
            rip_net = create_network_from_data(custom_network_data)
            rip_net.initialize_routing_tables()
            rip_net.simulate_rip()
        except Exception as validation_error:
            logging.warning(f"Validation of saved network failed: {validation_error}")
        
        # Optionally save to file
        try:
            with open('custom_network.json', 'w') as f:
                json.dump(custom_network_data, f, indent=2)
        except Exception as e:
            print(f"Warning: Could not save to file: {e}")
        
        return jsonify({"success": True, "message": "Network saved successfully"})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/network/load-sample', methods=['POST'])
def load_sample_network_endpoint():
    """Load the sample network"""
    try:
        load_sample_network()
        return jsonify({"success": True, "message": "Sample network loaded"})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/network/load-custom', methods=['POST'])
def load_custom_network():
    """Load a custom network from JSON data"""
    try:
        data = request.get_json()
        global custom_network_data, current_network
        
        custom_network_data = data
        current_network = create_network_from_data(custom_network_data)
        current_network.initialize_routing_tables()
        current_network.simulate_rip()
        
        return jsonify({"success": True, "message": "Custom network loaded"})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/network/add-node', methods=['POST'])
def add_node():
    """Add a new node to the network"""
    try:
        data = request.get_json()
        node_id = data.get('node_id')
        
        if not node_id:
            return jsonify({"error": "Node ID is required"}), 400
        
        ensure_network()
        
        # Check if node already exists
        if node_id in current_network.nodes:
            return jsonify({"error": "Node already exists"}), 400
        
        # Add node to network
        current_network.add_node(node_id)
        current_network.initialize_routing_tables()
        current_network.simulate_rip()
        
        return jsonify({"success": True, "message": f"Node {node_id} added"})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/network/remove-node', methods=['POST'])
def remove_node():
    """Remove a node from the network"""
    try:
        data = request.get_json()
        node_id = data.get('node_id')
        
        if not node_id:
            return jsonify({"error": "Node ID is required"}), 400
        
        ensure_network()
        
        # Check if node exists
        if node_id not in current_network.nodes:
            return jsonify({"error": "Node does not exist"}), 400
        
        # Remove node from network
        del current_network.nodes[node_id]
        
        # Remove all links to this node
        for node in current_network.nodes.values():
            if node_id in node.neighbors:
                del node.neighbors[node_id]
        
        current_network.initialize_routing_tables()
        current_network.simulate_rip()
        
        return jsonify({"success": True, "message": f"Node {node_id} removed"})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/network/add-link', methods=['POST'])
def add_link():
    """Add a link between two nodes"""
    try:
        data = request.get_json()
        source_id = data.get('source_id')
        target_id = data.get('target_id')
        distance = data.get('distance', 1)
        
        if not source_id or not target_id:
            return jsonify({"error": "Source and target IDs are required"}), 400
        
        ensure_network()
        
        # Check if nodes exist
        if source_id not in current_network.nodes or target_id not in current_network.nodes:
            return jsonify({"error": "One or both nodes do not exist"}), 400
        
        # Add bidirectional link
        current_network.add_bidirectional_link(source_id, target_id, distance)
        current_network.initialize_routing_tables()
        current_network.simulate_rip()
        
        return jsonify({"success": True, "message": f"Link added between {source_id} and {target_id}"})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/rip/network', methods=['GET'])
def get_rip_network():
    """Legacy endpoint - redirects to new topology endpoint"""
    return get_network_topology()

@app.route('/api/playfair/encrypt', methods=['POST'])
def playfair_encrypt():
    """Encrypt text using Playfair cipher."""
    try:
        data = request.get_json()
        plaintext = data.get('plaintext', '')
        key = data.get('key', '')
        
        if not plaintext or not key:
            return jsonify({"error": "Plaintext and key are required"}), 400
        
        encrypted_text = encrypt(plaintext, key)
        
        # Generate key matrix for visualization
        key_matrix = prepare_key(key)
        
        return jsonify({
            "encrypted_text": encrypted_text,
            "key_matrix": key_matrix,
            "success": True
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/playfair/decrypt', methods=['POST'])
def playfair_decrypt():
    """Decrypt text using Playfair cipher."""
    try:
        data = request.get_json()
        ciphertext = data.get('ciphertext', '')
        key = data.get('key', '')
        
        if not ciphertext or not key:
            return jsonify({"error": "Ciphertext and key are required"}), 400
        
        decrypted_text = decrypt(ciphertext, key)
        
        return jsonify({
            "decrypted_text": decrypted_text,
            "success": True
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/rip/shortest-path', methods=['POST'])
def find_shortest_path():
    """Find shortest path between two nodes."""
    try:
        data = request.get_json()
        source = data.get('source', 'A')
        destination = data.get('destination', 'F')
        
        # Build a RIPNetwork object from the current dictionary if necessary
        if isinstance(current_network, dict):
            graph = create_network_from_data(current_network)
            graph.initialize_routing_tables()
            graph.simulate_rip()
        else:
            graph = current_network
        
        path = graph.find_shortest_path(source, destination)
        cost = graph.get_path_cost(path) if path else -1
        
        return jsonify({
            "path": path,
            "cost": cost,
            "success": True
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/tcp/simulate', methods=['POST'])
def simulate_tcp():
    """Simulate TCP Reno transmission."""
    try:
        data = request.get_json()
        
        # Extract parameters with validation
        data_size = max(1000, min(int(data.get('data_size', 10000)), 1000000))  # 1KB to 1MB
        mss = max(500, min(int(data.get('mss', 1460)), 9000))  # 500B to 9KB (jumbo frames)
        initial_cwnd = max(1, min(int(data.get('initial_cwnd', 1)), 10))  # 1 to 10 MSS
        ssthresh = max(2, min(int(data.get('ssthresh', 65535)), 100))  # 2 to 100 MSS
        packet_loss_rate = max(0.0, min(float(data.get('packet_loss_rate', 0.05)), 0.5))  # 0% to 50%
        max_time = max(10, min(int(data.get('max_time', 100)), 200))  # 10 to 200 steps
        
        # Create simulator instance
        simulator = TCPRenoSimulator(
            mss=mss,
            initial_cwnd=initial_cwnd,
            ssthresh=ssthresh,
            max_time=max_time,
            packet_loss_rate=packet_loss_rate
        )
        
        # Run simulation
        results = simulator.simulate_transmission(data_size)
        
        # Generate plot as base64
        plot_base64 = simulator.plot_results(results, return_base64=True)
        
        return jsonify({
            'success': True,
            'results': results,
            'plot': plot_base64
        })
        
    except Exception as e:
        logging.error(f"TCP simulation error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/simulation/full', methods=['POST'])
def run_full_simulation():
    """Run the complete network transmission simulation."""
    try:
        data = request.get_json()
        plaintext = data.get('plaintext', 'HELLO NETWORK SECURITY WORLD')
        key = data.get('key', 'NETWORK')
        source_node = data.get('source_node', 'A')
        destination_node = data.get('destination_node', 'F')
        packet_loss_rate = data.get('packet_loss_rate', 0.05)
        
        results = simulate_network_transmission(
            plaintext, key, source_node, destination_node, packet_loss_rate
        )
        
        # Generate TCP plot if simulation was successful
        plot_data = None
        if results.get("success") and "tcp_results" in results:
            tcp_results = results["tcp_results"]
            
            plt.figure(figsize=(12, 6))
            time_steps = range(len(tcp_results["cwnd_history"]))
            
            plt.plot(time_steps, tcp_results["cwnd_history"], 'b-', label='Congestion Window', linewidth=2)
            plt.plot(time_steps, tcp_results["ssthresh_history"], 'r--', label='Slow Start Threshold', linewidth=2)
            
            plt.xlabel('Time Steps')
            plt.ylabel('Size (MSS)')
            plt.title('TCP Reno Simulation - Full Network Transmission')
            plt.grid(True, linestyle='--', alpha=0.7)
            plt.legend()
            plt.tight_layout()
            
            buffer = io.BytesIO()
            plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
            buffer.seek(0)
            plot_data = base64.b64encode(buffer.getvalue()).decode()
            plt.close()
        
        return jsonify({
            "results": results,
            "plot": plot_data,
            "success": True
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/network/nodes', methods=['GET'])
def get_all_nodes():
    """Get all available network nodes."""
    return jsonify({
        "nodes": ["A", "B", "C", "D", "E", "F"],
        "success": True
    })

@app.route('/api/network/load-topology', methods=['POST'])
def load_topology():
    try:
        data = request.get_json()
        topology_key = data.get('topology')
        topology_data = data.get('data')
        
        if not topology_data:
            return jsonify({'success': False, 'error': 'No topology data provided'})
        
        # Update global network state
        global current_network
        current_network = {
            'nodes': topology_data['nodes'],
            'links': topology_data['links']
        }
        
        # Save to file for persistence
        with open('custom_network.json', 'w') as f:
            json.dump({
                'topology': topology_key,
                'data': topology_data
            }, f, indent=2)
        
        logging.info(f"Loaded topology: {topology_key} with {len(topology_data['nodes'])} nodes and {len(topology_data['links'])} links")
        
        return jsonify({
            'success': True,
            'message': f'Topology {topology_key} loaded successfully',
            'nodes': topology_data['nodes'],
            'links': topology_data['links']
        })
        
    except Exception as e:
        logging.error(f"Error loading topology: {str(e)}")
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8003)
