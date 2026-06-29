import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useGetMyWorkerProfile, useUpdateWorkerProfile } from "@workspace/api-client-react";
import { getGetMyWorkerProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LANGUAGE_NAMES, type Language } from "@/lib/translations";
import { CheckCircle, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SKILL_OPTIONS = ["electrician", "plumber", "carpenter", "painter", "tailor", "maid", "driver", "mechanic", "tutor", "technician"];
const SPOKEN_LANGUAGE_OPTIONS = ["Hindi", "English", "Marathi", "Gujarati", "Bengali", "Tamil", "Telugu", "Kannada", "Malayalam", "Punjabi"];
const LOCATIONS = ["Mumbai", "Delhi", "Bangalore", "Pune", "Hyderabad", "Chennai", "Kolkata", "Ahmedabad", "Surat", "Jaipur"];

export default function ProfilePage() {
  const { user } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: profile } = useGetMyWorkerProfile({ query: { enabled: user?.role === "worker", queryKey: getGetMyWorkerProfileQueryKey() } });

  const [skills, setSkills] = useState<string[]>([]);
  const [spokenLanguages, setSpokenLanguages] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [about, setAbout] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    if (profile) {
      setSkills(profile.skills ?? []);
      setSpokenLanguages(profile.languages ?? []);
      setLocation(profile.location ?? "");
      setExperience(profile.experience ?? "");
      setAbout(profile.bio ?? "");
      setIsAvailable(profile.isAvailable ?? true);
    }
  }, [profile]);

  const updateProfile = useUpdateWorkerProfile({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMyWorkerProfileQueryKey() });
        toast({ title: t("save"), description: "Your changes have been saved." });
      },
      onError: () => {
        toast({ title: t("error"), description: "Failed to update profile.", variant: "destructive" });
      }
    }
  });

  const toggleSkill = (skill: string) => {
    setSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  const toggleSpokenLanguage = (lang: string) => {
    setSpokenLanguages(prev => prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]);
  };

  const handleSave = () => {
    if (user?.role !== "worker") return;
    updateProfile.mutate({
      data: { skills, languages: spokenLanguages, location, experience, bio: about, isAvailable }
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("myProfile")}</h1>
        <p className="text-muted-foreground text-sm">{t("manageAccount")}</p>
      </div>

      {/* App Language Preference */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-primary/20 bg-primary/2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              {t("language")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(LANGUAGE_NAMES) as [Language, { native: string; label: string; flag: string }][]).map(([code, info]) => (
                <button
                  key={code}
                  onClick={() => setLanguage(code)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    language === code
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/40 hover:bg-muted"
                  }`}
                >
                  <div className="text-2xl mb-1">{info.flag}</div>
                  <div className={`font-semibold text-sm ${language === code ? "text-primary" : "text-foreground"}`}>
                    {info.native}
                  </div>
                  <div className="text-xs text-muted-foreground">{info.label}</div>
                  {language === code && (
                    <CheckCircle className="w-3.5 h-3.5 text-primary mx-auto mt-1" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Basic info (display only) */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card>
          <CardHeader><CardTitle className="text-base">{t("accountInfo")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">{t("fullName")}</Label>
              <p className="font-medium">{user?.name}</p>
            </div>
            {user?.email && (
              <div>
                <Label className="text-xs text-muted-foreground">{t("email")}</Label>
                <p className="font-medium">{user.email}</p>
              </div>
            )}
            {user?.phone && (
              <div>
                <Label className="text-xs text-muted-foreground">{t("phoneNumber")}</Label>
                <p className="font-medium">{user.phone}</p>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">{t("role")}</Label>
              <p className="font-medium capitalize">{user?.role}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Worker profile */}
      {user?.role === "worker" && (
        <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{t("availabilityLabel")}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isAvailable ? "text-green-600" : "text-muted-foreground"}`}>
                      {isAvailable ? t("available") : t("busy")}
                    </span>
                    <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
                  </div>
                </div>
              </CardHeader>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <CardHeader><CardTitle className="text-base">{t("yourSkills")}</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map(skill => (
                    <button
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm capitalize transition-all ${
                        skills.includes(skill)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {skills.includes(skill) && <CheckCircle className="w-3.5 h-3.5" />}
                      {skill}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader><CardTitle className="text-base">{t("locationAndDetails")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>{t("cityLocation")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {LOCATIONS.map(loc => (
                      <button
                        key={loc}
                        onClick={() => setLocation(loc)}
                        className={`px-3 py-1.5 rounded-full border text-sm transition-all ${
                          location === loc ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="experience">{t("experienceLabel")}</Label>
                  <Input id="experience" placeholder={t("yearsOfExperiencePlaceholder")} value={experience} onChange={e => setExperience(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="about">{t("aboutYou")}</Label>
                  <Textarea
                    id="about"
                    placeholder={t("bioPlaceholder")}
                    rows={3}
                    value={about}
                    onChange={e => setAbout(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card>
              <CardHeader><CardTitle className="text-base">{t("spokenLanguagesLabel")}</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {SPOKEN_LANGUAGE_OPTIONS.map(lang => (
                    <button
                      key={lang}
                      onClick={() => toggleSpokenLanguage(lang)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all ${
                        spokenLanguages.includes(lang)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {spokenLanguages.includes(lang) && <CheckCircle className="w-3.5 h-3.5" />}
                      {lang}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Verification status */}
          {profile && (
            <Card>
              <CardHeader><CardTitle className="text-base">{t("verificationStatus")}</CardTitle></CardHeader>
              <CardContent>
                {(() => {
                  const vs = (profile as any).verificationStatus;
                  return (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                      vs === "approved" ? "bg-green-50 text-green-700"
                      : vs === "pending" ? "bg-yellow-50 text-yellow-700"
                      : vs === "rejected" ? "bg-red-50 text-red-700"
                      : "bg-muted text-muted-foreground"
                    }`}>
                      <CheckCircle className="w-4 h-4" />
                      {vs === "approved" ? t("profileVerifiedMsg")
                      : vs === "pending" ? t("verificationPendingMsg")
                      : vs === "rejected" ? t("verificationRejectedMsg")
                          : t("notSubmittedMsg")}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          <Button className="w-full bg-gradient-to-r from-primary to-orange-600 text-white" onClick={handleSave} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? t("loading") : t("save")}
          </Button>
        </>
      )}
    </div>
  );
}
