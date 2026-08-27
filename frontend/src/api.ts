export const API_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL || ""
  : import.meta.env.VITE_API_URL || "http://localhost:3000";
export const WEBSITE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_WEBSITE_URL || "/"
  : import.meta.env.VITE_WEBSITE_URL || "http://localhost:5173";

export type Role = "admin" | "manager" | "accountant" | "secretary" | "client";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: Role;
  client?: {
    id: number;
    phone: string;
    address: string;
    notes: string;
  } | null;
};

export type WebsiteSection = { key: string; value: unknown };
export type WebsiteContent = { id: number; sections: WebsiteSection[] };

export function errorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return "Request failed";
}

export function selectValue(event: Event) {
  return (event.target as HTMLSelectElement).value;
}

function authHeaders(extra: HeadersInit = {}): Record<string, string> {
  const token = localStorage.getItem("fiaba_token");
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra as Record<string, string>),
  };
}

export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...authHeaders() };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> | undefined) },
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export function mediaUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_URL}${path}`;
}

const SERVICE_PLACEHOLDERS = [
  "/uploads/placeholders/service-weddings.jpg",
  "/uploads/placeholders/service-events.jpg",
  "/uploads/placeholders/service-florals.jpg",
];

export function defaultServiceImagePath(item: { title?: string; imageUrl?: string }, index = 0) {
  if (item.imageUrl) return item.imageUrl;
  const title = (item.title || "").toLowerCase();
  if (title.includes("wedding")) return SERVICE_PLACEHOLDERS[0];
  if (title.includes("floral") || title.includes("styling")) return SERVICE_PLACEHOLDERS[2];
  if (title.includes("event") || title.includes("private")) return SERVICE_PLACEHOLDERS[1];
  return SERVICE_PLACEHOLDERS[index % SERVICE_PLACEHOLDERS.length];
}

export function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function toDatetimeLocal(value?: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function money(value?: number | string | null) {
  return Number(value || 0).toLocaleString("en-KW", {
    style: "currency",
    currency: "KWD",
  });
}

export function section<T>(content: WebsiteContent | null | undefined, key: string, fallback: T): T {
  const item = content?.sections?.find((s) => s.key === key);
  return item ? (item.value as T) : fallback;
}
