"use client";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useState } from "react";
import api from "@/api/axios";
import { getApiErrorMessage } from "@/lib/apiErrorMessage";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await api.post("/auth/reset-password-direct", {
        email,
        new_password: newPassword,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to reset password"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border border-white/60 shadow-xl shadow-slate-200/50 overflow-hidden backdrop-blur-md bg-white/90">
      <CardHeader className="space-y-3 pb-6 text-center">
        <CardTitle className="text-3xl font-serif">Reset Password</CardTitle>
        <CardDescription className="text-sm">
          Enter your registered phone number or email and your new password to reset it directly.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-5">
        {success ? (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm text-center">
            Password reset successfully! Redirecting to login...
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-5">
            {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}
            
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
              <label htmlFor="password">New Password</label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>

      <CardFooter className="justify-center border-t border-border/50 bg-muted/20 py-4">
        <Link href="/login" className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </CardFooter>
    </Card>
  );
}
