import { appLocale } from "@/lib/i18n";
import { setStoredLang } from "@/components/AutoTranslate";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSignOut } from "@/lib/useSignOut";
import {
  BarChart3, Bell, FileText, Home, Lightbulb, LogOut, MessageSquareText, PiggyBank, Plus, Settings, TrendingDown, TrendingUp, User,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useNotifications, useProfile } from "@/lib/data";
import { t, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/_app")({
  component: AppShell,
});

const nav: { to: "/dashboard" | "/expenses" | "/income" | "/sms-import" | "/budgets" | "/analytics" | "/insights" | "/reports" | "/notifications" | "/profile" | "/settings"; key: TKey; icon: typeof Home }[] = [
  { to: "/dashboard", key: "dashboard", icon: Home },
  { to: "/expenses", key: "expenses", icon: TrendingDown },
  { to: "/income", key: "income", icon: TrendingUp },
  { to: "/sms-import", key: "sms", icon: MessageSquareText },
  { to: "/budgets", key: "budgets", icon: PiggyBank },
  { to: "/analytics", key: "analytics", icon: BarChart3 },
  { to: "/insights", key: "insights", icon: Lightbulb },
  { to: "/reports", key: "reports", icon: FileText },
  { to: "/notifications", key: "notifications", icon: Bell },
  { to: "/profile", key: "profile", icon: User },
  { to: "/settings", key: "settings", icon: Settings },
];


function AppShell() {
  const { data: profile, isSuccess } = useProfile();
  const { data: notes } = useNotifications();
  const navigate = useNavigate();
  const signOut = useSignOut();
  const lang = profile?.language;
  useEffect(() => { if (lang) setStoredLang(lang); }, [lang]);
  const unread = notes?.filter((n) => !n.is_read).length ?? 0;

  useEffect(() => {
    if (isSuccess && profile && !profile.onboarded) navigate({ to: "/profile-setup", replace: true });
  }, [isSuccess, profile, navigate]);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-sidebar-border bg-sidebar p-4 backdrop-blur-xl lg:flex">
        <div className="px-2 py-2"><Logo to="/dashboard" /></div>
        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground" activeProps={{ className: "!bg-primary !text-primary-foreground shadow-sm" }}>
              <n.icon className="h-4 w-4" />
              <span className="flex-1">{t(lang, n.key)}</span>
              {n.key === "notifications" && unread > 0 && <span className="rounded-full bg-destructive px-1.5 text-xs text-destructive-foreground">{unread}</span>}
            </Link>
          ))}
        </nav>
        <button onClick={signOut} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground">
          <LogOut className="h-4 w-4" /> {t(lang, "logout")}
        </button>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background/70 px-4 py-3 backdrop-blur-xl lg:px-8">
          <div className="min-w-0">
            <div className="lg:hidden"><Logo to="/dashboard" /></div>
            <p className="hidden truncate text-sm text-muted-foreground lg:block">
              {t(lang, "greeting")}, <span className="font-medium text-foreground">{profile?.full_name?.split(" ")[0] ?? "there"}</span> · {new Date().toLocaleDateString(appLocale(), { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link to="/notifications" aria-label="Notifications" className="relative grid h-10 w-10 place-items-center rounded-xl border border-border bg-card">
              <Bell className="h-4 w-4" />
              {unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] text-destructive-foreground">{unread}</span>}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger aria-label="Account menu" className="rounded-full">
                <Avatar className="h-10 w-10">
                  {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt="" />}
                  <AvatarFallback className="bg-secondary font-display">{(profile?.full_name ?? "U").slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild><Link to="/profile">{t(lang, "profile")}</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/settings">{t(lang, "settings")}</Link></DropdownMenuItem>
                <DropdownMenuItem asChild className="lg:hidden"><Link to="/insights">{t(lang, "insights")}</Link></DropdownMenuItem>
                <DropdownMenuItem asChild className="lg:hidden"><Link to="/reports">{t(lang, "reports")}</Link></DropdownMenuItem>
                <DropdownMenuItem asChild className="lg:hidden"><Link to="/sms-import">{t(lang, "sms")}</Link></DropdownMenuItem>
                <DropdownMenuItem asChild className="lg:hidden"><Link to="/income">{t(lang, "income")}</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}><LogOut className="mr-2 h-4 w-4" />{t(lang, "logout")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 items-center rounded-2xl border border-border bg-popover/90 p-1.5 shadow-lg backdrop-blur-xl lg:hidden">
        {[nav[0]!, nav[1]!].map((n) => <MobileItem key={n.to} to={n.to} icon={n.icon} label={t(lang, n.key)} />)}
        <Link to="/expenses/add" aria-label={t(lang, "addExpense")} className="mx-auto grid h-12 w-12 -translate-y-3 place-items-center rounded-2xl bg-brand text-primary-foreground shadow-lg">
          <Plus className="h-6 w-6" />
        </Link>
        {[nav[3]!, nav[4]!].map((n) => <MobileItem key={n.to} to={n.to} icon={n.icon} label={t(lang, n.key)} />)}
      </nav>
    </div>
  );
}

function MobileItem({ to, icon: Icon, label }: { to: (typeof nav)[number]["to"]; icon: typeof Home; label: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] text-muted-foreground" activeProps={{ className: "!text-primary" }}>
      <Icon className="h-5 w-5" />
      <span className="max-w-full truncate">{label}</span>
    </Link>
  );
}
