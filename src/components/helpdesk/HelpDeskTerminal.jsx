import React, { useState, useRef } from "react";
import { Terminal, Shield, Send, Image as ImageIcon, X, Radio, ShieldAlert } from "lucide-react";

export default function HelpDeskTerminal({ userEmail, userName }) {
  const [inputText, setInputText] = useState("");
  const [stagedFile, setStagedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Core production dataset tracking live communication lines
  const [logs, setLogs] = useState([
    { 
      id: 1, 
      type: "system", 
      sender: "SYSTEM_CORE", 
      body: "Cryptographic connection established. This stream is end-to-end encrypted with the Outpost Support Network. No other users can monitor this frequency.", 
      timestamp: "14:15" 
    },
    { 
      id: 2, 
      type: "user", 
      sender: "SCOUT_TERMINAL", 
      body: "Hello, I need operator assistance with an isolated webhook container failure running on my Render cluster node.", 
      timestamp: "14:16" 
    }
  ]);

  const handleFileAttach = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setStagedFile(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleTransmitSignal = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !stagedFile) return;

    const payloadText = inputText || "Dispatched raw diagnostic media file container.";

    const newLog = {
      id: Date.now(),
      type: "user",
      sender: "SCOUT_TERMINAL",
      body: payloadText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setLogs(prev => [...prev, newLog]);
    setInputText("");
    const stagedImagePayload = stagedFile;
    setStagedFile(null);

    // Call backend router
    try {
      const response = await fetch("https://outpost-app.onrender.com/api/helpdesk/transmit-signal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          rawBytesPayload: payloadText,
          hasMedia: !!stagedImagePayload,
          mediaData: stagedImagePayload,
          userEmail: userEmail,
          userName: userName
        })
      });

      if (!response.ok) {
        console.error("Signal transmission failed:", await response.text());
        setLogs(prev => [...prev, {
          id: Date.now() + 1,
          type: "system",
          sender: "SYSTEM_ERROR",
          body: "Failed to verify signal with core network router.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (err) {
      console.error("Network error during transmission:", err);
    }
  };

  return (
    <div className="w-full h-full min-h-[calc(100vh-4rem)] bg-[#0c0c0e] border border-[#B1ADA1]/20 flex flex-col justify-between font-mono p-4 text-[#F4F3EE] select-none">
      
      {/* 📡 1. SOLID RETRO CONTAINER HEADER */}
      <div className="w-full bg-[#141416] border border-[#B1ADA1]/30 p-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <Terminal className="size-4 text-[#C15F3C]" />
          <span className="text-xs font-black tracking-wider text-white">SOVEREIGN DIRECT COMMS NODE // HELP DESK PROTOCOL</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] bg-emerald-950/60 border border-emerald-900/50 text-emerald-400 px-2.5 py-1 rounded">
          <span className="size-1.5 bg-emerald-400 rounded-full animate-ping" />
          STATUS: E2EE_ON
        </div>
      </div>

      {/* 👤 2. SYSTEM METADATA INDEX OVERVIEW (No wasted space, full width) */}
      <div className="w-full bg-[#141416] border-x border-b border-[#B1ADA1]/20 px-4 py-2.5 grid grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-[#B1ADA1] font-bold">OPERATOR IDENTITY:</span> <span className="text-white font-sans">{userName || "Scout"}</span>
        </div>
        <div className="text-right truncate">
          <span className="text-[#B1ADA1] font-bold">ROUTING LINK:</span> <span className="text-zinc-400">{userEmail || "UNKNOWN"}</span>
        </div>
      </div>

      {/* 💬 3. FULL-CANVAS HIGH-DENSITY TERMINAL LOGS FEED */}
      <div className="flex-1 w-full bg-[#08080a] border border-[#B1ADA1]/20 rounded-none my-4 p-4 overflow-y-auto space-y-4 min-h-[400px] flex flex-col justify-start">
        {logs.map((log) => (
          <div key={log.id} className="text-xs leading-relaxed space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[#B1ADA1] font-mono text-[10px]">{log.timestamp}</span>
              <span className={`font-black tracking-wide ${log.type === "system" ? "text-[#C15F3C]" : "text-emerald-500"}`}>
                [{log.sender}]:
              </span>
            </div>
            <p className={`pl-10 font-mono ${log.type === "system" ? "text-[#B1ADA1]/80 italic" : "text-[#F4F3EE]"}`}>
              {log.body}
            </p>
          </div>
        ))}

        {/* Media Payload Upload Banner Row */}
        {stagedFile && (
          <div className="w-fit ml-10 mt-2 p-2 bg-[#141416] border border-[#C15F3C]/40 flex items-center gap-3">
            <span className="text-[10px] text-[#C15F3C] font-bold">STAGED RAW MEDIA BYTES:</span>
            <span className="text-xs text-zinc-400">staged_screenshot.jpg</span>
            <button onClick={() => setStagedFile(null)} className="text-[#B1ADA1] hover:text-white">
              <X className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 🚀 4. SOLID COMMAND ENTRY DECK FOOTER */}
      <div className="w-full space-y-3">
        <form onSubmit={handleTransmitSignal} className="w-full flex items-center bg-[#141416] border border-[#B1ADA1]/30 p-1.5 focus-within:border-[#C15F3C] transition-colors">
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileAttach} className="hidden" />
          
          <span className="text-[#C15F3C] font-bold px-2 text-xs select-none">&gt;_</span>
          
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type encrypted support query parameter handle..."
            className="flex-1 bg-transparent border-none outline-none text-xs text-[#F4F3EE] placeholder-zinc-700 font-mono py-1.5"
          />

          <div className="flex items-center gap-1.5 px-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-[#0c0c0e] border border-[#B1ADA1]/20 text-[#B1ADA1] hover:text-white transition-colors"
            >
              <ImageIcon className="size-3.5" />
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#C15F3C] text-white font-mono font-black text-xs uppercase tracking-wide hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Send className="size-3" /> Transmit
            </button>
          </div>
        </form>

        {/* Tactical Rule Parameter Alert Frame */}
        <div className="w-full p-3 bg-red-950/10 border border-red-900/30 text-[10px] text-red-400/80 leading-normal">
          <span className="font-black text-[#C15F3C]">⚠️ RANGER COMPLIANCE ALERT:</span> Misuse of secure relays or attempting to upload unverified script payloads will trigger an automatic hardware node execution ban via the Basecamp Ranger perimeter shield network.
        </div>
      </div>

    </div>
  );
}
