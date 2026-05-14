"use client";

import { MapContainer, TileLayer, Polygon, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default Leaflet icons in Next.js
delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface FieldHistory {
  id: number;
  ndvi_value: number;
  health_status: string;
  recommendation?: string;
  problem?: string;
  recorded_at: string;
  soil_moisture?: number;
}

interface Field {
  id: number;
  name: string;
  crop_type: string;
  coordinates: [number, number][];
  area_acres?: number;
  history: FieldHistory[];
}

interface MapComponentProps {
  fields: Field[];
  activeField: Field | null;
  onFieldSelect: (field: Field) => void;
}

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function MapComponent({ fields, activeField, onFieldSelect }: MapComponentProps) {
  const defaultCenter = [18.5204, 73.8567] as [number, number]; // Pune, India as default
  
  const center = activeField && activeField.coordinates.length > 0
    ? activeField.coordinates[0]
    : fields.length > 0 && fields[0].coordinates.length > 0 
      ? fields[0].coordinates[0] 
      : defaultCenter;

  const getColor = (status: string) => {
    switch (status) {
      case "Healthy": return "#22c55e"; // Green 500
      case "Moderate": return "#f59e0b"; // Amber 500
      case "Critical": return "#ef4444"; // Red 500
      default: return "#64748b"; // Slate 500
    }
  };

  return (
    <div className="h-full w-full relative group">
      <MapContainer 
        center={center} 
        zoom={14} 
        scrollWheelZoom={true} 
        className="h-full w-full rounded-2xl z-0"
      >
        <ChangeView center={center} zoom={14} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          opacity={0.8}
        />
        {/* Semi-transparent dark overlay for 'premium dark satellite' map feel */}
        <div className="absolute inset-0 bg-black/20 pointer-events-none z-[1]"></div>
        
        {fields.map((field) => {
          const latestHistory = field.history[0];
          const color = latestHistory ? getColor(latestHistory.health_status) : "#22c55e";
          const isSelected = activeField?.id === field.id;
          
          return (
            <Polygon
              key={field.id}
              positions={field.coordinates}
              pathOptions={{
                color: isSelected ? "#ffffff" : color,
                fillColor: color,
                fillOpacity: isSelected ? 0.6 : 0.4,
                weight: isSelected ? 3 : 1,
              }}
              eventHandlers={{
                click: () => onFieldSelect(field),
              }}
            >
              <Tooltip sticky>
                <div className="p-1 px-2">
                  <h4 className="font-bold text-sm mb-1">{field.name}</h4>
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Crop: {field.crop_type}</p>
                    {latestHistory && (
                        <>
                        <p className="text-xs">NDVI Index: <span className="font-mono font-bold">{latestHistory.ndvi_value}</span></p>
                        <p className="text-xs">Soil Moisture: <span className="font-mono">{latestHistory.soil_moisture || '--'}%</span></p>
                        <p className="text-[10px] font-bold mt-1 inline-block px-1.5 py-0.5 rounded bg-black/5" style={{ color: getColor(latestHistory.health_status) }}>
                            {latestHistory.health_status.toUpperCase()}
                        </p>
                        </>
                    )}
                  </div>
                </div>
              </Tooltip>
            </Polygon>
          );
        })}
      </MapContainer>

      <div className="absolute bottom-6 right-6 z-[400] bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl min-w-[160px] animate-in slide-in-from-bottom-4 duration-500">
          <h5 className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-3">NDVI Health Scale</h5>
          <div className="space-y-2.5">
              <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-white">Healthy</p>
                    <p className="text-[9px] text-gray-500">0.6 - 1.0 NDVI</p>
                  </div>
              </div>
              <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#f59e0b] shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-white">Moderate</p>
                    <p className="text-[9px] text-gray-500">0.4 - 0.6 NDVI</p>
                  </div>
              </div>
              <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-white">Critical / Low</p>
                    <p className="text-[9px] text-gray-500">Below 0.4 NDVI</p>
                  </div>
              </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/5">
              <p className="text-[9px] text-gray-400 italic leading-tight">Lower values indicate sparse vegetation or stress.</p>
          </div>
      </div>
    </div>
  );
}
