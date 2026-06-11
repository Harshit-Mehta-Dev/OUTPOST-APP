import React from "react";
import { motion } from "framer-motion";
import { Terminal, ShieldCheck, Cpu, Code2 } from "lucide-react";

export default function FounderSection() {
  const engineeringMetrics = [
    { label: "Architecture", value: "Hybrid Micro", icon: Cpu },
    { label: "Core Security", value: "AI Guard Zero", icon: ShieldCheck },
    { label: "Engine Protocols", value: "WebSockets / Live", icon: Code2 },
  ];

  return (
    <section className="w-full max-w-5xl mx-auto px-6 py-24 relative font-sans text-zinc-300 overflow-hidden">
      {/* Background Ambient Radial Frequency Aura */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 bg-brand/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        
        {/* 🖼️ Left Cluster: Animated Founder Profile Frame (Takes 5 Columns) */}
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="md:col-span-5 relative group mx-auto md:mx-0 max-w-sm w-full"
        >
          {/* Animated Glow Border Frame backing the profile image */}
          <div className="absolute -inset-1.5 bg-gradient-to-tr from-[#ff4d00] via-[#ff4d00]/40 to-transparent rounded-2xl opacity-20 group-hover:opacity-40 blur-md transition-all duration-500" />
          
          {/* Main Visual Image Card Holder */}
          <div className="relative bg-[#09090b] border border-[#18181b] rounded-2xl overflow-hidden aspect-[4/5] shadow-2xl">
            <img 
              src="/founder-avatar.jpg" 
              alt="Harshit Mehta - Founder of Outpost" 
              className="w-full h-full object-cover filtering grayscale contrast-125 brightness-95 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-in-out"
            />
            
            {/* Overlay Glass Dashboard Badge on top of Photo */}
            <div className="absolute bottom-4 left-4 right-4 bg-[#09090b]/80 border border-[#27272a]/60 backdrop-blur-md rounded-xl p-3 flex items-center justify-between shadow-xl">
              <div>
                <p className="text-white font-black text-xs tracking-wide uppercase">Harshit Mehta</p>
                <p className="text-[10px] text-[#71717a] font-mono mt-0.5">Jalandhar Node // Founder</p>
              </div>
              <div className="w-6 h-6 bg-[#ff4d00]/10 border border-[#ff4d00]/20 rounded-lg flex items-center justify-center text-[#ff4d00] text-xs font-mono font-bold">
                Ω
              </div>
            </div>
          </div>
        </motion.div>

        {/* 📝 Right Cluster: Visionary Statement & Engineering Metadata (Takes 7 Columns) */}
        <motion.div 
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="md:col-span-7 space-y-6"
        >
          {/* Section Marker */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#18181b]/60 border border-[#27272a] rounded-lg text-xs font-mono text-[#ff4d00]">
            <Terminal className="w-3.5 h-3.5" /> Founder's Briefing Manifest
          </div>

          {/* Heading Layout */}
          <h3 className="text-3xl md:text-4xl font-black font-mono tracking-tight text-white uppercase leading-tight">
            The Ideology Behind <span className="text-[#ff4d00]">Outpost</span>
          </h3>

          {/* The Thought / Quote Block */}
          <div className="relative">
            <span className="absolute -top-6 -left-4 text-6xl text-[#27272a] font-serif select-none pointer-events-none">“</span>
            <p className="text-sm md:text-base text-[#a1a1aa] leading-relaxed italic relative z-10 font-sans">
              Outpost was forged out of a simple, uncompromised necessity: communication tools should be sovereign, fast, and unburdened by bloat. We didn't build this platform to copy what exists—we engineered it to redefine how technical teams and gaming squads deploy basecamps, manage perimeters, and secure their digital frequencies.
            </p>
          </div>

          {/* Founder Signature Block */}
          <div>
            <p className="text-white font-bold font-mono text-xs tracking-wider uppercase">HARSHIT MEHTA</p>
            <p className="text-[11px] text-[#71717a] font-mono mt-0.5">Core System Architect & Project Lead</p>
          </div>

          <hr className="border-[#27272a] my-4" />

          {/* Internal Structural Specs Sub-Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {engineeringMetrics.map((spec, index) => {
              const Icon = spec.icon;
              return (
                <div key={index} className="p-3 bg-[#09090b]/40 border border-[#18181b] rounded-xl backdrop-blur-sm hover:border-[#27272a] transition-colors">
                  <div className="flex items-center gap-2 text-[#71717a] font-mono text-[9px] uppercase tracking-wider">
                    <Icon className="w-3.5 h-3.5 text-[#ff4d00]/70" /> {spec.label}
                  </div>
                  <p className="text-xs font-bold text-[#e4e4e7] mt-1 font-mono">{spec.value}</p>
                </div>
              );
            })}
          </div>

        </motion.div>

      </div>
    </section>
  );
}
