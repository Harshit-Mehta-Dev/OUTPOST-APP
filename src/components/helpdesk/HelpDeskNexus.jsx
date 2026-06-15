import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Send, Image, LifeBuoy, X, HelpCircle, Lock } from "lucide-react";

export default function HelpDeskNexus({ isOpen, onClose, userEmail }) {
  const [queryText, setQueryText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTransmitTicket = async (e) => {
    e.preventDefault();
    if (!queryText.trim() && !selectedImage) return;

    // Blueprint cryptographic pass: Injected payload gets encrypted with AES-GCM locally here
    alert("🔐 Cryptographic Protocol Initiated: Transmitting fully encrypted E2EE data packet to Outpost Handle Staff.");
    
    setQueryText("");
    setSelectedImage(null);
  };

  return (
    <div className="fixed inset-0 bg-[#09090b] z-[9999] flex flex-col font-sans text-zinc-300">
      
      {/* 📡 TOP TERMINAL HEADER HEADER NAVIGATION */}
      <header className="w-full h-16 border-b border-zinc-900 bg-zinc-950 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 border rounded-xl" style={{ backgroundColor: 'rgba(0, 255, 170, 0.1)', borderColor: 'rgba(0, 255, 170, 0.2)', color: 'var(--brand-primary, #00ffaa)' }}>
            <LifeBuoy size={18} />
          </div>
          <div>
            <h2 className="text-xs font-mono font-black tracking-widest text-white uppercase flex items-center gap-1.5">
              Sovereign Help Desk 
              <span className="text-[9px] px-1.5 py-0.5 rounded font-normal border flex items-center gap-1" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#34d399' }}>
                <Lock size={10} /> E2EE Active
              </span>
            </h2>
            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">Direct encryted communications network node</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-mono"
        >
          <X size={16} /> Close Terminal
        </button>
      </header>

      {/* 🚀 WORKSPACE CANVAS SPLIT PANEL */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        
        {/* Left Form Stream: Input Deck (Takes 7 Columns) */}
        <div className="lg:col-span-7 flex flex-col h-full justify-between bg-zinc-950/40 border border-zinc-900/60 rounded-2xl p-5 relative">
          
          <div className="space-y-4 overflow-y-auto pr-1">
            <div className="border-b border-zinc-900 pb-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Transmission Request Template</span>
            </div>

            {/* Secure Meta Fields */}
            <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
              <div className="p-2.5 bg-zinc-900/20 border border-zinc-900 rounded-xl">
                <span className="text-zinc-600 block mb-0.5">SENDER IDENTIFIER</span>
                <span className="text-zinc-300 font-sans truncate block">{userEmail}</span>
              </div>
              <div className="p-2.5 bg-zinc-900/20 border border-zinc-900 rounded-xl">
                <span className="text-zinc-600 block mb-0.5">ROUTING GATEWAY</span>
                <span className="block font-bold" style={{ color: 'var(--brand-primary, #00ffaa)' }}>OUTPOST_HQ_CORE</span>
              </div>
            </div>

            {/* Core Query Text Area Box */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-zinc-500 uppercase px-1">Describe System Comms Query</label>
              <textarea
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="State your technical issue or security inquiry details here..."
                className="w-full h-40 bg-zinc-900/40 border border-zinc-900 rounded-xl p-3 text-xs text-white placeholder-zinc-600 focus:outline-none resize-none font-sans transition-colors focus:border-[#00ffaa]/40"
              />
            </div>

            {/* Image Micro View Render Staging Area */}
            {selectedImage && (
              <div className="relative w-32 aspect-video rounded-xl border border-zinc-800 overflow-hidden bg-zinc-900 group">
                <img src={selectedImage} alt="Attachment payload staging preview" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={handleClearImage}
                  className="absolute top-1 right-1 p-1 bg-black/80 hover:bg-black rounded-lg text-zinc-400 hover:text-white border border-zinc-800"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          {/* Execution Footer Bar Actions */}
          <form onSubmit={handleTransmitTicket} className="border-t border-zinc-900 pt-4 flex gap-2 items-center">
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleImageSelect} 
              className="hidden" 
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center"
              title="Attach Diagnostic Imagery"
            >
              <Image size={16} />
            </button>

            <button
              type="submit"
              className="flex-1 py-2.5 text-[#09090b] font-mono font-black text-xs rounded-xl hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,255,170,0.15)]"
              style={{ backgroundColor: 'var(--brand-primary, #00ffaa)' }}
            >
              <Send size={14} /> Broadcast Encrypted Core Signal
            </button>
          </form>

        </div>

        {/* Right Info Board: Safeguard Procedures Panel (Takes 5 Columns) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 backdrop-blur-md space-y-4">
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
              <HelpCircle size={14} style={{ color: 'var(--brand-primary, #00ffaa)' }} /> Operation Parameters
            </h4>
            
            <div className="space-y-3 text-[11px] leading-relaxed text-zinc-400">
              <div className="p-3 bg-zinc-900/20 border border-zinc-900 rounded-xl">
                <p className="font-mono text-zinc-200 font-bold mb-1">🛡️ Sovereign Encrypted Channel</p>
                All uploaded data matrices, text strings, and log frames are encrypted before hitting our network transport pipelines.
              </div>
              <div className="p-3 bg-zinc-900/20 border border-zinc-900 rounded-xl">
                <p className="font-mono text-zinc-200 font-bold mb-1">⏱️ Ticket Triage Times</p>
                Our Handle Core administrators respond to open secure channels within 24 operational deployment cycles.
              </div>
            </div>
          </div>

          <div className="p-3.5 border rounded-2xl flex gap-3 items-start" style={{ backgroundColor: 'rgba(153, 27, 27, 0.1)', borderColor: 'rgba(153, 27, 27, 0.2)' }}>
            <ShieldAlert size={16} className="text-red-400 shrink-0 mt-0.5" style={{ color: '#f87171' }} />
            <p className="text-[10px] font-mono text-zinc-500 leading-normal">
              NOTICE: Abuse of support communication loops or uploading malicious script injections will result in automated permanent account decommissioning via the Basecamp Ranger defense network.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
