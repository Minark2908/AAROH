"use client";

import { useEffect } from "react";

/**
 * SessionHydrator Ensures that authentication tokens stored in localStorage 
 * are synced to cookies so that Next.js Middleware can access them on the server.
 * This fixes issues where a user is redirected inappropriately because the 
 * middleware doesn't see their session yet.
 */
export function SessionHydrator() {
  useEffect(() => {
    // Sync localStorage to cookies so middleware can read them
    const token = localStorage.getItem("aaroh_token");
    const role = localStorage.getItem("aaroh_role");

    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift();
      return undefined;
    };

    // Sync without reloading - middleware will use the updated cookies on next request
    if (token && !getCookie("aaroh_token")) {
      document.cookie = `aaroh_token=${token}; path=/; max-age=86400; SameSite=Lax`;
      console.log("[SessionHydrator] Synced token to cookie");
    }
    if (role && !getCookie("aaroh_role")) {
      document.cookie = `aaroh_role=${role}; path=/; max-age=86400; SameSite=Lax`;
      console.log("[SessionHydrator] Synced role to cookie");
    }
  }, []);

  return null;
}
