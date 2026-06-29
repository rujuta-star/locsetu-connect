import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Image, Video, ArrowLeftRight, Briefcase, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

interface PortfolioItem {
  id: number;
  workerId: number;
  title: string;
  description: string | null;
  mediaUrl: string;
  mediaType: string;
  beforeUrl: string | null;
  afterUrl: string | null;
  createdAt: string;
}

interface PortfolioProps {
  workerId?: number;
  readonly?: boolean;
}

export function PortfolioSection({ workerId, readonly = false }: PortfolioProps) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", mediaUrl: "", mediaType: "image", beforeUrl: "", afterUrl: "" });
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();

  const load = async (id: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/portfolio/${id}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (workerId) load(workerId);
  }, [workerId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.mediaUrl) { toast({ title: t("titleAndImageRequired"), variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setItems(prev => [data, ...prev]);
      setForm({ title: "", description: "", mediaUrl: "", mediaType: "image", beforeUrl: "", afterUrl: "" });
      setShowForm(false);
      toast({ title: t("portfolioItemAdded") });
    } catch { toast({ title: t("errorAddingPortfolioItem"), variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const remove = async (id: number) => {
    const token = localStorage.getItem("auth_token");
    await fetch(`/api/portfolio/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setItems(prev => prev.filter(i => i.id !== id));
    toast({ title: t("portfolioItemRemoved") });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">{t("workPortfolio")}</h3>
          <Badge className="bg-primary/10 text-primary border-primary/20">{items.length} {t("itemsCount")}</Badge>
        </div>
        {!readonly && (
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5 rounded-xl bg-gradient-to-r from-primary to-orange-600 text-white">
            <Plus className="w-4 h-4" /> {t("addWork")}
          </Button>
        )}
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-5">
            <form onSubmit={submit} className="bg-muted/50 border border-border rounded-2xl p-5 space-y-3">
              <h4 className="font-semibold">{t("addPortfolioItem")}</h4>
              <input type="text" placeholder={t("portfolioTitlePlaceholder")} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <textarea placeholder={t("portfolioDescPlaceholder")} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2} className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              <input type="url" placeholder={t("portfolioMediaUrlPlaceholder")} value={form.mediaUrl} onChange={e => setForm(f => ({ ...f, mediaUrl: e.target.value }))}
                className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              <div className="grid grid-cols-2 gap-3">
                <input type="url" placeholder={t("portfolioBeforePlaceholder")} value={form.beforeUrl} onChange={e => setForm(f => ({ ...f, beforeUrl: e.target.value }))}
                  className="px-3 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input type="url" placeholder={t("portfolioAfterPlaceholder")} value={form.afterUrl} onChange={e => setForm(f => ({ ...f, afterUrl: e.target.value }))}
                  className="px-3 py-2.5 border border-border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={submitting} className="rounded-xl bg-gradient-to-r from-primary to-orange-600 text-white">
                  {submitting ? t("saving") : t("save")}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)} className="rounded-xl">{t("cancel")}</Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="aspect-square bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
              className="relative group rounded-2xl overflow-hidden border border-border bg-card shadow-sm aspect-square">
              {item.mediaUrl && (
                <img src={item.mediaUrl} alt={item.title} className="w-full h-full object-cover" onError={e => {
                  (e.target as HTMLImageElement).style.display = "none";
                }} />
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                <div className="flex justify-between">
                  <Badge className="bg-white/20 text-white border-0 text-xs capitalize">
                    {item.mediaType === "image" ? <Image className="w-3 h-3 mr-1" /> : <Video className="w-3 h-3 mr-1" />}
                    {item.mediaType}
                  </Badge>
                  {!readonly && (
                    <button onClick={() => remove(item.id)} className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{item.title}</p>
                  {item.description && <p className="text-white/70 text-xs mt-0.5 line-clamp-2">{item.description}</p>}
                  {(item.beforeUrl || item.afterUrl) && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <ArrowLeftRight className="w-3 h-3 text-white/60" />
                      <span className="text-white/60 text-xs">{t("beforeAfterAvailable")}</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Fallback when no image */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-orange-200 -z-10">
                <Upload className="w-8 h-8 text-primary/40" />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
          <Briefcase className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground font-medium">{readonly ? t("noPortfolioItems") : t("addFirstWorkPhoto")}</p>
          {!readonly && <p className="text-sm text-muted-foreground mt-1">{t("showCustomersWork")}</p>}
        </div>
      )}
    </div>
  );
}

export default function PortfolioPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [workerId, setWorkerId] = useState<number | null>(null);

  useEffect(() => {
    if (!user || user.role !== "worker") return;
    const token = localStorage.getItem("auth_token");
    fetch("/api/workers/me", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => setWorkerId(d.id)).catch(() => {});
  }, [user]);

  if (!user || user.role !== "worker") {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">{t("workersOnlyPortfolio")}</h2>
          <p className="text-muted-foreground">{t("registerAsWorkerPortfolio")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary to-orange-600 text-white py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <Briefcase className="w-8 h-8 mb-3" />
          <h1 className="text-3xl font-black mb-1">{t("myPortfolio")}</h1>
          <p className="text-orange-100">{t("portfolioSubtitle")}</p>
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {workerId && <PortfolioSection workerId={workerId} readonly={false} />}
        {!workerId && <p className="text-muted-foreground text-center py-12">{t("completeWorkerProfilePortfolio")}</p>}
      </div>
    </div>
  );
}
