import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, BarChart3, X, Plus } from "lucide-react";

export default function AttachmentPopover({ isOpen, onClose, onSendMedia, onSendPoll }) {
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict 5MB file size limit to protect MongoDB (Max document size is 16MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large! Please upload media under 5MB.");
      return;
    }

    const fileType = file.type.startsWith("video/") ? "video" : "image";
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        onSendMedia(reader.result, fileType);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePollSubmit = (e) => {
    e.preventDefault();
    const filteredOptions = pollOptions.filter(opt => opt.trim() !== "");
    if (!pollQuestion.trim() || filteredOptions.length < 2) return;

    onSendPoll(pollQuestion, filteredOptions);
    setPollQuestion("");
    setPollOptions(["", ""]);
    setShowPollCreator(false);
    onClose();
  };

  return (
    <div className="absolute bottom-14 left-2 z-50 font-sans text-xs">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="w-64 bg-zinc-950/95 border border-zinc-900 backdrop-blur-xl rounded-2xl p-3 shadow-2xl text-zinc-300"
          >
            {!showPollCreator ? (
              <div className="grid grid-cols-2 gap-2">
                <label className="flex flex-col items-center justify-center gap-2 p-4 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 rounded-xl cursor-pointer transition-all text-center group">
                  <Image className="w-5 h-5 text-brand group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-zinc-200">Upload Media</span>
                  <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                </label>

                <button
                  onClick={() => setShowPollCreator(true)}
                  className="flex flex-col items-center justify-center gap-2 p-4 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 rounded-xl transition-all text-center group"
                >
                  <BarChart3 className="w-5 h-5 text-brand group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-zinc-200">Forge Poll</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreatePollSubmit} className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
                  <span className="font-bold font-mono tracking-wider text-zinc-200 uppercase">New Poll Matrix</span>
                  <X className="w-4 h-4 cursor-pointer text-zinc-500 hover:text-zinc-300" onClick={() => setShowPollCreator(false)} />
                </div>
                
                <div>
                  <label className="text-[10px] font-mono uppercase text-zinc-500 block mb-1">Question</label>
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Ask your campsite..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase text-zinc-500 block">Options</label>
                  {pollOptions.map((option, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOpts = [...pollOptions];
                        newOpts[idx] = e.target.value;
                        setPollOptions(newOpts);
                      }}
                      placeholder={`Option ${idx + 1}`}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      required={idx < 2}
                    />
                  ))}
                  {pollOptions.length < 5 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions([...pollOptions, ""])}
                      className="text-brand flex items-center gap-1 font-mono text-[10px] font-bold hover:underline mt-1"
                    >
                      <Plus className="w-3 h-3" /> Add Choice
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-brand text-white font-mono font-bold rounded-xl hover:opacity-90 transition mt-2 shadow-[0_0_15px_rgba(var(--brand-primary),0.2)]"
                  style={{ backgroundColor: "var(--brand-primary)" }}
                >
                  Deploy Poll
                </button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
