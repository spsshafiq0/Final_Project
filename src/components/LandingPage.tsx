import { useState, useEffect } from "react";
import api from "../lib/api";
import {
  Trash2, Cpu, Zap, Shield, TrendingUp, Recycle,
  Users, ChevronRight, ArrowDown, CheckCircle, Globe,
  Leaf, Award, Wifi, Activity, Radio, Truck, Sparkles,
  Layers, MapPin, Gauge, ShieldAlert, ArrowUpRight,
  SlidersHorizontal, CheckCircle2, ChevronDown, Flame,
  Compass, BatteryCharging, Building2, Store, Lock
} from "lucide-react";

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

// ── 3D Smart Bin Graphic Component ──────────────────────────────────────
function SmartBin3D() {
  const W = 130, H = 170, D = 85;
  const hw = W / 2, hh = H / 2, hd = D / 2;

  const faceBase: React.CSSProperties = {
    position: "absolute",
    backfaceVisibility: "hidden",
  };

  const frontFace: React.CSSProperties = {
    ...faceBase,
    width: W, height: H, left: 0, top: 0,
    transform: `translateZ(${hd}px)`,
    background: "linear-gradient(175deg, #0f2718 0%, #06150b 100%)",
    border: "1.5px solid rgba(52, 211, 153, 0.45)",
    borderRadius: "10px 10px 14px 14px",
    boxShadow: "inset 0 0 20px rgba(16, 185, 129, 0.2)",
    overflow: "hidden",
  };

  const backFace: React.CSSProperties = {
    ...faceBase,
    width: W, height: H, left: 0, top: 0,
    transform: `rotateY(180deg) translateZ(${hd}px)`,
    background: "#040d07",
    border: "1px solid rgba(52, 211, 153, 0.2)",
    borderRadius: "10px 10px 14px 14px",
  };

  const leftFace: React.CSSProperties = {
    ...faceBase,
    width: D, height: H,
    left: (W - D) / 2, top: 0,
    transform: `rotateY(-90deg) translateZ(${hw}px)`,
    background: "linear-gradient(175deg, #091a10 0%, #030a05 100%)",
    border: "1px solid rgba(52, 211, 153, 0.3)",
  };

  const rightFace: React.CSSProperties = {
    ...faceBase,
    width: D, height: H,
    left: (W - D) / 2, top: 0,
    transform: `rotateY(90deg) translateZ(${hw}px)`,
    background: "linear-gradient(175deg, #0b2214 0%, #030a05 100%)",
    border: "1px solid rgba(52, 211, 153, 0.35)",
    overflow: "hidden",
  };

  const topFace: React.CSSProperties = {
    ...faceBase,
    width: W + 14, height: D + 10,
    left: -7, top: (H - D) / 2,
    transform: `rotateX(-90deg) translateZ(${hh}px)`,
    background: "linear-gradient(135deg, #133a21 0%, #0a2012 100%)",
    border: "2px solid rgba(52, 211, 153, 0.6)",
    borderRadius: "8px",
  };

  const bottomFace: React.CSSProperties = {
    ...faceBase,
    width: W, height: D,
    left: 0, top: (H - D) / 2,
    transform: `rotateX(90deg) translateZ(${hh}px)`,
    background: "#020804",
    border: "1px solid rgba(52, 211, 153, 0.15)",
  };

  const fill = 74;

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: 320, height: 340 }}>
      {/* IoT Expand Pulse Rings */}
      <div className="iot-ring-1 absolute w-28 h-28 rounded-full border-2 border-emerald-500/40 pointer-events-none" />
      <div className="iot-ring-2 absolute w-28 h-28 rounded-full border-2 border-emerald-400/30 pointer-events-none" />
      <div className="iot-ring-3 absolute w-28 h-28 rounded-full border-2 border-cyan-400/20 pointer-events-none" />

      {/* 3D Scene */}
      <div style={{ width: W, height: H, perspective: 1000, perspectiveOrigin: "50% 35%" }}>
        <div className="bin-spin relative" style={{ width: W, height: H, transformStyle: "preserve-3d" }}>
          <div style={bottomFace} />
          
          {/* Back */}
          <div style={backFace}>
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <div className="text-[9px] font-mono tracking-widest text-emerald-400/40">INTELLI-CORE</div>
              <div className="w-10 h-10 border border-emerald-500/30 rounded-lg flex items-center justify-center text-emerald-400/60">
                <Wifi size={18} />
              </div>
            </div>
          </div>

          {/* Left */}
          <div style={leftFace}>
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-[8px] font-mono tracking-widest text-emerald-400/40 rotate-180 [writing-mode:vertical-rl]">
                SMART GRID NODE
              </span>
            </div>
          </div>

          {/* Right */}
          <div style={rightFace}>
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-500/30 to-transparent border-t border-emerald-400"
              style={{ height: `${fill}%` }}
            />
            <span className="absolute bottom-2 right-2 text-[9px] font-mono font-bold text-emerald-400">
              {fill}%
            </span>
          </div>

          {/* Top Lid */}
          <div style={topFace}>
            <div className="w-full h-full flex items-center justify-center relative">
              <div className="w-8 h-2 bg-emerald-400/70 rounded-full" />
              <div className="absolute top-1.5 right-2 flex gap-1">
                <div className="led-blink-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <div className="led-blink-2 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <div className="led-blink-3 w-1.5 h-1.5 rounded-full bg-amber-400" />
              </div>
            </div>
          </div>

          {/* Front Face Display */}
          <div style={frontFace}>
            <div className="scan-line absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent pointer-events-none z-10" />
            
            <div className="p-2.5 flex flex-col h-full gap-2 text-slate-100">
              {/* Header */}
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-mono tracking-wider font-bold text-emerald-400">INTELLIWASTE</span>
                <div className="flex gap-1 items-center">
                  <div className="led-blink-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <div className="led-blink-2 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                </div>
              </div>

              {/* Status Badge */}
              <div className="bg-emerald-950/70 border border-emerald-500/30 rounded px-1.5 py-0.5 text-[8px] font-mono text-emerald-300 flex justify-between items-center">
                <span>IOT SENSOR ON</span>
                <span className="text-emerald-400 font-bold">LIVE</span>
              </div>

              {/* Fill Gauge */}
              <div className="mt-1">
                <div className="flex justify-between text-[8px] font-mono text-slate-400 mb-1">
                  <span>FILL CAPACITY</span>
                  <span className="text-emerald-300 font-bold">{fill}%</span>
                </div>
                <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400"
                    style={{ width: `${fill}%` }}
                  />
                </div>
              </div>

              {/* Sensor Grid */}
              <div className="grid grid-cols-2 gap-1 text-[7px] font-mono">
                <div className="bg-slate-900/80 border border-slate-700/60 rounded p-1">
                  <div className="text-slate-400">TEMP</div>
                  <div className="text-emerald-400 font-bold">27.4°C</div>
                </div>
                <div className="bg-slate-900/80 border border-slate-700/60 rounded p-1">
                  <div className="text-slate-400">GAS (PPM)</div>
                  <div className="text-emerald-400 font-bold">Normal</div>
                </div>
                <div className="bg-slate-900/80 border border-slate-700/60 rounded p-1">
                  <div className="text-slate-400">WEIGHT</div>
                  <div className="text-cyan-300 font-bold">34 kg</div>
                </div>
                <div className="bg-slate-900/80 border border-slate-700/60 rounded p-1">
                  <div className="text-slate-400">FIRE SHIELD</div>
                  <div className="text-emerald-400 font-bold">Secure</div>
                </div>
              </div>

              {/* Live Status Bar */}
              <div className="mt-auto bg-emerald-500/10 border border-emerald-500/20 rounded px-2 py-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[7.5px] font-mono text-emerald-300 uppercase tracking-tight">Active Node · Telemetry Streaming</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ground Shadow */}
      <div
        className="absolute bottom-2 left-1/2 -translate-x-1/2 w-40 h-5 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(16, 185, 129, 0.35) 0%, transparent 70%)",
          filter: "blur(6px)",
        }}
      />
    </div>
  );
}

// ── Main Senior Landing Page ───────────────────────────────────────────
export default function LandingPage({ onNavigate }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<"citizen" | "driver" | "ward" | "city">("citizen");
  const [liveBins, setLiveBins] = useState<any[]>([]);
  const [activeSorterItem, setActiveSorterItem] = useState("Plastic Bottle (PET)");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    api.bins.getAll().then((res: any) => {
      if (Array.isArray(res) && res.length > 0) {
        setLiveBins(res.slice(0, 5));
      }
    }).catch(() => {});
  }, []);

  const conveyorItems = [
    { name: "Plastic Bottle (PET)", icon: "🥤", category: "Recyclable — Plastic", stage: "Stage 01: Computer Vision + NIR", color: "from-cyan-500/20 to-blue-500/10", border: "border-cyan-500/40", text: "text-cyan-400" },
    { name: "Banana Peels & Food", icon: "🍌", category: "Organic / Biodegradable", stage: "Stage 04: Moisture & Capacitive", color: "from-emerald-500/20 to-green-500/10", border: "border-emerald-500/40", text: "text-emerald-400" },
    { name: "Aluminum Beverage Can", icon: "🥫", category: "Recyclable — Metal", stage: "Stage 02: Inductive Proximity", color: "from-amber-500/20 to-orange-500/10", border: "border-amber-500/40", text: "text-amber-400" },
    { name: "Cardboard Packaging", icon: "📦", category: "Recyclable — Paper", stage: "Stage 01: YOLOv8 Bounding Box", color: "from-yellow-500/20 to-amber-500/10", border: "border-yellow-500/40", text: "text-yellow-400" },
    { name: "Lithium Ion Battery", icon: "🔋", category: "Hazardous / Safe Handling", stage: "Stage 07: Gas & Chemical Detection", color: "from-red-500/20 to-rose-500/10", border: "border-red-500/40", text: "text-red-400" },
  ];

  const currentItemData = conveyorItems.find(i => i.name === activeSorterItem) || conveyorItems[0];

  return (
    <div className="bg-[#030712] text-slate-100 min-h-screen selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden font-sans">
      
      {/* ── TOP FROSTED NAVBAR ────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 h-20 transition-all duration-300 ${
          scrolled
            ? "glass-panel-elevated bg-[#030712]/85 border-b border-slate-800/80 shadow-2xl"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/40">
              <Recycle size={22} className="text-white" />
            </div>
            <div>
              <div className="font-display font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                Intelli<span className="gradient-text-emerald">Waste</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                  v2.4
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider">SMART MUNICIPAL INFRASTRUCTURE</p>
            </div>
          </div>

          {/* Center Navigation Links */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-emerald-400 transition-colors">Platform Features</a>
            <a href="#cvrp" className="hover:text-emerald-400 transition-colors">CVRP Routing</a>
            <a href="#sorting" className="hover:text-emerald-400 transition-colors">Conveyor Sorter</a>
            <a href="#stakeholders" className="hover:text-emerald-400 transition-colors">Portals & Roles</a>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate("setup")}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 transition-all cursor-pointer"
              title="First-time system setup & Super Admin credentials"
            >
              <SlidersHorizontal size={13} className="text-emerald-400" />
              <span>Setup</span>
            </button>

            <button
              onClick={() => onNavigate("citizen")}
              className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 transition-all cursor-pointer shadow-sm"
            >
              <Users size={14} />
              <span>Citizen Portal</span>
            </button>

            <button
              onClick={() => onNavigate("admin")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 cursor-pointer"
            >
              <Lock size={14} />
              <span>Operations Portal</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden bg-radial-gradient">
        {/* Background Grids & Ambient Lights */}
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[450px] h-[350px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Status Pill Badge */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-medium shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>IoT Mesh · Dynamic CVRP · AI Conveyor Segregation</span>
              </div>

              {/* Main Headline */}
              <h1 className="font-display font-black text-4xl sm:text-6xl lg:text-7xl leading-[1.08] tracking-tight text-white">
                Autonomous <span className="gradient-text-emerald">Waste Logistics</span> for Next-Gen Cities.
              </h1>

              {/* Sub-headline */}
              <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                IntelliWaste integrates real-time IoT dumpster telemetry, dynamic Capacitated Vehicle Routing (CVRP), and a 12-stage sensor-vision conveyor sorter into one cohesive municipal platform.
              </p>

              {/* Key Metric Highlights */}
              <div className="pt-2 flex flex-wrap justify-center lg:justify-start gap-4 text-xs font-mono">
                <div className="glass-panel px-3.5 py-2 rounded-xl flex items-center gap-2">
                  <span className="text-emerald-400 font-bold text-sm">49.1%</span>
                  <span className="text-slate-400">Fuel & Distance Cut</span>
                </div>
                <div className="glass-panel px-3.5 py-2 rounded-xl flex items-center gap-2">
                  <span className="text-teal-400 font-bold text-sm">145ms</span>
                  <span className="text-slate-400">CVRP Solver Speed</span>
                </div>
                <div className="glass-panel px-3.5 py-2 rounded-xl flex items-center gap-2">
                  <span className="text-cyan-400 font-bold text-sm">93.6%</span>
                  <span className="text-slate-400">ML Sorting Precision</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
                <button
                  onClick={() => onNavigate("admin")}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-bold text-sm text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:opacity-95 shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer group"
                >
                  <Building2 size={16} />
                  <span>Launch Operations Command</span>
                  <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => onNavigate("citizen")}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-sm text-slate-200 glass-panel-interactive flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Users size={16} className="text-emerald-400" />
                  <span>Citizen & Business Portal</span>
                </button>

                <button
                  onClick={() => onNavigate("collector")}
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl font-semibold text-sm text-slate-300 hover:text-white hover:bg-slate-800/60 border border-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Truck size={16} className="text-amber-400" />
                  <span>Driver App</span>
                </button>
              </div>

              {/* Supported Municipalities */}
              <div className="pt-4 text-slate-500 text-xs flex items-center justify-center lg:justify-start gap-2">
                <span>Multi-jurisdiction ready:</span>
                <span className="text-slate-400 font-medium">Dhaka North (DNCC) · Dhaka South (DSCC) · Chattogram (CCC) · Sylhet</span>
              </div>
            </div>

            {/* Right Interactive Telemetry & 3D Column */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="relative w-full max-w-md">
                
                {/* 3D Smart Receptacle */}
                <SmartBin3D />

                {/* Floating Telemetry Card */}
                <div className="glass-panel-elevated rounded-2xl p-4.5 mt-2 shadow-2xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <Radio size={14} className="text-emerald-400 animate-pulse" />
                      <span className="font-mono text-xs font-semibold text-slate-200">METROPOLITAN TELEMETRY HUD</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      LIVE STREAM
                    </span>
                  </div>

                  {/* Real-time Bins Stream */}
                  {liveBins.length > 0 ? (
                    <div className="space-y-2">
                      {liveBins.map((b) => {
                        const fill = b.fillLevel ?? b.fill ?? 0;
                        return (
                          <div key={b.id || b.binCode} className="flex items-center justify-between text-xs font-mono p-1.5 rounded-lg bg-slate-900/50 border border-slate-800/60">
                            <span className="text-slate-300 font-bold">{b.binCode || b.id}</span>
                            <div className="flex-1 mx-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  fill > 80 ? "bg-rose-500" : fill > 60 ? "bg-amber-400" : "bg-emerald-400"
                                }`}
                                style={{ width: `${fill}%` }}
                              />
                            </div>
                            <span className={fill > 80 ? "text-rose-400" : fill > 60 ? "text-amber-300" : "text-emerald-400"}>
                              {fill}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                      <div className="bg-slate-900/60 border border-slate-800 p-2 rounded-xl">
                        <div className="text-emerald-400 font-bold text-sm">100%</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Online Nodes</div>
                      </div>
                      <div className="bg-slate-900/60 border border-slate-800 p-2 rounded-xl">
                        <div className="text-teal-400 font-bold text-sm">0 PPM</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Gas Safety</div>
                      </div>
                      <div className="bg-slate-900/60 border border-slate-800 p-2 rounded-xl">
                        <div className="text-cyan-400 font-bold text-sm">28°C</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Core Temp</div>
                      </div>
                    </div>
                  )}

                  <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1.5">
                      <Shield size={12} className="text-emerald-400" />
                      Hazard Protection Active
                    </span>
                    <span className="text-slate-500">Auto-refresh 5s</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="text-center mt-12 text-slate-500 flex flex-col items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Explore Architecture</span>
          <ArrowDown size={16} className="animate-bounce text-emerald-400" />
        </div>
      </section>

      {/* ── BENTO GRID: ENTERPRISE PLATFORM CAPABILITIES ────────────────── */}
      <section id="features" className="py-24 border-t border-slate-800/80 bg-slate-950/60 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-mono tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              Core Architecture
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight">
              Four Pillars of <span className="gradient-text-emerald">Smart Operations</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Every layer of the waste cycle—from container sensors to algorithmic dispatch to mechanical segregation—engineered for zero human sorting error.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Bento Card 1: CVRP Route Optimization */}
            <div id="cvrp" className="md:col-span-7 glass-panel-interactive rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6">
                  <Compass size={24} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">Algorithmic Logistics</span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">1,000+ Bins Scale</span>
                </div>
                <h3 className="font-display font-bold text-2xl text-white mb-3">
                  Dynamic CVRP Fleet Route Optimizer
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Replaces obsolete static weekly schedules with an angular sweep spatial clustering solver. Filters candidates using dynamic thresholding (fill &ge; 70% or 12-hour overflow forecast) and local 2-opt/Or-opt heuristics, cutting urban truck distance by 49.1%.
                </p>
              </div>

              {/* Visual Benchmark Comparison */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 font-mono text-xs space-y-2.5">
                <div className="flex justify-between items-center text-slate-400 text-[11px] pb-1.5 border-b border-slate-800/80">
                  <span>Strategy Benchmark</span>
                  <span>Collection Distance</span>
                  <span>Fuel Saving</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Baseline A: Legacy Static Schedule</span>
                  <span className="text-slate-300">48.7 km</span>
                  <span className="text-rose-400">0% (Baseline)</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>Baseline B: Greedy Nearest-Neighbor</span>
                  <span className="text-slate-300">36.2 km</span>
                  <span className="text-amber-400">-25.7%</span>
                </div>
                <div className="flex justify-between items-center text-emerald-400 font-bold bg-emerald-950/50 px-2 py-1 rounded border border-emerald-500/30">
                  <span>IntelliWaste Dynamic CVRP</span>
                  <span className="text-white">24.8 km</span>
                  <span className="text-emerald-300">-49.1% Saved</span>
                </div>
              </div>
            </div>

            {/* Bento Card 2: IoT Sensor Node Mesh */}
            <div className="md:col-span-5 glass-panel-interactive rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-cyan-500/20 transition-all" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-6">
                  <Cpu size={24} />
                </div>
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider block mb-2">Hardware Telemetry</span>
                <h3 className="font-display font-bold text-2xl text-white mb-3">
                  Multi-Sensor Smart Receptacles
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Weatherproof ultrasonic transducer array measures exact millimeter volume. MQ-4 and MQ-135 sensors continuously sniff for toxic methane and ammonia build-ups with instantaneous infrared flame triggering.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl">
                  <div className="text-slate-400 text-[10px]">ACOUSTIC TRANSDUCER</div>
                  <div className="text-white font-bold mt-1">JSN-SR04T Waterproof</div>
                </div>
                <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl">
                  <div className="text-slate-400 text-[10px]">HAZARD DETECTION</div>
                  <div className="text-emerald-400 font-bold mt-1">MQ-4 / MQ-135 Array</div>
                </div>
              </div>
            </div>

            {/* Bento Card 3: Automated Conveyor Sorter */}
            <div id="sorting" className="md:col-span-5 glass-panel-interactive rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-teal-500/20 transition-all" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-6">
                  <Layers size={24} />
                </div>
                <span className="text-xs font-mono text-teal-400 font-bold uppercase tracking-wider block mb-2">Automated Processing</span>
                <h3 className="font-display font-bold text-2xl text-white mb-3">
                  Sensor-Vision Decision Fusion
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  One bin takes all mixed waste. At the municipal processing terminal, high-speed YOLOv8 deep learning vision couples with inductive metal and capacitive moisture sensors, actuating pneumatic air knives in 0.42 seconds.
                </p>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">Target Sorting Categories</span>
                <span className="text-teal-400 font-bold">5 Fractions</span>
              </div>
            </div>

            {/* Bento Card 4: Civic Gamification & Cash Ledger */}
            <div className="md:col-span-7 glass-panel-interactive rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6">
                  <Award size={24} />
                </div>
                <span className="text-xs font-mono text-amber-400 font-bold uppercase tracking-wider block mb-2">Public Incentivization</span>
                <h3 className="font-display font-bold text-2xl text-white mb-3">
                  Digital Civic Ledger & Cash Redemption
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Citizens earn verified recycling points for clean disposal and reporting illegal dumps. Transparent point-to-BDT policies enable citizens to generate secure cash claim vouchers (<code className="text-amber-300">WDR-XXXX</code>) redeemable directly at Ward Offices.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl text-center">
                  <div className="text-slate-400 text-[10px]">OFFICIAL RATE</div>
                  <div className="text-amber-400 font-bold text-sm mt-0.5">৳ 0.20 / point</div>
                </div>
                <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl text-center">
                  <div className="text-slate-400 text-[10px]">VERIFICATION</div>
                  <div className="text-white font-bold text-sm mt-0.5">Brevo OTP & QR</div>
                </div>
                <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl text-center">
                  <div className="text-slate-400 text-[10px]">DISBURSEMENT</div>
                  <div className="text-emerald-400 font-bold text-sm mt-0.5">Ward Cash Desk</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── INTERACTIVE CONVEYOR SIMULATOR ───────────────────────────────── */}
      <section className="py-24 border-t border-slate-800/80 bg-slate-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-xs font-mono tracking-widest text-teal-400 uppercase bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/30">
              Interactive Testbed
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white tracking-tight">
              Automated <span className="gradient-text-emerald">Conveyor Sorter</span> Simulator
            </h2>
            <p className="text-slate-400 text-sm">
              Click any waste item below to inspect how the multi-sensor decision fusion classifies and diverts materials.
            </p>
          </div>

          {/* Interactive Item Selector Tabs */}
          <div className="flex flex-wrap justify-center gap-2.5 mb-8">
            {conveyorItems.map((item) => (
              <button
                key={item.name}
                onClick={() => setActiveSorterItem(item.name)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeSorterItem === item.name
                    ? "bg-slate-800 text-white border border-emerald-500 shadow-md shadow-emerald-500/20"
                    : "bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </button>
            ))}
          </div>

          {/* Sorter Visual Display Card */}
          <div className="glass-panel-elevated rounded-3xl p-6 sm:p-10 border border-slate-800">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Conveyor Belt Visualization */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    CONVEYOR SPEED: 0.35 m/s
                  </span>
                  <span className="text-emerald-400 font-bold">DECISION TIME: 0.42s</span>
                </div>

                {/* Animated Belt Container */}
                <div className="h-28 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
                  
                  {/* Moving Items */}
                  <div className="conveyor-belt flex items-center gap-8 w-[200%]">
                    {conveyorItems.concat(conveyorItems).map((it, idx) => (
                      <div
                        key={idx}
                        className={`w-14 h-14 rounded-2xl bg-slate-800/90 border flex items-center justify-center text-2xl shadow-lg shrink-0 transition-all ${
                          it.name === activeSorterItem ? "border-emerald-400 scale-110 shadow-emerald-500/30" : "border-slate-700 opacity-60"
                        }`}
                      >
                        {it.icon}
                      </div>
                    ))}
                  </div>

                  {/* Laser Sensor Sweep Beam */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 via-teal-300 to-transparent pointer-events-none shadow-lg shadow-emerald-400/50" />
                </div>

                <div className="flex justify-between text-[11px] font-mono text-slate-500">
                  <span>Input Hopper</span>
                  <span>Vision &amp; Sensor Sweep Zone</span>
                  <span>5-Way Pneumatic Ejection</span>
                </div>
              </div>

              {/* Real-time Detection Result Box */}
              <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 uppercase">Detection Output</span>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Confidence: 98.4%
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl shadow-inner">
                    {currentItemData.icon}
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-lg text-white">{currentItemData.name}</h4>
                    <div className="text-xs font-mono text-emerald-400 mt-0.5">{currentItemData.category}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Actuator Method:</span>
                    <span className="text-slate-200">High-Pressure Pneumatic Air Jet</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Validation Stage:</span>
                    <span className="text-teal-300 font-semibold">{currentItemData.stage}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Target Stream:</span>
                    <span className="text-emerald-400 font-bold">Fraction Bin #0{conveyorItems.indexOf(currentItemData) + 1}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── STAKEHOLDERS & PORTALS SECTION ─────────────────────────────── */}
      <section id="stakeholders" className="py-24 border-t border-slate-800/80 bg-slate-950/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
              Complete Multi-Role System
            </span>
            <h2 className="font-display font-extrabold text-3xl sm:text-5xl text-white tracking-tight">
              Tailored Portals for <span className="gradient-text-cyan">Every Stakeholder</span>
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              A unified platform connecting central ministries, municipal commissioners, ward officials, fleet drivers, and citizens into one synchronized operational grid.
            </p>
          </div>

          {/* Interactive Role Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { id: "citizen", title: "Citizen & Business", icon: Users, desc: "Recycling ledger, GPS dump reports & cash claims", page: "citizen", color: "hover:border-emerald-500" },
              { id: "driver", title: "Fleet Driver / Collector", icon: Truck, desc: "OSRM dynamic route map, capacity & hazards", page: "collector", color: "hover:border-amber-500" },
              { id: "ward", title: "Ward Sub-Admin", icon: Store, desc: "Local bin health, driver dispatch & cash payouts", page: "admin", color: "hover:border-teal-500" },
              { id: "city", title: "City & Super Admin", icon: Building2, desc: "City-wide policies, point conversion & fleet tracking", page: "admin", color: "hover:border-cyan-500" },
            ].map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.id}
                  onClick={() => onNavigate(p.page)}
                  className="glass-panel-interactive rounded-2xl p-6 cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 group-hover:text-emerald-400 group-hover:border-emerald-500/40 transition-colors mb-4">
                      <Icon size={22} />
                    </div>
                    <h3 className="font-display font-bold text-lg text-white mb-1.5">{p.title}</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">{p.desc}</p>
                  </div>
                  <div className="pt-5 flex items-center gap-1.5 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
                    <span>Enter Portal</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── ENTERPRISE FOOTER ───────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/80 bg-[#02050e] py-16 text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center">
                  <Recycle size={18} className="text-white" />
                </div>
                <span className="font-display font-extrabold text-lg text-white tracking-tight">
                  Intelli<span className="gradient-text-emerald">Waste</span>
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
                Next-generation cyber-physical solid waste management platform. Developed for City Corporations with real-time IoT telemetry, ML-driven CVRP routing, and automated conveyor segregation.
              </p>
              <div className="text-[11px] font-mono text-slate-500">
                Department of Computer Science &amp; Engineering · University of Information Technology and Sciences (UITS)
              </div>
            </div>

            <div>
              <h4 className="font-mono text-xs uppercase text-slate-200 tracking-wider mb-3">Stakeholder Portals</h4>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => onNavigate("citizen")} className="hover:text-emerald-400 transition-colors cursor-pointer">Citizen Recycling Portal</button></li>
                <li><button onClick={() => onNavigate("business")} className="hover:text-emerald-400 transition-colors cursor-pointer">Commercial &amp; Restaurant App</button></li>
                <li><button onClick={() => onNavigate("collector")} className="hover:text-emerald-400 transition-colors cursor-pointer">Driver &amp; Collector Map</button></li>
                <li><button onClick={() => onNavigate("admin")} className="hover:text-emerald-400 transition-colors cursor-pointer">Municipal Admin Dashboard</button></li>
                <li><button onClick={() => onNavigate("setup")} className="hover:text-emerald-400 transition-colors cursor-pointer">Initial System Setup</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-mono text-xs uppercase text-slate-200 tracking-wider mb-3">System Specifications</h4>
              <ul className="space-y-2 text-xs text-slate-400 font-mono">
                <li>Routing: CVRP + 2-opt Heuristics</li>
                <li>Database: Neon PostgreSQL + Prisma</li>
                <li>Sensing: Ultrasonic + MQ-4/MQ-135</li>
                <li>Vision: YOLOv8 Object Classification</li>
                <li>Security: JWT + Brevo OTP Verification</li>
              </ul>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p className="text-slate-500">
              © 2026 IntelliWaste Platform. Academic Capstone Defense — UITS CSE. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>System Grid Online · Zero Fatal Errors</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
