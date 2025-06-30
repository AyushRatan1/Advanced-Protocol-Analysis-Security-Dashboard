import random
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Patch
import base64
import io

class TCPRenoSimulator:
    def __init__(self, mss=1460, initial_cwnd=1, ssthresh=65535, max_time=100, packet_loss_rate=0.05):
        """
        Initialize TCP Reno simulator.
        
        Args:
            mss: Maximum Segment Size in bytes
            initial_cwnd: Initial congestion window size in MSS
            ssthresh: Slow start threshold in MSS
            max_time: Maximum simulation time in steps
            packet_loss_rate: Probability of packet loss (0.0 to 1.0)
        """
        self.mss = max(1, int(mss))
        self.cwnd = max(1, float(initial_cwnd))
        self.ssthresh = max(2, int(ssthresh))
        self.max_time = max(10, int(max_time))
        self.packet_loss_rate = max(0.0, min(1.0, float(packet_loss_rate)))
        
        # For tracking
        self.time = 0
        self.state = "slow_start"
        self.cwnd_history = []
        self.ssthresh_history = []
        self.state_history = []
        self.time_history = []
        self.dup_acks = 0
        self.total_packets_sent = 0
        self.packets_lost = 0
        self.packet_loss_events = 0
        
        # Prevent infinite growth
        self.max_cwnd = 100  # Maximum allowed congestion window
        
    def _detect_packet_loss(self):
        """Simulate random packet loss."""
        return random.random() < self.packet_loss_rate
        
    def _handle_packet_loss(self, is_timeout=False):
        """Handle packet loss based on whether it's a timeout or fast retransmit."""
        self.packet_loss_events += 1
        
        if is_timeout:
            # Timeout: Set ssthresh to half of cwnd and reset cwnd to 1
            self.ssthresh = max(int(self.cwnd // 2), 2)
            self.cwnd = 1.0
            self.state = "slow_start"
            self.dup_acks = 0
        else:
            # Fast retransmit: Set ssthresh to half of cwnd and enter fast recovery
            self.ssthresh = max(int(self.cwnd // 2), 2)
            self.cwnd = float(self.ssthresh + 3)  # Enter fast recovery with 3 duplicate ACKs
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
                self.cwnd = min(self.cwnd + 1, self.max_cwnd)
                
            return
            
        # Reset duplicate ACK counter on new ACK
        self.dup_acks = 0
        
        if self.state == "slow_start":
            # Exponential increase during slow start
            self.cwnd = min(self.cwnd + 1, self.max_cwnd)
            
            # Transition to congestion avoidance if cwnd reaches ssthresh
            if self.cwnd >= self.ssthresh:
                self.state = "congestion_avoidance"
                
        elif self.state == "congestion_avoidance":
            # Additive increase during congestion avoidance (cwnd += 1/cwnd)
            increase = 1.0 / max(self.cwnd, 1.0)
            self.cwnd = min(self.cwnd + increase, self.max_cwnd)
            self.cwnd = max(self.cwnd, 1.0)  # Ensure cwnd is at least 1
            
        elif self.state == "fast_recovery":
            # Exit fast recovery and enter congestion avoidance
            self.cwnd = float(self.ssthresh)
            self.state = "congestion_avoidance"
            
    def simulate_transmission(self, data_size):
        """
        Simulate TCP Reno transmission of data.
        
        Args:
            data_size: Size of data to transmit in bytes
            
        Returns:
            Dictionary with simulation results
        """
        # Reset simulation state
        self.cwnd = max(1, float(self.cwnd))
        self.cwnd_history = []
        self.ssthresh_history = []
        self.state_history = []
        self.time_history = []
        self.time = 0
        self.total_packets_sent = 0
        self.packets_lost = 0
        self.packet_loss_events = 0
        self.state = "slow_start"
        self.dup_acks = 0
        
        data_size = max(1, int(data_size))
        remaining_data = data_size
        
        # Continue until all data is sent or max time is reached
        while remaining_data > 0 and self.time < self.max_time:
            # Record current state
            self.cwnd_history.append(float(self.cwnd))
            self.ssthresh_history.append(int(self.ssthresh))
            self.state_history.append(self.state)
            self.time_history.append(self.time)
            
            # Calculate how many packets to send in this round
            packets_to_send = min(int(self.cwnd), (remaining_data + self.mss - 1) // self.mss)
            packets_to_send = max(1, packets_to_send)  # Send at least 1 packet
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
            remaining_data = max(0, remaining_data - data_acknowledged)
            
            self.time += 1
            
        # Calculate time taken (in seconds, assuming each step is 1 RTT)
        time_taken = self.time  # seconds
        
        return {
            "cwnd_history": self.cwnd_history,
            "ssthresh_history": self.ssthresh_history,
            "state_history": self.state_history,
            "time_history": self.time_history,
            "time_taken": time_taken,
            "time_steps": time_taken,
            "total_packets_sent": self.total_packets_sent,
            "packets_lost": self.packets_lost,
            "packet_loss_events": self.packet_loss_events,
            "data_size": data_size,
            "data_transmitted": data_size - remaining_data,
            "transmission_complete": remaining_data == 0,
            "final_cwnd": self.cwnd,
            "final_ssthresh": self.ssthresh
        }
        
    def plot_results(self, results=None, return_base64=False):
        """Plot the congestion window and slow start threshold over time."""
        if results is None:
            results = {
                "cwnd_history": self.cwnd_history,
                "ssthresh_history": self.ssthresh_history,
                "state_history": self.state_history,
                "time_history": self.time_history
            }
            
        if not results["cwnd_history"]:
            return None
            
        # Clear any existing plots
        plt.clf()
        plt.close('all')
        
        # Create figure with better DPI and size
        fig, ax = plt.subplots(figsize=(12, 8), dpi=100)
        fig.patch.set_facecolor('#1a1a2e')
        ax.set_facecolor('#16213e')
        
        time_steps = results.get("time_history", range(len(results["cwnd_history"])))
        
        # Plot congestion window
        ax.plot(time_steps, results["cwnd_history"], 
                color='#00d4ff', linewidth=3, label='Congestion Window (cwnd)', 
                marker='o', markersize=4, markerfacecolor='white', markeredgecolor='#00d4ff')
        
        # Plot slow start threshold
        ax.plot(time_steps, results["ssthresh_history"], 
                color='#ff6b6b', linestyle='--', linewidth=2, 
                label='Slow Start Threshold (ssthresh)', alpha=0.8)
        
        # Mark different states with different background colors
        state_colors = {
            "slow_start": '#4ecdc4',
            "congestion_avoidance": '#ffe66d',
            "fast_recovery": '#ff6b6b'
        }
        
        # Create background shading for states
        prev_state = None
        start_idx = 0
        
        for i, state in enumerate(results["state_history"]):
            if state != prev_state:
                if prev_state is not None and start_idx < len(time_steps):
                    end_idx = min(i, len(time_steps) - 1)
                    ax.axvspan(time_steps[start_idx], time_steps[end_idx], 
                              alpha=0.2, color=state_colors.get(prev_state, '#666666'))
                prev_state = state
                start_idx = i
                
        # Handle the last state
        if prev_state is not None and start_idx < len(time_steps):
            ax.axvspan(time_steps[start_idx], time_steps[-1], 
                      alpha=0.2, color=state_colors.get(prev_state, '#666666'))
        
        # Styling
        ax.set_xlabel('Time (RTT)', fontsize=14, color='white', weight='bold')
        ax.set_ylabel('Window Size (MSS)', fontsize=14, color='white', weight='bold')
        ax.set_title('TCP Reno Congestion Control Simulation', 
                    fontsize=16, color='white', weight='bold', pad=20)
        
        # Grid
        ax.grid(True, linestyle='--', alpha=0.3, color='white')
        
        # Set limits with padding
        if time_steps and results["cwnd_history"]:
            ax.set_xlim(min(time_steps) - 0.5, max(time_steps) + 0.5)
            max_y = max(max(results["cwnd_history"]), max(results["ssthresh_history"]))
            ax.set_ylim(0, max_y * 1.1)
        
        # Legend with custom styling
        legend_elements = [
            plt.Line2D([0], [0], color='#00d4ff', linewidth=3, label='Congestion Window (cwnd)'),
            plt.Line2D([0], [0], color='#ff6b6b', linestyle='--', linewidth=2, label='Slow Start Threshold (ssthresh)'),
            Patch(facecolor='#4ecdc4', alpha=0.4, label='Slow Start'),
            Patch(facecolor='#ffe66d', alpha=0.4, label='Congestion Avoidance'),
            Patch(facecolor='#ff6b6b', alpha=0.4, label='Fast Recovery')
        ]
        
        legend = ax.legend(handles=legend_elements, loc='upper left', 
                          fancybox=True, shadow=True, ncol=1,
                          facecolor='#1a1a2e', edgecolor='white', labelcolor='white')
        legend.get_frame().set_alpha(0.9)
        
        # Style the axes
        ax.tick_params(colors='white', labelsize=12)
        for spine in ax.spines.values():
            spine.set_color('white')
            spine.set_linewidth(1.5)
        
        plt.tight_layout()
        
        if return_base64:
            # Convert plot to base64 string
            buffer = io.BytesIO()
            plt.savefig(buffer, format='png', facecolor='#1a1a2e', 
                       edgecolor='none', bbox_inches='tight', dpi=100)
            buffer.seek(0)
            plot_data = buffer.getvalue()
            buffer.close()
            
            # Encode to base64
            plot_base64 = base64.b64encode(plot_data).decode('utf-8')
            plt.close()
            return f"data:image/png;base64,{plot_base64}"
        else:
            # Save the plot to a file
            plt.savefig('tcp_reno_simulation.png', facecolor='#1a1a2e', 
                       edgecolor='none', bbox_inches='tight', dpi=100)
            plt.close()
            return 'tcp_reno_simulation.png'

if __name__ == "__main__":
    # Test the TCP Reno simulator
    simulator = TCPRenoSimulator(
        mss=1460,           # Standard MSS in bytes
        initial_cwnd=1,     # Start with 1 MSS
        ssthresh=65535,     # Initial ssthresh set high
        max_time=100,       # Maximum time steps
        packet_loss_rate=0.05  # 5% packet loss rate
    )
    
    # Simulate sending 100KB of data (more reasonable for testing)
    results = simulator.simulate_transmission(100000)  # 100KB
    
    # Print simulation results
    print("\nTCP Reno Simulation Results:")
    print(f"Data size: {results['data_size']} bytes")
    print(f"Data transmitted: {results['data_transmitted']} bytes")
    print(f"Transmission complete: {results['transmission_complete']}")
    print(f"Time taken: {results['time_taken']} RTTs")
    print(f"Total packets sent: {results['total_packets_sent']}")
    print(f"Packets lost: {results['packets_lost']}")
    print(f"Packet loss events: {results['packet_loss_events']}")
    
    if results['total_packets_sent'] > 0:
        print(f"Packet loss rate: {results['packets_lost'] / results['total_packets_sent'] * 100:.2f}%")
    
    # Plot the results
    plot_file = simulator.plot_results(results)
    print(f"\nGraph saved as '{plot_file}'")
    
    # Display final values
    print(f"\nFinal cwnd: {results['final_cwnd']:.2f} MSS")
    print(f"Final ssthresh: {results['final_ssthresh']} MSS")