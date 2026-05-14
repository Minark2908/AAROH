"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { predictPest } from "@/api/pestApi";
import type { PestDetectionResponse } from "@/schemas/pestSchema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadCloud, Camera, Bug, Sprout, CloudSun, ShieldCheck, MapPin, CalendarClock, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageProvider";
import { getPublicAssetBase } from "@/lib/publicAssetBase";

export default function PestDetectionPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [prediction, setPrediction] = useState<null | PestDetectionResponse>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: (file: File) => predictPest(file, { language }),
    onSuccess: (data) => {
      setPrediction(data);
    },
    onError: (err) => {
      console.error("Prediction error:", err);
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => setImagePreview(event.target?.result as string);
    reader.readAsDataURL(file);

    mutation.mutate(file);
  };

  const handleClickSelect = () => {
    fileInputRef.current?.click();
  };

  const apiBase = getPublicAssetBase();

  const confidencePct = prediction?.confidence ? Math.round(prediction.confidence * 100) : 0;
  const confidenceLabel =
    confidencePct >= 85 ? "High" : confidencePct >= 65 ? "Medium" : "Low";

  const upriScore =
    typeof prediction?.upri?.score === "number"
      ? prediction.upri.score
      : typeof prediction?.risk_index === "number"
        ? prediction.risk_index
        : null;
  const upriLevel = prediction?.upri?.level || prediction?.risk_level || null;

  const heatmapSrc = prediction?.heatmap
    ? `data:image/png;base64,${prediction.heatmap}`
    : null;

  const uploadedImageSrc = prediction?.image_url
    ? `${apiBase}${prediction.image_url}`
    : imagePreview;

  const trendIcon =
    prediction?.history?.trend === "increasing" ? TrendingUp :
    prediction?.history?.trend === "decreasing" ? TrendingDown :
    Minus;

  const trendText =
    prediction?.history?.trend === "increasing" ? "Increasing" :
    prediction?.history?.trend === "decreasing" ? "Decreasing" :
    "Stable";

  const urgency = prediction?.insights?.urgency_level || "Medium";
  const urgencyStyle =
    urgency === "High"
      ? "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20"
      : urgency === "Medium"
        ? "bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 border-yellow-500/20"
        : "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20";

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <PageHeader
        badgeIcon={Bug}
        badgeText={t("pest.badge_ai_detection", undefined, "Computer Vision Analysis")}
        badgeVariant="primary"
        title={t("pest.title", undefined, "AI Pest Detection")}
        description={t("pest.desc", undefined, "Upload a photo of your crop to instantly identify pests and diseases.")}
      />

      <AnimatePresence mode="wait">
        {!mutation.isPending && !prediction && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-8"
          >
            <Card className="glass-card hover-lift border-dashed border-2 border-[var(--color-primary)]/30">
              <CardContent className="flex flex-col items-center justify-center py-20 px-4 text-center">
                 <div className="h-20 w-20 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] mb-6 flex items-center justify-center ring-8 ring-[var(--color-primary)]/5">
                   <UploadCloud className="h-10 w-10" />
                 </div>
                 <h3 className="font-serif text-2xl font-bold mb-2 text-foreground">Upload Crop Image</h3>
                 <p className="text-muted-foreground mb-8 max-w-sm font-medium">Drag and drop your image here, or use your camera to take a fresh photo of the affected area.</p>
                 
                 <div className="flex flex-col sm:flex-row items-center gap-4">
                   <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
                   <Button onClick={handleClickSelect} size="lg" className="w-full sm:w-auto px-8 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white shadow-soft hover-lift text-sm h-11">
                     Select File
                   </Button>
                   <Button onClick={handleClickSelect} size="lg" variant="outline" className="w-full sm:w-auto px-8 flex items-center gap-2 rounded-full border-2 border-[var(--color-primary)]/50 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 shadow-soft hover-lift">
                     <Camera className="h-4 w-4" /> Use Camera
                   </Button>
                 </div>
                 {mutation.isError && <p className="text-red-500 mt-4 text-sm font-medium">Prediction failed. Please try again.</p>}
              </CardContent>
            </Card>

            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-border bg-card shadow-sm">
              <div className="h-20 w-20 mb-6 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center ring-4 ring-[var(--color-primary)]/5">
                <Sprout className="h-10 w-10 text-[var(--color-primary)]" />
              </div>
              <h3 className="font-serif text-xl font-bold mb-2 text-foreground">Your farm data will begin growing here.</h3>
              <p className="text-sm text-muted-foreground">Capture your first crop image to initialize pest AI analysis.</p>
            </div>
          </motion.div>
        )}

        {mutation.isPending && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid md:grid-cols-2 gap-6"
          >
            <Card className="overflow-hidden">
              <div className="relative h-64 flex items-center justify-center">
                 {imagePreview && (
                   <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover blur-sm opacity-60" alt="Uploading..." />
                 )}
                 <div className="absolute inset-0 bg-black/5 dark:bg-black/40"></div>
                 
                 <div className="relative z-10 flex flex-col items-center justify-center">
                   <div className="relative h-20 w-20 mb-4 shadow-sm rounded-full bg-card p-2 border border-border">
                     <div className="absolute inset-0 rounded-full border-4 border-muted/50"></div>
                     <div className="absolute inset-0 rounded-full border-4 border-[var(--color-primary)] border-t-transparent animate-spin"></div>
                     <div className="absolute inset-0 flex items-center justify-center text-[var(--color-primary)]">
                       <Bug className="h-8 w-8 animate-pulse" />
                     </div>
                   </div>
                   <h3 className="font-heading text-lg font-bold text-foreground bg-card/90 px-4 py-1 rounded-xl shadow-sm border border-border">Analyzing Image...</h3>
                 </div>
              </div>
            </Card>
            
            <div className="space-y-6">
              <Card className="h-full flex flex-col items-center justify-center border-dashed border-2 bg-muted/5 min-h-[16rem]">
                <p className="text-[var(--color-primary)] animate-pulse font-bold text-lg">Running computer vision models</p>
                <p className="text-muted-foreground text-sm mt-2">Searching our database of agricultural threats...</p>
              </Card>
            </div>
          </motion.div>
        )}

        {prediction && !mutation.isPending && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="glass-card border-none shadow-soft rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-black/5 dark:border-white/5 bg-muted/20">
                  <CardTitle className="text-base font-serif font-bold flex items-center gap-2">
                    <Camera className="h-5 w-5 text-[var(--color-primary)]" />
                    Uploaded image
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {uploadedImageSrc ? (
                    <img
                      src={uploadedImageSrc}
                      alt="Uploaded crop"
                      className="w-full h-64 object-cover rounded-xl border border-border/60"
                    />
                  ) : (
                    <div className="h-64 rounded-xl border border-dashed border-border flex items-center justify-center text-muted-foreground">
                      No image available
                    </div>
                  )}

                  {heatmapSrc && (
                    <div className="pt-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-[var(--color-primary)]">Affected areas (AI attention)</p>
                        <span className="text-xs text-muted-foreground">Heatmap overlay</span>
                      </div>
                      <img
                        src={heatmapSrc}
                        alt="Model attention heatmap"
                        className="w-full h-64 object-cover rounded-xl border border-border/60 mt-2"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-card border-none shadow-soft rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-black/5 dark:border-white/5 bg-muted/20">
                  <CardTitle className="text-base font-serif font-bold flex items-center gap-2">
                    <Bug className="h-5 w-5 text-[var(--color-primary)]" />
                    Diagnostic summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--color-primary-dark)] dark:text-white capitalize">
                      {prediction.pest}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-2 items-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full border ${urgencyStyle}`}>
                        Urgency: {urgency}
                      </span>
                      {prediction?.severity && (
                        <span className="text-xs font-bold px-2 py-1 rounded-full border bg-muted/30 border-border">
                          Severity: {prediction.severity}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground font-medium">Confidence</span>
                      <span className="font-semibold">{confidencePct}% ({confidenceLabel})</span>
                    </div>
                    <div className="mt-2 h-2 bg-gray-200 dark:bg-white/10 rounded overflow-hidden">
                      <div
                        className={`h-2 rounded ${confidencePct >= 85 ? "bg-green-500" : confidencePct >= 65 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${confidencePct}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-border bg-muted/10 p-3">
                      <p className="text-xs text-muted-foreground font-medium">UPRI Score</p>
                      <p className="text-lg font-bold">{typeof upriScore === "number" ? `${upriScore}/100` : "-"}</p>
                      <p className="text-xs text-muted-foreground">{upriLevel || "—"}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-muted/10 p-3">
                      <p className="text-xs text-muted-foreground font-medium">Spread probability</p>
                      <p className="text-lg font-bold">
                        {typeof prediction?.insights?.spread_probability === "number"
                          ? `${Math.round(prediction.insights.spread_probability * 100)}%`
                          : "-"}
                      </p>
                      <p className="text-xs text-muted-foreground">Nearby risk: {prediction?.insights?.nearby_risk || "—"}</p>
                    </div>
                  </div>

                  {prediction?.context && (
                    <div className="rounded-xl border border-border bg-muted/10 p-3 space-y-2">
                      <p className="text-sm font-semibold text-[var(--color-primary)]">Field context</p>
                      <div className="grid grid-cols-1 gap-1 text-sm">
                        <p className="text-muted-foreground">
                          Crop: <span className="text-foreground font-medium">{prediction.context.crop_type || "Unknown"}</span>
                        </p>
                        <p className="text-muted-foreground">
                          Growth stage: <span className="text-foreground font-medium">{prediction.context.growth_stage || "Unknown"}</span>
                        </p>
                        <p className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span className="text-foreground font-medium">{prediction.context.location || "Location not set"}</span>
                        </p>
                        {prediction?.timestamp && (
                          <p className="text-muted-foreground flex items-center gap-1">
                            <CalendarClock className="h-4 w-4" />
                            <span className="text-foreground font-medium">{new Date(prediction.timestamp).toLocaleString()}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {prediction?.insights?.rationale && prediction.insights.rationale.length > 0 && (
                    <div className="rounded-xl border border-border bg-muted/10 p-3">
                      <p className="text-sm font-semibold text-[var(--color-primary)] mb-2">Smart insights</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {prediction.insights.rationale.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(urgency === "High" || (typeof upriScore === "number" && upriScore >= 80)) && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                        <AlertTriangle className="h-5 w-5" />
                        <p className="font-bold">Immediate action recommended</p>
                      </div>
                      <p className="text-sm text-red-700/90 dark:text-red-200 mt-1">
                        High risk conditions detected. Follow the treatment plan and monitor the field daily for the next 3–5 days.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {prediction?.why && (
              <Card className="glass-card border-none shadow-soft rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-black/5 dark:border-white/5 bg-muted/20">
                  <CardTitle className="text-base font-serif font-bold">Why this prediction?</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {prediction?.why?.summary && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{prediction.why.summary}</p>
                  )}
                  {prediction?.why?.signals && prediction.why.signals.length > 0 && (
                    <div className="grid md:grid-cols-2 gap-3">
                      {prediction.why.signals.map((s, idx) => (
                        <div key={idx} className="rounded-xl border border-border bg-muted/10 p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold capitalize">{s.feature}</p>
                            <span className="text-xs text-muted-foreground capitalize">{s.strength}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{s.evidence}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {!prediction?.why?.heatmap_available && (
                    <p className="text-xs text-muted-foreground">
                      Heatmap not available for this prediction.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {prediction?.ai_advisory && (
              <div className="glass-card p-6 rounded-2xl shadow-soft space-y-6 mt-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-[var(--color-primary-dark)] dark:text-white">
                  <CloudSun className="h-5 w-5 text-[var(--color-primary)]" /> Advisory & Treatment Plan
                </h3>

                {prediction?.treatment_override && (
                  <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 animate-in fade-in slide-in-from-left-2 duration-500">
                    <div className="flex items-center gap-2 mb-2">
                       <ShieldCheck className="h-5 w-5 text-indigo-600" />
                       <h4 className="font-bold text-indigo-900 dark:text-indigo-200 uppercase text-xs tracking-widest">Expert Advisory Override</h4>
                    </div>
                    <p className="text-sm text-indigo-800 dark:text-indigo-300 font-medium leading-relaxed">
                      {prediction.treatment_override}
                    </p>
                  </div>
                )}
                
                {prediction?.ai_advisory?.explanation && (
                  <div>
                    <h4 className="font-semibold text-[var(--color-primary)] mb-2">Explanation</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {prediction?.ai_advisory?.explanation}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-[var(--color-primary)] mb-3">Treatments (dynamic)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {prediction?.ai_advisory?.chemical_treatment && (
                      <div className="border border-border/50 rounded-lg p-4 bg-muted/20">
                        <p className="font-bold text-sm text-red-500 mb-2">Chemical</p>
                        <p className="font-medium text-sm mb-2">{prediction?.ai_advisory?.chemical_treatment?.name}</p>
                        {prediction?.ai_advisory?.chemical_treatment?.image && (
                          <img src={prediction?.ai_advisory?.chemical_treatment?.image} alt="Chemical" className="w-full h-32 object-cover rounded-md mt-2" />
                        )}
                      </div>
                    )}
                    {prediction?.ai_advisory?.organic_treatment && (
                      <div className="border border-border/50 rounded-lg p-4 bg-muted/20">
                        <p className="font-bold text-sm text-green-500 mb-2">Organic</p>
                        <p className="font-medium text-sm mb-2">{prediction?.ai_advisory?.organic_treatment?.name}</p>
                        {prediction?.ai_advisory?.organic_treatment?.image && (
                          <img src={prediction?.ai_advisory?.organic_treatment?.image} alt="Organic" className="w-full h-32 object-cover rounded-md mt-2" />
                        )}
                      </div>
                    )}
                    {prediction?.ai_advisory?.preventive_treatment && (
                      <div className="border border-border/50 rounded-lg p-4 bg-muted/20">
                        <p className="font-bold text-sm text-blue-500 mb-2">Preventive</p>
                        <p className="font-medium text-sm mb-2">{prediction?.ai_advisory?.preventive_treatment?.name}</p>
                        {prediction?.ai_advisory?.preventive_treatment?.image && (
                          <img src={prediction?.ai_advisory?.preventive_treatment?.image} alt="Preventive" className="w-full h-32 object-cover rounded-md mt-2" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {prediction?.ai_advisory?.application_steps && prediction?.ai_advisory?.application_steps.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-primary mb-2">Application Steps</h4>
                    <ul className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                      {prediction?.ai_advisory?.application_steps?.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {prediction?.ai_advisory?.preventive_measures && prediction?.ai_advisory?.preventive_measures.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-primary mb-2">Preventive Measures</h4>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      {prediction?.ai_advisory?.preventive_measures?.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {prediction?.ai_advisory?.video_tutorials && prediction?.ai_advisory?.video_tutorials.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-primary mb-2">Video Tutorials</h4>
                    <div className="flex flex-col gap-2">
                      {prediction?.ai_advisory?.video_tutorials?.map((v, i) => (
                        <a key={i} href={v.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm font-medium flex items-center gap-2">
                          🎬 {v.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-white/20 dark:border-white/10 flex justify-center">
                  <Button 
                    size="lg" 
                    onClick={() => {
                      const pest = prediction?.pest || "Unknown pest";
                      const severity = prediction?.severity || "Unknown";
                      const crop = prediction?.context?.crop_type || "Unknown crop";
                      router.push(`/dashboard/advisor?pest=${encodeURIComponent(pest)}&severity=${encodeURIComponent(severity)}&crop=${encodeURIComponent(crop)}`);
                    }}
                    className="w-full sm:w-2/3 md:max-w-md rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white shadow-soft hover-lift transition-all"
                  >
                    Ask AI Advisor
                  </Button>
                </div>
              </div>
            )}

            {prediction?.history && (
              <Card className="glass-card border-none shadow-soft rounded-2xl overflow-hidden">
                <CardHeader className="pb-3 border-b border-black/5 dark:border-white/5 bg-muted/20">
                  <CardTitle className="text-base font-serif font-bold flex items-center gap-2">
                    {(() => {
                      const Icon = trendIcon;
                      return <Icon className="h-5 w-5 text-[var(--color-primary)]" />;
                    })()}
                    Detection history (latest)
                    <span className="ml-auto text-xs text-muted-foreground">Trend: {trendText}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {prediction?.history?.recent && prediction.history.recent.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {prediction.history.recent.slice(0, 6).map((h) => (
                        <div key={h.id} className="rounded-xl border border-border bg-muted/10 p-3 flex gap-3">
                          <div className="h-16 w-16 rounded-lg overflow-hidden border border-border/60 bg-muted/30 shrink-0">
                            {h.image_url ? (
                              <img
                                src={`${apiBase}${h.image_url}`}
                                alt={h.pest_name}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm line-clamp-1">{h.pest_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Confidence: {Math.round(h.confidence * 100)}% • Risk: {typeof h.risk_index === "number" ? `${h.risk_index}/100` : "-"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {h.timestamp ? new Date(h.timestamp).toLocaleString() : "—"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No previous detections found for this user.</p>
                  )}
                </CardContent>
              </Card>
            )}
            
            <div className="text-center pt-8">
              <Button variant="outline" size="lg" onClick={() => { setPrediction(null); setImagePreview(null); }} className="rounded-full shadow-sm hover:bg-muted/50 border-border/80 text-muted-foreground">Scan Another Image</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
