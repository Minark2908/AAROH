"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, LogOut, Shield, Sprout, Upload, User } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { toast } from "sonner";
import { useChangePassword, useUpdateUserProfile, useUploadAvatar, useUserProfile } from "@/hooks/useProfile";
import { useFarm, useUpdateFarm } from "@/hooks/useFarm";
import { useLanguage } from "@/i18n/LanguageProvider";

type ActiveSection = "personal" | "farm" | "security";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validatePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export default function SettingsPage() {
  const { setLanguage } = useLanguage();

  const { data: profile, isLoading: profileLoading, isError: profileError } = useUserProfile();
  const { data: farm, isLoading: farmLoading, isError: farmError } = useFarm();

  const updateProfile = useUpdateUserProfile();
  const updateFarm = useUpdateFarm();
  const uploadAvatar = useUploadAvatar();
  const changePassword = useChangePassword();

  const [activeSection, setActiveSection] = useState<ActiveSection>("personal");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    preferred_language: "en" as "en" | "hi" | "gu",
    location: "",
    land_area: "",
    crops: "",
    irrigation_type: "Drip Irrigation",
    growth_stage: "",
    old_password: "",
    new_password: "",
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const hydrated = useMemo(() => Boolean(profile && farm), [profile, farm]);

  useEffect(() => {
    if (!profile || !farm) return;
    setForm((prev) => {
      // Only hydrate once (if the user hasn't started editing)
      if (prev.name || prev.phone || prev.email) return prev;
      const lang = profile.preferred_language;
      const preferred_language = lang === "hi" || lang === "gu" ? lang : "en";
      return {
        ...prev,
        name: profile.name || "",
        phone: profile.phone || "",
        email: profile.email || "",
        preferred_language,
        location: farm.location || "",
        land_area: farm.land_area != null ? String(farm.land_area) : "",
        crops: (farm.crops || []).join(", "),
        irrigation_type: farm.irrigation_type || "Drip Irrigation",
        growth_stage: farm.growth_stage || "",
      };
    });
  }, [profile, farm]);

  const completion = useMemo(() => {
    const checks = [
      Boolean((profile?.name || "").trim()),
      Boolean((profile?.phone || "").trim()),
      Boolean((profile?.email || "").trim()),
      Boolean((profile?.avatar_url || "").trim()),
      Boolean((farm?.location || "").trim()),
      typeof farm?.land_area === "number" ? farm.land_area > 0 : false,
      Array.isArray(farm?.crops) ? farm.crops.length > 0 : false,
      Boolean((farm?.growth_stage || "").trim()),
      Boolean((farm?.irrigation_type || "").trim()),
    ];
    const done = checks.filter(Boolean).length;
    const total = checks.length;
    const pct = Math.round((done / total) * 100);
    return { done, total, pct };
  }, [profile, farm]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setTouched((p) => ({ ...p, [e.target.name]: true }));
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "preferred_language") {
      const v = value === "hi" || value === "gu" ? value : "en";
      setLanguage(v);
    }
  };

  const errors = useMemo(() => {
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const landArea = form.land_area.trim() ? Number(form.land_area) : null;
    const invalidLandArea =
      form.land_area.trim() ? Number.isNaN(landArea) || (landArea ?? 0) < 0 : false;

    return {
      name: !name ? "Full name is required." : "",
      email: !email ? "Email is required." : !validateEmail(email) ? "Enter a valid email address." : "",
      phone: !phone ? "Phone number is required." : !validatePhone(phone) ? "Enter 10–15 digits." : "",
      land_area: invalidLandArea ? "Land area must be a valid positive number." : "",
      old_password: form.old_password && form.old_password.length < 4 ? "Old password looks too short." : "",
      new_password: form.new_password && form.new_password.length > 0 && form.new_password.length < 8 ? "Minimum 8 characters." : "",
    };
  }, [form]);

  const savePersonal = async () => {
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();

    if (!name) return toast.error("Please enter your full name.");
    if (!validateEmail(email)) return toast.error("Please enter a valid email address.");
    if (!validatePhone(phone)) return toast.error("Please enter a valid phone number (10–15 digits).");

    try {
      await updateProfile.mutateAsync({
        name,
        email,
        phone,
        language: form.preferred_language,
      });
      toast.success("Profile updated.");
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? // axios-style error
            String(
              // @ts-expect-error - runtime shape from axios
              e.response?.data?.detail?.message || e.response?.data?.detail || "Failed to update profile."
            )
          : "Failed to update profile.";
      toast.error(msg);
    }
  };

  const saveFarm = async () => {
    const crops = form.crops
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    const landArea = form.land_area.trim() ? Number(form.land_area) : null;
    if (form.land_area.trim() && (Number.isNaN(landArea) || (landArea ?? 0) < 0)) {
      return toast.error("Land area must be a valid number.");
    }

    try {
      await updateFarm.mutateAsync({
        location: form.location.trim() || null,
        land_area: landArea,
        crops,
        growth_stage: form.growth_stage.trim() || null,
        irrigation_type: form.irrigation_type || null,
      });
      toast.success("Farm details updated.");
    } catch (e: unknown) {
      const msg =
        typeof e === "object" && e !== null && "response" in e
          ? // @ts-expect-error - runtime shape from axios
            String(e.response?.data?.detail?.message || e.response?.data?.detail || "Failed to update farm details.")
          : "Failed to update farm details.";
      toast.error(msg);
    }
  };

  const handleLogout = () => {
    // Clear all auth data from localStorage
    localStorage.removeItem("aaroh_token");
    localStorage.removeItem("aaroh_role");
    localStorage.removeItem("aaroh_user_name");
    localStorage.removeItem("aaroh_user_id");
    
    // Clear cookies for middleware with proper path/SameSite alignment
    const cookies = ["aaroh_token", "aaroh_role"];
    cookies.forEach(c => {
      document.cookie = `${c}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      document.cookie = `${c}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; domain=${window.location.hostname}`;
    });
    
    console.log("[Settings] Session cleared. Redirecting to /login");
    window.location.href = "/login";
  };

  const loading = profileLoading || farmLoading;
  const error = profileError || farmError;

  if (loading) return <div className="text-center py-20 text-muted-foreground animate-pulse">Loading Profile...</div>;
  if (error) return <div className="text-center py-20 text-red-500">Failed to load profile data. Ensure you are signed in.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader
        badgeIcon={User}
        badgeText="Account Information"
        badgeVariant="primary"
        title="Profile & Settings"
        description="Manage your account, farm details, and security settings."
      />

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card className="glass-card hover-lift border-none shadow-soft rounded-2xl">
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="h-24 w-24 bg-white dark:bg-black rounded-full mb-3 overflow-hidden border-4 border-[var(--color-primary)]/20 shadow-soft text-muted-foreground flex items-center justify-center p-1 relative">
                <div className="h-full w-full bg-gradient-farm rounded-full flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar_url} alt="Profile avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-[var(--color-primary-dark)] dark:text-white" />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-serif font-bold text-2xl text-foreground">{profile?.name || "AAROH Farmer"}</h3>
                {completion.pct >= 80 && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-4">{profile?.phone}</p>

              <div className="w-full text-left">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground">Profile completion</span>
                  <span className="text-xs font-bold text-foreground">{completion.pct}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--color-primary)]" style={{ width: `${completion.pct}%` }} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Tip: add your farm location and crop details to unlock more accurate weather, crop health, and recommendations.
                </p>
              </div>

              <div className="w-full mt-4">
                <label className="text-xs font-semibold text-muted-foreground block mb-2">Profile photo</label>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border border-border hover:bg-muted/40 cursor-pointer">
                    <Upload className="h-4 w-4" />
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const inputEl = e.currentTarget;
                        const f = inputEl.files?.[0];
                        if (!f) return;
                        try {
                          await uploadAvatar.mutateAsync(f);
                          toast.success("Profile photo updated.");
                        } catch (err: unknown) {
                          const msg =
                            typeof err === "object" && err !== null && "response" in err
                              ? // @ts-expect-error - runtime shape from axios
                                String(err.response?.data?.detail?.message || err.response?.data?.detail || "Failed to upload avatar.")
                              : "Failed to upload avatar.";
                          toast.error(msg);
                        } finally {
                          // After await, React may clear the event object; use captured element.
                          inputEl.value = "";
                        }
                      }}
                    />
                  </label>
                  {uploadAvatar.isPending && <span className="text-xs text-muted-foreground animate-pulse">Uploading...</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          <nav className="flex flex-col gap-1">
            <Button
              variant="ghost"
              onClick={() => setActiveSection("personal")}
              className={`justify-start ${activeSection === "personal" ? "bg-muted/50" : "text-muted-foreground"}`}
            >
              <User className="mr-2 h-4 w-4" /> Personal
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveSection("farm")}
              className={`justify-start ${activeSection === "farm" ? "bg-muted/50" : "text-muted-foreground"}`}
            >
              <Sprout className="mr-2 h-4 w-4" /> Farm
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveSection("security")}
              className={`justify-start ${activeSection === "security" ? "bg-muted/50" : "text-muted-foreground"}`}
            >
              <Shield className="mr-2 h-4 w-4" /> Security
            </Button>
            <div className="my-2 border-t border-border" />
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="justify-start text-red-600 hover:text-red-700 hover:bg-red-500/10 w-full"
            >
              <LogOut className="mr-2 h-4 w-4" /> Log out
            </Button>
          </nav>
        </div>

        <div className="md:col-span-2 space-y-6">
          {activeSection === "personal" && (
            <Card className="glass-card hover-lift shadow-soft rounded-2xl border-none">
              <CardHeader className="pb-4 border-b border-black/5 dark:border-white/5 bg-muted/30 rounded-t-2xl">
                <CardTitle className="font-serif text-xl border-none text-foreground">Personal Information</CardTitle>
                <CardDescription className="font-medium">Update your contact details and language preference.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input name="name" value={form.name} onChange={handleChange} error={touched.name && Boolean(errors.name)} />
                    {touched.name && errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone Number</label>
                    <Input name="phone" value={form.phone} onChange={handleChange} placeholder="10–15 digits" error={touched.phone && Boolean(errors.phone)} />
                    {touched.phone && errors.phone && <p className="text-xs text-red-600">{errors.phone}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email Address</label>
                    <Input name="email" value={form.email} onChange={handleChange} placeholder="name@example.com" error={touched.email && Boolean(errors.email)} />
                    {touched.email && errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Preferred Language</label>
                    <select
                      name="preferred_language"
                      value={form.preferred_language}
                      onChange={handleChange}
                      className="flex h-11 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="gu">Gujarati</option>
                    </select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end border-t border-black/5 dark:border-white/5 py-4 bg-muted/10">
                <Button
                  onClick={savePersonal}
                  disabled={!hydrated || updateProfile.isPending}
                  className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white shadow-soft hover-lift"
                  isLoading={updateProfile.isPending}
                >
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          )}

          {activeSection === "farm" && (
            <Card className="glass-card hover-lift shadow-soft rounded-2xl border-none">
              <CardHeader className="pb-4 border-b border-black/5 dark:border-white/5 bg-muted/30 rounded-t-2xl">
                <CardTitle className="font-serif text-xl border-none items-center gap-2 flex text-foreground">
                  <Sprout className="h-5 w-5 text-[var(--color-primary)]" /> Farm Details
                </CardTitle>
                <CardDescription className="font-medium">These details power weather, crop health, and AI recommendations.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Farm Location</label>
                    <Input name="location" value={form.location} onChange={handleChange} placeholder="e.g., Rajkot, Gujarat" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Total Land Area (Acres)</label>
                    <Input
                      name="land_area"
                      value={form.land_area}
                      onChange={handleChange}
                      inputMode="decimal"
                      placeholder="e.g., 2.5"
                      error={touched.land_area && Boolean(errors.land_area)}
                    />
                    {touched.land_area && errors.land_area && <p className="text-xs text-red-600">{errors.land_area}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Crops</label>
                    <Input name="crops" value={form.crops} onChange={handleChange} placeholder="e.g., Cotton, Groundnut" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Growth Stage</label>
                    <Input
                      name="growth_stage"
                      value={form.growth_stage}
                      onChange={handleChange}
                      placeholder="e.g., Vegetative / Flowering / Fruiting"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Irrigation Type</label>
                    <select
                      name="irrigation_type"
                      value={form.irrigation_type}
                      onChange={handleChange}
                      className="flex h-11 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                    >
                      <option value="Drip Irrigation">Drip Irrigation</option>
                      <option value="Sprinkler">Sprinkler</option>
                      <option value="Surface (Flood)">Surface (Flood)</option>
                      <option value="Rainfed">Rainfed</option>
                    </select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end border-t border-black/5 dark:border-white/5 py-4 bg-muted/10">
                <Button
                  onClick={saveFarm}
                  disabled={!hydrated || updateFarm.isPending}
                  className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white shadow-soft hover-lift"
                  isLoading={updateFarm.isPending}
                >
                  Update Farm Data
                </Button>
              </CardFooter>
            </Card>
          )}

          {activeSection === "security" && (
            <Card className="glass-card hover-lift shadow-soft rounded-2xl border-none">
              <CardHeader className="pb-4 border-b border-black/5 dark:border-white/5 bg-muted/30 rounded-t-2xl">
                <CardTitle className="font-serif text-xl border-none items-center gap-2 flex text-foreground">
                  <Shield className="h-5 w-5 text-[var(--color-primary)]" /> Security
                </CardTitle>
                <CardDescription className="font-medium">Change your password and keep your account secure.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Old Password</label>
                    <Input
                      type="password"
                      name="old_password"
                      value={form.old_password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      error={touched.old_password && Boolean(errors.old_password)}
                    />
                    {touched.old_password && errors.old_password && <p className="text-xs text-red-600">{errors.old_password}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">New Password</label>
                    <Input
                      type="password"
                      name="new_password"
                      value={form.new_password}
                      onChange={handleChange}
                      placeholder="Min 8 characters"
                      error={touched.new_password && Boolean(errors.new_password)}
                    />
                    {touched.new_password && errors.new_password && <p className="text-xs text-red-600">{errors.new_password}</p>}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-between border-t border-black/5 dark:border-white/5 py-4 bg-muted/10 gap-3 flex-wrap">
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="text-red-600 border-red-500/20 hover:bg-red-500/10 hover:text-red-700"
                >
                  <LogOut className="mr-2 h-4 w-4" /> Log out
                </Button>
                <Button
                  onClick={async () => {
                    if (!form.old_password) return toast.error("Please enter your old password.");
                    if (!form.new_password || form.new_password.length < 8)
                      return toast.error("New password must be at least 8 characters.");
                    try {
                      await changePassword.mutateAsync({ old_password: form.old_password, new_password: form.new_password });
                      toast.success("Password updated.");
                      setForm((p) => ({ ...p, old_password: "", new_password: "" }));
                    } catch (e: unknown) {
                      const msg =
                        typeof e === "object" && e !== null && "response" in e
                          ? // @ts-expect-error - runtime shape from axios
                            String(e.response?.data?.detail?.message || e.response?.data?.detail || "Failed to change password.")
                          : "Failed to change password.";
                      toast.error(msg);
                    }
                  }}
                  disabled={changePassword.isPending}
                  className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white shadow-soft hover-lift"
                  isLoading={changePassword.isPending}
                >
                  Change Password
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
