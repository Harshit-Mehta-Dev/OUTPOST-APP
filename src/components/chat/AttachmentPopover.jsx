import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, BarChart3, X, Plus, Mic, Square, MoreHorizontal } from "lucide-react";
import "./AttachmentPopover.css";

export default function AttachmentPopover({ isOpen, onClose, onSendMedia, onSendPoll }) {
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            onSendMedia(reader.result, 'audio');
            onClose();
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };
      setAudioChunks(chunks);
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.type.startsWith("video/") ? "video" : "image";

    if (fileType === "image") {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          onSendMedia(dataUrl, fileType);
          onClose();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      if (file.size > 10 * 1024 * 1024) {
        alert("Video is too large! Please upload videos under 10MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          onSendMedia(reader.result, fileType);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
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

                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className="attachment-popover-btn"
                  style={isRecording ? { color: '#ff3b30', borderColor: '#ff3b30', background: 'rgba(255, 59, 48, 0.1)' } : {}}
                >
                  {isRecording ? <Square size={20} fill="#ff3b30" /> : <Mic size={20} />}
                  <span>{isRecording ? "Stop Recording" : "Record Voice"}</span>
                </button>

                <button
                  className="attachment-popover-btn"
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                >
                  <MoreHorizontal size={20} />
                  <span>Coming Soon</span>
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
