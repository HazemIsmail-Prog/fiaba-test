export const API_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL || ""
  : import.meta.env.VITE_API_URL || "http://localhost:3000";
export const APP_URL = import.meta.env.PROD
  ? import.meta.env.VITE_APP_URL || "/app"
  : import.meta.env.VITE_APP_URL || "http://localhost:5174";

export type WebsiteSection = {
  key: string;
  value: unknown;
};

export type WebsiteContent = {
  id: number;
  sections: WebsiteSection[];
};

export type ServiceItem = {
  title: string;
  description: string;
  imageUrl: string;
};

export type GalleryItem = {
  imageUrl: string;
  caption: string;
};

export type ContactInfo = {
  email?: string;
  phone?: string;
  address?: string;
};

export type HeroInfo = {
  description?: string;
  imageUrl?: string;
};

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

export function serviceImageUrl(item: ServiceItem, index = 0) {
  if (item.imageUrl) return mediaUrl(item.imageUrl);
  const title = (item.title || "").toLowerCase();
  let path = SERVICE_PLACEHOLDERS[index % SERVICE_PLACEHOLDERS.length];
  if (title.includes("wedding")) path = SERVICE_PLACEHOLDERS[0];
  else if (title.includes("floral") || title.includes("styling")) path = SERVICE_PLACEHOLDERS[2];
  else if (title.includes("event") || title.includes("private")) path = SERVICE_PLACEHOLDERS[1];
  return mediaUrl(path);
}

export function section<T>(content: WebsiteContent | null | undefined, key: string, fallback: T): T {
  const item = content?.sections?.find((s) => s.key === key);
  return item ? (item.value as T) : fallback;
}

export async function fetchWebsite(): Promise<WebsiteContent> {
  const res = await fetch(`${API_URL}/api/website`);
  if (!res.ok) throw new Error("Could not load website content");
  return res.json();
}

export async function requestAppointment(payload: {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  requestedAt: string;
  message: string;
}) {
  const res = await fetch(`${API_URL}/api/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Could not send request");
  return data;
}
