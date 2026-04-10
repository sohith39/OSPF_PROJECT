/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, useRef, useState } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera,
  Environment,
  Html,
  Line,
  Text,
  Billboard,
  Stars,
  Sky,
  Float
} from '@react-three/drei';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Network, 
  Plus, 
  Trash2, 
  Info,
  Activity,
  Map as MapIcon,
  Zap,
  X,
  Database,
  Sun,
  Moon,
  Share2,
  Power,
  Monitor,
  Play,
  Terminal,
  ArrowRight,
  ChevronDown,
  Globe as GlobeIcon,
  Cpu,
  ShieldCheck
} from 'lucide-react';
import * as THREE from 'three';

// --- Types ---

interface PC {
  id: string;
  ip: string;
  position: THREE.Vector3;
  cost: number;
}

interface RouterNode {
  id: string;
  position: THREE.Vector3;
  name: string;
  status: 'online' | 'offline';
  pcs: PC[];
}

interface NetworkLink {
  id: string;
  fromId: string;
  toId: string;
  cost: number;
  sequenceNumber: number;
}

interface SimulationState {
  isActive: boolean;
  sourceIp: string;
  destIp: string;
  path: any[]; // Array of { type: 'router' | 'pc', id: string, position: Vector3, label: string, hopCost: number }
  currentHopIndex: number;
  progress: number;
  logs: string[];
  totalCost: number;
}

// --- 3D Components ---

function RouterMarker({ node, index, showLinks }: { node: RouterNode; index: number; showLinks: boolean }) {
  const [hovered, setHovered] = useState(false);
  const pulseRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (pulseRef.current) {
      const s = 1.1 + Math.sin(state.clock.getElapsedTime() * 6) * 0.4;
      pulseRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group>
      {/* Router Node */}
      <group position={node.position}>
        <mesh onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial 
            color={node.status === 'online' ? "#4ade80" : "#f87171"} 
            emissive={node.status === 'online' ? "#4ade80" : "#f87171"}
            emissiveIntensity={hovered ? 4 : 2}
          />
        </mesh>
        
        {/* Pulsating circle */}
        <mesh ref={pulseRef}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshBasicMaterial color="#4ade80" transparent opacity={0.3} />
        </mesh>

        <Html position={[0, 0, 0]} center distanceFactor={10}>
          <div className="pointer-events-none select-none">
            <span className="text-[6px] font-black text-neutral-950 bg-white/90 px-0.5 rounded-[1px] shadow-sm">
              {index + 1}
            </span>
          </div>
        </Html>

        <Html distanceFactor={10}>
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-neutral-900/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-2xl pointer-events-none min-w-[120px]"
              >
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Router Node</p>
                <p className="text-sm font-bold text-white mb-2">{node.name}</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${node.status === 'online' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                  <span className="text-[10px] text-neutral-400 uppercase">{node.status}</span>
                </div>
                {node.pcs.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <p className="text-[8px] text-neutral-500 uppercase font-bold mb-1">Connected PCs ({node.pcs.length})</p>
                    {node.pcs.map(pc => (
                      <p key={pc.id} className="text-[9px] text-indigo-300 font-mono">{pc.ip}</p>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Html>
      </group>

      {/* Connected PCs */}
      {node.pcs.map((pc) => (
        <group key={pc.id}>
          <mesh position={pc.position}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color="#818cf8" />
          </mesh>
          {showLinks && (
            <group>
              <Line
                points={[node.position, pc.position]}
                color="#818cf8"
                lineWidth={2.5}
                transparent
                opacity={0.8}
              />
              <Billboard
                position={node.position.clone().lerp(pc.position, 0.5).add(node.position.clone().normalize().multiplyScalar(0.05))}
                follow={true}
              >
                <Text
                  fontSize={0.04}
                  color="#818cf8"
                  anchorX="center"
                  anchorY="middle"
                  outlineWidth={0.005}
                  outlineColor="#000000"
                >
                  {pc.cost}
                </Text>
              </Billboard>
            </group>
          )}
        </group>
      ))}
    </group>
  );
}

function Packet({ path, currentHopIndex, progress }: { path: any[]; currentHopIndex: number; progress: number }) {
  const currentHop = path[currentHopIndex];
  const nextHop = path[currentHopIndex + 1];

  if (!currentHop || !nextHop) return null;

  const start = currentHop.position;
  const end = nextHop.position;
  
  // Calculate position along the arc
  const pos = new THREE.Vector3().lerpVectors(start, end, progress);
  pos.normalize();
  
  const dist = start.distanceTo(end);
  const height = Math.sin(progress * Math.PI) * (dist * 0.15 + 0.05);
  pos.multiplyScalar(2.05 + height);

  return (
    <group position={pos}>
      <mesh>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      <pointLight intensity={0.5} color="#fbbf24" />
    </group>
  );
}

function LinkLine({ link, nodes, simulationPath }: { link: NetworkLink; nodes: RouterNode[]; simulationPath?: any[] }) {
  const fromNode = nodes.find(n => n.id === link.fromId);
  const toNode = nodes.find(n => n.id === link.toId);

  if (!fromNode || !toNode) return null;
  
  // If simulation is active, only show links that are part of the path
  if (simulationPath) {
    const isInPath = simulationPath.some((hop, i) => {
      const nextHop = simulationPath[i + 1];
      if (!nextHop) return false;
      return (hop.id === link.fromId && nextHop.id === link.toId) || 
             (hop.id === link.toId && nextHop.id === link.fromId);
    });
    if (!isInPath) return null;
  }

  const isOffline = fromNode.status === 'offline' || toNode.status === 'offline';

  const start = fromNode.position.clone();
  const end = toNode.position.clone();
  
  // Create points along the spherical path
  const points = [];
  const segments = 64;
  const dist = start.distanceTo(end);
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = new THREE.Vector3().lerpVectors(start, end, t);
    p.normalize();
    // Arc height depends on distance to look natural
    const height = Math.sin(t * Math.PI) * (dist * 0.15 + 0.05);
    p.multiplyScalar(2.02 + height);
    points.push(p);
  }

  const midIndex = Math.floor(segments / 2);
  const mid = points[midIndex];
  const up = mid.clone().normalize();

  return (
    <group>
      <Line 
        points={points} 
        color={isOffline ? "#3f3f46" : "#818cf8"} 
        lineWidth={isOffline ? 1 : 2} 
        transparent 
        opacity={isOffline ? 0.3 : 1} 
      />
      {!isOffline && (
        <Billboard
          position={mid.clone().add(up.clone().multiplyScalar(0.1))}
          follow={true}
        >
          <Text
            fontSize={0.08}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.015}
            outlineColor="#000000"
          >
            {link.cost}
          </Text>
        </Billboard>
      )}
    </group>
  );
}

function Globe({ onAddNode, nodes, isPlacementMode, links, showLinks, theme, simulation, setSimulation }: { 
  onAddNode: (pos: THREE.Vector3) => void; 
  nodes: RouterNode[]; 
  isPlacementMode: boolean;
  links: NetworkLink[];
  showLinks: boolean;
  theme: 'night' | 'day';
  simulation: SimulationState;
  setSimulation: React.Dispatch<React.SetStateAction<SimulationState>>;
}) {
  const globeRef = useRef<THREE.Mesh>(null);
  const mouseDownPos = useRef<{ x: number, y: number } | null>(null);

  // Animation Loop for Simulation
  useFrame((_, delta) => {
    if (simulation.isActive && simulation.path.length > 0) {
      setSimulation(prev => {
        if (prev.currentHopIndex >= prev.path.length - 1) {
          return prev; // Finished
        }

        const nextProgress = prev.progress + delta * 0.5; // Speed (Slowed down)
        if (nextProgress >= 1) {
          const nextHopIndex = prev.currentHopIndex + 1;
          const nextHop = prev.path[nextHopIndex];
          const newLogs = [...prev.logs];
          
          if (nextHop.type === 'router') {
            newLogs.push(`Hop ${nextHopIndex}: ${nextHop.label} (Cost: ${nextHop.hopCost})`);
          } else if (nextHopIndex === prev.path.length - 1) {
            newLogs.push(`Success: Delivered to ${nextHop.label} (Cost: ${nextHop.hopCost})`);
            newLogs.push(`Total Path Cost: ${prev.totalCost}`);
          }

          return {
            ...prev,
            currentHopIndex: nextHopIndex,
            progress: 0,
            logs: newLogs
          };
        }

        return { ...prev, progress: nextProgress };
      });
    }
  });
  
  // Load textures
  const [colorMap, normalMap, specularMap, lightsMap] = useLoader(THREE.TextureLoader, [
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_lights_2048.png'
  ]);

  const handlePointerDown = (e: any) => {
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: any) => {
    if (!mouseDownPos.current || !isPlacementMode) return;
    
    const dx = e.clientX - mouseDownPos.current.x;
    const dy = e.clientY - mouseDownPos.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Only add node if it was a click (small movement), not a drag
    if (dist < 5) {
      const point = e.point.clone();
      point.normalize().multiplyScalar(2.05);
      onAddNode(point);
    }
    mouseDownPos.current = null;
  };

  return (
    <group>
      <mesh 
        ref={globeRef} 
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          map={colorMap}
          normalMap={normalMap}
          roughnessMap={specularMap}
          emissiveMap={lightsMap}
          emissive={theme === 'night' ? new THREE.Color(0xffff88) : new THREE.Color(0x000000)}
          emissiveIntensity={theme === 'night' ? 2 : 0}
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>
      
      {/* Atmosphere Glow */}
      <mesh scale={[1.02, 1.02, 1.02]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshPhongMaterial
          color={theme === 'night' ? "#4f46e5" : "#93c5fd"}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
        />
      </mesh>

      {nodes.map((node, i) => (
        <RouterMarker key={node.id} node={node} index={i} showLinks={showLinks} />
      ))}

      {showLinks && links.map(link => (
        <LinkLine 
          key={link.id} 
          link={link} 
          nodes={nodes} 
          simulationPath={simulation.isActive ? simulation.path : undefined} 
        />
      ))}

      {simulation.isActive && simulation.path.length > 0 && (
        <Packet 
          path={simulation.path} 
          currentHopIndex={simulation.currentHopIndex} 
          progress={simulation.progress} 
        />
      )}
    </group>
  );
}

// --- UI Components ---

function Sidebar({ 
  nodes, 
  onRemoveNode, 
  onToggleNode,
  onManagePCs,
  onOpenCostTable
}: { 
  nodes: RouterNode[]; 
  onRemoveNode: (id: string) => void;
  onToggleNode: (id: string) => void;
  onManagePCs: (id: string) => void;
  onOpenCostTable: () => void;
}) {
  return (
    <motion.div 
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="fixed left-6 top-24 bottom-6 w-72 bg-neutral-900/80 backdrop-blur-xl border border-white/5 rounded-3xl z-30 flex flex-col overflow-hidden"
    >
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
            <Network className="w-5 h-5" />
          </div>
          <h2 className="font-display font-bold text-xl text-white">OSPF Topology</h2>
        </div>
        <p className="text-xs text-neutral-500">Manage your network nodes and costs.</p>
      </div>

      <div className="p-4">
        <button 
          onClick={onOpenCostTable}
          className="w-full py-3 bg-white/5 hover:bg-white/10 text-neutral-400 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
        >
          <Activity className="w-4 h-4" />
          Set Router Costs
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {nodes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <Activity className="w-8 h-8 text-neutral-700 mb-4" />
            <p className="text-sm text-neutral-500 font-medium">No nodes deployed yet.</p>
          </div>
        ) : (
          nodes.map((node, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={node.id}
              className={`p-3 border rounded-xl group transition-colors ${
                node.status === 'online' 
                  ? 'bg-white/5 border-white/5 hover:border-indigo-500/30' 
                  : 'bg-red-500/5 border-red-500/20 grayscale opacity-60'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className={`text-sm font-bold ${node.status === 'online' ? 'text-white' : 'text-neutral-500'}`}>{node.name}</h3>
                  <p className="text-[10px] text-neutral-500 font-mono">ID: {node.id.slice(0, 8)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => onManagePCs(node.id)}
                    title="Manage PCs"
                    className="p-1.5 text-neutral-500 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-all"
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onToggleNode(node.id)}
                    title={node.status === 'online' ? 'Disable Router' : 'Enable Router'}
                    className={`p-1.5 rounded-lg transition-all ${
                      node.status === 'online' 
                        ? 'text-neutral-500 hover:text-amber-400 hover:bg-amber-400/10' 
                        : 'text-green-500 hover:bg-green-500/10'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onRemoveNode(node.id)}
                    className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${node.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className={`text-[10px] uppercase tracking-tighter font-bold ${
                    node.status === 'online' ? 'text-neutral-400' : 'text-red-500'
                  }`}>
                    Status: {node.status}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-600 font-bold">PCs: {node.pcs.length}</span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="p-4 bg-white/5 border-t border-white/5">
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>Active Nodes</span>
          <span className="font-bold text-white">{nodes.length}</span>
        </div>
      </div>
    </motion.div>
  );
}

function PCManagerModal({
  router,
  onAddPC,
  onUpdatePCCost,
  onRemovePC,
  onClose
}: {
  router: RouterNode;
  onAddPC: (id: string) => void;
  onUpdatePCCost: (routerId: string, pcId: string, cost: number) => void;
  onRemovePC: (routerId: string, pcId: string) => void;
  onClose: () => void;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[70vh] flex flex-col overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-display font-bold text-white">Manage PCs: {router.name}</h2>
            <p className="text-sm text-neutral-500">Configure local network devices and their costs.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl text-neutral-400 hover:text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {router.pcs.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-neutral-500 border border-white/5 rounded-2xl bg-white/[0.02]">
              <Monitor className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">No PCs connected to this router.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {router.pcs.map((pc, idx) => (
                <div key={pc.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{pc.ip}</p>
                      <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-tighter">Device ID: {pc.id.slice(0, 6)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-neutral-500 font-bold uppercase mb-1">Link Cost</span>
                      <input 
                        type="number"
                        min="1"
                        value={pc.cost}
                        onChange={(e) => onUpdatePCCost(router.id, pc.id, parseInt(e.target.value) || 1)}
                        className="w-20 bg-neutral-950 border border-white/10 rounded-lg p-2 text-sm text-white text-center focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                    <button 
                      onClick={() => onRemovePC(router.id, pc.id)}
                      className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 flex flex-col gap-4">
          <button 
            onClick={() => onAddPC(router.id)}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-5 h-5" />
            Add New PC
          </button>
          <button 
            onClick={onClose}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-neutral-400 rounded-xl font-bold text-sm transition-all"
          >
            Close Manager
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SimulationModal({
  nodes,
  onStart,
  onClose,
  calculateSPF
}: {
  nodes: RouterNode[];
  onStart: (sourceIp: string, destIp: string) => void;
  onClose: () => void;
  calculateSPF: (sourceId: string) => { distances: Record<string, number>; previous: Record<string, string | null> } | null;
}) {
  const [sourceIp, setSourceIp] = useState('');
  const [destIp, setDestIp] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleStart = () => {
    setError(null);
    const allPCs = nodes.flatMap(n => n.pcs);
    const sourcePC = allPCs.find(pc => pc.ip === sourceIp);
    const destPC = allPCs.find(pc => pc.ip === destIp);

    if (!sourcePC || !destPC) {
      setError('IP address is invalid');
      return;
    }

    if (sourceIp === destIp) {
      setError('Source and destination cannot be the same');
      return;
    }

    // Check reachability
    const sourceRouter = nodes.find(n => n.pcs.some(pc => pc.ip === sourceIp));
    const destRouter = nodes.find(n => n.pcs.some(pc => pc.ip === destIp));

    if (!sourceRouter || !destRouter) {
      setError('IP address not reachable');
      return;
    }

    if (sourceRouter.status === 'offline') {
      setError(`Source router (${sourceRouter.name}) is offline`);
      return;
    }

    if (destRouter.status === 'offline') {
      setError(`Destination router (${destRouter.name}) is offline`);
      return;
    }

    const spf = calculateSPF(sourceRouter.id);
    if (!spf || spf.distances[destRouter.id] === Infinity) {
      setError('No path available through current network topology');
      return;
    }
    
    onStart(sourceIp, destIp);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-md p-8 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display font-bold text-white">Network Simulation</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-white"><X /></button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Source PC IP</label>
            <input 
              type="text"
              value={sourceIp}
              onChange={(e) => setSourceIp(e.target.value)}
              placeholder="e.g. 192.168.1.10"
              className="w-full bg-neutral-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 placeholder:text-neutral-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Destination PC IP</label>
            <input 
              type="text"
              value={destIp}
              onChange={(e) => setDestIp(e.target.value)}
              placeholder="e.g. 192.168.2.10"
              className="w-full bg-neutral-800 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500 placeholder:text-neutral-600"
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold text-center"
            >
              {error}
            </motion.div>
          )}

          <button 
            disabled={!sourceIp || !destIp}
            onClick={handleStart}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Start Simulation
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TracertPanel({ logs, onClose }: { logs: string[]; onClose: () => void }) {
  return (
    <motion.div 
      initial={{ x: 400 }}
      animate={{ x: 0 }}
      exit={{ x: 400 }}
      className="fixed right-6 top-24 bottom-6 w-72 bg-neutral-900/90 backdrop-blur-xl border border-white/10 rounded-3xl z-50 flex flex-col overflow-hidden shadow-2xl"
    >
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <h2 className="font-bold text-sm text-white">Tracert Output</h2>
        </div>
        <button onClick={onClose} className="text-neutral-500 hover:text-white"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-1.5">
        {logs.map((log, i) => (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            key={i} 
            className="text-neutral-300 flex gap-2"
          >
            <span className="text-neutral-600">{i + 1}</span>
            <span>{log}</span>
          </motion.div>
        ))}
        {logs.length === 0 && <p className="text-neutral-600 italic">Waiting for simulation...</p>}
      </div>
    </motion.div>
  );
}

function CostTableModal({ 
  nodes, 
  links, 
  onUpdateLink, 
  onClose 
}: { 
  nodes: RouterNode[]; 
  links: NetworkLink[]; 
  onUpdateLink: (fromId: string, toId: string, cost: number) => void;
  onClose: () => void;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-display font-bold text-white">OSPF Cost Matrix</h2>
            <p className="text-sm text-neutral-500">Define the OSPF cost between router nodes.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl text-neutral-400 hover:text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {nodes.length < 2 ? (
            <div className="h-64 flex flex-col items-center justify-center text-neutral-500">
              <Info className="w-12 h-12 mb-4 opacity-20" />
              <p>Deploy at least 2 nodes to configure links.</p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-3 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-white/5">From \ To</th>
                  {nodes.map(node => (
                    <th key={node.id} className="p-3 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-white/5">
                      {node.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {nodes.map(fromNode => (
                  <tr key={fromNode.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-3 text-sm font-bold text-indigo-400">{fromNode.name}</td>
                    {nodes.map(toNode => {
                      if (fromNode.id === toNode.id) {
                        return <td key={toNode.id} className="p-3 text-neutral-700 bg-neutral-950/50 text-center">-</td>;
                      }
                      const link = links.find(l => 
                        (l.fromId === fromNode.id && l.toId === toNode.id) ||
                        (l.fromId === toNode.id && l.toId === fromNode.id)
                      );
                      return (
                        <td key={toNode.id} className="p-2">
                          <input 
                            type="number"
                            min="1"
                            value={link?.cost || ''}
                            placeholder="∞"
                            onChange={(e) => onUpdateLink(fromNode.id, toNode.id, parseInt(e.target.value) || 0)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-6 border-t border-white/10 flex justify-end">
          <button 
            onClick={onClose}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all"
          >
            Save Configuration
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function LSDBModal({ 
  nodes, 
  links, 
  onClose 
}: { 
  nodes: RouterNode[]; 
  links: NetworkLink[]; 
  onClose: () => void;
}) {
  const [sourceNodeId, setSourceNodeId] = useState<string>(nodes[0]?.id || '');

  // Dijkstra's Algorithm
  const calculateSPF = (sourceId: string) => {
    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};
    const activeNodes = nodes.filter(n => n.status === 'online');
    const unvisited = new Set(activeNodes.map(n => n.id));

    if (!activeNodes.find(n => n.id === sourceId)) return null;

    activeNodes.forEach(node => {
      distances[node.id] = node.id === sourceId ? 0 : Infinity;
      previous[node.id] = null;
    });

    while (unvisited.size > 0) {
      let currentId = Array.from(unvisited).reduce((minId, id) => 
        distances[id] < distances[minId] ? id : minId
      );

      if (distances[currentId] === Infinity) break;

      unvisited.delete(currentId);

      // Only consider links between online nodes
      const neighbors = links.filter(l => {
        const fromNode = nodes.find(n => n.id === l.fromId);
        const toNode = nodes.find(n => n.id === l.toId);
        return (l.fromId === currentId || l.toId === currentId) && 
               fromNode?.status === 'online' && 
               toNode?.status === 'online';
      });

      neighbors.forEach(link => {
        const neighborId = link.fromId === currentId ? link.toId : link.fromId;
        if (unvisited.has(neighborId)) {
          const alt = distances[currentId] + link.cost;
          if (alt < distances[neighborId]) {
            distances[neighborId] = alt;
            previous[neighborId] = currentId;
          }
        }
      });
    }

    return { distances, previous };
  };

  const spfResults = sourceNodeId ? calculateSPF(sourceNodeId) : null;

  const getPath = (targetId: string) => {
    if (!spfResults) return [];
    const path = [];
    let curr: string | null = targetId;
    while (curr) {
      const node = nodes.find(n => n.id === curr);
      if (node) path.unshift(node.name);
      curr = spfResults.previous[curr];
    }
    return path.length > 1 ? path.join(' → ') : 'Self';
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-display font-bold text-white">Link State Database (LSDB)</h2>
            <p className="text-sm text-neutral-500">Current Link State Advertisements and SPF Calculations.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl text-neutral-400 hover:text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-8">
          {/* LSA Section */}
          <section>
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">Link State Advertisements</h3>
            {links.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-neutral-500 border border-white/5 rounded-2xl bg-white/[0.02]">
                <Database className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">No LSAs found.</p>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-white/5">#</th>
                    <th className="p-3 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-white/5">Link ID</th>
                    <th className="p-3 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-white/5">Source</th>
                    <th className="p-3 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-white/5">Destination</th>
                    <th className="p-3 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-white/5 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((link, idx) => {
                    const fromNode = nodes.find(n => n.id === link.fromId);
                    const toNode = nodes.find(n => n.id === link.toId);
                    return (
                      <tr key={link.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 text-xs font-bold text-indigo-400">{idx + 1}</td>
                        <td className="p-3 text-xs font-mono text-neutral-400">{link.id.slice(0, 8)}</td>
                        <td className="p-3 text-sm text-white font-bold">{fromNode?.name || 'Unknown'}</td>
                        <td className="p-3 text-sm text-white font-bold">{toNode?.name || 'Unknown'}</td>
                        <td className="p-3 text-sm text-indigo-400 font-bold text-right">{link.cost}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

          {/* SPF Section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Shortest Path First (SPF) Results</h3>
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-500">Source Router:</span>
                <select 
                  value={sourceNodeId}
                  onChange={(e) => setSourceNodeId(e.target.value)}
                  className="bg-neutral-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {nodes.map(node => (
                    <option key={node.id} value={node.id}>{node.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {nodes.length === 0 ? (
              <p className="text-sm text-neutral-500 text-center py-8">Deploy nodes to calculate SPF.</p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-white/5">Destination</th>
                    <th className="p-3 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-white/5">OSPF Path</th>
                    <th className="p-3 text-left text-xs font-bold text-neutral-500 uppercase tracking-widest border-b border-white/5 text-right">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.map(node => (
                    <tr key={node.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 text-sm text-white font-bold">{node.name}</td>
                      <td className="p-3 text-xs font-medium text-neutral-400">
                        {getPath(node.id)}
                      </td>
                      <td className="p-3 text-sm text-indigo-400 font-bold text-right">
                        {spfResults?.distances[node.id] === Infinity ? '∞' : spfResults?.distances[node.id]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Header({ theme, onToggleTheme, onBackToIntro }: { theme: 'night' | 'day'; onToggleTheme: () => void; onBackToIntro: () => void }) {
  return (
    <header className="fixed top-0 left-0 w-full z-40 px-6 py-8 flex justify-between items-center pointer-events-none">
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Network className="text-white w-6 h-6" />
        </div>
        <span className="font-display text-2xl font-bold tracking-tighter text-white">OSPF GLOBE</span>
      </div>

      <div className="flex items-center gap-4 pointer-events-auto">
        <button 
          onClick={onBackToIntro}
          className="p-3 bg-neutral-900/80 backdrop-blur-md border border-white/5 rounded-xl text-neutral-400 hover:text-white transition-colors flex items-center gap-2"
          title="Back to Introduction"
        >
          <Info className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Intro</span>
        </button>
        <button 
          onClick={onToggleTheme}
          className="p-3 bg-neutral-900/80 backdrop-blur-md border border-white/5 rounded-xl text-neutral-400 hover:text-white transition-colors flex items-center gap-2"
        >
          {theme === 'night' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          <span className="text-xs font-bold uppercase tracking-widest">{theme === 'night' ? 'Night' : 'Day'}</span>
        </button>
      </div>
    </header>
  );
}

function LandingSection({ onEnter }: { onEnter: () => void }) {
  return (
    <motion.div 
      initial={{ y: 0 }}
      exit={{ y: '-100%' }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      className="fixed inset-0 z-[100] bg-neutral-950 flex flex-col overflow-y-auto overflow-x-hidden selection:bg-indigo-500/30"
    >
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center relative px-6 py-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center max-w-4xl z-10"
        >
          <h1 className="text-6xl md:text-8xl font-display font-black text-white mb-8 tracking-tighter">
            OSPF <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Global</span> Visualizer
          </h1>
          <p className="text-xl md:text-2xl text-neutral-400 mb-12 leading-relaxed font-light">
            Experience the dynamics of Open Shortest Path First (OSPF) routing through a real-time, interactive 3D global topology simulation.
          </p>
        </motion.div>
      </section>

      {/* Content Sections */}
      <section className="max-w-6xl mx-auto px-6 py-32 grid md:grid-cols-2 gap-20 items-center border-t border-white/5">
        <div className="space-y-8">
          <h2 className="text-4xl font-display font-bold text-white">What is OSPF?</h2>
          <p className="text-lg text-neutral-400 leading-relaxed">
            Open Shortest Path First (OSPF) is a powerful link-state routing protocol designed for large-scale enterprise networks. It operates by maintaining a complete map of the network topology, allowing routers to make intelligent, independent routing decisions.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-neutral-900/50 border border-white/5">
              <Zap className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="text-white font-bold mb-2">Fast Convergence</h3>
              <p className="text-sm text-neutral-500">Instantly reacts to topology changes and link failures.</p>
            </div>
            <div className="p-6 rounded-2xl bg-neutral-900/50 border border-white/5">
              <Network className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-white font-bold mb-2">Scalability</h3>
              <p className="text-sm text-neutral-500">Efficiently handles complex networks with hierarchical areas.</p>
            </div>
          </div>
        </div>
        <div className="relative aspect-square rounded-3xl bg-gradient-to-br from-indigo-600/20 to-blue-600/20 border border-white/10 overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
          <GlobeIcon className="w-48 h-48 text-indigo-500/40 animate-pulse" />
        </div>
      </section>

      <section className="bg-neutral-900/30 py-32">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-display font-bold text-white text-center mb-20">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { title: "Neighbor Discovery", desc: "Routers identify peers using Hello packets to establish adjacencies.", icon: <Plus className="text-indigo-400" /> },
              { title: "LSA Exchange", desc: "Link State Advertisements are flooded throughout the network area.", icon: <Share2 className="text-blue-400" /> },
              { title: "LSDB Sync", desc: "Every router builds an identical map of the entire network topology.", icon: <Database className="text-indigo-400" /> },
              { title: "SPF Calculation", desc: "Dijkstra's algorithm runs to find the mathematically shortest path.", icon: <Cpu className="text-blue-400" /> }
            ].map((step, i) => (
              <div key={i} className="relative p-8 rounded-3xl bg-neutral-900 border border-white/5 hover:border-indigo-500/50 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{step.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{step.desc}</p>
                <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center text-xs font-bold text-neutral-600">
                  0{i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-32 text-center">
        <h2 className="text-4xl font-display font-bold text-white mb-8">Ready to Simulate?</h2>
        <p className="text-xl text-neutral-400 mb-12 max-w-2xl mx-auto">
          Dive into the interactive environment. Place nodes, configure costs, and watch the OSPF protocol optimize your global network in real-time.
        </p>
        <button 
          onClick={onEnter}
          className="flex flex-col items-center gap-6 mx-auto group cursor-pointer"
        >
          <span className="text-sm font-display font-bold uppercase tracking-[0.4em] text-indigo-400 group-hover:text-white transition-all duration-500">
            Explore Network
          </span>
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="text-neutral-600 group-hover:text-indigo-500 transition-colors duration-500"
          >
            <ChevronDown className="w-10 h-10" strokeWidth={1} />
          </motion.div>
        </button>
      </section>

      <footer className="py-12 border-t border-white/5 text-center">
        <p className="text-neutral-600 text-sm font-medium tracking-widest uppercase">
          OSPF Visualizer &copy; 2026
        </p>
      </footer>
    </motion.div>
  );
}

export default function App() {
  const [nodes, setNodes] = useState<RouterNode[]>([]);
  const [links, setLinks] = useState<NetworkLink[]>([]);
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const [isCostTableOpen, setIsCostTableOpen] = useState(false);
  const [isLSDBOpen, setIsLSDBOpen] = useState(false);
  const [activeRouterForPC, setActiveRouterForPC] = useState<string | null>(null);
  const [isSimulationModalOpen, setIsSimulationModalOpen] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [simulation, setSimulation] = useState<SimulationState>({
    isActive: false,
    sourceIp: '',
    destIp: '',
    path: [],
    currentHopIndex: 0,
    progress: 0,
    logs: [],
    totalCost: 0
  });
  const [theme, setTheme] = useState<'night' | 'day'>('night');
  const [showLinks, setShowLinks] = useState(true);

  // Dijkstra's Algorithm
  const calculateSPF = (sourceId: string) => {
    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};
    const activeNodes = nodes.filter(n => n.status === 'online');
    const unvisited = new Set(activeNodes.map(n => n.id));

    if (!activeNodes.find(n => n.id === sourceId)) return null;

    activeNodes.forEach(node => {
      distances[node.id] = node.id === sourceId ? 0 : Infinity;
      previous[node.id] = null;
    });

    while (unvisited.size > 0) {
      let currentId = Array.from(unvisited).reduce((minId, id) => 
        distances[id] < distances[minId] ? id : minId
      );

      if (distances[currentId] === Infinity) break;

      unvisited.delete(currentId);

      // Only consider links between online nodes
      const neighbors = links.filter(l => {
        const fromNode = nodes.find(n => n.id === l.fromId);
        const toNode = nodes.find(n => n.id === l.toId);
        return (l.fromId === currentId || l.toId === currentId) && 
               fromNode?.status === 'online' && 
               toNode?.status === 'online';
      });

      neighbors.forEach(link => {
        const neighborId = link.fromId === currentId ? link.toId : link.fromId;
        if (unvisited.has(neighborId)) {
          const alt = distances[currentId] + link.cost;
          if (alt < distances[neighborId]) {
            distances[neighborId] = alt;
            previous[neighborId] = currentId;
          }
        }
      });
    }

    return { distances, previous };
  };

  const startSimulation = (sourceIp: string, destIp: string) => {
    const sourcePC = nodes.flatMap(n => n.pcs).find(pc => pc.ip === sourceIp);
    const destPC = nodes.flatMap(n => n.pcs).find(pc => pc.ip === destIp);
    const sourceRouter = nodes.find(n => n.pcs.some(pc => pc.ip === sourceIp));
    const destRouter = nodes.find(n => n.pcs.some(pc => pc.ip === destIp));

    if (!sourcePC || !destPC || !sourceRouter || !destRouter) return;

    const spf = calculateSPF(sourceRouter.id);
    if (!spf || spf.distances[destRouter.id] === Infinity) {
      return;
    }

    // Build router path
    const routerPath = [];
    let curr: string | null = destRouter.id;
    while (curr) {
      const node = nodes.find(n => n.id === curr);
      if (node) routerPath.unshift(node);
      curr = spf.previous[curr];
    }

    // Full path with costs
    // 1. PC to Source Router
    const fullPath = [
      { type: 'pc', id: sourcePC.id, position: sourcePC.position, label: sourcePC.ip, hopCost: 0 },
      { type: 'router', id: sourceRouter.id, position: sourceRouter.position, label: sourceRouter.name, hopCost: sourcePC.cost }
    ];

    // 2. Router to Router
    for (let i = 1; i < routerPath.length; i++) {
      const prevRouter = routerPath[i - 1];
      const currRouter = routerPath[i];
      const cost = spf.distances[currRouter.id] - spf.distances[prevRouter.id];
      fullPath.push({ 
        type: 'router', 
        id: currRouter.id, 
        position: currRouter.position, 
        label: currRouter.name, 
        hopCost: cost 
      });
    }

    // 3. Dest Router to Dest PC
    fullPath.push({ 
      type: 'pc', 
      id: destPC.id, 
      position: destPC.position, 
      label: destPC.ip, 
      hopCost: destPC.cost 
    });

    const totalCost = sourcePC.cost + spf.distances[destRouter.id] + destPC.cost;

    setSimulation({
      isActive: true,
      sourceIp,
      destIp,
      path: fullPath,
      currentHopIndex: 0,
      progress: 0,
      logs: [`Tracing route to ${destIp}...`],
      totalCost
    });
    setIsSimulationModalOpen(false);
  };

  const addNode = (position: THREE.Vector3) => {
    const newNode: RouterNode = {
      id: Math.random().toString(36).substr(2, 9),
      position,
      name: `Router-${nodes.length + 1}`,
      status: 'online',
      pcs: []
    };
    setNodes(prev => [...prev, newNode]);
    // Automatically exit placement mode after adding
    setIsPlacementMode(false);
  };

  const addPC = (routerId: string) => {
    setNodes(prev => prev.map(node => {
      if (node.id === routerId) {
        const routerIndex = prev.findIndex(n => n.id === routerId);
        const pcIndex = node.pcs.length;
        const ip = `192.168.${routerIndex + 1}.${10 + pcIndex}`;
        
        // Calculate a position close to the router on the sphere
        // We use the router's normal vector and add a small offset
        const normal = node.position.clone().normalize();
        const tangent = new THREE.Vector3(0, 1, 0).cross(normal).normalize();
        const bitangent = normal.clone().cross(tangent).normalize();
        
        // Random angle for PC placement around router
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.15 + Math.random() * 0.1;
        
        const offset = tangent.clone().multiplyScalar(Math.cos(angle) * radius)
          .add(bitangent.clone().multiplyScalar(Math.sin(angle) * radius));
        
        const pcPosition = node.position.clone().add(offset).normalize().multiplyScalar(2.05);

        return {
          ...node,
          pcs: [...node.pcs, { id: Math.random().toString(36).substr(2, 9), ip, position: pcPosition, cost: 1 }]
        };
      }
      return node;
    }));
  };

  const updatePCCost = (routerId: string, pcId: string, cost: number) => {
    setNodes(prev => prev.map(node => {
      if (node.id === routerId) {
        return {
          ...node,
          pcs: node.pcs.map(pc => pc.id === pcId ? { ...pc, cost } : pc)
        };
      }
      return node;
    }));
  };

  const removePC = (routerId: string, pcId: string) => {
    setNodes(prev => prev.map(node => {
      if (node.id === routerId) {
        return {
          ...node,
          pcs: node.pcs.filter(pc => pc.id !== pcId)
        };
      }
      return node;
    }));
  };

  const removeNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setLinks(prev => prev.filter(l => l.fromId !== id && l.toId !== id));
  };

  const updateLink = (fromId: string, toId: string, cost: number) => {
    setLinks(prev => {
      const existing = prev.find(l => 
        (l.fromId === fromId && l.toId === toId) ||
        (l.fromId === toId && l.toId === fromId)
      );

      if (cost <= 0) {
        return prev.filter(l => l !== existing);
      }

      if (existing) {
        return prev.map(l => l === existing ? { ...l, cost, sequenceNumber: l.sequenceNumber + 1 } : l);
      }
      
      return [...prev, { id: `${fromId}-${toId}`, fromId, toId, cost, sequenceNumber: 0x80000001 }];
    });
  };

  return (
    <main className="relative w-full h-screen bg-neutral-950 font-sans selection:bg-indigo-500/30 overflow-hidden">
      <AnimatePresence>
        {showLanding && <LandingSection onEnter={() => setShowLanding(false)} />}
      </AnimatePresence>

      {/* 3D Scene */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows dpr={[1, 2]}>
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={45} />
            <ambientLight intensity={theme === 'night' ? 1.2 : 2.5} />
            <directionalLight position={[5, 5, 5]} intensity={theme === 'night' ? 1.8 : 3.5} castShadow />
            <pointLight position={[-10, -10, -10]} intensity={theme === 'night' ? 0.8 : 1.5} />
            
            <Globe 
              onAddNode={addNode} 
              nodes={nodes} 
              isPlacementMode={isPlacementMode} 
              links={links}
              showLinks={showLinks}
              theme={theme}
              simulation={simulation}
              setSimulation={setSimulation}
            />

            {theme === 'night' ? (
              <>
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
                  <mesh position={[15, 10, -20]}>
                    <sphereGeometry args={[1.5, 32, 32]} />
                    <meshStandardMaterial color="#fefce8" emissive="#fefce8" emissiveIntensity={0.5} />
                  </mesh>
                </Float>
              </>
            ) : (
              <>
                <Sky sunPosition={[100, 20, 100]} />
                <Float speed={2} rotationIntensity={0.2} floatIntensity={0.2}>
                  <mesh position={[20, 15, -30]}>
                    <sphereGeometry args={[4, 32, 32]} />
                    <meshBasicMaterial color="#fbbf24" />
                    <pointLight intensity={1000} color="#fbbf24" />
                  </mesh>
                </Float>
              </>
            )}
            
            <OrbitControls 
              enablePan={false} 
              minDistance={3} 
              maxDistance={10}
              autoRotate={false}
            />
            <Environment preset={theme === 'night' ? "night" : "city"} />
          </Suspense>
        </Canvas>
      </div>

      {/* UI Overlay */}
      <Header 
        theme={theme} 
        onToggleTheme={() => setTheme(theme === 'night' ? 'day' : 'night')} 
        onBackToIntro={() => setShowLanding(true)}
      />
      <Sidebar 
        nodes={nodes} 
        onRemoveNode={removeNode} 
        onToggleNode={(id) => {
          setNodes(prev => prev.map(n => n.id === id ? { ...n, status: n.status === 'online' ? 'offline' : 'online' } : n));
        }}
        onManagePCs={(id) => setActiveRouterForPC(id)}
        onOpenCostTable={() => setIsCostTableOpen(true)}
      />

      <AnimatePresence>
        {activeRouterForPC && (
          <PCManagerModal 
            router={nodes.find(n => n.id === activeRouterForPC)!}
            onAddPC={addPC}
            onUpdatePCCost={updatePCCost}
            onRemovePC={removePC}
            onClose={() => setActiveRouterForPC(null)}
          />
        )}
        {isCostTableOpen && (
          <CostTableModal 
            nodes={nodes}
            links={links}
            onUpdateLink={updateLink}
            onClose={() => setIsCostTableOpen(false)}
          />
        )}
        {isLSDBOpen && (
          <LSDBModal 
            nodes={nodes}
            links={links}
            onClose={() => setIsLSDBOpen(false)}
          />
        )}
        {isSimulationModalOpen && (
          <SimulationModal 
            nodes={nodes}
            onStart={startSimulation}
            onClose={() => setIsSimulationModalOpen(false)}
            calculateSPF={calculateSPF}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {simulation.isActive && (
          <TracertPanel 
            logs={simulation.logs} 
            onClose={() => setSimulation(prev => ({ ...prev, isActive: false }))} 
          />
        )}
      </AnimatePresence>

      {/* Right Side Buttons */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-4">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsLSDBOpen(true)}
          className="px-6 py-4 bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-2xl text-indigo-400 hover:text-white hover:bg-indigo-600 transition-all shadow-2xl group flex items-center gap-3"
        >
          <Database className="w-6 h-6" />
          <span className="text-sm font-bold uppercase tracking-widest">View LSDB</span>
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowLinks(!showLinks)}
          className={`px-6 py-4 backdrop-blur-xl border border-white/10 rounded-2xl transition-all shadow-2xl group flex items-center gap-3 ${
            showLinks ? 'bg-indigo-600 text-white' : 'bg-neutral-900/80 text-indigo-400 hover:text-white hover:bg-indigo-600'
          }`}
        >
          <Share2 className="w-6 h-6" />
          <span className="text-sm font-bold uppercase tracking-widest">View Links</span>
        </motion.button>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsSimulationModalOpen(true)}
          className="px-6 py-4 bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-2xl text-indigo-400 hover:text-white hover:bg-indigo-600 transition-all shadow-2xl group flex items-center gap-3"
        >
          <Play className="w-6 h-6" />
          <span className="text-sm font-bold uppercase tracking-widest">Simulation</span>
        </motion.button>
      </div>

      {/* Instructions Overlay */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 px-6 py-3 bg-neutral-900/80 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-4 shadow-2xl"
      >
        <button 
          onClick={() => setIsPlacementMode(!isPlacementMode)}
          className="flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors group"
        >
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${isPlacementMode ? 'bg-indigo-600 text-white' : 'bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/40'}`}>
            <Plus className="w-3 h-3" />
          </div>
          <span>{isPlacementMode ? 'Placement Active' : 'Enable Add Mode to Place'}</span>
        </button>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <MapIcon className="w-3 h-3" />
          </div>
          <span>Drag to Rotate</span>
        </div>
      </motion.div>

      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-indigo-500/5 blur-[150px] rounded-full pointer-events-none -z-10" />
    </main>
  );
}


