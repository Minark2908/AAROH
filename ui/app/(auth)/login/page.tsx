"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Shield, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import api from "@/api/axios";
import { adminLogin } from "@/api/adminApi";
import { getApiErrorMessage, getZodFirstMessage } from "@/lib/apiErrorMessage";
import { z } from "zod";

const farmerLoginSchema = z.object({
  email: z.string().min(1, "Email or phone is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const adminLoginSchema = z.object({
  username: z.string().min(1, "Admin username is required"),
  password: z.string().min(1, "Admin password is required"),
});

type Tab = "farmer" | "admin";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const showAdminTab = searchParams.get("admin") === "true";

  const [tab, setTab] = useState<Tab>("farmer");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Reset form state when switching tabs
  useEffect(() => {
    setError("");
    setEmail("");
    setPassword("");
    setAdminUsername("");
    setAdminPassword("");
  }, [tab]);

  // ── Regular Farmer Login ──────────────────────────────────────────────────
  const handleFarmerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      farmerLoginSchema.parse({ email, password });
      
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      // Storage: Both for Client (Persistence) and Server (Middleware)
      document.cookie = `aaroh_token=${res.data.access_token}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `aaroh_role=${res.data.role}; path=/; max-age=86400; SameSite=Lax`;
      
      localStorage.setItem("aaroh_token", res.data.access_token);
      localStorage.setItem("aaroh_role", res.data.role);
      localStorage.setItem("aaroh_user_name", res.data.name);
      localStorage.setItem("aaroh_user_id", String(res.data.user_id));

      // Verify storage worked  
      console.log("[Login] Farmer login success", {
        tokenStored: !!localStorage.getItem("aaroh_token"),
        roleStored: localStorage.getItem("aaroh_role"),
        userNameStored: localStorage.getItem("aaroh_user_name"),
        tokenLength: res.data.access_token?.length || 0,
        isAdmin: res.data.role === "admin",
      });

      if (res.data.role === "admin") {
        console.log("[Login] Redirecting admin to /admin");
        router.push("/admin");
      } else {
        console.log("[Login] Redirecting farmer to /dashboard");
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        setError(getZodFirstMessage(err));
        return;
      }
      setError(getApiErrorMessage(err, "Login failed"));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Master Admin Login ────────────────────────────────────────────────────
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      adminLoginSchema.parse({ username: adminUsername, password: adminPassword });
      
      const res = await adminLogin(adminUsername, adminPassword);

      document.cookie = `aaroh_token=${res.access_token}; path=/; max-age=86400; SameSite=Lax`;
      document.cookie = `aaroh_role=${res.role}; path=/; max-age=86400; SameSite=Lax`;

      localStorage.setItem("aaroh_token", res.access_token);
      localStorage.setItem("aaroh_role", res.role);
      localStorage.setItem("aaroh_user_name", res.name);
      localStorage.setItem("aaroh_user_id", String(res.user_id));

      // Verify storage worked
      console.log("[Admin Login] Admin login success", {
        tokenStored: !!localStorage.getItem("aaroh_token"),
        roleStored: localStorage.getItem("aaroh_role"),
        userNameStored: localStorage.getItem("aaroh_user_name"),
        tokenLength: res.access_token?.length || 0,
      });
      
      console.log("[Admin Login] Redirecting to /admin");
      router.push("/admin");
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        setError(getZodFirstMessage(err));
        return;
      }
      setError(getApiErrorMessage(err, "Invalid admin credentials"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border border-white/60 shadow-xl shadow-slate-200/50 overflow-hidden backdrop-blur-md bg-white/90">
      {/* ── Tab Switcher (admin tab hidden unless ?admin=true) ── */}
      {showAdminTab && (
        <div className="flex border-b border-border/50">
          <button
            type="button"
            onClick={() => setTab("farmer")}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              tab === "farmer"
                ? "bg-white text-slate-900 border-b-2 border-orange-500"
                : "bg-slate-50/60 text-muted-foreground hover:text-slate-700"
            }`}
          >
            <Sprout className="h-4 w-4" />
            Farmer Login
          </button>
          <button
            type="button"
            onClick={() => setTab("admin")}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              tab === "admin"
                ? "bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600"
                : "bg-slate-50/60 text-muted-foreground hover:text-slate-700"
            }`}
          >
            <Shield className="h-4 w-4" />
            Admin Access
          </button>
        </div>
      )}

      {tab === "farmer" && (
        <>
          <CardHeader className="space-y-3 pb-6 text-center">
            <CardTitle className="text-3xl font-serif">Welcome Back</CardTitle>
            <CardDescription className="text-sm">
              Enter your email to access your farm dashboard.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-5" onSubmit={handleFarmerLogin}>
              {error && (
                <p className="text-red-500 text-sm font-medium text-center bg-red-50 py-2 px-3 rounded-lg">
                  {error}
                </p>
              )}

              <div className="space-y-2 text-sm font-medium">
                <label htmlFor="email">Phone Number / Email</label>
                <Input
                  id="email"
                  type="text"
                  placeholder="Enter your detail..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/60 border-slate-200 focus-visible:ring-orange-500/30"
                />
              </div>

              <div className="space-y-2 text-sm font-medium relative">
                <div className="flex justify-between items-center">
                  <label htmlFor="password">Password</label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-[var(--primary)] hover:underline font-semibold"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/60 border-slate-200 focus-visible:ring-orange-500/30 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition-all hover:-translate-y-0.5 border-none"
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="justify-center border-t border-border/50 bg-muted/20 py-4">
            <p className="text-sm text-muted-foreground">
              New to AAROH?{" "}
              <Link href="/signup" className="text-[var(--primary)] font-semibold hover:underline">
                Create an account
              </Link>
            </p>
          </CardFooter>
        </>
      )}

      {tab === "admin" && (
        <>
          <CardHeader className="space-y-3 pb-6 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Shield className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-2xl font-serif text-indigo-900 dark:text-white">
              Admin Portal
            </CardTitle>
            <CardDescription className="text-sm">
              Restricted access. Authorized personnel only.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-5" onSubmit={handleAdminLogin}>
              {error && (
                <p className="text-red-500 text-sm font-medium text-center bg-red-50 py-2 px-3 rounded-lg">
                  {error}
                </p>
              )}

              <div className="space-y-2 text-sm font-medium">
                <label htmlFor="admin-username">Admin Username</label>
                <Input
                  id="admin-username"
                  type="text"
                  placeholder="Enter admin username"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  required
                  autoComplete="off"
                  className="bg-white/60 border-indigo-200 focus-visible:ring-indigo-500/30"
                />
              </div>

              <div className="space-y-2 text-sm font-medium">
                <label htmlFor="admin-password">Admin Password</label>
                <div className="relative">
                  <Input
                    id="admin-password"
                    type={showAdminPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="bg-white/60 border-indigo-200 focus-visible:ring-indigo-500/30 pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                  >
                    {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-500/30 hover:shadow-indigo-500/40 transition-all hover:-translate-y-0.5 border-none"
                >
                  {isLoading ? "Authenticating..." : "Access Admin Portal"}
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="justify-center border-t border-indigo-100 bg-indigo-50/30 py-3">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-indigo-400" />
              Secured by AAROH Auth — All access attempts are logged.
            </p>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
