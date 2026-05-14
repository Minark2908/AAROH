/**
 * Base URL for FastAPI-hosted files (/uploads/...). When NEXT_PUBLIC_API_URL is unset,
 * use same-origin so Next.js can rewrite /uploads → FastAPI.
 */
export function getPublicAssetBase(): string {
  const direct = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (direct) return direct.replace(/\/$/, "");
  return "";
}
