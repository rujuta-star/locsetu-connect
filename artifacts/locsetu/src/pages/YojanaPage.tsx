import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink, ChevronDown, ChevronUp, BookOpen, IndianRupee, Heart, Briefcase, GraduationCap } from "lucide-react";

interface Scheme {
  id: string;
  name: string;
  nameHi: string;
  ministry: string;
  category: "income" | "health" | "skill" | "loan" | "pension";
  description: string;
  benefits: string[];
  eligibility: { minAge?: number; maxAge?: number; maxIncome?: number; gender?: string; occupation?: string[]; };
  documents: string[];
  link: string;
  color: string;
  icon: React.ElementType;
}

const ALL_SCHEMES: Scheme[] = [
  {
    id: "eshram", name: "e-Shram", nameHi: "ई-श्रम", ministry: "Ministry of Labour & Employment",
    category: "income", description: "National database for unorganised workers providing accident insurance of ₹2 lakh.",
    benefits: ["₹2 lakh accidental insurance", "PM-SYM pension link", "Future welfare scheme access"],
    eligibility: { minAge: 16, maxAge: 59, maxIncome: 10000 },
    documents: ["Aadhaar card", "Bank account details", "Mobile number linked to Aadhaar"],
    link: "https://eshram.gov.in", color: "from-blue-500 to-indigo-600", icon: Briefcase,
  },
  {
    id: "svanidhhi", name: "PM SVANidhi", nameHi: "पीएम स्वनिधि", ministry: "Ministry of Housing & Urban Affairs",
    category: "loan", description: "Micro-credit for street vendors — up to ₹50,000 working capital loan at subsidised rates.",
    benefits: ["₹10,000 first loan", "Up to ₹50,000 after repayment", "7% interest subsidy", "Digital payment cashback"],
    eligibility: { occupation: ["street vendor", "hawker", "small trader"] },
    documents: ["Aadhaar card", "Vendor certificate / letter of recommendation", "Bank account"],
    link: "https://pmsvanidhi.mohua.gov.in", color: "from-green-500 to-emerald-600", icon: IndianRupee,
  },
  {
    id: "ayushman", name: "Ayushman Bharat", nameHi: "आयुष्मान भारत", ministry: "Ministry of Health & Family Welfare",
    category: "health", description: "₹5 lakh per family per year health coverage at 27,000+ hospitals.",
    benefits: ["₹5 lakh annual health cover", "Cashless treatment", "27,000+ empanelled hospitals", "All pre-existing diseases covered"],
    eligibility: { maxIncome: 200000 },
    documents: ["Aadhaar card", "Ration card", "Income certificate"],
    link: "https://pmjay.gov.in", color: "from-rose-500 to-pink-600", icon: Heart,
  },
  {
    id: "skill_india", name: "Skill India / PMKVY", nameHi: "स्किल इंडिया / PMKVY", ministry: "Ministry of Skill Development",
    category: "skill", description: "Free skill training in 700+ job roles with certification and job placement support.",
    benefits: ["Free industry-linked training", "Government-recognised certificate", "Job placement support", "₹500–₹1,500 stipend"],
    eligibility: { minAge: 14 },
    documents: ["Aadhaar card", "10th/12th marksheet (if any)", "Bank account"],
    link: "https://www.pmkvyofficial.org", color: "from-amber-500 to-orange-600", icon: GraduationCap,
  },
  {
    id: "jan_dhan", name: "PM Jan Dhan Yojana", nameHi: "जन धन योजना", ministry: "Ministry of Finance",
    category: "income", description: "Zero-balance bank account with ₹2 lakh insurance and ₹5,000 overdraft facility.",
    benefits: ["Zero-balance savings account", "RuPay debit card", "₹2 lakh accident insurance", "₹30,000 life insurance", "Overdraft up to ₹10,000"],
    eligibility: {},
    documents: ["Aadhaar card / Voter ID", "One recent photograph"],
    link: "https://pmjdy.gov.in", color: "from-teal-500 to-cyan-600", icon: IndianRupee,
  },
  {
    id: "mudra", name: "PM Mudra Yojana", nameHi: "मुद्रा योजना", ministry: "Ministry of Finance",
    category: "loan", description: "Collateral-free business loans for micro entrepreneurs. Up to ₹10 lakh.",
    benefits: ["Shishu: up to ₹50,000", "Kishore: ₹50K–₹5 lakh", "Tarun: ₹5–₹10 lakh", "No collateral needed"],
    eligibility: { minAge: 18 },
    documents: ["Aadhaar card", "PAN card", "Business plan / proof", "Bank statements"],
    link: "https://www.mudra.org.in", color: "from-violet-500 to-purple-600", icon: IndianRupee,
  },
];

const CATEGORY_ICONS = { income: IndianRupee, health: Heart, skill: GraduationCap, loan: Briefcase, pension: FileText };
const CATEGORY_COLORS: Record<string, string> = { income: "bg-green-100 text-green-700 border-green-200", health: "bg-rose-100 text-rose-700 border-rose-200", skill: "bg-amber-100 text-amber-700 border-amber-200", loan: "bg-blue-100 text-blue-700 border-blue-200", pension: "bg-purple-100 text-purple-700 border-purple-200" };

function SchemeCard({ scheme }: { scheme: Scheme }) {
  const [open, setOpen] = useState(false);
  const Icon = scheme.icon;
  return (
    <motion.div layout className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${scheme.color} flex items-center justify-center text-white flex-shrink-0`}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-base">{scheme.name}</h3>
                <p className="text-xs text-muted-foreground">{scheme.nameHi} · {scheme.ministry}</p>
              </div>
              <Badge className={`text-xs rounded-full capitalize flex-shrink-0 ${CATEGORY_COLORS[scheme.category]}`}>{scheme.category}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{scheme.description}</p>
          </div>
        </div>

        <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between mt-4 pt-3 border-t border-border text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          <span>{open ? "Hide details" : "View benefits & eligibility"}</span>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-5 pb-5 space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Benefits</h4>
                <ul className="space-y-1.5">
                  {scheme.benefits.map(b => (
                    <li key={b} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-0.5">✓</span> {b}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Required Documents</h4>
                <ul className="space-y-1.5">
                  {scheme.documents.map(d => (
                    <li key={d} className="flex items-start gap-2 text-sm">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" /> {d}
                    </li>
                  ))}
                </ul>
              </div>
              <a href={scheme.link} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className={`w-full rounded-xl bg-gradient-to-r ${scheme.color} text-white gap-2`}>
                  Apply Now <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function YojanaPage() {
  const [form, setForm] = useState({ age: "", gender: "", income: "", occupation: "", state: "" });
  const [results, setResults] = useState<Scheme[] | null>(null);

  const findSchemes = () => {
    const age = parseInt(form.age);
    const income = parseInt(form.income);
    const matched = ALL_SCHEMES.filter(s => {
      const e = s.eligibility;
      if (e.minAge && age && age < e.minAge) return false;
      if (e.maxAge && age && age > e.maxAge) return false;
      if (e.maxIncome && income && income > e.maxIncome) return false;
      if (e.gender && form.gender && e.gender !== form.gender) return false;
      return true;
    });
    setResults(matched);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-orange-600 to-amber-600 text-white py-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-90" />
          <h1 className="text-3xl font-black mb-2">Yojana Assistant</h1>
          <p className="text-orange-100">Discover government schemes you're eligible for</p>
          <p className="text-orange-100 text-sm mt-1">सरकारी योजनाएं जो आपके लिए हैं</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Form */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-lg mb-4">Tell us about yourself</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Age / आयु</label>
              <input type="number" placeholder="e.g. 28" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Gender / लिंग</label>
              <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background text-sm">
                <option value="">Any</option>
                <option value="male">Male / पुरुष</option>
                <option value="female">Female / महिला</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Monthly Income / मासिक आय (₹)</label>
              <input type="number" placeholder="e.g. 8000" value={form.income} onChange={e => setForm(f => ({ ...f, income: e.target.value }))}
                className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Occupation / पेशा</label>
              <select value={form.occupation} onChange={e => setForm(f => ({ ...f, occupation: e.target.value }))}
                className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background text-sm">
                <option value="">Select</option>
                <option value="electrician">Electrician</option>
                <option value="plumber">Plumber</option>
                <option value="carpenter">Carpenter</option>
                <option value="street vendor">Street Vendor</option>
                <option value="maid">Maid / Domestic Worker</option>
                <option value="tailor">Tailor</option>
                <option value="mechanic">Mechanic</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <Button onClick={findSchemes} className="w-full mt-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-bold rounded-xl">
            Find My Schemes
          </Button>
        </div>

        {/* Results */}
        {results !== null ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">{results.length} Schemes Found</h2>
              <Badge className="bg-green-100 text-green-700 border-green-200">Eligible</Badge>
            </div>
            {results.map(s => <SchemeCard key={s.id} scheme={s} />)}
            {results.length === 0 && <p className="text-muted-foreground text-center py-8">No schemes matched. Try adjusting your details.</p>}
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="font-bold text-lg">All Schemes</h2>
            {ALL_SCHEMES.map(s => <SchemeCard key={s.id} scheme={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}
