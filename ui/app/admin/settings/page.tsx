"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Save, Loader2 } from "lucide-react";
import { fetchSettings, updateSettings } from "@/api/adminApi";

interface SystemSetting {
  id: number;
  key: string;
  value: string;
  description: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await fetchSettings();
      setSettings(data);
      const initialValues: Record<string, string> = {};
      data.forEach((s: SystemSetting) => {
        initialValues[s.key] = s.value;
      });
      setFormValues(initialValues);
    } catch (error) {
      console.error("Failed to load settings", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      const updates = Object.entries(formValues).map(([key, value]) => ({ key, value }));
      await updateSettings(updates);
      alert("Settings updated successfully");
      await loadSettings();
    } catch (error: any) {
      alert(error.response?.data?.detail || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="h-8 w-8 text-indigo-500" />
            System Settings
          </h1>
          <p className="text-muted-foreground mt-1 text-base">
            Configure global thresholds and system parameters.
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={loading || saving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {loading ? (
        <Card className="border-none shadow-sm">
          <CardContent className="py-16 text-center text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Loading settings...
          </CardContent>
        </Card>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50 dark:bg-zinc-900/50 border-b border-slate-100 dark:border-white/5">
            <CardTitle>Global Parameters</CardTitle>
            <CardDescription>Changes apply to all users across the platform.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
            {settings.map((setting) => (
              <div key={setting.key} className="space-y-2">
                <Label htmlFor={setting.key} className="text-base font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                  {setting.key.replace(/_/g, " ")}
                </Label>
                <Input
                  id={setting.key}
                  value={formValues[setting.key] || ""}
                  onChange={(e) => setFormValues({ ...formValues, [setting.key]: e.target.value })}
                  className="font-mono bg-slate-50 dark:bg-zinc-900"
                />
                <p className="text-sm text-muted-foreground">
                  {setting.description}
                </p>
              </div>
            ))}

            {settings.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No settings found.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
