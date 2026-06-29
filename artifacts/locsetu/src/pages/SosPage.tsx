import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AlertTriangle, MapPin, Phone, CheckCircle, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

export default function SosPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [locationAddr, setLocationAddr] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { t } = useLanguage();

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setLocationAddr(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        toast({ title: t("locationDetected"), description: t("coordinatesCaptured") });
      }, () => {
        toast({ title: t("cannotAccessLocation"), description: t("enterLocationManually"), variant: "destructive" });
      });
    }
  };

  const sendSOS = async () => {
    if (!user) { navigate("/login"); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          locationAddress: locationAddr || "Location not provided",
          emergencyContact: contact || null,
          message: message || "SOS - Emergency help needed",
        }),
      });
      setSent(true);
    } catch {
      toast({ title: t("sosFailed"), description: t("sosTryAgain"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const EMERGENCY_NUMBERS = [
    { label: t("policeLabel"), num: "100" },
    { label: t("ambulanceLabel"), num: "108" },
    { label: t("emergencyLabel"), num: "112" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-gradient-to-br from-red-700 to-rose-800 text-white py-10 px-4">
        <div className="max-w-lg mx-auto text-center">
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <AlertTriangle className="w-14 h-14 mx-auto mb-3" />
          </motion.div>
          <h1 className="text-3xl font-black mb-2">{t("sosSafetyAlert")}</h1>
          <p className="text-red-100">{t("sendEmergencyAlertDesc")}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 flex-1 space-y-5">
        {sent ? (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-center py-16">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black mb-2">{t("sosAlertSent")}</h2>
            <p className="text-muted-foreground mb-6">{t("helpIsOnWay")}</p>
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-left space-y-3">
              <p className="text-sm font-medium text-green-800">{t("whatToDoNow")}</p>
              <ul className="space-y-2 text-sm text-green-700">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {t("stayInSafeLocation")}</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {t("keepPhoneCharged")}</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {t("call112IfDanger")}</li>
              </ul>
            </div>
            <Button onClick={() => setSent(false)} variant="outline" className="mt-6 rounded-xl">{t("sendAnotherAlert")}</Button>
          </motion.div>
        ) : (
          <>
            {/* National Emergency Numbers */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
              <p className="text-sm font-bold text-red-800 mb-3">{t("nationalEmergencyNumbers")}</p>
              <div className="grid grid-cols-3 gap-2">
                {EMERGENCY_NUMBERS.map(e => (
                  <a key={e.num} href={`tel:${e.num}`}>
                    <div className="text-center bg-white border border-red-200 rounded-xl py-3 hover:bg-red-50 transition-colors cursor-pointer">
                      <div className="font-black text-red-700 text-lg">{e.num}</div>
                      <div className="text-xs text-red-600">{e.label}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* SOS Form */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("yourLocation")}</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    placeholder={t("enterAreaAddress")}
                    value={locationAddr}
                    onChange={e => setLocationAddr(e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 bg-background text-sm"
                  />
                  <Button variant="outline" onClick={getLocation} className="rounded-xl border-red-300 text-red-600 hover:bg-red-50">
                    <MapPin className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("emergencyContactNumber")}</label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="w-4 h-4 text-muted-foreground ml-3 absolute" />
                  <input
                    type="tel"
                    placeholder="+91 XXXXXXXXXX"
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 bg-background text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">{t("messageOptionalLabel")}</label>
                <textarea
                  placeholder={t("describeYourEmergency")}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows={3}
                  className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 bg-background text-sm resize-none"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={sendSOS}
                disabled={loading}
                className="w-full py-5 bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-2xl font-black text-xl shadow-lg shadow-red-200 flex items-center justify-center gap-3 hover:shadow-xl transition-shadow"
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><AlertTriangle className="w-6 h-6" /> {t("sendSosAlert")}</>
                )}
              </motion.button>

              <div className="flex items-center gap-2 justify-center text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>{t("sosPrivacyNote")}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
