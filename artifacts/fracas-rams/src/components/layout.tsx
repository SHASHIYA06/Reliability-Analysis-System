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
  Menu
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Wrench, label: "Job Cards (FRACAS)", href: "/job-cards" },
  { icon: FileBarChart, label: "RAMS Reports", href: "/reports" },
  { icon: Train, label: "Fleet Management", href: "/fleet" },
  { icon: BookOpen, label: "Withdrawal Scenarios", href: "/scenarios" },
];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-border/50 bg-card/50 flex flex-col backdrop-blur-xl relative z-10">
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold font-mono">
              KR
            </div>
            <span className="font-bold text-lg tracking-tight">FRACAS<span className="text-primary">RAMS</span></span>
          </div>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
            Modules
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className="block">
                  <div className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-primary/15 text-primary border border-primary/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]" 
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}>
                    <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "opacity-70")} />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer rounded-lg hover:bg-white/5">
            <Settings className="w-5 h-5 opacity-70" />
            System Settings
          </div>
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
                placeholder="Search job cards, parts..." 
                className="pl-9 bg-card/50 border-border/50 focus-visible:ring-primary/50"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
              <span className="text-xs text-muted-foreground font-mono">SYS.ONLINE</span>
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary"></span>
            </Button>
            <div className="w-8 h-8 rounded-full bg-secondary/20 border border-secondary/50 flex items-center justify-center text-sm font-medium text-secondary">
              AD
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 relative">
          {/* Subtle background glow effect */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>
          <div className="relative z-10 h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
