import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LANGUAGE_NAMES, type Language } from "@/lib/translations";
import { AlertCircle, User, Briefcase, Globe } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().min(10, "Invalid phone number").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["customer", "worker"]),
}).refine(data => data.email || data.phone, {
  message: "Email or phone is required",
  path: ["email"],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { login } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [, navigate] = useLocation();
  const [error, setError] = useState("");
  const [selectedRole, setSelectedRole] = useState<"customer" | "worker">("customer");

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "customer" },
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        login(data.user as any, data.token);
        const role = data.user.role;
        if (role === "worker") navigate("/worker-dashboard");
        else navigate("/dashboard");
      },
      onError: (err: any) => {
        setError(err?.data?.error ?? "Registration failed. Please try again.");
      },
    }
  });

  const handleRoleSelect = (role: "customer" | "worker") => {
    setSelectedRole(role);
    setValue("role", role);
  };

  const onSubmit = (data: FormData) => {
    setError("");
    registerMutation.mutate({
      data: {
        name: data.name,
        email: data.email || "",
        phone: data.phone || undefined,
        password: data.password,
        role: data.role,
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-white font-bold text-lg">L</span>
          </div>
          <h1 className="text-2xl font-bold">{t("joinLocSetu")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("createYourAccount")}</p>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Language selector */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  {t("chooseLanguage")}
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(LANGUAGE_NAMES) as [Language, { native: string; label: string; flag: string }][]).map(([code, info]) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setLanguage(code)}
                      className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                        language === code
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="text-lg mb-0.5">{info.flag}</div>
                      <div className={`font-medium text-xs ${language === code ? "text-primary" : "text-foreground"}`}>
                        {info.native}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Role selector */}
              <div className="space-y-1.5">
                <Label>{t("iAma")}</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "customer" as const, label: t("customer"), desc: t("hireWorkers"), icon: User },
                    { value: "worker" as const, label: t("worker"), desc: t("offerServices"), icon: Briefcase },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleRoleSelect(opt.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        selectedRole === opt.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <opt.icon className={`w-5 h-5 mb-1 ${selectedRole === opt.value ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="font-medium text-sm">{opt.label}</div>
                      <div className="text-xs text-muted-foreground">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">{t("fullName")}</Label>
                <Input id="name" placeholder={t("fullNamePlaceholder")} {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">{t("email")}</Label>
                <Input id="email" type="email" placeholder={t("emailPlaceholder")} {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">{t("phoneNumber")}</Label>
                <Input id="phone" type="tel" placeholder={t("phonePlaceholder")} {...register("phone")} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">{t("password")}</Label>
                <Input id="password" type="password" placeholder={t("passwordMin")} {...register("password")} />
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-primary to-orange-600 text-white font-semibold" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? t("creatingAccount") : t("createAccount")}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              {t("alreadyHaveAccount")}{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">{t("signIn")}</Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
