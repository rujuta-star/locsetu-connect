import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Zap, Droplets, Hammer, Wrench, Lock, Phone, MessageCircle,
  Star, MapPin, CheckCircle, Clock, Shield, AlertTriangle
} from "lucide-react";

const EMERGENCY_SKILLS = [
  { id: "electrician", name: "Electrician", nameHi: "इलेक्ट्रीशियन", icon: Zap, color: "from-amber-500 to-orange-600", bg: "bg-amber-50 border-amber-200" },
  { id: "plumber", name: "Plumber", nameHi: "प्लंबर", icon: Droplets, color: "from-blue-500 to-cyan-600", bg: "bg-blue-50 border-blue-200" },
  { id: "carpenter", name: "Carpenter", nameHi: "बढ़ई", icon: Hammer, color: "from-green-500 to-emerald-600", bg: "bg-green-50 border-green-200" },
  { id: "mechanic", name: "Mechanic", nameHi: "मैकेनिक", icon: Wrench, color: "from-purple-500 to-violet-600", bg: "bg-purple-50 border-purple-200" },
  { id: "locksmith", name: "Locksmith", nameHi: "लॉकस्मिथ", icon: Lock, color: "from-rose-500 to-pink-600", bg: "bg-rose-50 border-rose-200" },
];

const AVATAR_GRADIENTS = ["from-orange-400 to-rose-500", "from-blue-400 to-violet-500", "from-green-400 to-teal-500", "from-amber-400 to-orange-500", "from-purple-400 to-pink-500"];

export default function EmergencyPage() {
  const [selectedSkill, setSelectedSkill] = useState("");
  const [location, setLocation] = useState("");
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<"rating" | "availability" | "distance">("rating");
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  const findWorkers = async () => {
    if (!selectedSkill) {
      toast({ title: "Select a service", description: "Please choose what help you need.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const params = new URLSearchParams({ skill: selectedSkill });
      if (location) params.set("location", location);
      const res = await fetch(`/api/emergency/workers?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setWorkers(data);
      if (data.length === 0) toast({ title: "No workers found", description: "Try a different location or skill." });
    } catch {
      toast({ title: "Error", description: "Could not find workers.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const bookInstantly = async (worker: any) => {
    if (!user) { navigate("/login"); return; }
    try {
      const token = localStorage.getItem("auth_token");
      await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: `Emergency ${selectedSkill} help`,
          description: `Emergency assistance needed`,
          skill: selectedSkill,
          location: location || "Current location",
          workerId: worker.userId,
        }),
      });
      toast({ title: "Booked!", description: `${worker.name} has been notified. Estimated arrival: ${worker.estimatedArrival} mins.` });
    } catch {
      toast({ title: "Error", description: "Booking failed.", variant: "destructive" });
    }
  };

  const sorted = [...workers].sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "distance") return (a.estimatedArrival ?? 99) - (b.estimatedArrival ?? 99);
    return (b.isAvailable ? 1 : 0) - (a.isAvailable ? 1 : 0);
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Emergency Header */}
      <div className="bg-gradient-to-br from-red-600 to-rose-700 text-white py-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 mb-4">
              <AlertTriangle className="w-4 h-4 animate-pulse" />
              <span className="text-sm font-bold">Emergency Help — Fast Response</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black mb-3">Need Urgent Help?</h1>
            <p className="text-red-100 text-base">Find the nearest available worker within minutes</p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Skill Selection */}
        <div>
          <p className="font-bold text-lg mb-3">Select Service Type</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {EMERGENCY_SKILLS.map(skill => {
              const Icon = skill.icon;
              return (
                <motion.button
                  key={skill.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedSkill(skill.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                    selectedSkill === skill.id
                      ? "border-red-500 bg-red-50 shadow-lg shadow-red-100"
                      : "border-border bg-card hover:border-red-300"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${skill.color} flex items-center justify-center text-white`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-center leading-tight">{skill.name}</span>
                  <span className="text-xs text-muted-foreground">{skill.nameHi}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Location */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
            <input
              type="text"
              placeholder="Your location / area"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-border rounded-xl focus:outline-none focus:border-red-400 bg-background"
            />
          </div>
          <Button
            onClick={findWorkers}
            disabled={loading}
            className="bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold px-6 rounded-xl hover:shadow-lg"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "Find Now"}
          </Button>
        </div>

        {/* Sort */}
        {workers.length > 0 && (
          <div className="flex gap-2">
            <span className="text-sm text-muted-foreground mr-2 self-center">Sort by:</span>
            {(["rating", "distance", "availability"] as const).map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all capitalize ${
                  sortBy === s ? "bg-red-600 text-white" : "bg-muted text-muted-foreground hover:bg-red-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Workers List */}
        <div className="space-y-4">
          {sorted.map((worker, i) => {
            const gradient = AVATAR_GRADIENTS[worker.id % AVATAR_GRADIENTS.length];
            const initials = worker.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
            return (
              <motion.div
                key={worker.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-2xl p-5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-base`}>
                      {worker.avatarUrl ? <img src={worker.avatarUrl} alt={worker.name} className="w-full h-full object-cover rounded-2xl" /> : initials}
                    </div>
                    {worker.isAvailable && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{worker.name}</h3>
                        {worker.isVerified && <CheckCircle className="w-4 h-4 text-primary" />}
                        <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">Emergency</Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm font-bold text-red-600">
                        <Clock className="w-3.5 h-3.5" />
                        ~{worker.estimatedArrival} min
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-semibold">{worker.rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({worker.reviewCount} reviews)</span>
                      <span className="mx-2 text-border">·</span>
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{worker.location}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {worker.skills.slice(0, 3).map((s: string) => (
                        <span key={s} className="text-xs bg-primary/10 text-primary rounded-lg px-2 py-0.5 capitalize">{s}</span>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-3">
                      {worker.phone && (
                        <>
                          <a href={`tel:${worker.phone}`}>
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs rounded-xl border-green-300 text-green-700 hover:bg-green-50">
                              <Phone className="w-3.5 h-3.5" /> Call
                            </Button>
                          </a>
                          <a href={`https://wa.me/${worker.phone?.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline" className="gap-1.5 text-xs rounded-xl border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                            </Button>
                          </a>
                        </>
                      )}
                      <Button
                        size="sm"
                        onClick={() => bookInstantly(worker)}
                        className="gap-1.5 text-xs rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white ml-auto"
                      >
                        <Zap className="w-3.5 h-3.5" /> Book Instantly
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {workers.length === 0 && !loading && (
          <div className="text-center py-16 text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-4 text-red-300" />
            <p className="font-medium">Select a service type and tap "Find Now"</p>
            <p className="text-sm mt-1">We'll find the nearest available professional</p>
          </div>
        )}
      </div>
    </div>
  );
}
