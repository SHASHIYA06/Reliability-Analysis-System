const explicit = import.meta.env.VITE_API_URL as string | undefined;
export const API_BASE = explicit
  ? explicit.replace(/\/$/, "")
  : import.meta.env.BASE_URL.replace(/\/$/, "");
