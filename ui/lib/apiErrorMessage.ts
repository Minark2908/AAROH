import type { ZodError } from "zod";

/** Zod v4 uses `issues`; older examples used `errors`. */
export function getZodFirstMessage(err: ZodError): string {
  const issues = err.issues;
  if (issues?.length) return issues[0]?.message ?? "Validation failed";
  return "Validation failed";
}

/**
 * Maps Axios / fetch failures to user-visible messages.
 * ERR_NETWORK usually means no HTTP response (backend down, CORS block, wrong URL).
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const e = err as {
    code?: string;
    response?: { data?: { detail?: unknown } };
    message?: string;
  };

  if (e?.code === "ERR_NETWORK") {
    const direct = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (direct) {
      return `Cannot reach the API at ${direct}. Start FastAPI (ml-service) on that host/port, or remove NEXT_PUBLIC_API_URL to use the Next.js proxy (/api-proxy).`;
    }
    return (
      "Cannot reach the API. Start the FastAPI server (ml-service, port 8000) and restart `next dev`. " +
      "The app uses Next.js /api-proxy — ensure INTERNAL_API_URL in frontend/.env points to your API (e.g. http://127.0.0.1:8000)."
    );
  }

  const detail = e.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (typeof detail === "object" && detail !== null && !Array.isArray(detail)) {
    const msg = (detail as Record<string, unknown>).message ?? (detail as Record<string, unknown>).msg;
    if (typeof msg === "string") return msg;
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string };
    if (typeof first?.msg === "string") return first.msg;
  }

  if (typeof e.message === "string" && e.message !== "Network Error") {
    return e.message;
  }

  return fallback;
}
