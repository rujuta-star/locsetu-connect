import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LANGUAGE_NAMES, type Language } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Bell, Menu, X, Search, Heart, User, LogOut,
  LayoutDashboard, Shield, Megaphone, ChevronDown, Globe
} from "lucide-react";
import { useListNotifications, getListNotificationsQueryKey } from "@workspace/api-client-react";
import { useLogout } from "@/lib/api-compat";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const logoutMutation = useLogout();

  const { data: notifications } = useListNotifications({
    query: { enabled: !!user, queryKey: getListNotificationsQueryKey() }
  });
  const unreadCount = notifications?.filter(n => !n.isRead).length ?? 0;

  const handleLogout = () => {
    logoutMutation.mutate();
    logout();
    navigate("/");
  };

  const initials = user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  const navLinks = user?.role === "worker"
    ? [
        { href: "/worker-dashboard", label: t("dashboard"), icon: LayoutDashboard },
        { href: "/search", label: t("findJobs"), icon: Search },
        { href: "/buzz", label: t("localBuzz"), icon: Megaphone },
      ]
    : user?.role === "admin"
    ? [
        { href: "/admin", label: t("admin"), icon: Shield },
        { href: "/search", label: t("workers"), icon: Search },
        { href: "/buzz", label: t("localBuzz"), icon: Megaphone },
      ]
    : user
    ? [
        { href: "/search", label: t("findWorkers"), icon: Search },
        { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
        { href: "/saved", label: t("saved"), icon: Heart },
        { href: "/buzz", label: t("localBuzz"), icon: Megaphone },
      ]
    : [
        { href: "/search", label: t("findWorkers"), icon: Search },
        { href: "/buzz", label: t("localBuzz"), icon: Megaphone },
      ];

  const isDark = location === "/";

  return (
    <div className="min-h-screen bg-background">
      <header className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        isDark
          ? "bg-[#0f0f0f]/80 backdrop-blur-xl border-white/10"
          : "bg-card/80 backdrop-blur-xl border-border shadow-sm"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <motion.div
                whileHover={{ rotate: 10, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
                className="w-8 h-8 bg-gradient-to-br from-primary to-orange-600 rounded-xl flex items-center justify-center shadow-md"
              >
                <span className="text-white font-black text-sm">L</span>
              </motion.div>
              <span className={`font-black text-lg hidden sm:block transition-colors ${isDark ? "text-white" : "text-foreground"}`}>
                LocSetu <span className="text-primary">Connect</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => {
                const Icon = link.icon;
                const active = location === link.href;
                return (
                  <Link key={link.href} href={link.href}>
                    <motion.div
                      whileHover={{ y: -1 }}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                        active
                          ? isDark
                            ? "bg-white/15 text-white"
                            : "bg-primary/10 text-primary"
                          : isDark
                          ? "text-white/70 hover:text-white hover:bg-white/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </motion.div>
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-1.5">
              {/* Language switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
                      isDark ? "text-white/70 hover:text-white hover:bg-white/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                    title={t("language")}
                  >
                    <Globe className="w-4 h-4" />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 rounded-2xl p-1.5">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{t("language")}</div>
                  {(Object.entries(LANGUAGE_NAMES) as [Language, { native: string; label: string; flag: string }][]).map(([code, info]) => (
                    <DropdownMenuItem
                      key={code}
                      onClick={() => setLanguage(code)}
                      className={`flex items-center gap-2.5 cursor-pointer rounded-xl px-3 py-2 ${language === code ? "bg-primary/10 text-primary font-medium" : ""}`}
                    >
                      <span className="text-base">{info.flag}</span>
                      <div>
                        <div className="text-sm">{info.native}</div>
                        <div className="text-xs text-muted-foreground">{info.label}</div>
                      </div>
                      {language === code && <span className="ml-auto text-primary">✓</span>}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {user ? (
                <>
                  {/* Notifications */}
                  <Link href="/notifications">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
                        isDark ? "text-white/70 hover:text-white hover:bg-white/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      <Bell className="w-5 h-5" />
                      <AnimatePresence>
                        {unreadCount > 0 && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                          >
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </Link>

                  {/* Avatar dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors ${
                          isDark ? "hover:bg-white/10" : "hover:bg-muted"
                        }`}
                      >
                        <Avatar className="h-7 w-7 ring-2 ring-primary/30">
                          <AvatarImage src={user.avatarUrl ?? undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-orange-600 text-white text-xs font-bold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className={`text-sm font-medium hidden sm:block max-w-[80px] truncate ${isDark ? "text-white/90" : "text-foreground"}`}>
                          {user.name.split(" ")[0]}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 hidden sm:block ${isDark ? "text-white/50" : "text-muted-foreground"}`} />
                      </motion.button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1.5">
                      <div className="px-3 py-2.5 mb-1">
                        <p className="font-semibold text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground capitalize flex items-center gap-1 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${user.role === "admin" ? "bg-purple-500" : user.role === "worker" ? "bg-blue-500" : "bg-green-500"}`} />
                          {user.role}
                        </p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center gap-2.5 cursor-pointer rounded-xl px-3 py-2">
                          <User className="w-4 h-4" /> {t("profile")}
                        </Link>
                      </DropdownMenuItem>
                      {user.role === "admin" && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center gap-2.5 cursor-pointer rounded-xl px-3 py-2">
                            <Shield className="w-4 h-4" /> {t("adminPanel")}
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-destructive gap-2.5 cursor-pointer rounded-xl px-3 py-2 focus:text-destructive focus:bg-destructive/10"
                      >
                        <LogOut className="w-4 h-4" /> {t("logout")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`font-medium rounded-xl ${isDark ? "text-white/80 hover:text-white hover:bg-white/10" : ""}`}
                    >
                      {t("login")}
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      size="sm"
                      className="font-semibold rounded-xl bg-gradient-to-r from-primary to-orange-600 text-white shadow-md hover:shadow-lg transition-shadow"
                    >
                      {t("signUpFree")}
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                className={`md:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-colors ${
                  isDark ? "text-white/80 hover:bg-white/10" : "text-foreground hover:bg-muted"
                }`}
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`md:hidden border-t overflow-hidden ${isDark ? "border-white/10 bg-[#0f0f0f]/95" : "border-border bg-card/95"} backdrop-blur-xl`}
            >
              <div className="px-4 py-3 space-y-1">
                {navLinks.map(link => {
                  const Icon = link.icon;
                  const active = location === link.href;
                  return (
                    <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        active
                          ? "bg-primary/10 text-primary"
                          : isDark
                          ? "text-white/70 hover:bg-white/10 hover:text-white"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}>
                        <Icon className="w-4 h-4" />
                        {link.label}
                      </div>
                    </Link>
                  );
                })}
                {/* Mobile language switcher */}
                <div className="px-4 py-2">
                  <p className={`text-xs font-medium mb-2 flex items-center gap-1 ${isDark ? "text-white/50" : "text-muted-foreground"}`}>
                    <Globe className="w-3 h-3" /> {t("language")}
                  </p>
                  <div className="flex gap-2">
                    {(Object.entries(LANGUAGE_NAMES) as [Language, { native: string; label: string; flag: string }][]).map(([code, info]) => (
                      <button
                        key={code}
                        onClick={() => { setLanguage(code); setMobileOpen(false); }}
                        className={`flex-1 py-1.5 px-2 rounded-lg border text-xs text-center transition-all ${
                          language === code
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : isDark ? "border-white/20 text-white/70" : "border-border text-muted-foreground"
                        }`}
                      >
                        {info.flag} {info.native}
                      </button>
                    ))}
                  </div>
                </div>
                {!user && (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium ${isDark ? "text-white/70 hover:bg-white/10" : "text-muted-foreground hover:bg-muted"}`}>
                        {t("login")}
                      </div>
                    </Link>
                    <Link href="/register" onClick={() => setMobileOpen(false)}>
                      <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary to-orange-600 text-white">
                        {t("signUpFree")}
                      </div>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main>{children}</main>
    </div>
  );
}
