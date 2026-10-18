import { MapPin, Navigation, Trash2 } from "lucide-react";
import { bins } from "../data/cityData";

interface NearbyBinsMapProps {
  area?: string;
  dark?: boolean;
}

const pinPositions = [
  ["18%", "24%"],
  ["68%", "18%"],
  ["42%", "47%"],
  ["78%", "68%"],
  ["22%", "74%"],
];

export default function NearbyBinsMap({ area = "Mohammadpur", dark = false }: NearbyBinsMapProps) {
  const nearby = [...bins]
    .sort((a, b) => ((a.area || "").toLowerCase() === (area || "").toLowerCase() ? -1 : 1) - ((b.area || "").toLowerCase() === (area || "").toLowerCase() ? -1 : 1))
    .slice(0, 5)
    .map((bin, index) => ({ ...bin, distance: (0.2 + index * 0.35).toFixed(1) }));

  return (
    <div className={`border rounded-2xl overflow-hidden ${dark ? "bg-[#0d2414] border-[#1a3d22]" : "bg-white border-[#e2f5e9]"}`}>
      <div className="p-4 sm:p-5 flex items-start justify-between gap-3">
        <div>
          <div className={`font-display font-700 ${dark ? "text-white" : "text-[#052e16]"}`}>Nearest Smart Bins</div>
          <div className="text-[#4b7a5a] text-xs mt-1">Red pins show public smart bins near {area}.</div>
        </div>
        <MapPin size={18} className="text-red-500 shrink-0" />
      </div>
      <div className={`relative h-64 map-grid border-y ${dark ? "bg-[#061309] border-[#1a3d22]" : "bg-[#f0fdf4] border-[#e2f5e9]"}`}>
        <div className="absolute inset-x-0 top-1/2 border-t-4 border-white/60 rotate-6" />
        <div className="absolute inset-y-0 left-1/3 border-l-4 border-white/60 -rotate-12" />
        <div className="absolute inset-y-0 right-1/4 border-l-2 border-white/50 rotate-12" />
        {nearby.map((bin, index) => (
          <a
            key={bin.id}
            href={`https://maps.google.com/?q=${bin.lat},${bin.lng}`}
            target="_blank"
            rel="noreferrer"
            title={`${bin.id} · ${bin.distance} km`}
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: pinPositions[index % pinPositions.length][0], top: pinPositions[index % pinPositions.length][1] }}
          >
            <div className="w-9 h-9 bg-red-500 text-white rounded-full border-4 border-white shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Trash2 size={13} />
            </div>
            <div className={`absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg px-2 py-1 text-xs shadow ${dark ? "bg-[#0d2414] text-white" : "bg-white text-[#052e16]"}`}>
              {bin.distance} km
            </div>
          </a>
        ))}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 border-4 border-white rounded-full shadow-lg" title="Your location" />
      </div>
      <div className="p-4 grid sm:grid-cols-2 gap-2">
        {nearby.slice(0, 4).map((bin) => (
          <a key={bin.id} href={`https://maps.google.com/?q=${bin.lat},${bin.lng}`} target="_blank" rel="noreferrer" className={`flex items-center gap-3 rounded-xl p-3 ${dark ? "bg-[#061309]" : "bg-[#f8fdf9]"}`}>
            <MapPin size={14} className="text-red-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className={`text-xs font-semibold truncate ${dark ? "text-[#86efac]" : "text-[#052e16]"}`}>{bin.location}</div>
              <div className="text-[#4b7a5a] text-xs">{bin.distance} km · {bin.fill}% full</div>
            </div>
            <Navigation size={12} className="text-blue-500" />
          </a>
        ))}
      </div>
    </div>
  );
}
