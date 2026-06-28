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
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { AlertCircle } from "lucide-react";

const schema = z.object({
  identifier: z.string().min(1, "Email or phone is required"),
  password: z.string().min(1, "Password is required"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const [, navigate] = useLocation();
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        login(data.user as any, data.token);
        const role = data.user.role;
        if (role === "admin") navigate("/admin");
        else if (role === "worker") navigate("/worker-dashboard");
        else navigate("/dashboard");
      },
      onError: (err: any) => {
        setError(err?.data?.error ?? "Invalid credentials. Please try again.");
      },
    }
  });

  const onSubmit = (data: FormData) => {
    setError("");
    loginMutation.mutate({ data });
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
          <h1 className="text-2xl font-bold">{t("welcomeBack")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t("signInToAccount")}</p>
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

              <div className="space-y-1.5">
                <Label htmlFor="identifier">{t("emailOrPhone")}</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder={t("emailOrPhonePlaceholder")}
                  {...register("identifier")}
                />
                {errors.identifier && (
                  <p className="text-xs text-destructive">{errors.identifier.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">{t("password")}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("passwordPlaceholder")}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-orange-600 text-white font-semibold"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? t("signingIn") : t("signIn")}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              {t("dontHaveAccount")}{" "}
              <Link href="/register" className="text-primary font-medium hover:underline">
                {t("signUp")}
              </Link>
            </div>

            <div className="mt-4 p-3 bg-muted rounded-xl text-xs text-muted-foreground space-y-0.5">
              <p className="font-semibold text-foreground mb-1">{t("demoCredentials")}</p>
              <p>Admin: admin@locsetu.com / admin123</p>
              <p>Customer: customer@locsetu.com / demo123</p>
              <p>Worker: worker@locsetu.com / demo123</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
