import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Image as ImageIcon, Lock, ShieldAlert, Terminal, MessageSquare, User, Mail, Sparkles, X } from "lucide-react";

export default function HelpDeskCenterView({ userEmail, userName }) {
  // Session handles mapped to terminal login states
  const accountCredentials = {
    username: userName || "Harshit Mehta22",
    email: userEmail || "harshitmehta1012@gmail.com",
    nodeStatus: "SECURE_GRID_NOMINAL"
  };

  const [inputMessage, setInputMessage] = useState("");
  const [stagedImage, setStagedImage] = useState(null);
  const fileInputRef = useRef(null);

  // Simulated help chat message timeline state array
  const [supportTimeline, setSupportTimeline] = useState([
    { id: 1, sender: "system", text: "🔐 Cryptographic Connection Established. This stream is end-to-end encrypted with the Outpost Support Network. No other users can monitor this frequency.", time: "14:15" },
    { id: 2, sender: "user", text: "Hello, I need operator assistance with an isolated webhook container failure running on my Render cluster node.", time: "14:16" }
  ]);

  const handleAttachImage = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setStagedImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() && !stagedImage) return;

    const newPacket = {
      id: Date.now(),
      sender: "user",
      text: inputMessage || "📷 [Secure Image Payload Dispatched]",
      time: "Just Now"
    };

    setSupportTimeline([...supportTimeline, newPacket]);
    setInputMessage("");
    setStagedImage(null);
  };

  return (
    <div className="w-full h-full max-w-5xl mx-auto p-4 md:p-6 flex flex-col justify-between font-sans text-zinc-300 bg-[#0c0c0e]/40 border border-zinc-900/60 backdrop-blur-2xl rounded-2xl shadow-2xl relative overflow-hidden">
      
      {/* Dynamic Aura Glow Accent */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand/5 rounded-full blur-3xl pointer-events-none" />

      {/* 📡 1. MODULE CONTROL BAR HEADER */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-brand/10 border border-brand/20 text-brand rounded-xl">
            <MessageSquare className="size-4" />
          </div>
          <div>
            <h3 className="text-xs font-mono font-black tracking-widest text-white uppercase flex items-center gap-2">
              Sovereign Direct Comms Node
              <span className="text-[9px] bg-emerald-950/80 border border-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded-md flex items-center gap-1 font-mono font-normal">
                <Lock className="size-2.5" /> E2EE STREAM ACTIVE
              </span>
            </h3>
          </div>
        </div>
      </div>

      {/* 👤 2. INTEGRATED SENDER METADATA BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-[11px] font-mono">
        <div className="p-3 bg-zinc-950/80 border border-zinc-900/80 rounded-xl flex items-center gap-2.5">
          <User className="size-4 text-brand" />
          <div>
            <span className="text-zinc-600 block text-[9px] uppercase">OPERATOR NAME</span>
            <span className="text-white font-sans font-bold">{accountCredentials.username}</span>
          </div>
        </div>
        <div className="p-3 bg-zinc-950/80 border border-zinc-900/80 rounded-xl flex items-center gap-2.5 sm:col-span-2">
          <Mail className="size-4 text-brand" />
          <div className="truncate w-full">
            <span className="text-zinc-600 block text-[9px] uppercase">SECURE REGISTRATION GATEWAY</span>
            <span className="text-zinc-300 font-sans truncate block">{accountCredentials.email}</span>
          </div>
        </div>
      </div>

      {/* 💬 3. SECURE ONE-ON-ONE CONVERSATION STREAM */}
      <div className="flex-1 bg-zinc-950/60 border border-zinc-900 rounded-xl p-4 overflow-y-auto mb-4 space-y-3 min-h-[300px] flex flex-col justify-end">
        {supportTimeline.map((msg) => {
          const isSystem = msg.sender === "system";
          return (
            <div 
              key={msg.id} 
              className={`flex flex-col max-w-[85%] ${isSystem ? "mx-auto text-center w-full" : "ml-auto"}`}
            >
              {isSystem ? (
                <div className="p-2.5 bg-brand/5 border border-brand/20 text-brand/90 font-mono text-[10px] rounded-xl tracking-wide max-w-2xl mx-auto">
                  {msg.text}
                </div>
              ) : (
                <div className="bg-zinc-900 border border-zinc-800/80 p-3 rounded-2xl rounded-tr-none shadow-md space-y-1">
                  <div className="flex items-center justify-between gap-6">
                    <span className="text-[10px] font-mono font-bold text-brand uppercase tracking-wider">Scout Terminal</span>
                    <span className="text-[9px] font-mono text-zinc-600">{msg.time}</span>
                  </div>
                  <p className="text-xs text-zinc-200 leading-relaxed font-sans">{msg.text}</p>
                </div>
              )}
            </div>
          );
        })}

        {/* Floating image attachment render block */}
        {stagedImage && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            className="ml-auto relative w-28 aspect-video rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950"
          >
            <img src={stagedImage} alt="Staged network packet visualization payload" className="w-full h-full object-cover" />
            <button 
              onClick={() => setStagedImage(null)}
              className="absolute top-1 right-1 p-1 bg-black/80 hover:bg-black rounded-lg text-zinc-400 border border-zinc-900"
            >
              <X className="size-3" />
            </button>
          </motion.div>
        )}
      </div>

      {/* 🚀 4. TRANSMISSION CONTROL INTERACTIVE FOOTER BLOCK */}
      <div className="space-y-3">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-center bg-zinc-950 p-2 border border-zinc-900 rounded-xl focus-within:border-brand/40 transition-colors">
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAttachImage} className="hidden" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
            title="Stage Diagnostic Screen Image"
          >
            <ImageIcon className="size-4" />
          </button>
          
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your encrypted network help query..."
            className="flex-1 bg-transparent border-none outline-none px-2 text-xs text-white placeholder-zinc-600"
          />

          <button
            type="submit"
            className="px-4 py-2 bg-brand text-white font-mono font-black text-[10px] uppercase tracking-wider rounded-lg hover:opacity-95 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(var(--brand-primary),0.15)] shrink-0"
          >
            <Send className="size-3" /> Transmit Signal
          </button>
        </form>

        {/* Security Rule Warning Base Footer bar */}
        <div className="p-3 bg-red-950/10 border border-red-900/20 rounded-xl flex gap-2.5 items-start text-red-400/80">
          <ShieldAlert className="size-4 shrink-0 mt-0.5" />
          <p className="text-[10px] font-mono leading-normal text-zinc-500">
            <span className="text-red-400 font-bold">RANGER ALERT:</span> Abuse of secure support frequencies or attempting to upload unverified script payloads will trigger an automatic hardware node ban via the Basecamp Ranger perimeter shield network.
          </p>
        </div>
      </div>

    </div>
  );
}
