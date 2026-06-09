import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, BarChart3, X, Plus } from "lucide-react";
import "./AttachmentPopover.css";

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
    <div className="attachment-popover-container">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="attachment-popover-menu"
          >
            {!showPollCreator ? (
              <div className="attachment-popover-grid">
                <label className="attachment-popover-btn">
                  <Image size={20} />
                  <span>Upload Media</span>
                  <input type="file" accept="image/*,video/*" className="hidden" style={{ display: 'none' }} onChange={handleFileChange} />
                </label>

                <button
                  onClick={() => setShowPollCreator(true)}
                  className="attachment-popover-btn"
                >
                  <BarChart3 size={20} />
                  <span>Forge Poll</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreatePollSubmit}>
                <div className="poll-form-header">
                  <span className="poll-form-title">New Poll Matrix</span>
                  <X size={16} className="poll-form-close" onClick={() => setShowPollCreator(false)} />
                </div>
                
                <div>
                  <label className="poll-form-label">Question</label>
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Ask your campsite..."
                    className="poll-form-input"
                    required
                  />
                </div>

                <div>
                  <label className="poll-form-label">Options</label>
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
                      className="poll-form-input"
                      style={{ marginBottom: '8px' }}
                      required={idx < 2}
                    />
                  ))}
                  {pollOptions.length < 5 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions([...pollOptions, ""])}
                      className="poll-form-add-btn"
                    >
                      <Plus size={12} /> Add Choice
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="poll-form-submit"
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
