"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAdvisor, useAdvisorHistory, useAdvisorImage } from "@/hooks/useAdvisor";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Send, Bot, User, Sprout, Image as ImageIcon, Mic, Volume2, StopCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/i18n/LanguageProvider";
import { ContextBar } from "@/components/advisor/ContextBar";
import { StructuredResponse } from "@/components/advisor/StructuredResponse";

interface Message {
  id: string | number;
  role: "system" | "user" | "assistant";
  content: string;
  created_at?: string | null;
}

export default function AdvisorPage() {
  const [query, setQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { language: preferredLanguage } = useLanguage();

  const { data: history, isLoading: historyLoading, isError: historyError } = useAdvisorHistory();
  const { mutate: sendMsg, isPending: isSending } = useAdvisor();
  const { mutate: sendImage, isPending: isSendingImage } = useAdvisorImage();

  const isPending = isSending || isSendingImage;

  const [messages, setMessages] = useState<Message[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | number | null>(null);
  const contextProcessed = useRef(false);

  const suggestions = useMemo(
    () => [
      { key: "pest", label: "Check pest treatment", text: "I suspect a pest issue. What treatment do you recommend for my crop right now?" },
      { key: "weather", label: "Weather impact on crops", text: "How will today’s weather affect my crop, and what precautions should I take?" },
      { key: "irrigation", label: "Irrigation advice", text: "Based on my soil moisture and weather, should I irrigate today? Give a clear plan." },
    ],
    []
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!history?.messages) return;
    setMessages(
      history.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        created_at: m.created_at ?? null,
      }))
    );
  }, [history?.messages]);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    return () => {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    };
  }, []);

  const stopSpeak = () => {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      setPlayingMessageId(null);
    } catch {}
  };

  const speak = (text: string, msgId: string | number) => {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      setPlayingMessageId(msgId);
      
      const u = new SpeechSynthesisUtterance(text);
      u.lang = preferredLanguage === "hi" ? "hi-IN" : preferredLanguage === "gu" ? "gu-IN" : "en-IN";
      
      u.onend = () => setPlayingMessageId(null);
      u.onerror = () => setPlayingMessageId(null);
      
      window.speechSynthesis.speak(u);
    } catch {}
  };

  const startVoice = async () => {
    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input is not supported in this browser.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = preferredLanguage === "hi" ? "hi-IN" : preferredLanguage === "gu" ? "gu-IN" : "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    recognitionRef.current = rec;
    setIsListening(true);
    setIsProcessingVoice(false);

    rec.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0]?.transcript || "";
      }
      setQuery(transcript.trim());
    };
    
    rec.onspeechstart = () => setIsProcessingVoice(true);
    
    rec.onerror = (e: any) => {
      console.error("Speech error", e);
      setIsListening(false);
      setIsProcessingVoice(false);
      if (e.error !== "no-speech") {
        toast.error("Voice recognition failed. Please try again.");
      }
    };

    rec.onend = () => {
      setIsListening(false);
      setIsProcessingVoice(false);
    };

    rec.start();
  };

  const handleSend = (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const finalQuery = overrideQuery || query;
    if (!finalQuery.trim() || isPending) return;
    
    const userMessage: Message = { id: Date.now().toString(), role: "user", content: finalQuery, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMessage]);
    
    setQuery("");

    sendMsg(
      { message: finalQuery, language: preferredLanguage },
      {
        onSuccess: (res) => {
          const botMsg: Message = {
            id: res.message_id ?? (Date.now() + 1).toString(),
            role: "assistant",
            content: res.reply,
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, botMsg]);
          // Removed auto-play as per requirements
        },
        onError: () => {
          const errMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "system",
            content: preferredLanguage === "hi"
              ? "AI Agronomist से कनेक्ट नहीं हो पा रहा है। कृपया थोड़ी देर बाद फिर कोशिश करें।"
              : preferredLanguage === "gu"
              ? "AI Agronomist સાથે કનેક્ટ થઈ શક્યું નથી. કૃપા કરીને થોડીવાર પછી ફરી પ્રયાસ કરો."
              : "Failed to connect to AI Agronomist. Please try again later.",
            created_at: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, errMsg]);
        },
      },
    );
  };

  useEffect(() => {
    if (contextProcessed.current || typeof window === "undefined" || historyLoading) return;
    
    // We only want to process URL context if history is successfully loaded (prevents racing with history fetching)
    // and if there are no messages in the current session yet or we are fresh.
    const params = new URLSearchParams(window.location.search);
    const pest = params.get("pest");
    
    if (pest) {
      contextProcessed.current = true;
      const severity = params.get("severity") || "unknown";
      const crop = params.get("crop") || "unknown";
      const initialText = `I suspect a pest issue. The pest detected is ${pest} with ${severity} severity on my ${crop} crop. What treatment do you recommend?`;
      
      // Process URL context immediately
      handleSend(undefined, initialText);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [historyLoading, historyError]); // Removed handleSend from deps to avoid re-triggering

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Agronomist"
        description="Your personal 24/7 expert on Indian farming practices."
      />

      <div className="h-[calc(100vh-220px)] flex flex-col max-w-4xl mx-auto glass-panel rounded-[2rem] overflow-hidden animate-in fade-in duration-500">
         <div className="h-20 border-b border-border/50 bg-white/40 dark:bg-black/20 backdrop-blur-xl flex items-center px-6 gap-4 shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
            
            <div className="h-12 w-12 bg-gradient-farm text-[var(--color-primary-dark)] dark:text-white rounded-xl flex items-center justify-center shadow-soft relative z-10 focus:outline-none border border-[var(--color-primary)]/20">
              <Bot className="h-6 w-6 relative z-10" />
            </div>
            <div className="relative z-10">
              <h2 className="font-serif font-bold text-xl leading-tight">AAROH Agronomist <span className="text-[10px] font-sans font-bold uppercase tracking-wider bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full ml-2 align-middle">Online</span></h2>
              <p className="text-xs text-muted-foreground font-medium mt-0.5 flex items-center gap-1.5"><Sprout className="h-3 w-3 text-[var(--primary)]" /> Specializing in regional crops</p>
            </div>
            <div className="ml-auto relative z-10 flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground font-semibold px-2 py-1 rounded-md bg-muted/50 border border-border/50 uppercase">
                {preferredLanguage === "hi" ? "हिंदी" : preferredLanguage === "gu" ? "ગુજરાતી" : "English"}
              </span>
            </div>
         </div>

         <ContextBar />

         <div className="flex-1 overflow-y-auto p-6 space-y-10 bg-white/20 dark:bg-black/10 transition-all duration-300">
          {historyLoading && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center text-sm text-muted-foreground animate-pulse">Loading conversation...</div>
            </div>
          )}
          {historyError && messages.length === 0 && (
            <div className="text-center text-sm text-red-500">Failed to load chat history. Please try again.</div>
          )}

          {messages.map((msg) => {
             if (msg.role === "system") {
               return (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center my-6">
                    <div className="bg-muted/60 backdrop-blur-sm border border-border/50 px-5 py-2.5 rounded-full text-xs font-semibold text-muted-foreground flex items-center gap-2.5 max-w-md text-center shadow-sm">
                      <Sprout className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                      {msg.content}
                    </div>
                  </motion.div>
               );
             }

            const isBot = msg.role === "assistant";

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${isBot ? "justify-start" : "justify-end"}`}
              >
                {isBot && (
                  <div className="h-10 w-10 bg-gradient-farm text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-1 border border-primary/20">
                    <Bot className="h-5 w-5" />
                  </div>
                )}
                
                <div className={`group relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-soft transition-all ${
                  isBot 
                    ? "glass-card text-foreground rounded-tl-sm border-none bg-white/60 dark:bg-black/20" 
                    : "bg-[var(--color-primary)] text-white rounded-tr-sm"
                }`}>
                  {isBot ? (
                    <div className="space-y-3">
                      <StructuredResponse content={msg.content} />
                      <div className="flex items-center justify-between gap-4 mt-2">
                        {msg.created_at && (
                          <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => playingMessageId === msg.id ? stopSpeak() : speak(msg.content, msg.id)}
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          {playingMessageId === msg.id ? (
                            <StopCircle className="h-4 w-4 animate-pulse text-primary" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                      {msg.created_at && (
                        <div className="mt-1 text-[9px] font-bold text-white/60 text-right uppercase tracking-tighter">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {!isBot && (
                  <div className="h-10 w-10 bg-muted border border-border/50 text-muted-foreground rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-1">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </motion.div>
            );
         })}

         {isPending && (
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex gap-3">
             <div className="h-10 w-10 bg-gradient-farm text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-1 border border-primary/20">
               <Bot className="h-5 w-5" />
             </div>
             <div className="max-w-[80%] rounded-2xl px-5 py-4 glass-card text-foreground rounded-tl-sm shadow-soft border-none bg-white/60 dark:bg-black/20">
               <div className="flex items-center gap-3 text-sm text-muted-foreground font-bold">
                 <div className="flex gap-1">
                   <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                   <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                   <span className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" />
                 </div>
                 {preferredLanguage === "hi" ? "AI Agronomist सोच रहा है..." : preferredLanguage === "gu" ? "AI Agronomist વિચારી રહ્યું છે..." : "AI Agronomist is typing..."}
               </div>
             </div>
           </motion.div>
         )}
         <div ref={messagesEndRef} />
       </div>

       <div className="p-4 bg-white/40 dark:bg-black/20 backdrop-blur-xl border-t border-border/50 shrink-0">
          <div className="flex flex-wrap gap-2 mb-4 max-w-4xl mx-auto px-1">
            <AnimatePresence>
              {suggestions.map((s, idx) => (
                <motion.div
                  key={s.key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleSend(undefined, s.text)}
                    className="rounded-full bg-white/50 dark:bg-black/20 border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all text-[11px] font-bold h-8"
                  >
                    {s.label}
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="max-w-4xl mx-auto relative group">
            {isListening && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute -top-14 left-0 right-0 flex justify-center z-50"
              >
                <div className="bg-primary px-4 py-2 rounded-2xl shadow-xl flex items-center gap-3 border border-white/20 backdrop-blur-md">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-white/40 rounded-full animate-ping" />
                    <div className="h-3 w-3 rounded-full bg-white relative z-10" />
                  </div>
                  <span className="text-white text-xs font-bold tracking-wide uppercase">
                     {isProcessingVoice ? "Converting speech..." : "Listening..."}
                  </span>
                </div>
              </motion.div>
            )}

            <form onSubmit={(e) => handleSend(e)} className="relative flex items-center gap-2 bg-white dark:bg-muted/50 rounded-[1.5rem] p-2 border border-border/50 shadow-soft focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary focus-within:shadow-lg transition-all duration-200">
               <input
                 ref={fileInputRef}
                 type="file"
                 accept="image/*"
                 className="hidden"
                 onChange={(e) => {
                   const f = e.currentTarget.files?.[0];
                   if (!f) return;
                   setMessages((prev) => [
                     ...prev,
                     { id: Date.now().toString(), role: "system", content: "Image uploaded. Sending to AI for analysis...", created_at: new Date().toISOString() },
                   ]);
                   sendImage(
                     { file: f, message: query.trim() || undefined, language: preferredLanguage },
                     {
                       onSuccess: (res) => {
                         const botMsg: Message = {
                           id: res.message_id ?? (Date.now() + 1).toString(),
                           role: "assistant",
                           content: res.reply,
                           created_at: new Date().toISOString(),
                         };
                         setMessages((prev) => [...prev, botMsg]);
                       },
                       onError: () => {
                         toast.error("Image analysis failed. Please try again.");
                       },
                       onSettled: () => {
                         e.currentTarget.value = "";
                       },
                     }
                   );
                 }}
               />

               <Button
                 variant="ghost"
                 size="icon"
                 type="button"
                 disabled={isPending}
                 onClick={() => fileInputRef.current?.click()}
                 className="shrink-0 text-muted-foreground hover:text-primary hover:bg-primary/10 h-10 w-10 rounded-xl transition-colors"
                 title="Upload image"
               >
                 <ImageIcon className="h-5 w-5" />
               </Button>
               
               <textarea 
                 rows={1}
                 className="flex-1 bg-transparent max-h-32 min-h-[48px] resize-none outline-none py-3 px-4 text-sm text-foreground placeholder-muted-foreground font-bold tracking-tight transition-all duration-200"
                 placeholder={preferredLanguage === "hi" ? "सवाल पूछें..." : preferredLanguage === "gu" ? "પ્રશ્ન પૂછો..." : "Ask your agricultural query..."}
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 disabled={isPending}
                 onKeyDown={(e) => {
                   if (e.key === "Enter" && !e.shiftKey) {
                     e.preventDefault();
                     handleSend(e);
                   }
                 }}
               />

              <div className="flex items-center gap-1 pr-1">
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  disabled={isPending}
                  onClick={startVoice}
                  className={`shrink-0 h-10 w-10 rounded-xl transition-all relative ${
                    isListening ? "text-primary bg-primary/20 ring-2 ring-primary/40 shadow-inner" : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                  }`}
                  title="Voice input"
                >
                  <Mic className={`h-5 w-5 ${isListening ? "animate-pulse" : ""}`} />
                  {isListening && (
                    <span className="absolute inset-0 rounded-xl bg-primary/20 animate-ping" />
                  )}
                </Button>
                
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!query.trim() || isPending} 
                  className="shrink-0 rounded-xl h-10 w-10 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 border-none shadow-soft"
                >
                  {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </div>
            </form>
          </div>
          <div className="text-center mt-3">
             <span className="text-[10px] text-muted-foreground font-medium">Responses generated by AI. Please consult local agronomists for severe infestations.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
