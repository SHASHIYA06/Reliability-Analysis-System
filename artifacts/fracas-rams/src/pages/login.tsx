import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";

export default function Login() {
  const { login } = useAuth();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    setTimeout(() => {
      const result = login(userId.trim(), password);
      if (!result.success) {
        setError(result.error || "Login failed");
      }
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* BEML Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/40 to-blue-500/40 rounded-2xl blur-xl opacity-60 animate-pulse" />
            <div className="relative bg-card/80 backdrop-blur border border-border/60 rounded-2xl px-8 py-5 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-2xl tracking-tight" style={{ fontFamily: "system-ui" }}>B</span>
                </div>
                <div>
                  <div className="text-2xl font-black tracking-tight">
                    <span style={{ color: "#E31E24" }}>BEML</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">
                    Bharat Earth Movers Ltd.
                  </div>
                </div>
              </div>
            </div>
          </div>
          <h1 className="text-xl font-bold text-foreground text-center">
            FRACAS & RAMS System
          </h1>
          <p className="text-sm text-muted-foreground text-center mt-1">
            RS-3R Rolling Stock · KMRC Project
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card/80 backdrop-blur border border-border/60 rounded-2xl shadow-2xl shadow-black/30 p-8">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground">Sign In</h2>
            <p className="text-sm text-muted-foreground">Enter your BEML credentials to access the system.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">User ID / Employee ID</label>
              <input
                type="text"
                value={userId}
                onChange={e => setUserId(e.target.value)}
                placeholder="e.g. BEML/70147"
                className="w-full px-4 py-3 rounded-xl bg-background border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all font-mono text-sm"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password / Passcode</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-xl bg-background border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive text-sm px-4 py-3 rounded-xl">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all bg-primary hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-primary/30 mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/></svg>
                  Authenticating…
                </span>
              ) : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border/40 text-xs text-muted-foreground text-center space-y-1">
            <p>Authorised users only. All sessions are logged.</p>
            <p className="font-mono">BEML Rolling Stock Division · RS-3R · KMRC</p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          FRACAS & RAMS v2.0 · © 2026 BEML Limited
        </p>
      </div>
    </div>
  );
}
