import random
import time
import copy

class Node:
    def __init__(self, node_id):
        self.node_id = node_id
        self.neighbors = {}  # neighbor_id -> direct distance
        self.routing_table = {}  # destination_id -> (next_hop, distance)
        
    def add_neighbor(self, neighbor_id, distance):
        """Add a direct neighbor with the given distance."""
        self.neighbors[neighbor_id] = distance
        # Initialize routing table with direct neighbors
        self.routing_table[neighbor_id] = (neighbor_id, distance)
        
    def initialize_routing_table(self, all_nodes):
        """Initialize routing table with direct connections and infinity for others."""
        for node_id in all_nodes:
            if node_id == self.node_id:
                self.routing_table[node_id] = (self.node_id, 0)  # Distance to self is 0
            elif node_id not in self.routing_table:
                self.routing_table[node_id] = (None, float('inf'))  # Set distance to infinity for unknown nodes
                
    def get_distance_vector(self):
        """Return the distance vector to share with neighbors."""
        return {dest: dist for dest, (_, dist) in self.routing_table.items()}
                
    def update_routing_table(self, neighbor_id, distance_vector):
        """Update routing table based on a neighbor's distance vector."""
        updated = False
        
        # Distance to the neighbor
        direct_distance = self.neighbors[neighbor_id]
        
        for dest_id, reported_distance in distance_vector.items():
            if dest_id == self.node_id:
                continue  # Skip self
                
            # Calculate new potential distance through this neighbor
            new_distance = direct_distance + reported_distance
            
            # Current best known distance
            _, current_distance = self.routing_table.get(dest_id, (None, float('inf')))
            
            # Update if new path is better
            if new_distance < current_distance:
                self.routing_table[dest_id] = (neighbor_id, new_distance)
                updated = True
                
        return updated
    
    def get_next_hop(self, destination_id):
        """Get the next hop to reach the destination."""
        if destination_id in self.routing_table:
            return self.routing_table[destination_id][0]
        return None
    
    def get_path_to(self, destination_id, network):
        """Get the complete path to the destination."""
        if destination_id not in self.routing_table:
            return []
            
        path = [self.node_id]
        current = self.node_id
        
        while current != destination_id:
            next_hop = network[current].get_next_hop(destination_id)
            if next_hop is None or next_hop == current or next_hop in path:  # Avoid loops
                return []  # No path found
            path.append(next_hop)
            current = next_hop
            
        return path
        
    def print_routing_table(self):
        """Print the routing table for this node."""
        print(f"\nRouting Table for Node {self.node_id}:")
        print("Destination | Next Hop | Distance")
        print("------------|----------|----------")
        for dest_id in sorted(self.routing_table.keys()):
            next_hop, distance = self.routing_table[dest_id]
            if distance == float('inf'):
                distance_str = "∞"
            else:
                distance_str = str(distance)
            print(f"{dest_id:^11} | {next_hop if next_hop is not None else '-':^8} | {distance_str:^8}")

class RIPNetwork:
    def __init__(self):
        self.nodes = {}  # node_id -> Node
        
    def add_node(self, node_id):
        """Add a node to the network."""
        self.nodes[node_id] = Node(node_id)
        return self.nodes[node_id]
        
    def add_bidirectional_link(self, node1_id, node2_id, distance):
        """Add a bidirectional link between two nodes."""
        if node1_id not in self.nodes:
            self.add_node(node1_id)
        if node2_id not in self.nodes:
            self.add_node(node2_id)
            
        self.nodes[node1_id].add_neighbor(node2_id, distance)
        self.nodes[node2_id].add_neighbor(node1_id, distance)
        
    def initialize_routing_tables(self):
        """Initialize routing tables for all nodes."""
        all_node_ids = list(self.nodes.keys())
        for node in self.nodes.values():
            node.initialize_routing_table(all_node_ids)
            
    def simulate_rip(self, max_iterations=100):
        """Simulate the RIP algorithm until convergence or max iterations."""
        iteration = 0
        converged = False
        
        print("Starting RIP simulation...")
        
        while not converged and iteration < max_iterations:
            iteration += 1
            print(f"\nIteration {iteration}")
            
            # Make a copy of nodes to simulate simultaneous updates
            updates = []
            
            # Each node shares its distance vector with neighbors
            for node_id, node in self.nodes.items():
                distance_vector = node.get_distance_vector()
                
                for neighbor_id in node.neighbors:
                    updates.append((neighbor_id, node_id, distance_vector))
            
            # Apply all updates and check if any tables changed
            any_updates = False
            for neighbor_id, sender_id, distance_vector in updates:
                updated = self.nodes[neighbor_id].update_routing_table(sender_id, distance_vector)
                any_updates = any_updates or updated
                
            # If no updates were made, we've converged
            converged = not any_updates
            
            # Print routing tables after each iteration
            if iteration == 1 or iteration == max_iterations or converged:
                for node in self.nodes.values():
                    node.print_routing_table()
                    
        if converged:
            print(f"\nRIP converged after {iteration} iterations.")
        else:
            print(f"\nRIP did not converge after {max_iterations} iterations.")
            
        return converged
        
    def find_shortest_path(self, source_id, destination_id):
        """Find the shortest path from source to destination."""
        if source_id not in self.nodes or destination_id not in self.nodes:
            return None
            
        path = self.nodes[source_id].get_path_to(destination_id, self.nodes)
        return path
        
    def get_path_cost(self, path):
        """Calculate the total cost of a path."""
        if not path or len(path) < 2:
            return 0
            
        cost = 0
        for i in range(len(path) - 1):
            current = path[i]
            next_hop = path[i + 1]
            cost += self.nodes[current].neighbors[next_hop]
            
        return cost

def create_sample_network():
    """Create a sample network for testing."""
    network = RIPNetwork()
    
    # Create nodes (A through F)
    nodes = ['A', 'B', 'C', 'D', 'E', 'F']
    for node_id in nodes:
        network.add_node(node_id)
    
    # Add links (bidirectional)
    network.add_bidirectional_link('A', 'B', 1)
    network.add_bidirectional_link('A', 'C', 3)
    network.add_bidirectional_link('B', 'D', 2)
    network.add_bidirectional_link('C', 'D', 1)
    network.add_bidirectional_link('C', 'E', 5)
    network.add_bidirectional_link('D', 'E', 2)
    network.add_bidirectional_link('D', 'F', 3)
    network.add_bidirectional_link('E', 'F', 1)
    
    return network

if __name__ == "__main__":
    # Create and test a sample network
    network = create_sample_network()
    network.initialize_routing_tables()
    
    # Run RIP simulation
    network.simulate_rip()
    
    # Test finding paths
    source = 'A'
    destination = 'F'
    path = network.find_shortest_path(source, destination)
    cost = network.get_path_cost(path)
    
    print(f"\nShortest path from {source} to {destination}: {' -> '.join(path)}")
    print(f"Total cost: {cost}") 