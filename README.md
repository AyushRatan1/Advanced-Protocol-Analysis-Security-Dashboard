# DCN Network Simulation Dashboard

A comprehensive network simulation system with an immersive React-based dashboard for analyzing and visualizing network protocols, encryption, and routing algorithms.

## 🚀 Features

### Backend Simulation Engine
- **Playfair Cipher**: Advanced encryption/decryption with visual key matrix
- **RIP Routing Protocol**: Dynamic route discovery and shortest path calculation
- **TCP Reno Congestion Control**: Real-time window size and throughput simulation
- **End-to-End Network Simulation**: Complete secure data transmission pipeline

### Frontend Dashboard
- **Immersive Network Visualization**: Interactive network topology with real-time animations
- **Multi-Tab Interface**: Dedicated sections for each protocol simulation
- **Professional Dark/Light Theme**: Clean, corporate design with accessibility features
- **Responsive Design**: Perfect experience across desktop, tablet, and mobile devices
- **Real-Time API Integration**: Live data from backend simulation engine

## 📁 Project Structure

```
dcn/
├── backend/                 # Python Flask API Server
│   ├── app.py              # Main Flask application with API endpoints
│   ├── playfair_cipher.py  # Playfair encryption implementation
│   ├── rip_simulator.py    # RIP routing protocol simulation
│   ├── tcp_reno_simulator.py # TCP Reno congestion control
│   ├── main.py             # Standalone simulation script
│   └── requirements.txt    # Python dependencies
├── frontend/               # React Dashboard Application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Dashboard.js # Main dashboard layout
│   │   │   ├── tabs/       # Individual protocol tabs
│   │   │   └── styles/     # Component-specific CSS
│   │   ├── services/       # API integration
│   │   └── assets/         # Static resources
│   ├── public/             # Public assets
│   └── package.json        # Node.js dependencies
├── start.sh                # Quick start script for both servers
└── README.md              # This file
```

## 🛠️ Technologies Used

### Backend
- **Python 3.8+** - Core simulation engine
- **Flask** - RESTful API server
- **NumPy** - Mathematical computations
- **Matplotlib** - Graph generation and visualization

### Frontend
- **React 18** - Modern UI framework
- **React-Tabs** - Tab navigation system
- **React-Icons** - Professional icon set
- **Axios** - HTTP client for API calls
- **Framer Motion** - Smooth animations
- **Recharts** - Data visualization and charts

## 🚦 Quick Start

### Prerequisites
- **Node.js 16+** and **npm**
- **Python 3.8+** and **pip**
- **Git** (for cloning)

### Option 1: One-Command Start (Recommended)
```bash
# Clone the repository
git clone <repository-url>
cd dcn

# Make the start script executable and run
chmod +x start.sh
./start.sh
```

### Option 2: Manual Setup

#### Backend Setup
```bash
# Navigate to project root
cd dcn

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Start Flask API server
python app.py
```
*Backend will be available at: http://localhost:5001*

#### Frontend Setup
```bash
# Open new terminal and navigate to frontend
cd dcn/frontend

# Install Node.js dependencies
npm install

# Start React development server
npm start
```
*Frontend will be available at: http://localhost:3000*

## 🌐 API Endpoints

### Playfair Cipher
- `POST /api/playfair/encrypt` - Encrypt text with Playfair cipher
- `POST /api/playfair/decrypt` - Decrypt text with Playfair cipher

### RIP Routing
- `GET /api/rip/network` - Get network topology
- `POST /api/rip/simulate` - Run RIP simulation for shortest path

### TCP Reno Simulation
- `POST /api/tcp/simulate` - Simulate TCP Reno congestion control

### Full Network Simulation
- `POST /api/simulate` - End-to-end secure network transmission

## 📱 Dashboard Features

### Network Overview Tab
- Interactive network topology visualization
- Real-time node and link animations
- Network statistics and performance metrics
- Dynamic routing path highlighting

### Playfair Cipher Tab
- Interactive key matrix generation
- Real-time encryption/decryption
- Step-by-step process visualization
- Copy-to-clipboard functionality

### RIP Routing Tab
- Network topology management
- Shortest path calculation
- Routing table visualization
- Distance vector algorithm simulation

### TCP Reno Tab
- Congestion window visualization
- Real-time throughput graphs
- Packet loss simulation
- Performance metrics dashboard

### Full Simulation Tab
- End-to-end simulation pipeline
- Combined protocol workflow
- Results analysis and comparison
- Export simulation data

### Settings Tab
- Theme customization (Dark/Light)
- Simulation parameters
- Network configuration
- Performance optimization

## 🎨 Design Features

### Professional Theme System
- **Dark Mode**: Deep blues and blacks with blue accents
- **Light Mode**: Clean whites and grays with professional styling
- **Accessibility**: WCAG compliant contrast ratios
- **Responsive**: Mobile-first design with breakpoints at 640px, 768px, 1024px, 1200px

### Layout Architecture
- **Fixed Positioning**: Eliminates scrolling issues
- **Flexbox Layout**: Responsive and flexible component arrangement
- **CSS Variables**: Dynamic theming with fallback support
- **Smooth Animations**: Professional transitions and micro-interactions

## 🧪 Testing & Development

### Running Tests
```bash
# Backend tests
cd dcn
python -m pytest tests/

# Frontend tests
cd frontend
npm test
```

### Development Mode
```bash
# Backend with auto-reload
cd dcn
export FLASK_ENV=development
python app.py

# Frontend with hot-reload
cd frontend
npm start
```

## 📊 Simulation Parameters

### Default Network Topology
- **Nodes**: A, B, C, D, E, F
- **Connections**: Pre-defined distance matrix
- **Protocols**: RIP with 30-second updates

### Configurable Parameters
- **Encryption Key**: Playfair cipher key (default: "NETWORK")
- **Source/Destination**: Any node in topology
- **Packet Loss Rate**: 0-100% (default: 5%)
- **Window Size**: TCP congestion window parameters
- **Animation Speed**: Visualization timing controls

## 🔧 Troubleshooting

### Common Issues

**Port Conflicts**
- Backend default: 5001, Frontend default: 3000
- Modify ports in `app.py` and `package.json` if needed

**API Connection Issues**
- Ensure backend is running before starting frontend
- Check proxy configuration in `frontend/package.json`

**Installation Problems**
- Update Node.js to latest LTS version
- Use Python virtual environment
- Clear npm cache: `npm cache clean --force`

**Performance Issues**
- Disable animations in Settings tab
- Reduce simulation complexity
- Close other browser tabs

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- React community for excellent documentation
- Flask framework for API simplicity
- Network protocol specifications for accurate simulation
- Open source contributors for inspiration and tools

## 📞 Support

For questions, issues, or contributions:
- Create an issue on GitHub
- Review existing documentation
- Check troubleshooting section above

---

**Made with ❤️ for Network Simulation and Education**