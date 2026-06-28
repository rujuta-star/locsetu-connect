import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin, Search, Hospital, Shield, Flame, Droplets, Heart, Building2, AlertTriangle } from "lucide-react";

interface Resource {
  id: number;
  name: string;
  category: "hospital" | "ambulance" | "police" | "fire" | "blood_bank" | "government";
  phone: string;
  address: string;
  available24x7: boolean;
  city: string;
}

const RESOURCES: Resource[] = [
  { id: 1, name: "National Emergency", category: "police", phone: "112", address: "Pan India", available24x7: true, city: "all" },
  { id: 2, name: "Police Helpline", category: "police", phone: "100", address: "Pan India", available24x7: true, city: "all" },
  { id: 3, name: "Ambulance (National)", category: "ambulance", phone: "108", address: "Pan India", available24x7: true, city: "all" },
  { id: 4, name: "Ambulance (Private)", category: "ambulance", phone: "102", address: "Pan India", available24x7: true, city: "all" },
  { id: 5, name: "Fire Brigade", category: "fire", phone: "101", address: "Pan India", available24x7: true, city: "all" },
  { id: 6, name: "Women Helpline", category: "police", phone: "1091", address: "Pan India", available24x7: true, city: "all" },
  { id: 7, name: "Child Helpline", category: "government", phone: "1098", address: "Pan India", available24x7: true, city: "all" },
  { id: 8, name: "Disaster Management", category: "government", phone: "1070", address: "Pan India", available24x7: true, city: "all" },
  { id: 9, name: "Blood Bank (National)", category: "blood_bank", phone: "1910", address: "Pan India", available24x7: true, city: "all" },
  { id: 10, name: "Red Cross Blood Bank", category: "blood_bank", phone: "1800-180-7104", address: "Pan India", available24x7: false, city: "all" },
  { id: 11, name: "AIIMS Hospital", category: "hospital", phone: "011-26588500", address: "Ansari Nagar, New Delhi", available24x7: true, city: "delhi" },
  { id: 12, name: "District General Hospital", category: "hospital", phone: "1800-200-0000", address: "District HQ", available24x7: true, city: "all" },
  { id: 13, name: "PM Helpline", category: "government", phone: "1800-11-0031", address: "Pan India", available24x7: false, city: "all" },
  { id: 14, name: "Labour Helpline", category: "government", phone: "1800-233-2444", address: "Pan India", available24x7: false, city: "all" },
  { id: 15, name: "Senior Citizen Helpline", category: "government", phone: "14567", address: "Pan India", available24x7: true, city: "all" },
];

const CATEGORIES = [
  { id: "all", label: "All", icon: Building2 },
  { id: "hospital", label: "Hospitals", icon: Hospital },
  { id: "ambulance", label: "Ambulance", icon: Heart },
  { id: "police", label: "Police", icon: Shield },
  { id: "fire", label: "Fire Brigade", icon: Flame },
  { id: "blood_bank", label: "Blood Banks", icon: Droplets },
  { id: "government", label: "Government", icon: Building2 },
];

const CATEGORY_STYLES: Record<string, string> = {
  hospital: "bg-rose-100 text-rose-700 border-rose-200",
  ambulance: "bg-red-100 text-red-700 border-red-200",
  police: "bg-blue-100 text-blue-700 border-blue-200",
  fire: "bg-orange-100 text-orange-700 border-orange-200",
  blood_bank: "bg-pink-100 text-pink-700 border-pink-200",
  government: "bg-purple-100 text-purple-700 border-purple-200",
};

const ICON_MAP: Record<string, React.ElementType> = { hospital: Hospital, ambulance: Heart, police: Shield, fire: Flame, blood_bank: Droplets, government: Building2 };

export default function CommunityHelpPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = RESOURCES.filter(r => {
    if (activeCategory !== "all" && r.category !== activeCategory) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) && !r.phone.includes(search)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-blue-700 to-indigo-800 text-white py-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-90" />
          <h1 className="text-3xl font-black mb-2">Community Help Center</h1>
          <p className="text-blue-100">Emergency contacts & resources near you</p>
          <p className="text-blue-100 text-sm mt-1">सामुदायिक सहायता केंद्र</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search hospitals, police, fire..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-primary bg-background"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                  activeCategory === cat.id
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "bg-muted text-muted-foreground hover:bg-primary/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((resource, i) => {
            const Icon = ICON_MAP[resource.category] ?? Building2;
            return (
              <motion.div
                key={resource.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm leading-tight">{resource.name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{resource.address}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge className={`text-xs rounded-full capitalize ${CATEGORY_STYLES[resource.category]}`}>
                      {resource.category.replace("_", " ")}
                    </Badge>
                    {resource.available24x7 && (
                      <Badge className="text-xs rounded-full bg-green-100 text-green-700 border-green-200">24/7</Badge>
                    )}
                  </div>
                </div>
                <a href={`tel:${resource.phone}`} className="block mt-4">
                  <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:shadow-md transition-shadow">
                    <Phone className="w-4 h-4" /> {resource.phone}
                  </button>
                </a>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No resources found for your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
