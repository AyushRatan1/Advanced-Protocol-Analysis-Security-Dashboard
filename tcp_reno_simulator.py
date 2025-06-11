import random
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Patch  # Import Patch from patches

class TCPRenoSimulator:
    def __init__(self, mss=1, initial_cwnd=1, ssthresh=65535, max_time=100, packet_loss_rate=0.05):
        """
        Initialize TCP Reno simulator.
        
        Args:
            mss: Maximum Segment Size in bytes
            initial_cwnd: Initial congestion window size in MSS
            ssthresh: Slow start threshold in MSS
            max_time: Maximum simulation time in steps
            packet_loss_rate: Probability of packet loss (0.0 to 1.0)
        """
        self.mss = mss
        self.cwnd = initial_cwnd
        self.ssthresh = ssthresh
        self.max_time = max_time
        self.packet_loss_rate = packet_loss_rate
        
        # For tracking
        self.time = 0
        self.state = "slow_start"
        self.cwnd_history = []
        self.ssthresh_history = []
        self.state_history = []
        self.dup_acks = 0
        self.total_packets_sent = 0
        self.packets_lost = 0
        
    def _detect_packet_loss(self):
        """Simulate random packet loss."""
        return random.random() < self.packet_loss_rate
        
    def _handle_packet_loss(self, is_timeout=False):
        """Handle packet loss based on whether it's a timeout or fast retransmit."""
        if is_timeout:
            # Timeout: Set ssthresh to half of cwnd and reset cwnd to 1
            self.ssthresh = max(self.cwnd // 2, 2)
            self.cwnd = 1
            self.state = "slow_start"
            self.dup_acks = 0
        else:
            # Fast retransmit: Set ssthresh to half of cwnd and enter fast recovery
            self.ssthresh = max(self.cwnd // 2, 2)
            self.cwnd = self.ssthresh + 3  # Enter fast recovery with 3 duplicate ACKs
            self.state = "fast_recovery"
            
    def _update_cwnd(self, ack_received=True):
        """Update congestion window based on current state and whether ACK was received."""
        if not ack_received:
            self.dup_acks += 1
            
            # Fast Retransmit after 3 duplicate ACKs
            if self.dup_acks == 3:
                self._handle_packet_loss(is_timeout=False)
                self.packets_lost += 1
            
            # In Fast Recovery, increase cwnd by 1 for each duplicate ACK
            elif self.state == "fast_recovery" and self.dup_acks > 3:
                self.cwnd += 1
                
            return
            
        # Reset duplicate ACK counter on new ACK
        self.dup_acks = 0
        
        if self.state == "slow_start":
            # Exponential increase during slow start
            self.cwnd += 1
            
            # Transition to congestion avoidance if cwnd reaches ssthresh
            if self.cwnd >= self.ssthresh:
                self.state = "congestion_avoidance"
                
        elif self.state == "congestion_avoidance":
            # Additive increase during congestion avoidance (cwnd += 1/cwnd)
            self.cwnd += 1.0 / self.cwnd
            self.cwnd = max(self.cwnd, 1)  # Ensure cwnd is at least 1
            
        elif self.state == "fast_recovery":
            # Exit fast recovery and enter congestion avoidance
            self.cwnd = self.ssthresh
            self.state = "congestion_avoidance"
            
    def simulate_transmission(self, data_size):
        """
        Simulate TCP Reno transmission of data.
        
        Args:
            data_size: Size of data to transmit in bytes
            
        Returns:
            Dictionary with simulation results
        """
        self.cwnd_history = []
        self.ssthresh_history = []
        self.state_history = []
        self.time = 0
        self.total_packets_sent = 0
        self.packets_lost = 0
        
        remaining_data = data_size
        
        # Continue until all data is sent or max time is reached
        while remaining_data > 0 and self.time < self.max_time:
            # Record current state
            self.cwnd_history.append(self.cwnd)
            self.ssthresh_history.append(self.ssthresh)
            self.state_history.append(self.state)
            
            # Calculate how many packets to send in this round
            packets_to_send = min(int(self.cwnd), (remaining_data + self.mss - 1) // self.mss)
            self.total_packets_sent += packets_to_send
            
            # Check for packet loss
            packet_loss = self._detect_packet_loss()
            
            if packet_loss:
                # Simulate either timeout or fast recovery based on a random choice
                # (In a real system, this would depend on whether duplicate ACKs are received)
                is_timeout = random.random() < 0.3  # 30% chance of timeout
                
                self._handle_packet_loss(is_timeout)
                self.packets_lost += 1
                
                # If timeout, no data is acknowledged
                if is_timeout:
                    acked_packets = 0
                else:
                    # If fast retransmit, some packets might be acknowledged
                    acked_packets = max(0, packets_to_send - 1)
            else:
                # All packets acknowledged
                acked_packets = packets_to_send
                self._update_cwnd(ack_received=True)
                
            # Update remaining data
            data_acknowledged = min(acked_packets * self.mss, remaining_data)
            remaining_data -= data_acknowledged
            
            self.time += 1
            
        return {
            "cwnd_history": self.cwnd_history,
            "ssthresh_history": self.ssthresh_history,
            "state_history": self.state_history,
            "time_steps": self.time,
            "total_packets_sent": self.total_packets_sent,
            "packets_lost": self.packets_lost,
            "data_size": data_size,
            "data_transmitted": data_size - remaining_data,
            "transmission_complete": remaining_data == 0
        }
        
    def plot_results(self, results=None):
        """Plot the congestion window and slow start threshold over time."""
        if results is None:
            results = {
                "cwnd_history": self.cwnd_history,
                "ssthresh_history": self.ssthresh_history,
                "state_history": self.state_history,
                "time_steps": self.time
            }
            
        time_steps = range(len(results["cwnd_history"]))
        
        plt.figure(figsize=(12, 6))
        plt.plot(time_steps, results["cwnd_history"], 'b-', label='Congestion Window (cwnd)')
        plt.plot(time_steps, results["ssthresh_history"], 'r--', label='Slow Start Threshold (ssthresh)')
        
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
                
        # Add labels and title
        plt.xlabel('Time Steps')
        plt.ylabel('Size (MSS)')
        plt.title('TCP Reno Congestion Control')
        plt.grid(True, linestyle='--', alpha=0.7)
        
        # Add a legend
        legend_elements = [
            plt.Line2D([0], [0], color='b', lw=2, label='Congestion Window (cwnd)'),
            plt.Line2D([0], [0], color='r', linestyle='--', lw=2, label='Slow Start Threshold (ssthresh)'),
            Patch(facecolor='lightskyblue', alpha=0.3, label='Slow Start'),
            Patch(facecolor='lightgreen', alpha=0.3, label='Congestion Avoidance'),
            Patch(facecolor='salmon', alpha=0.3, label='Fast Recovery')
        ]
        plt.legend(handles=legend_elements, loc='upper left')
        
        plt.tight_layout()
        
        # Save the plot to a file
        plt.savefig('tcp_reno_simulation.png')
        
        return plt  # Return the plot for further customization if needed

if __name__ == "__main__":
    # Test the TCP Reno simulator
    simulator = TCPRenoSimulator(
        mss=1460,           # Standard MSS in bytes
        initial_cwnd=1,     # Start with 1 MSS
        ssthresh=65535,     # Initial ssthresh set high
        max_time=100,       # Maximum time steps
        packet_loss_rate=0.05  # 5% packet loss rate
    )
    
    # Simulate sending 1MB of data
    results = simulator.simulate_transmission(1000000)  # 1MB
    
    # Print simulation results
    print("\nTCP Reno Simulation Results:")
    print(f"Data size: {results['data_size']} bytes")
    print(f"Data transmitted: {results['data_transmitted']} bytes")
    print(f"Transmission complete: {results['transmission_complete']}")
    print(f"Time steps: {results['time_steps']}")
    print(f"Total packets sent: {results['total_packets_sent']}")
    print(f"Packets lost: {results['packets_lost']}")
    print(f"Packet loss rate: {results['packets_lost'] / results['total_packets_sent'] * 100:.2f}%")
    
    # Plot the results
    simulator.plot_results(results)
    print("\nGraph saved as 'tcp_reno_simulation.png'")
    
    # Display final cwnd and ssthresh
    print(f"\nFinal cwnd: {simulator.cwnd} MSS")
    print(f"Final ssthresh: {simulator.ssthresh} MSS")