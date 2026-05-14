"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  return (
    <Card className="border border-white/60 shadow-xl shadow-slate-200/50 overflow-hidden backdrop-blur-md bg-white/90">
      <CardHeader className="space-y-3 pb-6 text-center">
        <CardTitle className="text-3xl font-serif">Reset Password</CardTitle>
        <CardDescription className="text-sm">
          Enter your registered phone number or email to receive a reset link.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-5">
        <div className="space-y-2 text-sm font-medium">
          <label htmlFor="email">Phone Number / Email</label>
          <Input id="email" type="text" placeholder="Enter your detail..." className="bg-white/60 border-slate-200 focus-visible:ring-orange-500/30" />
        </div>
        
        <div className="pt-2">
           <Button className="w-full h-12 text-base bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 transition-all hover:-translate-y-0.5 border-none">Send Reset Link</Button>
        </div>
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
