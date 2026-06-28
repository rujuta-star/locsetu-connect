import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, Zap, Droplets, Hammer, Paintbrush, Wrench, Scissors, Home, Car, BookOpen, Search } from "lucide-react";

const SKILLS = [
  { id: "all", name: "All", icon: IndianRupee },
  { id: "electrician", name: "Electrician", icon: Zap },
  { id: "plumber", name: "Plumber", icon: Droplets },
  { id: "carpenter", name: "Carpenter", icon: Hammer },
  { id: "painter", name: "Painter", icon: Paintbrush },
  { id: "mechanic", name: "Mechanic", icon: Wrench },
  { id: "tailor", name: "Tailor", icon: Scissors },
  { id: "maid", name: "Maid", icon: Home },
  { id: "tutor", name: "Tutor", icon: BookOpen },
];

const SKILL_COLORS: Record<string, string> = {
  electrician: "from-amber-500 to-orange-600",
  plumber: "from-blue-500 to-cyan-600",
  carpenter: "from-green-500 to-emerald-600",
  painter: "from-rose-500 to-pink-600",
  mechanic: "from-purple-500 to-violet-600",
  tailor: "from-teal-500 to-cyan-600",
  maid: "from-orange-400 to-red-500",
  tutor: "from-indigo-500 to-blue-600",
};

const PRICING_DATA = [
  { skill: "electrician", serviceName: "Fan Repair", serviceNameHi: "पंखा मरम्मत", minPrice: 100, avgPrice: 175, maxPrice: 250, unit: "per visit" },
  { skill: "electrician", serviceName: "House Wiring", serviceNameHi: "घर की वायरिंग", minPrice: 500, avgPrice: 2750, maxPrice: 5000, unit: "per room" },
  { skill: "electrician", serviceName: "Switch/Socket Repair", serviceNameHi: "स्विच मरम्मत", minPrice: 80, avgPrice: 140, maxPrice: 200, unit: "per unit" },
  { skill: "electrician", serviceName: "MCB/Fuse Replacement", serviceNameHi: "MCB बदलना", minPrice: 150, avgPrice: 250, maxPrice: 400, unit: "per unit" },
  { skill: "plumber", serviceName: "Tap Repair", serviceNameHi: "नल मरम्मत", minPrice: 150, avgPrice: 225, maxPrice: 300, unit: "per tap" },
  { skill: "plumber", serviceName: "Pipe Leakage Fix", serviceNameHi: "पाइप लीकेज", minPrice: 200, avgPrice: 400, maxPrice: 800, unit: "per point" },
  { skill: "plumber", serviceName: "Toilet Repair", serviceNameHi: "टॉयलेट मरम्मत", minPrice: 250, avgPrice: 450, maxPrice: 700, unit: "per visit" },
  { skill: "plumber", serviceName: "Water Pump Installation", serviceNameHi: "वॉटर पंप", minPrice: 500, avgPrice: 1000, maxPrice: 2000, unit: "per unit" },
  { skill: "carpenter", serviceName: "Door/Window Repair", serviceNameHi: "दरवाज़ा मरम्मत", minPrice: 200, avgPrice: 450, maxPrice: 800, unit: "per item" },
  { skill: "carpenter", serviceName: "Furniture Polish", serviceNameHi: "फर्नीचर पॉलिश", minPrice: 300, avgPrice: 600, maxPrice: 1200, unit: "per piece" },
  { skill: "carpenter", serviceName: "Bed Assembly", serviceNameHi: "बेड असेंबली", minPrice: 300, avgPrice: 500, maxPrice: 800, unit: "per piece" },
  { skill: "painter", serviceName: "Room Painting", serviceNameHi: "कमरे की पेंटिंग", minPrice: 800, avgPrice: 2000, maxPrice: 5000, unit: "per room" },
  { skill: "painter", serviceName: "Wall Putty", serviceNameHi: "वॉल पुट्टी", minPrice: 10, avgPrice: 18, maxPrice: 30, unit: "per sq ft" },
  { skill: "mechanic", serviceName: "Bike Service", serviceNameHi: "बाइक सर्विस", minPrice: 300, avgPrice: 600, maxPrice: 1200, unit: "per service" },
  { skill: "mechanic", serviceName: "Car Service", serviceNameHi: "कार सर्विस", minPrice: 800, avgPrice: 2000, maxPrice: 5000, unit: "per service" },
  { skill: "mechanic", serviceName: "Oil Change", serviceNameHi: "तेल बदलना", minPrice: 200, avgPrice: 400, maxPrice: 800, unit: "per visit" },
  { skill: "tailor", serviceName: "Shirt Stitching", serviceNameHi: "शर्ट सिलाई", minPrice: 200, avgPrice: 350, maxPrice: 600, unit: "per piece" },
  { skill: "tailor", serviceName: "Alteration", serviceNameHi: "बदलाव", minPrice: 50, avgPrice: 150, maxPrice: 300, unit: "per piece" },
  { skill: "maid", serviceName: "House Cleaning", serviceNameHi: "घर की सफाई", minPrice: 300, avgPrice: 600, maxPrice: 1200, unit: "per visit" },
  { skill: "maid", serviceName: "Utensil Washing", serviceNameHi: "बर्तन धोना", minPrice: 500, avgPrice: 1000, maxPrice: 2000, unit: "per month" },
  { skill: "tutor", serviceName: "Home Tuition (1 student)", serviceNameHi: "होम ट्यूशन", minPrice: 1500, avgPrice: 3000, maxPrice: 8000, unit: "per month" },
];

export default function PricingPage() {
  const [activeSkill, setActiveSkill] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = PRICING_DATA.filter(p => {
    if (activeSkill !== "all" && p.skill !== activeSkill) return false;
    if (search && !p.serviceName.toLowerCase().includes(search.toLowerCase()) && !p.serviceNameHi.includes(search)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <IndianRupee className="w-10 h-10 mx-auto mb-3 opacity-90" />
          <h1 className="text-3xl font-black mb-2">Price Transparency</h1>
          <p className="text-emerald-100">Know the fair price before booking any service</p>
          <p className="text-emerald-100 text-sm mt-1">बुकिंग से पहले सही कीमत जानें</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search service..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-primary bg-background"
          />
        </div>

        {/* Skill Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SKILLS.map(skill => {
            const Icon = skill.icon;
            return (
              <button
                key={skill.id}
                onClick={() => setActiveSkill(skill.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all ${
                  activeSkill === skill.id
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "bg-muted text-muted-foreground hover:bg-primary/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {skill.name}
              </button>
            );
          })}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((item, i) => {
            const color = SKILL_COLORS[item.skill] ?? "from-gray-500 to-gray-600";
            return (
              <motion.div
                key={`${item.skill}-${item.serviceName}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-bold text-base">{item.serviceName}</h3>
                    <p className="text-sm text-muted-foreground">{item.serviceNameHi}</p>
                  </div>
                  <Badge className={`text-xs rounded-full capitalize bg-gradient-to-r ${color} text-white border-0`}>{item.skill}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center bg-green-50 border border-green-200 rounded-xl py-3">
                    <div className="text-xs text-muted-foreground mb-1">Min</div>
                    <div className="font-black text-green-700">₹{item.minPrice.toLocaleString()}</div>
                  </div>
                  <div className="text-center bg-primary/8 border border-primary/20 rounded-xl py-3">
                    <div className="text-xs text-muted-foreground mb-1">Avg</div>
                    <div className="font-black text-primary">₹{item.avgPrice.toLocaleString()}</div>
                  </div>
                  <div className="text-center bg-amber-50 border border-amber-200 rounded-xl py-3">
                    <div className="text-xs text-muted-foreground mb-1">Max</div>
                    <div className="font-black text-amber-700">₹{item.maxPrice.toLocaleString()}</div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center mt-3">
                  Prices are estimates · {item.unit}
                </p>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <IndianRupee className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No services found for your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
