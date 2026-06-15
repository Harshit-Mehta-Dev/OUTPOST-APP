import React, { useState, useRef } from "react";
import { Send, Image as ImageIcon, X, LifeBuoy, User, Mail, MessageSquare } from "lucide-react";

export default function HelpDeskSupportView({ userEmail, userName, isDarkMode }) {
  const [inputText, setInputText] = useState("");
  const [stagedFile, setStagedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Clean, modern initial state without the cyber text
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      type: "support", 
      sender: "Outpost Support", 
      body: "Hello! Welcome to Outpost Support. How can we help you today?", 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Color Palette Definitions
  const colors = {
    blackBean: "#3D1202",
    mahogany: "#BA3D03",
    cadmiumOrange: "#E58423",
    golf: "#E8C581"
  };

  // Dynamic Theme Colors
  const theme = {
    bg: isDarkMode ? colors.blackBean : colors.golf,
    text: isDarkMode ? colors.golf : colors.blackBean,
    headerBg: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)',
    bubbleUser: isDarkMode ? colors.mahogany : colors.cadmiumOrange,
    bubbleUserText: "#ffffff",
    bubbleSupport: isDarkMode ? 'rgba(255,255,255,0.1)' : '#ffffff',
    bubbleSupportText: isDarkMode ? colors.golf : colors.blackBean,
    inputBg: isDarkMode ? 'rgba(0,0,0,0.3)' : '#ffffff',
    border: isDarkMode ? 'rgba(232, 197, 129, 0.2)' : 'rgba(61, 18, 2, 0.15)'
  };

  const handleFileAttach = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setStagedFile(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !stagedFile) return;

    const payloadText = inputText || "Sent an image attachment.";

    const newMessage = {
      id: Date.now(),
      type: "user",
      sender: userName || "User",
      body: payloadText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      image: stagedFile
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText("");
    const stagedImagePayload = stagedFile;
    setStagedFile(null);

    // Call backend router securely
    try {
      const response = await fetch("https://outpost-app.onrender.com/api/helpdesk/transmit-signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawBytesPayload: payloadText,
          hasMedia: !!stagedImagePayload,
          mediaData: stagedImagePayload,
          userEmail: userEmail,
          userName: userName
        })
      });

      if (!response.ok) {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          type: "support",
          sender: "System",
          body: "Failed to send message. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (err) {
      console.error("Network error during transmission:", err);
    }
  };

  return (
    <div 
      className="w-full h-full min-h-[calc(100vh-4rem)] flex flex-col justify-between font-sans transition-colors duration-300 rounded-2xl overflow-hidden"
      style={{ backgroundColor: theme.bg, color: theme.text, border: `1px solid ${theme.border}` }}
    >
      
      {/* HEADER SECTION - Clean and curved */}
      <div 
        className="w-full px-6 py-4 flex flex-col sm:flex-row items-center justify-between shadow-sm backdrop-blur-md"
        style={{ backgroundColor: theme.headerBg, borderBottom: `1px solid ${theme.border}` }}
      >
        <div className="flex items-center gap-4">
          <div 
            className="p-3 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ backgroundColor: colors.mahogany, color: '#fff' }}
          >
            <LifeBuoy size={24} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Help Center</h2>
            <p className="text-sm opacity-80 font-medium">We usually respond within a few minutes.</p>
          </div>
        </div>
        
        {/* User Card */}
        <div 
          className="mt-4 sm:mt-0 flex items-center gap-4 px-4 py-2 rounded-2xl"
          style={{ backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)', border: `1px solid ${theme.border}` }}
        >
          <div className="flex flex-col text-right">
            <span className="text-sm font-bold">{userName || "Guest"}</span>
            <span className="text-xs opacity-70">{userEmail || "Not logged in"}</span>
          </div>
          <div className="p-2 rounded-full" style={{ backgroundColor: colors.cadmiumOrange, color: '#fff' }}>
            <User size={18} />
          </div>
        </div>
      </div>

      {/* CHAT FEED SECTION */}
      <div className="flex-1 w-full p-4 sm:p-6 overflow-y-auto space-y-6 flex flex-col">
        {messages.map((msg) => {
          const isUser = msg.type === "user";
          return (
            <div key={msg.id} className={`flex flex-col w-full max-w-[80%] ${isUser ? "ml-auto items-end" : "mr-auto items-start"}`}>
              <span className="text-xs font-semibold opacity-60 mb-1 ml-1">{msg.sender} • {msg.timestamp}</span>
              
              <div 
                className={`px-5 py-3.5 rounded-3xl shadow-sm text-[15px] leading-relaxed ${isUser ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                style={{ 
                  backgroundColor: isUser ? theme.bubbleUser : theme.bubbleSupport,
                  color: isUser ? theme.bubbleUserText : theme.bubbleSupportText,
                  border: isUser ? 'none' : `1px solid ${theme.border}`
                }}
              >
                {msg.body}
              </div>

              {msg.image && (
                <div className="mt-2 rounded-2xl overflow-hidden border-2 shadow-md w-48" style={{ borderColor: theme.bubbleUser }}>
                  <img src={msg.image} alt="Attachment" className="w-full object-cover" />
                </div>
              )}
            </div>
          );
        })}

        {/* Staged Image Preview */}
        {stagedFile && (
          <div className="ml-auto mt-2 w-48 relative rounded-2xl overflow-hidden border-4 shadow-xl" style={{ borderColor: colors.cadmiumOrange }}>
            <img src={stagedFile} alt="Staged Attachment" className="w-full object-cover" />
            <button 
              onClick={() => setStagedFile(null)}
              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-colors backdrop-blur-sm"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* INPUT FOOTER SECTION */}
      <div 
        className="w-full p-4 sm:p-6"
        style={{ backgroundColor: theme.headerBg, borderTop: `1px solid ${theme.border}` }}
      >
        <form 
          onSubmit={handleSendMessage} 
          className="flex items-center gap-3 p-2 rounded-[2rem] shadow-sm transition-all duration-200"
          style={{ backgroundColor: theme.inputBg, border: `1px solid ${theme.border}` }}
        >
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileAttach} className="hidden" />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 rounded-full transition-colors hover:opacity-80"
            style={{ color: isDarkMode ? colors.golf : colors.mahogany }}
            title="Attach Image"
          >
            <ImageIcon size={22} strokeWidth={2} />
          </button>
          
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message here..."
            className="flex-1 bg-transparent border-none outline-none text-[15px] px-2"
            style={{ color: theme.text }}
          />

          <button
            type="submit"
            className="px-6 py-3 rounded-full font-bold text-sm tracking-wide transition-transform active:scale-95 flex items-center gap-2 shadow-md"
            style={{ backgroundColor: colors.mahogany, color: '#fff' }}
          >
            Send <Send size={16} />
          </button>
        </form>
      </div>

    </div>
  );
}
