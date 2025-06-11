import random
import sys
import time
from playfair_cipher import encrypt, decrypt, display_matrix
from rip_simulator import RIPNetwork, create_sample_network
from tcp_reno_simulator import TCPRenoSimulator
import matplotlib.pyplot as plt

def simulate_network_transmission(plaintext, key, source_node, destination_node, packet_loss_rate=0.05):
    """
    Simulate a complete network transmission with encryption, routing, and transport.
    
    Args:
        plaintext: Text message to transmit
        key: Encryption key for Playfair cipher
        source_node: Source node ID
        destination_node: Destination node ID
        packet_loss_rate: Probability of packet loss during transmission
        
    Returns:
        Dictionary with results of the simulation
    """
    print("\n" + "="*50)
    print("SECURE ROUTING SIMULATION")
    print("="*50)
    
    # Step 1: Encrypt the message using Playfair Cipher
    print("\n[1] ENCRYPTION LAYER (Playfair Cipher)")
    print("-"*50)
    print(f"Plaintext: {plaintext}")
    print(f"Encryption Key: {key}")
    print("\nKey Matrix:")
    display_matrix(key)
    
    encrypted_text = encrypt(plaintext, key)
    print(f"\nEncrypted Text: {encrypted_text}")
    
    # Step 2: Determine the route using RIP
    print("\n[2] ROUTING LAYER (RIP)")
    print("-"*50)
    print("Initializing network...")
    network = create_sample_network()
    network.initialize_routing_tables()
    
    # Run RIP algorithm to converge routing tables
    network.simulate_rip()
    
    # Find the shortest path from source to destination
    path = network.find_shortest_path(source_node, destination_node)
    path_cost = network.get_path_cost(path)
    
    if not path:
        print(f"\nError: No path found from {source_node} to {destination_node}")
        return {
            "success": False,
            "error": f"No path found from {source_node} to {destination_node}"
        }
        
    print(f"\nSelected Path from {source_node} to {destination_node}: {' -> '.join(path)}")
    print(f"Total Path Cost: {path_cost}")
    
    # Step 3: Simulate the transmission using TCP Reno
    print("\n[3] TRANSPORT LAYER (TCP Reno)")
    print("-"*50)
    
    # Create TCP Reno simulator
    tcp_simulator = TCPRenoSimulator(
        mss=1,  # Use 1 byte as MSS for simplicity in this demo
        initial_cwnd=1,
        ssthresh=16,
        max_time=100,
        packet_loss_rate=packet_loss_rate
    )
    
    # Simulate the transmission
    data_size = len(encrypted_text)
    print(f"Transmitting {data_size} bytes of encrypted data with {packet_loss_rate*100:.1f}% packet loss rate...")
    
    tcp_results = tcp_simulator.simulate_transmission(data_size)
    
    # Display TCP results
    print(f"\nTCP Transmission Results:")
    print(f"Data transmitted: {tcp_results['data_transmitted']} of {data_size} bytes")
    print(f"Transmission complete: {tcp_results['transmission_complete']}")
    print(f"Time steps required: {tcp_results['time_steps']}")
    print(f"Packets sent: {tcp_results['total_packets_sent']}")
    print(f"Packets lost: {tcp_results['packets_lost']} ({tcp_results['packets_lost']/tcp_results['total_packets_sent']*100:.2f}%)")
    
    # Step 4: Decrypt the message at the destination
    print("\n[4] DECRYPTION AT DESTINATION")
    print("-"*50)
    
    # Check if all data was successfully transmitted
    if tcp_results['transmission_complete']:
        decrypted_text = decrypt(encrypted_text, key)
        print(f"Decrypted Text: {decrypted_text}")
        
        # Plot TCP Reno behavior
        tcp_simulator.plot_results(tcp_results)
        print("\nTCP Reno congestion window graph saved as 'tcp_reno_simulation.png'")
        
        return {
            "success": True,
            "plaintext": plaintext,
            "encrypted_text": encrypted_text,
            "decrypted_text": decrypted_text,
            "path": path,
            "path_cost": path_cost,
            "tcp_results": tcp_results
        }
    else:
        print("Error: Transmission incomplete. Some data was lost during transmission.")
        return {
            "success": False,
            "error": "Transmission incomplete",
            "tcp_results": tcp_results
        }

def main():
    # Get user input or use default values
    try:
        if len(sys.argv) > 1:
            plaintext = sys.argv[1]
        else:
            plaintext = input("Enter message to transmit: ")
            
        if not plaintext:
            plaintext = "HELLO NETWORK SECURITY WORLD"
            print(f"Using default message: {plaintext}")
            
        key = input("Enter encryption key (or press Enter for default): ")
        if not key:
            key = "NETWORK"
            print(f"Using default key: {key}")
            
        source = input("Enter source node (A-F, or press Enter for default A): ").upper()
        if not source or source not in "ABCDEF":
            source = "A"
            print(f"Using default source node: {source}")
            
        destination = input("Enter destination node (A-F, or press Enter for default F): ").upper()
        if not destination or destination not in "ABCDEF" or destination == source:
            destination = "F"
            print(f"Using default destination node: {destination}")
            
        packet_loss_str = input("Enter packet loss rate (0.0-1.0, or press Enter for default 0.05): ")
        if not packet_loss_str:
            packet_loss_rate = 0.05
        else:
            packet_loss_rate = float(packet_loss_str)
            if packet_loss_rate < 0 or packet_loss_rate > 1:
                packet_loss_rate = 0.05
                print("Invalid packet loss rate. Using default: 0.05")
            else:
                print(f"Using packet loss rate: {packet_loss_rate}")
            
    except Exception as e:
        print(f"Error in input: {e}")
        print("Using default values")
        plaintext = "HELLO NETWORK SECURITY WORLD"
        key = "NETWORK"
        source = "A"
        destination = "F"
        packet_loss_rate = 0.05
        
    # Run the simulation
    results = simulate_network_transmission(plaintext, key, source, destination, packet_loss_rate)
    
    # Final summary
    print("\n" + "="*50)
    if results["success"]:
        print("SIMULATION COMPLETED SUCCESSFULLY")
    else:
        print("SIMULATION FAILED")
        print(f"Error: {results.get('error', 'Unknown error')}")
    print("="*50)
    
if __name__ == "__main__":
    main() 