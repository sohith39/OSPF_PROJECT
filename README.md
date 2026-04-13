# 🌍 OSPF Globe Explorer

An interactive **3D network simulator** that visualizes the **OSPF (Open Shortest Path First)** routing protocol on a global scale.  
Built with modern web technologies, this project combines **computer networking + real-time graphics + simulation** into a single immersive experience.

---

## 🚀 Features

### 🌐 3D Global Network Visualization
- Real-time **interactive Earth globe** using Three.js  
- Place routers anywhere on the globe  
- Smooth camera controls (rotate, zoom)  

### 📡 OSPF Protocol Simulation
- Full **Shortest Path First (SPF)** using Dijkstra’s Algorithm  
- Dynamic routing based on configurable link costs  
- Real-time packet traversal visualization  

### 🧠 Link State Database (LSDB)
- View all **Link State Advertisements (LSAs)**  
- Inspect routing tables and shortest paths  
- Understand how OSPF builds network topology  

### 💻 Router & PC Management
- Add/remove routers dynamically  
- Attach multiple PCs to routers  
- Configure **individual link costs**  

### ⚡ Simulation Engine
- Simulate packet transfer between any two PCs  
- Step-by-step **hop tracing (like tracert)**  
- Live logs with total cost calculation  

### 🎨 Modern UI/UX
- Glassmorphism UI with smooth animations  
- Dark/Light (Night/Day) modes  
- Fully responsive (mobile + desktop)  

---

## 🛠️ Tech Stack

- ⚛️ React + Vite  
- 🎮 Three.js + React Three Fiber  
- 🎨 TailwindCSS  
- 🎬 Framer Motion  
- 🧠 Custom OSPF Simulation Logic  

---

## ⚙️ Installation

```bash
git clone https://github.com/your-username/ospf-globe-explorer.git
cd ospf-globe-explorer
npm install
npm run dev
```

---
