'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import api from "@/api/axios";
import { getApiErrorMessage, getZodFirstMessage } from "@/lib/apiErrorMessage";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().regex(/^\+?[\d\s-]{10,}$/, "Invalid phone number format"),
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one digit")
    .regex(/[!@#$%^&*()_+\-=\[\]{};:,.<>?]/, "Password must contain at least one special character"),
});

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      signupSchema.parse({ name, phone, email, password });
      
      await api.post("/auth/register", { name, phone, email, password });
      router.push("/login");
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        setError(getZodFirstMessage(err));
        return;
      }
      console.error("Signup Error:", err);
      setError(getApiErrorMessage(err, "Registration failed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border border-white/60 shadow-xl shadow-slate-200/50 overflow-hidden backdrop-blur-md bg-white/90">
      <CardHeader className="space-y-3 pb-6 text-center">
        <CardTitle className="text-3xl font-serif">Join AAROH</CardTitle>
        <CardDescription className="text-sm">
          Enter your details below to start modernizing your farm.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form className="space-y-5" onSubmit={handleSignup}>
        {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}
        <div className="space-y-2 text-sm font-medium">
          <label htmlFor="name">Full Name</label>
          <Input id="name" type="text" placeholder="Ramesh Kumar..." value={name} onChange={e => setName(e.target.value)} required className="bg-white/60 border-slate-200 focus-visible:ring-orange-500/30" />
        </div>

        <div className="space-y-2 text-sm font-medium">
          <label htmlFor="phone">Phone Number</label>
          <Input id="phone" type="tel" placeholder="+91 99999 99999" value={phone} onChange={e => setPhone(e.target.value)} required className="bg-white/60 border-slate-200 focus-visible:ring-orange-500/30" />
        </div>

        <div className="space-y-2 text-sm font-medium">
          <label htmlFor="email">Email</label>
          <Input id="email" type="email" placeholder="farmer@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="bg-white/60 border-slate-200 focus-visible:ring-orange-500/30" />
        </div>

        
        <div className="space-y-2 text-sm font-medium relative">
          <label htmlFor="password">Password</label>
          <div className="relative">
            <Input 
              id="password" 
              type={showPassword ? "text" : "password"} 
              placeholder="••••••••" 
              value={password} onChange={e => setPassword(e.target.value)}
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
           <Button type="submit" disabled={isLoading} className="w-full h-12 text-base bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition-all hover:-translate-y-0.5 border-none">
             {isLoading ? "Loading..." : "Create Account"}
           </Button>
        </div>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t border-border/50 bg-muted/20 py-4">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--primary)] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
