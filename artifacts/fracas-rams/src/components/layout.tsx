import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Wrench, 
  FileBarChart, 
  Train, 
  BookOpen, 
  Settings,
  Bell,
  Search,
  Menu,
  ClipboardList,
  LogOut,
  ChevronDown,
  ClipboardCheck,
  FileCheck,
  ShieldAlert,
  ArrowRightLeft,
  Package,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

interface LayoutProps {
  children: ReactNode;
}

const navSections = [
  {
    section: "Core",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/" },
      { icon: Wrench,           label: "Job Cards (FRACAS)", href: "/job-cards" },
      { icon: FileBarChart,     label: "RAMS Reports", href: "/reports" },
      { icon: Train,            label: "Fleet Management", href: "/fleet" },
    ],
  },
  {
    section: "Quality & NCR",
    items: [
      { icon: ClipboardList,  label: "NCR Management", href: "/ncr" },
      { icon: BookOpen,       label: "Withdrawal Scenarios", href: "/scenarios" },
      { icon: ShieldAlert,    label: "DLP Items", href: "/dlp" },
    ],
  },
  {
    section: "Inspection",
    items: [
      { icon: ClipboardCheck, label: "EIR", href: "/eir" },
      { icon: FileCheck,      label: "RSOI", href: "/rsoi" },
    ],
  },
  {
    section: "Store & Tools",
    items: [
      { icon: Package,        label: "Store Inventory", href: "/inventory" },
      { icon: Wrench,         label: "Tools Management", href: "/tools" },
      { icon: ArrowRightLeft, label: "Gate Pass", href: "/gate-pass" },
    ],
  },
];

function BEMLLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/50 to-red-800/50 rounded-lg blur-sm" />
        <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg border border-red-500/30">
          <span className="text-white font-black text-lg leading-none" style={{ fontFamily: "system-ui" }}>B</span>
        </div>
      </div>
      <div className="leading-tight">
        <div className="font-black text-base tracking-tight">
          <span style={{ color: "#E31E24" }}>BEML</span>
          <span className="text-foreground"> FRACAS</span>
        </div>
        <div className="text-[9px] text-muted-foreground font-medium tracking-widest uppercase">RS-3R · RAMS System</div>
      </div>
    </div>
  );
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, logout, isAdmin } = useAuth();

  const roleLabelMap: Record<string, string> = {
    admin: "Admin",
    engineer: "Engineer",
    officer: "Officer",
    "data-entry": "Data Entry",
  };
  const roleLabel = roleLabelMap[user?.role || ""] || "";

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border/50 bg-card/50 flex flex-col backdrop-blur-xl relative z-10">
        <div className="h-16 flex items-center px-4 border-b border-border/50">
          <BEMLLogo />
        </div>
        
        <div className="p-3 flex-1 overflow-y-auto space-y-4">
          {navSections.map((section) => (
            <div key={section.section}>
              <div className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest mb-1.5 px-3">
                {section.section}
              </div>
              <nav className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                  return (
                    <Link key={item.href} href={item.href} className="block">
                      <div className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-primary/15 text-primary border border-primary/20 shadow-[0_0_12px_rgba(249,115,22,0.08)]"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      )}>
                        <item.icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-primary" : "opacity-70")} />
                        <span className="truncate text-xs">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t border-border/50 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-white/5">
            <Settings className="w-5 h-5 opacity-70 flex-shrink-0" />
            System Settings
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-destructive transition-colors cursor-pointer rounded-lg hover:bg-destructive/10"
          >
            <LogOut className="w-5 h-5 opacity-70 flex-shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex-shrink-0 border-b border-border/50 bg-background/80 backdrop-blur-xl flex items-center justify-between px-6 z-10 sticky top-0">
          <div className="flex items-center gap-4 flex-1">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
            <div className="relative w-64 hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search job cards, NCR, parts..." 
                className="pl-9 bg-card/50 border-border/50 focus-visible:ring-primary/50"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs text-muted-foreground font-mono">SYS.ONLINE</span>
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary"></span>
            </Button>
            {user && (
              <div className="flex items-center gap-2 cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-bold text-primary">
                  {user.initials}
                </div>
                <div className="hidden sm:block text-xs leading-tight">
                  <div className="font-medium text-foreground truncate max-w-[120px]">{user.name.split(" ")[0]} {user.name.split(" ")[1]?.[0]}.</div>
                  <div className="text-muted-foreground">{roleLabel}</div>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
          <div className="relative z-10 h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
