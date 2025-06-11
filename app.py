from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import base64
import io
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
from playfair_cipher import encrypt, decrypt, display_matrix, prepare_key
from rip_simulator import RIPNetwork, create_sample_network
from tcp_reno_simulator import TCPRenoSimulator
from main import simulate_network_transmission

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "message": "DCN API is running"})

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

@app.route('/api/rip/network', methods=['GET'])
def get_network_topology():
    """Get the network topology and routing information."""
    try:
        network = create_sample_network()
        network.initialize_routing_tables()
        network.simulate_rip()
        
        # Get network structure
        nodes = []
        links = []
        
        for node_id, node in network.nodes.items():
            nodes.append({
                "id": node_id,
                "label": f"Node {node_id}",
                "neighbors": list(node.neighbors.keys())
            })
            
            # Get routing table
            routing_table = {}
            for dest_id, (next_hop, distance) in node.routing_table.items():
                routing_table[dest_id] = {
                    "next_hop": next_hop,
                    "distance": distance if distance != float('inf') else -1
                }
            
            nodes[-1]["routing_table"] = routing_table
        
        # Create links
        processed_links = set()
        for node_id, node in network.nodes.items():
            for neighbor_id, distance in node.neighbors.items():
                link_key = tuple(sorted([node_id, neighbor_id]))
                if link_key not in processed_links:
                    links.append({
                        "source": node_id,
                        "target": neighbor_id,
                        "distance": distance
                    })
                    processed_links.add(link_key)
        
        return jsonify({
            "nodes": nodes,
            "links": links,
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
        
        network = create_sample_network()
        network.initialize_routing_tables()
        network.simulate_rip()
        
        path = network.find_shortest_path(source, destination)
        cost = network.get_path_cost(path) if path else -1
        
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
        data_size = data.get('data_size', 1000)
        mss = data.get('mss', 1460)
        initial_cwnd = data.get('initial_cwnd', 1)
        ssthresh = data.get('ssthresh', 65535)
        packet_loss_rate = data.get('packet_loss_rate', 0.05)
        max_time = data.get('max_time', 100)
        
        simulator = TCPRenoSimulator(
            mss=mss,
            initial_cwnd=initial_cwnd,
            ssthresh=ssthresh,
            max_time=max_time,
            packet_loss_rate=packet_loss_rate
        )
        
        results = simulator.simulate_transmission(data_size)
        
        # Generate plot and return as base64 string
        plt.figure(figsize=(12, 6))
        time_steps = range(len(results["cwnd_history"]))
        
        plt.plot(time_steps, results["cwnd_history"], 'b-', label='Congestion Window (cwnd)', linewidth=2)
        plt.plot(time_steps, results["ssthresh_history"], 'r--', label='Slow Start Threshold (ssthresh)', linewidth=2)
        
        # Mark different states with different colors
        state_colors = {
            "slow_start": 'lightskyblue',
            "congestion_avoidance": 'lightgreen',
            "fast_recovery": 'salmon'
        }
        
        prev_state = None
        start_idx = 0
        
        for i, state in enumerate(results["state_history"]):
            if state != prev_state or i == len(results["state_history"]) - 1:
                if prev_state is not None:
                    plt.axvspan(start_idx, i, alpha=0.3, color=state_colors.get(prev_state, 'gray'))
                prev_state = state
                start_idx = i
        
        plt.xlabel('Time Steps')
        plt.ylabel('Size (MSS)')
        plt.title('TCP Reno Congestion Control Simulation')
        plt.grid(True, linestyle='--', alpha=0.7)
        plt.legend()
        plt.tight_layout()
        
        # Convert plot to base64 string
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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
