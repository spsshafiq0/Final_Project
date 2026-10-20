import { useState, useEffect } from "react";
import {
  Trash2, Cpu, Zap, Shield, TrendingUp, Recycle,
  Users, ChevronRight, ArrowDown, CheckCircle, Globe,
  Leaf, Award, Wifi, Activity, Radio
} from "lucide-react";

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

// ── Color tokens (landing only) ─────────────────────────────────────────
const C = {
  bg:      "#030b18",
  card:    "#07142a",
  surface: "#0d2040",
  cyan:    "#00d9ff",
  lime:    "#a3e635",
  border:  "rgba(0,217,255,0.18)",
  borderL: "rgba(163,230,53,0.25)",
  text:    "#d6eeff",
  muted:   "#4a7899",
  danger:  "#f87171",
  amber:   "#fbbf24",
};

// ── 3D Smart Bin ────────────────────────────────────────────────────────
function SmartBin3D() {
  const W = 120, H = 160, D = 80;
  const hw = W / 2, hh = H / 2, hd = D / 2;

  const faceBase: React.CSSProperties = {
    position: "absolute",
    backfaceVisibility: "hidden",
  };

  const frontFace: React.CSSProperties = {
    ...faceBase,
    width: W, height: H, left: 0, top: 0,
    transform: `translateZ(${hd}px)`,
    background: "linear-gradient(175deg, #0a2444 0%, #041428 100%)",
    border: `1.5px solid ${C.cyan}`,
    borderRadius: "6px 6px 10px 10px",
    overflow: "hidden",
  };

  const backFace: React.CSSProperties = {
    ...faceBase,
    width: W, height: H, left: 0, top: 0,
    transform: `rotateY(180deg) translateZ(${hd}px)`,
    background: "#030d1e",
    border: "1px solid rgba(0,217,255,0.1)",
    borderRadius: "6px 6px 10px 10px",
  };

  // Left: width=D, height=H, left=(W-D)/2, top=0
  const leftFace: React.CSSProperties = {
    ...faceBase,
    width: D, height: H,
    left: (W - D) / 2, top: 0,
    transform: `rotateY(-90deg) translateZ(${hw}px)`,
    background: "linear-gradient(175deg, #071d38 0%, #030d1e 100%)",
    border: "1px solid rgba(0,217,255,0.2)",
  };

  const rightFace: React.CSSProperties = {
    ...faceBase,
    width: D, height: H,
    left: (W - D) / 2, top: 0,
    transform: `rotateY(90deg) translateZ(${hw}px)`,
    background: "linear-gradient(175deg, #091e36 0%, #030d1e 100%)",
    border: "1px solid rgba(0,217,255,0.3)",
    overflow: "hidden",
  };

  // Top: width=W, height=D, left=0, top=(H-D)/2
  const topFace: React.CSSProperties = {
    ...faceBase,
    width: W + 12, height: D + 8,
    left: -6, top: (H - D) / 2,
    transform: `rotateX(-90deg) translateZ(${hh}px)`,
    background: "linear-gradient(135deg, #0d2847 0%, #071c36 100%)",
    border: `2px solid ${C.cyan}`,
    borderRadius: "6px",
  };

  const bottomFace: React.CSSProperties = {
    ...faceBase,
    width: W, height: D,
    left: 0, top: (H - D) / 2,
    transform: `rotateX(90deg) translateZ(${hh}px)`,
    background: "#020810",
    border: "1px solid rgba(0,217,255,0.08)",
  };

  const fill = 68; // percent full

  return (
    <div className="relative flex items-center justify-center" style={{ width: 300, height: 320 }}>
      {/* IoT signal rings */}
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className={`iot-ring-${i + 1}`}
          style={{
            position: "absolute",
            width: 100, height: 100,
            borderRadius: "50%",
            border: `2px solid ${C.cyan}`,
            opacity: 0,
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />
      ))}

      {/* 3D scene */}
      <div style={{ width: W, height: H, perspective: 900, perspectiveOrigin: "50% 40%" }}>
        <div
          className="bin-spin"
          style={{ width: W, height: H, position: "relative", transformStyle: "preserve-3d" }}
        >
          {/* Bottom */}
          <div style={bottomFace} />

          {/* Back */}
          <div style={backFace}>
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <div style={{ color: "rgba(0,217,255,0.3)", fontSize: 10, fontFamily: "monospace", letterSpacing: 2 }}>REAR PANEL</div>
              <div style={{ width: 40, height: 40, border: "1px solid rgba(0,217,255,0.2)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ fontSize: 18 }}>📶</div>
              </div>
            </div>
          </div>

          {/* Left face — darker side */}
          <div style={leftFace}>
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ color: "rgba(0,217,255,0.25)", fontSize: 8, fontFamily: "monospace", letterSpacing: 1, writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                INTELLIWASTE · IoT
              </div>
            </div>
          </div>

          {/* Right face — lighter side with fill indicator stripe */}
          <div style={rightFace}>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${fill}%`, background: "linear-gradient(0deg, rgba(163,230,53,0.25) 0%, transparent 100%)", borderTop: `1px solid ${C.lime}` }} />
            <div style={{ position: "absolute", bottom: `${fill}%`, right: 8, fontSize: 8, fontFamily: "monospace", color: C.lime }}>{fill}%</div>
          </div>

          {/* TOP LID */}
          <div style={topFace}>
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <div style={{ width: 28, height: 8, background: C.cyan, borderRadius: 4, opacity: 0.7 }} />
              <div style={{ position: "absolute", top: 4, right: 6, display: "flex", gap: 3 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} className={`led-blink-${i + 1}`} style={{ width: 5, height: 5, borderRadius: "50%", background: i === 0 ? C.lime : i === 1 ? C.cyan : C.amber }} />
                ))}
              </div>
            </div>
          </div>

          {/* FRONT FACE — main display */}
          <div style={frontFace}>
            {/* Scan line */}
            <div
              className="scan-line"
              style={{
                position: "absolute", left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, transparent, ${C.cyan}, transparent)`,
                zIndex: 10, pointerEvents: "none",
              }}
            />

            <div style={{ padding: "10px 10px", display: "flex", flexDirection: "column", height: "100%", gap: 6 }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 7, fontFamily: "monospace", color: C.cyan, letterSpacing: 1 }}>IntelliWaste</div>
                <div style={{ display: "flex", gap: 3 }}>
                  <div className="led-blink-1" style={{ width: 5, height: 5, borderRadius: "50%", background: C.lime }} />
                  <div className="led-blink-2" style={{ width: 5, height: 5, borderRadius: "50%", background: C.cyan }} />
                </div>
              </div>

              {/* Bin ID badge */}
              <div style={{ background: "rgba(0,217,255,0.08)", border: `1px solid ${C.border}`, borderRadius: 4, padding: "3px 6px", fontSize: 7, fontFamily: "monospace", color: C.muted }}>
                BIN-ID: B-047 · WARD 10
              </div>

              {/* Fill gauge */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 7, fontFamily: "monospace", color: C.muted }}>
                  <span>FILL LEVEL</span>
                  <span style={{ color: fill > 80 ? C.danger : fill > 60 ? C.amber : C.lime }}>{fill}%</span>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${fill}%`, borderRadius: 3,
                    background: fill > 80 ? C.danger : fill > 60 ? C.amber : `linear-gradient(90deg, ${C.lime}, ${C.cyan})`
                  }} />
                </div>
              </div>

              {/* Sensors */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                {[
                  { k: "TEMP", v: "28°C", ok: true },
                  { k: "GAS", v: "Normal", ok: true },
                  { k: "WEIGHT", v: "31 kg", ok: true },
                  { k: "FIRE", v: "Clear", ok: true },
                ].map(s => (
                  <div key={s.k} style={{ background: "rgba(0,217,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 3, padding: "3px 4px" }}>
                    <div style={{ fontSize: 6, fontFamily: "monospace", color: C.muted }}>{s.k}</div>
                    <div style={{ fontSize: 7, fontFamily: "monospace", color: s.ok ? C.lime : C.danger, fontWeight: 600 }}>{s.v}</div>
                  </div>
                ))}
              </div>

              {/* GPS + QR row */}
              <div style={{ display: "flex", gap: 4 }}>
                <div style={{ flex: 1, background: "rgba(163,230,53,0.06)", border: `1px solid ${C.borderL}`, borderRadius: 3, padding: "3px 4px" }}>
                  <div style={{ fontSize: 6, fontFamily: "monospace", color: C.muted }}>GPS</div>
                  <div style={{ fontSize: 6.5, fontFamily: "monospace", color: C.lime }}>23.757°N 90.400°E</div>
                </div>
                <div style={{ width: 28, height: 28, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                  ▣
                </div>
              </div>

              {/* Status bar */}
              <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 4, background: "rgba(163,230,53,0.08)", border: `1px solid ${C.borderL}`, borderRadius: 3, padding: "3px 6px" }}>
                <div className="led-blink-1" style={{ width: 5, height: 5, borderRadius: "50%", background: C.lime }} />
                <span style={{ fontSize: 6.5, fontFamily: "monospace", color: C.lime }}>ONLINE · COLLECTING</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ground shadow */}
      <div style={{
        position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)",
        width: 140, height: 18,
        background: "radial-gradient(ellipse, rgba(0,217,255,0.25) 0%, transparent 70%)",
        filter: "blur(4px)",
      }} />
    </div>
  );
}

// ── Data ────────────────────────────────────────────────────────────────
const stats = [
  { label: "Smart Bins Deployed",  value: "12,847", unit: "",           icon: Trash2,    color: C.cyan },
  { label: "Waste Sorted Daily",   value: "4.2",    unit: "tons",       icon: Recycle,   color: C.lime },
  { label: "Carbon Reduced",       value: "18.6",   unit: "t CO₂/mo",  icon: Leaf,      color: "#4ade80" },
  { label: "Citizens Engaged",     value: "89,412", unit: "",           icon: Users,     color: C.amber },
];

const features = [
  { icon: Cpu,        title: "IoT Sensor Network",       color: C.cyan,  tag: "Hardware",      desc: "Ultrasonic fill-level, weight, gas/odor, temperature, and fire/smoke sensors on every smart bin. Real-time telemetry over Wi-Fi, LoRaWAN, and 4G/5G." },
  { icon: Zap,        title: "ML-Powered Routing",        color: C.lime,  tag: "Intelligence",  desc: "LSTM and Prophet fill-level forecasting. Dynamic route optimization with Google OR-Tools and genetic algorithms. Auto-reroutes on overflow, fire, or gas anomalies." },
  { icon: Recycle,    title: "Automated Sorting Machine", color: "#60a5fa", tag: "Hardware",    desc: "12-stage sensor-vision decision fusion: camera + ML, inductive, electromagnet, capacitive, air-jet, NIR, X-ray, and acoustic sensors on a motorized conveyor." },
  { icon: Award,      title: "Citizen Gamification",      color: "#f472b6", tag: "Engagement",  desc: "Earn reward tokens for recycling quality, illegal-dump reporting, and on-demand pickups. Points redeemable for local discounts through the citizen portal." },
  { icon: Shield,     title: "Hazardous Waste Handling",  color: C.danger, tag: "Safety",       desc: "Color-coded QR tagging, chain-of-custody logging, NFC bin locks, certified handler routing, and digital Certificates of Destruction." },
  { icon: TrendingUp, title: "Analytics & Compliance",    color: C.amber,  tag: "Analytics",    desc: "Carbon-footprint estimation, recycling-rate statistics, cost/fuel tracking, driver performance, and downloadable audit logs for regulators." },
];

const sortingStages = [
  { stage: 1, technique: "Camera + ML",              separates: "Material type classification",  time: "<50ms",  color: C.lime },
  { stage: 2, technique: "Inductive Sensor",         separates: "Metal items detected",          time: "<10ms",  color: C.cyan },
  { stage: 3, technique: "Electromagnet / Eddy",     separates: "Ferrous vs non-ferrous",        time: "<20ms",  color: "#94a3b8" },
  { stage: 4, technique: "Capacitive / Moisture",    separates: "Wet organic waste",             time: "<30ms",  color: "#86efac" },
  { stage: 5, technique: "Air Jet / Robotic Arm",    separates: "Diverts to target bin",         time: "<15ms",  color: "#fb923c" },
  { stage: 6, technique: "NIR Sensor",               separates: "Plastic types PET, HDPE",      time: "<30ms",  color: C.amber },
  { stage: 7, technique: "Chemical / Gas Sensor",    separates: "Hazardous containers",          time: "<100ms", color: C.danger },
  { stage: 8, technique: "X-ray Sensor",             separates: "Hidden metals, multi-layer",   time: "<80ms",  color: "#a78bfa" },
];

const wasteCategories = [
  { name: "Organic / Biodegradable",  action: "Composting / Biogas",      color: "#86efac", icon: "🌱", freq: "Weekly" },
  { name: "Recyclable — Plastic",     action: "Recycling Plant",          color: "#60a5fa", icon: "♻️",  freq: "Bi-weekly" },
  { name: "Recyclable — Metal",       action: "Recycling / Scrap",        color: "#94a3b8", icon: "🔩", freq: "Bi-weekly" },
  { name: "Recyclable — Paper",       action: "Recycling",                color: "#fde68a", icon: "📄", freq: "Bi-weekly" },
  { name: "Glass",                    action: "Recycling",                color: "#7dd3fc", icon: "🫙", freq: "Monthly" },
  { name: "Hazardous / Sensitive",    action: "Certified Safe Handling",  color: "#fca5a5", icon: "⚠️",  freq: "Quarterly" },
  { name: "Textile / Fabrics",        action: "Donation / Recycling",     color: "#f9a8d4", icon: "👕", freq: "Monthly" },
  { name: "Construction Debris",      action: "Recycling / Landfill",     color: "#d4b896", icon: "🏗️", freq: "As needed" },
  { name: "Electronic Waste",         action: "Certified Handler",        color: "#c4b5fd", icon: "💻", freq: "Quarterly" },
  { name: "Bulky Items",              action: "Donation / Recycling",     color: "#fdba74", icon: "🛋️", freq: "As needed" },
  { name: "Oil & Chemicals",          action: "Certified Safe Handling",  color: "#fcd34d", icon: "🧪", freq: "Quarterly" },
  { name: "Non-Recyclable Residual",  action: "Landfill / Incineration",  color: "#9ca3af", icon: "🗑️", freq: "Weekly" },
];

const stakeholders = [
  "Citizens & Households", "Waste Collectors & Drivers", "City Corporation Admins",
  "Hazardous Waste Units", "Recycling & Processing Plants", "Environmental Regulators",
  "Composting / Biogas Operators", "Scrap Metal Refiners", "Textile Recyclers",
  "MRF Plant Supervisors", "Fleet Management / 3PL", "Emergency Services",
];

// ── Helper styles ────────────────────────────────────────────────────────
const pill = (color: string): React.CSSProperties => ({
  display: "inline-flex", alignItems: "center", gap: 6,
  border: `1px solid ${color}44`, background: `${color}12`,
  borderRadius: 999, padding: "5px 14px",
  color, fontSize: 11, fontFamily: "monospace", fontWeight: 600, letterSpacing: 1,
});

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const [activeFeature, setActiveFeature] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveFeature(f => (f + 1) % features.length), 3200);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", overflowX: "hidden" }}>

      {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        height: 64,
        background: scrolled ? "rgba(3,11,24,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : undefined,
        borderBottom: scrolled ? `1px solid ${C.border}` : "none",
        transition: "all 0.3s ease",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, background: `linear-gradient(135deg, ${C.cyan}, #0088aa)`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Recycle size={17} color="#fff" />
            </div>
            <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 19, color: "#fff" }}>
              Intelli<span style={{ color: C.cyan }}>Waste</span>
            </span>
          </div>

          {/* Nav links */}
          <div style={{ display: "flex", gap: 28, alignItems: "center" }} className="hidden md:flex">
            {["Features", "Sorting Machine", "Categories", "Stakeholders"].map(l => (
              <a key={l} href={`#${l.toLowerCase().replace(" ", "-")}`}
                style={{ color: C.muted, fontSize: 14, fontWeight: 500, textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = C.cyan)}
                onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
              >{l}</a>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={() => onNavigate("setup")}
              style={{ background: "rgba(74,222,128,0.1)", border: `1px solid rgba(74,222,128,0.3)`, borderRadius: 8, padding: "8px 12px", color: "#4ade80", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
              title="First-time installation & Super Admin initialization"
            >
              ⚙️ Setup
            </button>
            <button
              onClick={() => onNavigate("citizen")}
              style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 16px", color: C.cyan, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,217,255,0.08)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
            >
              Citizen Portal
            </button>
            <button
              onClick={() => onNavigate("admin")}
              style={{ background: `linear-gradient(135deg, ${C.cyan}, #0099bb)`, border: "none", borderRadius: 8, padding: "8px 18px", color: "#030b18", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
            >
              Admin Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        {/* City night background image */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url('https://images.unsplash.com/photo-1603793510575-a8cf24361baa?w=1920&h=1080&fit=crop&auto=format')",
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "brightness(0.28) saturate(1.4)",
        }} />
        {/* Cyan/navy gradient overlay */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(3,11,24,0.92) 0%, rgba(3,11,24,0.65) 50%, rgba(0,30,60,0.85) 100%)" }} />
        {/* City grid */}
        <div className="city-grid" style={{ position: "absolute", inset: 0, opacity: 0.5 }} />
        {/* Cyan glow orbs */}
        <div style={{ position: "absolute", top: "20%", left: "5%", width: 500, height: 500, background: C.cyan, borderRadius: "50%", opacity: 0.04, filter: "blur(80px)" }} />
        <div style={{ position: "absolute", bottom: "20%", right: "10%", width: 400, height: 400, background: C.lime, borderRadius: "50%", opacity: 0.04, filter: "blur(80px)" }} />

        <div style={{ position: "relative", zIndex: 10, maxWidth: 1200, margin: "0 auto", padding: "120px 24px 80px", display: "grid", gap: 60, alignItems: "center" }}
          className="grid-cols-1 lg:grid-cols-2"
        >
          {/* Left — text */}
          <div>
            <div style={pill(C.cyan)} className="mb-6">
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.lime, display: "inline-block" }} className="pulse-cyan" />
              IoT · ML · Automated Sorting · Live City Network
            </div>

            <h1 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 900, fontSize: "clamp(42px,6vw,72px)", lineHeight: 1.05, color: "#fff", margin: "0 0 20px" }}>
              Smart Waste.<br />
              <span className="gradient-text-cyan">Smarter City.</span>
            </h1>

            <p style={{ color: C.muted, fontSize: 17, lineHeight: 1.7, maxWidth: 480, margin: "0 0 36px" }}>
              IntelliWaste connects IoT bin sensors, ML-powered route optimization, and a 12-stage automated sorting machine into one unified platform — one bin collects everything, the machine sorts it all.
            </p>

            {/* Key stats pills */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 36 }}>
              {[
                { label: "15 Wards", color: C.cyan },
                { label: "IoT Sensors", color: C.lime },
                { label: "12-Stage Sorter", color: C.amber },
                { label: "ML Routing", color: "#a78bfa" },
              ].map(p => (
                <span key={p.label} style={{ ...pill(p.color), fontSize: 10 }}>{p.label}</span>
              ))}
            </div>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <button
                onClick={() => onNavigate("admin")}
                className="glow-cyan"
                style={{ background: `linear-gradient(135deg, ${C.cyan}, #0099bb)`, border: "none", borderRadius: 10, padding: "14px 28px", color: "#030b18", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}
              >
                Open Admin Dashboard <ChevronRight size={16} />
              </button>
              <button
                onClick={() => onNavigate("citizen")}
                style={{ background: "rgba(163,230,53,0.08)", border: `1.5px solid ${C.lime}55`, borderRadius: 10, padding: "14px 28px", color: C.lime, fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}
              >
                Citizen Portal <ChevronRight size={16} />
              </button>
              <button
                onClick={() => onNavigate("collector")}
                style={{ background: "rgba(255,255,255,0.04)", border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "14px 28px", color: C.text, fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
              >
                Driver Portal <ChevronRight size={16} />
              </button>
              <button
                onClick={() => onNavigate("business")}
                style={{ background: "rgba(244,114,182,0.08)", border: "1.5px solid rgba(244,114,182,0.35)", borderRadius: 10, padding: "14px 28px", color: "#f9a8d4", fontSize: 15, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
              >
                Shop & Restaurant <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Right — 3D Bin + live panel */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
            <SmartBin3D />

            {/* Live bin data strip */}
            <div style={{ width: "100%", maxWidth: 340, background: "rgba(7,20,42,0.85)", border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, backdropFilter: "blur(12px)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontFamily: "monospace", fontSize: 10, color: C.cyan, letterSpacing: 1 }}>LIVE BIN STATUS — DHAKA CITY</span>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.lime, display: "inline-block" }} className="pulse-cyan" />
              </div>
              {[
                { id: "B-102", level: 87, weight: "42 kg", loc: "Mirpur-10" },
                { id: "B-047", level: 54, weight: "28 kg", loc: "Dhanmondi" },
                { id: "B-218", level: 92, weight: "51 kg", loc: "Gulshan-2" },
                { id: "B-331", level: 23, weight: "12 kg", loc: "Motijheel" },
                { id: "B-156", level: 71, weight: "37 kg", loc: "Banani" },
              ].map(b => (
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontFamily: "monospace", fontSize: 10, color: C.muted, width: 44 }}>{b.id}</span>
                  <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${b.level}%`, borderRadius: 2, background: b.level > 80 ? C.danger : b.level > 60 ? C.amber : C.lime }} />
                  </div>
                  <span style={{ fontFamily: "monospace", fontSize: 10, color: b.level > 80 ? C.danger : b.level > 60 ? C.amber : C.lime, width: 28 }}>{b.level}%</span>
                  <span style={{ fontFamily: "monospace", fontSize: 9, color: C.muted, width: 36 }}>{b.weight}</span>
                  <span style={{ fontSize: 9, color: C.muted }}>{b.loc}</span>
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 12 }}>
                {[{ label: "Active Trucks", v: "14", c: C.lime }, { label: "Critical Bins", v: "3", c: C.danger }, { label: "Sorted Today", v: "2.1t", c: C.cyan }].map(m => (
                  <div key={m.label} style={{ background: "rgba(0,217,255,0.04)", border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 0", textAlign: "center" }}>
                    <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: m.c }}>{m.v}</div>
                    <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", color: `${C.cyan}66` }} className="animate-bounce">
          <ArrowDown size={22} />
        </div>
      </section>

      {/* ── STATS STRIP ─────────────────────────────────────────────────── */}
      <section style={{ background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "40px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gap: 24 }} className="grid-cols-2 lg:grid-cols-4">
          {stats.map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ width: 48, height: 48, background: `${s.color}12`, border: `1px solid ${s.color}33`, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <s.icon size={22} color={s.color} />
              </div>
              <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 32, color: "#fff", lineHeight: 1 }}>
                {s.value}<span style={{ fontSize: 15, fontWeight: 500, color: C.muted, marginLeft: 4 }}>{s.unit}</span>
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: "96px 24px", background: C.bg }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={pill(C.cyan)} className="mb-4 mx-auto" >
              SYSTEM CAPABILITIES
            </div>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "clamp(32px,4vw,48px)", color: "#fff", margin: "16px 0 16px" }}>
              Every Layer. <span className="gradient-text-cyan">Fully Integrated.</span>
            </h2>
            <p style={{ color: C.muted, fontSize: 16, maxWidth: 540, margin: "0 auto" }}>
              From hardware sensors to AI models to citizen apps — IntelliWaste connects every stakeholder through one unified platform.
            </p>
          </div>

          <div style={{ display: "grid", gap: 20 }} className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                onClick={() => setActiveFeature(i)}
                onMouseEnter={() => setActiveFeature(i)}
                style={{
                  background: activeFeature === i ? C.surface : C.card,
                  border: `1px solid ${activeFeature === i ? f.color + "60" : C.border}`,
                  borderRadius: 16, padding: "24px",
                  cursor: "pointer", transition: "all 0.25s ease",
                  boxShadow: activeFeature === i ? `0 0 30px ${f.color}18` : "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div style={{ width: 46, height: 46, background: `${f.color}18`, border: `1px solid ${f.color}33`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <f.icon size={20} color={f.color} />
                  </div>
                  <span style={{ ...pill(f.color), fontSize: 9, padding: "3px 8px" }}>{f.tag}</span>
                </div>
                <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 8 }}>{f.title}</div>
                <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.65 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ONE BIN FLOW ────────────────────────────────────────────────── */}
      <section style={{ padding: "96px 24px", background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }} id="how-it-works">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={pill(C.lime)} className="mb-4 mx-auto">HOW IT WORKS</div>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "clamp(32px,4vw,48px)", color: "#fff", margin: "16px 0 16px" }}>
              One Bin. <span className="gradient-text-cyan">Everything In.</span>
            </h2>
            <p style={{ color: C.muted, fontSize: 16, maxWidth: 520, margin: "0 auto" }}>
              Citizens throw ALL waste into one smart bin. No sorting needed. IntelliWaste handles everything downstream — collection, transport, and automated sorting.
            </p>
          </div>

          <div style={{ position: "relative", display: "grid", gap: 0 }} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Connector */}
            <div style={{ position: "absolute", top: 32, left: "12.5%", right: "12.5%", height: 1, background: `linear-gradient(90deg, ${C.cyan}, ${C.lime})`, zIndex: 0 }} />
            {[
              { step: "01", title: "Citizen Throws Waste",        icon: "🗑️", color: C.cyan,   desc: "Everything goes into the single smart IoT bin — no sorting or segregation needed from the citizen." },
              { step: "02", title: "Smart Bin Monitors",          icon: "📡", color: C.lime,   desc: "Fill level, weight, gas/odor, temperature, and fire sensors transmit real-time telemetry to the platform." },
              { step: "03", title: "ML Routes the Truck",         icon: "🚛", color: C.amber,  desc: "When fill exceeds threshold, ML auto-dispatches the nearest truck with a dynamically optimized collection route." },
              { step: "04", title: "Sorting Machine Separates",   icon: "⚙️", color: "#a78bfa", desc: "12-stage automated facility classifies and routes each item to the correct recycling, compost, or disposal destination." },
            ].map((step, i) => (
              <div key={step.step} style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 16px" }}>
                <div style={{ width: 64, height: 64, background: C.bg, border: `2px solid ${step.color}55`, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 16, backdropFilter: "blur(8px)" }}>
                  {step.icon}
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 10, color: step.color, marginBottom: 6, letterSpacing: 1 }}>{step.step}</div>
                <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 14, color: "#fff", marginBottom: 8 }}>{step.title}</div>
                <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            ))}
          </div>

          {/* Important note */}
          <div style={{ marginTop: 56, background: "rgba(0,217,255,0.05)", border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px 28px", display: "flex", gap: 20, alignItems: "flex-start" }}>
            <div style={{ width: 44, height: 44, background: `${C.cyan}15`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>💡</div>
            <div>
              <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, fontSize: 16, color: "#fff", marginBottom: 6 }}>No Segregation Required from Citizens</div>
              <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
                Unlike traditional systems, IntelliWaste uses a <span style={{ color: C.cyan, fontWeight: 600 }}>single unified dustbin</span> for all household waste. Organic, plastic, paper, metal, glass — everything goes in together. The automated sorting machine at the processing facility handles all classification using computer vision, 12 sensor stages, and ML decision fusion. The only exception: <span style={{ color: C.danger, fontWeight: 600 }}>hazardous items</span> (batteries, medicines, chemicals, e-waste) must be taken to designated certified drop-off points.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SORTING MACHINE ─────────────────────────────────────────────── */}
      <section id="sorting-machine" style={{ padding: "96px 24px", background: C.bg }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={pill(C.lime)} className="mb-4 mx-auto">HARDWARE INNOVATION</div>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "clamp(32px,4vw,48px)", color: "#fff", margin: "16px 0 16px" }}>
              12-Stage Automated <span className="gradient-text-cyan">Sorting Machine</span>
            </h2>
            <p style={{ color: C.muted, fontSize: 16, maxWidth: 560, margin: "0 auto" }}>
              Sensor-Vision Decision Fusion cross-checks camera imagery against 12 sensor stages before triggering actuators — eliminating classification errors at machine speed.
            </p>
          </div>

          {/* Conveyor */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 32, overflow: "hidden", position: "relative" }}>
            <div style={{ fontFamily: "monospace", fontSize: 10, color: C.lime, letterSpacing: 1, marginBottom: 12 }}>▶ CONVEYOR BELT — LIVE SIMULATION</div>
            <div style={{ height: 60, background: `rgba(0,217,255,0.04)`, borderRadius: 8, overflow: "hidden", display: "flex", alignItems: "center", position: "relative" }}>
              <div className="conveyor-belt" style={{ display: "flex", gap: 20, width: "200%", paddingLeft: 16 }}>
                {["🍌","🥤","📦","🔩","💻","⚠️","👕","🫙","🍌","🥤","📦","🔩","💻","⚠️","👕","🫙"].map((item, i) => (
                  <div key={i} style={{ width: 44, height: 44, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 14 }} className="grid-cols-2 lg:grid-cols-4">
            {sortingStages.map(s => (
              <div key={s.stage}
                style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, transition: "all 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = s.color + "55"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 32, height: 32, background: `${s.color}18`, border: `1px solid ${s.color}44`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: s.color }}>
                    {s.stage}
                  </div>
                  <span style={{ fontFamily: "monospace", fontSize: 10, color: s.color }}>{s.time}</span>
                </div>
                <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 13, color: "#fff", marginBottom: 4 }}>{s.technique}</div>
                <div style={{ color: C.muted, fontSize: 11 }}>{s.separates}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OUTPUT CATEGORIES ───────────────────────────────────────────── */}
      <section id="categories" style={{ padding: "96px 24px", background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={pill(C.cyan)} className="mb-4 mx-auto">SORTING MACHINE OUTPUT</div>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "clamp(32px,4vw,48px)", color: "#fff", margin: "16px 0 16px" }}>
              12 Output <span className="gradient-text-cyan">Categories</span> from the Facility
            </h2>
            <p style={{ color: C.muted, fontSize: 16, maxWidth: 520, margin: "0 auto" }}>
              After collection, the automated sorting machine separates mixed waste into these categories — each routed to the correct processing destination.
            </p>
          </div>
          <div style={{ display: "grid", gap: 14 }} className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {wasteCategories.map(cat => (
              <div key={cat.name}
                style={{ display: "flex", gap: 14, padding: "14px 16px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, alignItems: "flex-start", transition: "all 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = cat.color + "55"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border; }}
              >
                <div style={{ width: 44, height: 44, background: cat.color + "18", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{cat.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 13, color: "#fff", marginBottom: 3 }}>{cat.name}</div>
                  <div style={{ color: C.muted, fontSize: 11, marginBottom: 6 }}>→ {cat.action}</div>
                  <span style={{ fontFamily: "monospace", fontSize: 9, background: cat.color + "22", color: cat.color, borderRadius: 4, padding: "2px 6px" }}>{cat.freq}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ARCHITECTURE ────────────────────────────────────────────────── */}
      <section style={{ padding: "96px 24px", background: C.bg }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "clamp(30px,4vw,44px)", color: "#fff", margin: "0 0 12px" }}>End-to-End System Architecture</h2>
            <p style={{ color: C.muted, fontSize: 15 }}>From bin sensors to processing plants — every component connected and monitored.</p>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 36, overflowX: "auto" }}>
            <div style={{ minWidth: 600 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 24 }}>
                {["Smart Bins", "IoT Gateway", "Cloud Backend", "ML Engine"].map((node, i) => (
                  <div key={node} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ background: C.surface, border: `1px solid ${C.cyan}44`, borderRadius: 10, padding: "12px 20px", textAlign: "center", minWidth: 120 }}>
                      <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 13, color: C.cyan }}>{node}</div>
                    </div>
                    {i < 3 && <div style={{ color: C.cyan, fontFamily: "monospace", fontSize: 18 }}>→</div>}
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", color: C.lime, fontFamily: "monospace", marginBottom: 20, fontSize: 20 }}>↓</div>
              <div style={{ display: "grid", gap: 14 }} className="grid-cols-2 lg:grid-cols-4">
                {[
                  { name: "Web/Mobile Apps",   sub: "Dashboards, citizen app",   color: C.lime },
                  { name: "Sorting Machine",   sub: "Conveyor + vision ML",      color: C.cyan },
                  { name: "Processing Module", sub: "Reuse/recycle/dispose",     color: C.amber },
                  { name: "Analytics Engine",  sub: "Reports, compliance",       color: "#a78bfa" },
                ].map(n => (
                  <div key={n.name} style={{ background: C.surface, border: `1px solid ${n.color}33`, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
                    <div style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 12, color: n.color, marginBottom: 4 }}>{n.name}</div>
                    <div style={{ color: C.muted, fontSize: 10 }}>{n.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STAKEHOLDERS ────────────────────────────────────────────────── */}
      <section id="stakeholders" style={{ padding: "96px 24px", background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "clamp(30px,4vw,44px)", color: "#fff", margin: "0 0 12px" }}>
            12 Stakeholders. <span className="gradient-text-cyan">One Platform.</span>
          </h2>
          <p style={{ color: C.muted, fontSize: 15, marginBottom: 48 }}>Every entity in the waste management chain, unified through IntelliWaste.</p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
            {stakeholders.map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 7, background: C.bg, border: `1px solid ${i % 2 === 0 ? C.border : C.borderL}`, borderRadius: 999, padding: "8px 16px" }}>
                <CheckCircle size={13} color={i % 2 === 0 ? C.cyan : C.lime} />
                <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH STACK ──────────────────────────────────────────────────── */}
      <section style={{ padding: "96px 24px", background: C.bg }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={pill(C.cyan)} className="mb-4 mx-auto">TECHNOLOGY STACK</div>
            <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "clamp(30px,4vw,44px)", color: "#fff", margin: "16px 0 0" }}>Built on Proven Technologies</h2>
          </div>
          <div style={{ display: "grid", gap: 16 }} className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[
              { layer: "IoT / Hardware",    items: "ESP32/Arduino, Ultrasonic, Gas, Temp, GPS, Load Cells",               color: C.cyan },
              { layer: "Sorting Machine",   items: "Raspberry Pi / Jetson Nano, Conveyor, Servo, Pneumatic, Electromagnet", color: C.lime },
              { layer: "Vision / ML",       items: "Python, OpenCV, TensorFlow/PyTorch, YOLO, MobileNet, ResNet",          color: "#a78bfa" },
              { layer: "Connectivity",      items: "Wi-Fi, GSM, LoRaWAN, NB-IoT, MQTT protocol",                          color: C.amber },
              { layer: "Backend",           items: "Node.js/Express or Django, REST APIs, PostgreSQL, MongoDB, InfluxDB",  color: "#60a5fa" },
              { layer: "Frontend",          items: "React.js (Web), React Native/Flutter (Mobile), Google Maps API",       color: "#f472b6" },
              { layer: "ML / Routing",      items: "scikit-learn, Google OR-Tools, LSTM, Prophet, Genetic Algorithms",    color: C.lime },
              { layer: "Cloud / Deploy",    items: "AWS / Firebase / Azure IoT Hub, Docker containers",                   color: C.cyan },
              { layer: "Analytics",         items: "Grafana, Power BI, Recharts, InfluxDB time-series dashboards",        color: C.amber },
            ].map(t => (
              <div key={t.layer}
                style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, transition: "all 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = t.color + "50"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = C.border; }}
              >
                <div style={{ fontFamily: "monospace", fontSize: 10, color: t.color, letterSpacing: 1, marginBottom: 8 }}>{t.layer.toUpperCase()}</div>
                <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.65 }}>{t.items}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ position: "relative", borderRadius: 24, overflow: "hidden" }}>
            {/* BG image */}
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "url('https://images.unsplash.com/photo-1524282592407-25bf4101ac81?w=1200&h=600&fit=crop&auto=format')",
              backgroundSize: "cover", backgroundPosition: "center",
              filter: "brightness(0.2) saturate(1.5)",
            }} />
            <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, rgba(3,11,24,0.9), rgba(0,40,80,0.85))` }} />
            <div className="city-grid" style={{ position: "absolute", inset: 0, opacity: 0.4 }} />

            <div style={{ position: "relative", zIndex: 1, padding: "72px 48px", textAlign: "center" }}>
              <div style={pill(C.lime)} className="mb-6 mx-auto">GET STARTED</div>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontWeight: 900, fontSize: "clamp(30px,4vw,48px)", color: "#fff", margin: "16px 0 16px" }}>
                Ready to transform your city?
              </h2>
              <p style={{ color: C.muted, fontSize: 16, marginBottom: 40, maxWidth: 500, margin: "0 auto 40px" }}>
                Access the full IntelliWaste platform — admin tools, citizen portal, analytics, live sorting machine data.
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
                <button
                  onClick={() => onNavigate("admin")}
                  className="glow-cyan"
                  style={{ background: `linear-gradient(135deg, ${C.cyan}, #0099bb)`, border: "none", borderRadius: 12, padding: "16px 36px", color: "#030b18", fontSize: 16, fontWeight: 700, cursor: "pointer" }}
                >
                  Open Admin Dashboard
                </button>
                <button
                  onClick={() => onNavigate("citizen")}
                  style={{ background: "rgba(163,230,53,0.08)", border: `2px solid ${C.lime}66`, borderRadius: 12, padding: "16px 36px", color: C.lime, fontSize: 16, fontWeight: 600, cursor: "pointer" }}
                >
                  Citizen Portal
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={{ background: C.card, borderTop: `1px solid ${C.border}`, padding: "56px 24px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gap: 40, marginBottom: 48 }} className="grid-cols-1 md:grid-cols-3">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, background: `linear-gradient(135deg, ${C.cyan}, #0088aa)`, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Recycle size={15} color="#fff" />
                </div>
                <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: 18, color: "#fff" }}>
                  Intelli<span style={{ color: C.cyan }}>Waste</span>
                </span>
              </div>
              <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>Smart waste management for modern cities. Capstone project — UITS Department of CSE.</p>
            </div>
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 10, color: C.cyan, letterSpacing: 1, marginBottom: 14 }}>PLATFORM</div>
              {[
                { label: "Admin Dashboard", action: () => onNavigate("admin") },
                { label: "Citizen Portal", action: () => onNavigate("citizen") },
                { label: "Collector App", action: () => onNavigate("collector") },
                { label: "Shop & Restaurant", action: () => onNavigate("business") },
                { label: "Sorting Machine", action: () => {
                  const el = document.getElementById("sorting-machine");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                } },
              ].map(p => (
                <div
                  key={p.label}
                  onClick={p.action}
                  style={{ color: C.muted, fontSize: 13, marginBottom: 6, cursor: "pointer", transition: "color 0.2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.color = C.text; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.color = C.muted; }}
                >
                  {p.label}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily: "monospace", fontSize: 10, color: C.lime, letterSpacing: 1, marginBottom: 14 }}>PROJECT INFO</div>
              <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.8 }}>
                <div>University of Information Technology &amp; Sciences (UITS)</div>
                <div>Department of Computer Science &amp; Engineering</div>
                <div>Capstone Project Proposal</div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div style={{ color: C.muted, fontSize: 12 }}>© 2026 IntelliWaste — Smart City Waste Management Platform</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "monospace", fontSize: 10, color: C.cyan }}>
              <Globe size={11} />
              UITS · CSE Capstone Project
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
