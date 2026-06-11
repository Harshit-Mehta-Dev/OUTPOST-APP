import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, 
  Hash, 
  Volume2, 
  MessageSquare, 
  Settings, 
  Users, 
  Send, 
  Plus, 
  Mic, 
  Headphones, 
  LogOut,
  Sun,
  Moon,
  Bot,
  Target,
  Menu,
  Trash2,
  X,
  Copy,
  Palette,
  Brain
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import logoUrl from '../assets/logo.png';
import './Basecamp.css';
import CreateCampsiteModal from '../components/CreateCampsiteModal';
import CreateChannelModal from '../components/CreateChannelModal';
import CampOperationsModal from '../components/CampOperationsModal';
import UserProfileModal from '../components/UserProfileModal';
import ScoutControlDeck from '../components/ScoutControlDeck';
import Discover from '../components/Discover';
import ThemeController from '../components/ThemeController';
import AnimatedMesh from '../components/AnimatedMesh';
import MemberDrawer from '../components/MemberDrawer';
import AttachmentPopover from '../components/chat/AttachmentPopover';
import AIOperations from '../components/settings/AIOperations';

const socket = io('https://outpost-app.onrender.com');

const Basecamp = ({ isDarkMode, toggleTheme }) => {
  const navigate = useNavigate();
  const [activeChannel, setActiveChannel] = useState('community-chat');
  const [showWelcome, setShowWelcome] = useState(true);
  const [showDiscover, setShowDiscover] = useState(false);
  const [joinNotification, setJoinNotification] = useState(null);
  const [adminNotification, setAdminNotification] = useState(null);
  const [inputText, setInputText] = useState('');
  const [activeTypers, setActiveTypers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isFetchingMessages, setIsFetchingMessages] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [activeMembersList, setActiveMembersList] = useState([]);
  const typingTimeoutRef = useRef(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCampOpsModalOpen, setIsCampOpsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState(null);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const messagesEndRef = useRef(null);

  const handleCopyMessage = (msg) => {
    let textToCopy = "";
    if (msg.type === "media") textToCopy = msg.body;
    else if (msg.type === "poll") textToCopy = msg.pollData?.question || "";
    else textToCopy = msg.text;
    
    navigator.clipboard.writeText(textToCopy).catch(err => console.error("Failed to copy", err));
  };

  // User identity
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('outpost_user');
    return saved ? JSON.parse(saved) : { username: 'YourUser' };
  });

  // Keep currentUser fresh from localStorage/backend syncs
  useEffect(() => {
    const interval = setInterval(() => {
      const saved = localStorage.getItem('outpost_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.profilePictureUrl !== currentUser.profilePictureUrl || parsed.username !== currentUser.username) {
          setCurrentUser(parsed);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Wait for component init
  const [campsites, setCampsites] = useState(() => {
    const saved = localStorage.getItem('outpost_campsites');
    if (saved && saved !== '[]') {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse saved campsites', e);
      }
    }
    return [{ 
      id: 1, 
      name: 'Outpost HQ', 
      active: true,
      expeditions: [
        { id: 'community-chat', name: 'community-chat', type: 'text' },
        { id: 'announcements', name: 'announcements', type: 'text' },
        { id: 'ideas', name: 'ideas', type: 'text' },
        { id: 'dev-talk', name: 'dev-talk', type: 'text' },
        { id: 'Lobby', name: 'Lobby', type: 'voice' },
        { id: 'Gaming', name: 'Gaming', type: 'voice' },
      ]
    }];
  });

  useEffect(() => {
    try {
      localStorage.setItem('outpost_campsites', JSON.stringify(campsites));
    } catch (e) {
      console.error('Failed to save campsites to localStorage, likely due to quota size limit.', e);
    }
  }, [campsites]);

  const [messagesByChannel, setMessagesByChannel] = useState({});
  const [discoverRefreshTrigger, setDiscoverRefreshTrigger] = useState(0);

  const activeCampsite = campsites && campsites.length > 0 ? (campsites.find(c => c.active) || campsites[0]) : null;
  const expeditions = activeCampsite?.expeditions || [];
  const currentChannelKey = activeCampsite ? `${activeCampsite.id}_${activeChannel}` : 'fallback';
  const messages = messagesByChannel[currentChannelKey] || [];

  // Fetch messages from MongoDB when joining a new channel
  useEffect(() => {
    setIsFetchingMessages(true);
    fetch(`https://outpost-app.onrender.com/api/messages/${currentChannelKey}`)
      .then(res => res.json())
      .then(data => {
        setMessagesByChannel(prev => ({
          ...prev,
          [currentChannelKey]: data
        }));
        // Artificially delay hiding the skeleton for 800ms to improve perceived UX
        setTimeout(() => setIsFetchingMessages(false), 800);
      })
      .catch(err => {
        console.error("Failed to fetch messages:", err);
        setIsFetchingMessages(false);
      });

    // Join the socket room
    socket.emit('join_channel', currentChannelKey);
    setActiveTypers([]); // Reset typers when changing channels
  }, [currentChannelKey]);

  useEffect(() => {
    if (activeCampsite) {
      socket.emit('join_campsite_room', activeCampsite.id);
      setActiveMembersList(activeCampsite.members || []);
    }
  }, [activeCampsite]);

  useEffect(() => {
    if (currentUser?.email) {
      socket.emit('join_admin_room', currentUser.email);
    }
  }, [currentUser?.email]);

  // Reconnect logic to never lose channel assignment
  useEffect(() => {
    const onConnect = () => {
      console.log("Socket reconnected! Re-joining rooms...");
      socket.emit('join_channel', currentChannelKey);
      if (activeCampsite) socket.emit('join_campsite_room', activeCampsite.id);
      if (currentUser?.email) socket.emit('join_admin_room', currentUser.email);
    };
    
    socket.on('connect', onConnect);
    return () => socket.off('connect', onConnect);
  }, [currentChannelKey, activeCampsite, currentUser]);

  // Frontend Ping to keep Render Server Awake while app is open
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('https://outpost-app.onrender.com/api/health').catch(err => {});
    }, 10 * 60 * 1000); // 10 minutes
    
    return () => clearInterval(interval);
  }, []);

  // Listen for real-time messages and member events
  useEffect(() => {
    const handleReceiveMessage = (newMessage) => {
      setMessagesByChannel(prev => {
        const currentMessages = prev[newMessage.channelKey] || [];
        // Prevent duplicate messages if already in state
        if (currentMessages.find(m => m._id === newMessage.id || m.id === newMessage.id)) {
          return prev;
        }
        return {
          ...prev,
          [newMessage.channelKey]: [...currentMessages, newMessage]
        };
      });
    };

    socket.on('receive_message', handleReceiveMessage);
    
    const handleTypingStart = ({ scoutName }) => {
      setActiveTypers((prev) => {
        if (prev.includes(scoutName)) return prev;
        return [...prev, scoutName];
      });
    };

    const handleTypingStop = ({ scoutName }) => {
      setActiveTypers((prev) => prev.filter((name) => name !== scoutName));
    };

    socket.on("broadcast-typing-start", handleTypingStart);
    socket.on("broadcast-typing-stop", handleTypingStop);

    const handleScoutJoinedList = ({ scoutName, scoutAvatar }) => {
      setActiveMembersList((prev) => {
        if (prev.some(m => (m.username === scoutName) || (m === scoutName))) return prev;
        return [...prev, { username: scoutName, profilePictureUrl: scoutAvatar }];
      });
    };
    
    const handleAdminNotification = ({ message, scoutName }) => {
      setAdminNotification(message);
      setTimeout(() => setAdminNotification(null), 5000);
    };

    const handleUpdatedVote = ({ messageId, optionIndex, scoutId, channelKey }) => {
      setMessagesByChannel(prev => {
        const currentMessages = prev[channelKey] || [];
        const updated = currentMessages.map(msg => {
          if ((msg._id || msg.id) === messageId && msg.type === 'poll') {
            const newPollData = { 
              ...msg.pollData,
              votesArray: [...(msg.pollData.votesArray || [])],
              votesMap: { ...msg.pollData.votesMap }
            };
            if (!newPollData.votesArray.includes(scoutId)) {
              newPollData.votesArray.push(scoutId);
              newPollData.votesMap[optionIndex] = [...(newPollData.votesMap[optionIndex] || []), scoutId];
            }
            return { ...msg, pollData: newPollData };
          }
          return msg;
        });
        return { ...prev, [channelKey]: updated };
      });
    };

    const handleMessageDeleted = ({ messageId, channelKey }) => {
      setMessagesByChannel(prev => {
        const currentMessages = prev[channelKey] || [];
        return {
          ...prev,
          [channelKey]: currentMessages.filter(m => (m._id || m.id) !== messageId)
        };
      });
    };

    socket.on("scout-joined-list", handleScoutJoinedList);
    socket.on("campsite-admin-notification", handleAdminNotification);
    socket.on("broadcast-updated-vote", handleUpdatedVote);
    socket.on("message_deleted", handleMessageDeleted);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off("broadcast-typing-start", handleTypingStart);
      socket.off("broadcast-typing-stop", handleTypingStop);
      socket.off("scout-joined-list", handleScoutJoinedList);
      socket.off("campsite-admin-notification", handleAdminNotification);
      socket.off("broadcast-updated-vote", handleUpdatedVote);
      socket.off("message_deleted", handleMessageDeleted);
    };
  }, []);

  useEffect(() => {
    if (!currentUser || !currentUser.username || !currentUser.email) return;

    fetch(`https://outpost-app.onrender.com/api/campsites/user/${currentUser.username}/${currentUser.email}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const formattedCamps = data.map(camp => ({
            ...camp,
            id: camp._id || camp.id,
            active: (camp._id || camp.id) === (activeCampsite ? activeCampsite.id : 1)
          }));
          setCampsites(prev => {
            const hq = prev.find(c => c.id === 1);
            
            // Only show campsites the user is a member of in the sidebar
            const merged = [...formattedCamps];
            
            return hq ? [hq, ...merged] : merged;
          });
        }
      })
      .catch(err => console.error("Error loading user campsites from API:", err));
  }, [currentUser?.username, currentUser?.email, activeCampsite?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputText.trim()) {
      const isRangerEnabled = localStorage.getItem("outpost_ai_ranger") === "true";

      if (isRangerEnabled) {
        try {
          const aiResponse = await fetch("/api/ai/evaluate-comms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ textContent: inputText.trim() })
          });
          
          const analysis = await aiResponse.json();
          
          if (!analysis.safe) {
            alert("⚠️ Transmission Blocked: Toxicity detected by Basecamp Ranger.");
            return; 
          }
        } catch (error) {
          // Fail-safe protection: fallback silently
        }
      }

      const messageData = {
        channelKey: currentChannelKey,
        user: {
          username: currentUser?.username || 'Scout',
          profilePictureUrl: currentUser?.profilePictureUrl || '',
          level: currentUser?.level || 1
        },
        time: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text',
        text: inputText.trim()
      };
      
      // Emit to server
      socket.emit('send_message', messageData);
      
      // Stop typing
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setIsTyping(false);
      socket.emit("scout-typing-stop", { 
        channelId: currentChannelKey, 
        scoutName: currentUser?.username || 'Scout' 
      });

      setInputText('');
    }
  };

  const handleSendMediaMessage = (base64Data, fileType) => {
    const messageData = {
      channelKey: currentChannelKey,
      user: {
        username: currentUser?.username || 'Scout',
        profilePictureUrl: currentUser?.profilePictureUrl || '',
        level: currentUser?.level || 1
      },
      time: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: "media",
      mediaType: fileType,
      body: base64Data
    };
    socket.emit('send_message', messageData);
  };

  const handleSendPollMessage = (question, options) => {
    const messageData = {
      channelKey: currentChannelKey,
      user: {
        username: currentUser?.username || 'Scout',
        profilePictureUrl: currentUser?.profilePictureUrl || '',
        level: currentUser?.level || 1
      },
      time: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: "poll",
      pollData: {
        question,
        options,
        votesArray: [],
        votesMap: options.reduce((acc, _, i) => ({ ...acc, [i]: [] }), {})
      }
    };
    socket.emit('send_message', messageData);
  };

  const handleVoteSubmission = (messageId, optionIndex) => {
    socket.emit("submit-scout-vote", { 
      messageId, 
      channelKey: currentChannelKey, 
      optionIndex, 
      scoutId: currentUser?.username || 'Scout' 
    });
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("scout-typing-start", { 
        channelId: currentChannelKey, 
        scoutName: currentUser?.username || 'Scout' 
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("scout-typing-stop", { 
        channelId: currentChannelKey, 
        scoutName: currentUser?.username || 'Scout' 
      });
    }, 1500);
  };

  const handleCampsiteClick = (id) => {
    setShowDiscover(false);
    setCampsites(prev => prev.map(c => ({
      ...c,
      active: c.id === id
    })));
    
    const clickedCamp = campsites.find(c => c.id === id);
    if (clickedCamp && clickedCamp.expeditions) {
      const firstTextChannel = clickedCamp.expeditions.find(e => e.type === 'text');
      if (firstTextChannel) {
        setActiveChannel(firstTextChannel.id);
      }
    }
  };

  const handleCampsiteCreated = (data) => {
    const newCampId = Date.now().toString(); // Use a more unique ID for global simulation
    let newExpeditions = [];

    if (data.template === 'gaming') {
      newExpeditions = [
        { id: 'lobby', name: 'lobby', type: 'text' },
        { id: 'patch-notes', name: 'patch-notes', type: 'text' },
        { id: 'The Frontlines', name: 'The Frontlines', type: 'voice' },
      ];
    } else if (data.template === 'dev') {
      newExpeditions = [
        { id: 'general-dev', name: 'general-dev', type: 'text' },
        { id: 'code-review', name: 'code-review', type: 'text' },
        { id: 'Pair-Programming', name: 'Pair-Programming', type: 'voice' },
      ];
    } else {
      newExpeditions = [
        { id: 'chit-chat', name: 'chit-chat', type: 'text' },
        { id: 'memes', name: 'memes', type: 'text' },
        { id: 'Around the Fire', name: 'Around the Fire', type: 'voice' },
      ];
    }

    // Save to global campsites API
    let category = "Casual";
    let icon = "🏕️";
    if (data.template === 'gaming') { category = "Gaming"; icon = "🎮"; }
    if (data.template === 'dev') { category = "Tech & Dev"; icon = "💻"; }

    const newCampData = {
      id: newCampId,
      name: data.name,
      description: `A brand new ${category} Outpost created by ${currentUser?.username || 'a Scout'}.`,
      category: category,
      icon: icon,
      totalScouts: 1,
      activeScouts: 1,
      color: data.template === 'gaming' ? '#ff3b30' : data.template === 'dev' ? '#4facfe' : '#ffcc00',
      adminEmail: currentUser?.email,
      isPublic: data.isPublic,
      template: data.template,
      imageUrl: data.imageUrl,
      members: [currentUser?.username || 'Scout'], // Creator is automatically a member
      expeditions: newExpeditions
    };

    fetch('https://outpost-app.onrender.com/api/campsites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newCampData)
    })
    .then(res => res.json())
    .then(savedData => {
      console.log("Campsite successfully built:", savedData);
      
      // Instantly add to local sidebar and make it active
      setCampsites(prev => {
        const disabledPrev = prev.map(c => ({...c, active: false}));
        return [...disabledPrev, { ...savedData, active: true }];
      });
      
      // Auto-switch to its first text channel
      const firstTextChannel = savedData.expeditions?.find(e => e.type === 'text');
      if (firstTextChannel) setActiveChannel(firstTextChannel.id);
      
      if (data.isPublic) {
        setDiscoverRefreshTrigger(prev => prev + 1); // Trigger Discover refetch
        setJoinNotification(`🏕️ You've successfully built the Public Basecamp ${data.name}!`);
      } else {
        setJoinNotification(`🔒 Hidden Outpost ${data.name} Established! Use Camp Operations to invite scouts.`);
      }
      setTimeout(() => {
        setJoinNotification(null);
      }, 4000);
    })
    .catch(err => {
      console.error("Error creating campsite in API:", err);
      // Fallback: still add it locally if backend fails
      setCampsites(prev => {
        const disabledPrev = prev.map(c => ({...c, active: false}));
        return [...disabledPrev, { ...newCampData, active: true }];
      });
      const firstTextChannel = newCampData.expeditions?.find(e => e.type === 'text');
      if (firstTextChannel) setActiveChannel(firstTextChannel.id);
      
      setJoinNotification(`⚠️ Established locally, but failed to sync to server.`);
      setTimeout(() => setJoinNotification(null), 4000);
    });
    
    setIsCreateModalOpen(false);
  };

  const handleDeleteCampsite = (campId) => {
    fetch(`https://outpost-app.onrender.com/api/campsites/${campId}`, {
      method: 'DELETE'
    })
    .then(res => res.json())
    .then(() => {
      setCampsites(prev => {
        const filtered = prev.filter(c => c.id !== campId);
        if (filtered.length > 0) {
          filtered[0].active = true;
          const firstText = filtered[0].expeditions?.find(e => e.type === 'text');
          if (firstText) setActiveChannel(firstText.id);
        }
        return filtered;
      });
    })
    .catch(err => console.error("Error deleting campsite:", err));
  };

  const handleCreateChannel = (channelData) => {
    setCampsites(prev => prev.map(c => {
      if (c.active) {
        return {
          ...c,
          expeditions: [
            ...(c.expeditions || []),
            { id: channelData.name, name: channelData.name, type: channelData.type }
          ]
        };
      }
      return c;
    }));
    setActiveChannel(channelData.name);
  };

  const handleDeleteChannel = (channelId) => {
    setCampsites(prev => prev.map(c => {
      if (c.active) {
        return {
          ...c,
          expeditions: c.expeditions.filter(e => e.id !== channelId)
        };
      }
      return c;
    }));
    if (activeChannel === channelId) {
      const remaining = activeCampsite?.expeditions?.filter(e => e.id !== channelId);
      if (remaining && remaining.length > 0) {
        setActiveChannel(remaining[0].id);
      } else {
        setActiveChannel('');
      }
    }
    setChannelToDelete(null);
  };

  const handleLeaveCampsite = (campId) => {
    fetch(`https://outpost-app.onrender.com/api/campsites/${campId}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: currentUser?.username || 'Scout' })
    })
    .then(res => res.json())
    .then(() => {
      setCampsites(prev => {
        const filtered = prev.filter(c => c.id !== campId);
        if (filtered.length > 0) {
          filtered[0].active = true;
          const firstText = filtered[0].expeditions?.find(e => e.type === 'text');
          if (firstText) setActiveChannel(firstText.id);
        }
        return filtered;
      });
      setIsCampOpsModalOpen(false);
    })
    .catch(err => console.error("Error leaving campsite:", err));
  };

  const handleUpdateCampsite = (campId, updates) => {
    setCampsites(prev => prev.map(c => {
      if (c.id === campId) {
        return { ...c, ...updates };
      }
      return c;
    }));
  };

  // Determine if the current user is an admin for the active campsite
  const normalizedUserEmail = currentUser?.email?.toLowerCase()?.trim();
  const isGlobalAdmin = normalizedUserEmail === 'harshitmehta1012@gmail.com';
  const isCampAdmin = activeCampsite?.id === 1 
    ? isGlobalAdmin 
    : (activeCampsite?.adminEmail?.toLowerCase()?.trim() === normalizedUserEmail || isGlobalAdmin);

  const handleLogout = () => {
    localStorage.removeItem('outpost_user'); 
    localStorage.removeItem('outpost_campsites');
    localStorage.removeItem('outpost_messages');
    navigate('/'); 
  };

  return (
    <div className="outpost-app-wrapper">
      <AnimatedMesh />
      <div 
        className="basecamp-layout" 
        style={{ gridTemplateColumns: showDiscover ? '72px 1fr' : (isSidebarOpen ? '72px 280px 1fr' : '72px 1fr') }}
      >
      <AnimatePresence>
        {messageToDelete && (
          <motion.div 
            className="welcome-modal-overlay"
            style={{ zIndex: 9999, padding: '20px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="welcome-modal-content"
              style={{ maxWidth: '400px', textAlign: 'center' }}
              initial={{ scale: 0.8, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: -20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <h3 style={{ color: 'var(--brand-primary)', marginBottom: '16px' }}>Delete Content?</h3>
              <p style={{ marginBottom: '24px', opacity: 0.8 }}>Choose how you want to delete this content.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button 
                  className="btn-primary" 
                  style={{ background: 'transparent', border: '1px solid var(--text-secondary)' }}
                  onClick={() => {
                    setMessagesByChannel(prev => {
                      const currentMessages = prev[messageToDelete.channelKey] || [];
                      return {
                        ...prev,
                        [messageToDelete.channelKey]: currentMessages.filter(m => (m._id || m.id) !== messageToDelete.id)
                      };
                    });
                    setMessageToDelete(null);
                  }}
                >
                  Delete for me
                </button>
                {messageToDelete?.isOwnMessage && (
                  <button 
                    className="btn-primary" 
                    style={{ background: 'rgba(255, 59, 48, 0.2)', color: '#ff3b30', borderColor: '#ff3b30' }}
                    onClick={() => {
                      socket.emit("delete_message_for_all", { messageId: messageToDelete.id, channelKey: messageToDelete.channelKey });
                      setMessageToDelete(null);
                    }}
                  >
                    Delete for everyone
                  </button>
                )}
                <button 
                  style={{ background: 'transparent', color: 'var(--text-secondary)', border: 'none', marginTop: '8px', cursor: 'pointer' }}
                  onClick={() => setMessageToDelete(null)}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            className="welcome-modal-overlay"
            style={{ zIndex: 9999, padding: '20px' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >
            <motion.img 
              src={selectedImage}
              alt="Enlarged"
              style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', cursor: 'zoom-out', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showWelcome && (
          <motion.div 
            className="welcome-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="welcome-modal-content"
              initial={{ scale: 0.8, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: -20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <h2>WELCOME SCOUT TO OUTPOST BOOT CAMP</h2>
              <p>Grab a seat by the campfire, pack your gear, and get ready for an amazing journey. Your squad is waiting for you!</p>
              <button className="btn-primary" onClick={() => setShowWelcome(false)}>
                Join the Expedition
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 1. Campsite Sidebar (Servers) */}
      <nav className="campsite-sidebar glass-panel-dark">
        <div className={`campsite-item home-button ${showDiscover ? 'active' : ''}`} onClick={() => setShowDiscover(true)}>
          <Compass size={24} />
        </div>
        <div className="campsite-separator"></div>
        
        {campsites.map(camp => (
          <div 
            key={camp.id} 
            className={`campsite-item ${camp.active ? 'active' : ''}`}
            onClick={() => handleCampsiteClick(camp.id)}
          >
            {camp.id === 1 ? (
              <img src={logoUrl} alt="HQ" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
            ) : camp.imageUrl ? (
              <img src={camp.imageUrl} alt={camp.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              camp.name.charAt(0)
            )}
          </div>
        ))}

        <div className="campsite-item add-button" onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={24} />
        </div>
      </nav>

        {showDiscover ? (
          <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', zIndex: 1 }}>
            <Discover 
              refreshTrigger={discoverRefreshTrigger} 
              onJoinCampsite={(camp) => {
              fetch(`https://outpost-app.onrender.com/api/campsites/${camp.id}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser?.username || 'Scout' })
              })
              .then(res => res.json())
              .then(joinedCamp => {
                setCampsites(prev => {
                  const exists = prev.find(c => c.id === camp.id);
                  if (exists) {
                    return prev.map(c => ({ ...c, active: c.id === camp.id }));
                  }
                  return [...prev.map(c => ({...c, active: false})), { ...joinedCamp, active: true }];
                });
                setActiveChannel('lobby');
                setShowDiscover(false);
                
                // Notify backend socket to broadcast
                socket.emit("register-new-scout-join", {
                  campsiteId: camp.id,
                  adminEmail: camp.adminEmail,
                  scoutName: currentUser?.username || 'Scout',
                  scoutAvatar: currentUser?.profilePictureUrl || ''
                });

                // Show sweet notification
                setJoinNotification(`🏕️ You've successfully joined ${camp.name}! Welcome to the squad.`);
                setTimeout(() => {
                  setJoinNotification(null);
                }, 4000);
              })
              .catch(err => console.error("Error joining campsite via API:", err));
            }} />
          </div>
        ) : (
          <>
        {/* 2. Expedition Sidebar (Channels) */}
        {isSidebarOpen && (
          <aside className="expedition-sidebar glass-panel">
            <div className="expedition-header">
              <div className="expedition-header-logo">
                <img src={logoUrl} alt="Logo" />
                <span>OUTPOST</span>
              </div>
            </div>
            
            <div className="expedition-list">
              <div className="expedition-category" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>CAMPSITES</span>
                <button className="icon-btn" onClick={() => setIsCreateChannelModalOpen(true)} style={{ padding: '2px', background: 'transparent' }}>
                  <Plus size={14} />
                </button>
              </div>
              {expeditions.filter(e => e.type === 'text').map(exp => (
                <div 
                  key={exp.id} 
                  className={`expedition-item ${activeChannel === exp.id ? 'active' : ''}`}
                  onClick={() => setActiveChannel(exp.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Hash size={18} className="exp-icon" />
                    <span>{exp.name}</span>
                  </div>
                  {isCampAdmin && (
                    <button 
                      className="delete-channel-btn" 
                      onClick={(e) => { e.stopPropagation(); setChannelToDelete(exp); }}
                      title="Delete Channel"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}

          <div className="expedition-category mt-4">VOICE EXPEDITIONS</div>
          {expeditions.filter(e => e.type === 'voice').map(exp => (
            <div key={exp.id} className="expedition-item voice" onClick={() => setActiveChannel(exp.id)}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Volume2 size={18} className="exp-icon" />
                <span>{exp.name}</span>
              </div>
              {isCampAdmin && (
                <button 
                  className="delete-channel-btn" 
                  onClick={(e) => { e.stopPropagation(); setChannelToDelete(exp); }}
                  title="Delete Channel"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* User Controls */}
        <div className="user-profile">
          <div className="user-info" onClick={() => setIsProfileModalOpen(true)} style={{ cursor: 'pointer' }}>
            <div className="user-avatar" style={{ overflow: 'hidden', position: 'relative' }}>
              {currentUser?.profilePictureUrl ? (
                <img src={currentUser.profilePictureUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : null}
              <span className="status-dot online"></span>
            </div>
            <div className="user-name">
              <strong>{currentUser?.username || 'YourUser'}</strong>
              <span>Level {currentUser?.level || 1}</span>
            </div>
          </div>
          <ScoutControlDeck 
            isDarkMode={isDarkMode} 
            toggleTheme={toggleTheme} 
            onLogout={handleLogout} 
            currentUser={currentUser}
          />
        </div>
      </aside>
        )}

      {/* 3. Main Chat View */}
      <main className="chat-view glass-panel">
        <header className="outpost-top-bar">
          <div className="top-bar-left">
            <button 
              className="icon-btn menu-toggle-btn" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title="Toggle Sidebar"
            >
              <Menu size={20} style={{ color: 'var(--text-secondary)' }} />
            </button>
            <span className="active-camp-name"># {activeCampsite?.name || 'Loading...'}</span>
          </div>
          <div className="top-bar-center">
            <Target size={16} />
            <span>Outpost Status: Active</span>
          </div>
          <div className="top-bar-right" style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
            {isCampAdmin && (
              <button
                onClick={() => {
                  setIsAIOpen(!isAIOpen);
                  setIsThemeOpen(false);
                }}
                className={`theme-trigger-btn ${isAIOpen ? 'active' : ''}`}
                style={{
                  background: isAIOpen ? 'var(--bg-card)' : 'var(--bg-glass)',
                  color: isAIOpen ? 'var(--brand-primary)' : 'var(--text-secondary)'
                }}
                title="Compute Intelligence Matrices"
              >
                <Brain size={18} />
              </button>
            )}

            <button
              onClick={() => {
                setIsThemeOpen(!isThemeOpen);
                setIsAIOpen(false);
              }}
              className={`theme-trigger-btn ${isThemeOpen ? 'active' : ''}`}
              title="Modulate Theme Matrix"
            >
              <Palette size={18} />
            </button>

            <button className="camp-ops-btn" onClick={() => setIsCampOpsModalOpen(true)}>
              <Settings size={18} />
              Camp Operations
            </button>

            <AnimatePresence>
              {isCampAdmin && isAIOpen && <AIOperations onClose={() => setIsAIOpen(false)} />}
            </AnimatePresence>

            <AnimatePresence>
              {isThemeOpen && <ThemeController onClose={() => setIsThemeOpen(false)} />}
            </AnimatePresence>
          </div>
        </header>

        <header className="chat-header">
          <div className="chat-title">
            <Hash size={24} className="chat-title-icon" />
            <h2>{activeChannel}</h2>
          </div>
          <div className="chat-header-actions" style={{ position: 'relative' }}>
            <button 
              className={`icon-btn ${isDrawerOpen ? 'active' : ''}`}
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              style={{
                background: isDrawerOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: isDrawerOpen ? 'rgb(var(--brand-primary))' : 'var(--text-secondary)'
              }}
            >
              <Users size={20} className="header-icon" />
            </button>
            <MemberDrawer 
              isOpen={isDrawerOpen} 
              onClose={() => setIsDrawerOpen(false)} 
              members={activeMembersList}
              adminEmail={activeCampsite?.adminEmail}
            />
          </div>
        </header>

        <div className="chat-messages">
          <div className="chat-welcome">
            <div className="welcome-icon">
              <Hash size={40} />
            </div>
            <h1>Welcome to #{activeChannel}!</h1>
            <p>This is the start of the #{activeChannel} expedition. Please review the community guidelines before participating.</p>
            
            <div className="community-guidelines" style={{ marginTop: '20px', padding: '20px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: '4px solid var(--primary-color)' }}>
              <h3 style={{ marginBottom: '15px', color: 'var(--primary-color)' }}>🏕️ Outpost Community Guidelines</h3>
              <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li><strong>1. Respect Everyone:</strong> Treat all scouts and commanders with respect. No harassment, hate speech, or toxicity.</li>
                <li><strong>2. Stay on Mission:</strong> Keep conversations relevant to the channel topic.</li>
                <li><strong>3. No Spam:</strong> Avoid repetitive messages, self-promotion, or malicious links.</li>
                <li><strong>4. Support the Squad:</strong> Share knowledge, collaborate, and help others when possible.</li>
                <li><strong>5. Secure Comms:</strong> Do not share sensitive personal information or credentials.</li>
              </ul>
              <p style={{ marginTop: '15px', fontStyle: 'italic', opacity: 0.8 }}>Failure to follow these rules may result in being kicked from the basecamp.</p>
            </div>
          </div>

          {isFetchingMessages ? (
            <div className="chat-messages-skeleton">
              {[...Array(5)].map((_, i) => (
                <div className="message-skeleton" key={`skel-${i}`}>
                  <div className="skeleton-avatar"></div>
                  <div className="skeleton-content">
                    <div className="skeleton-meta">
                      <div className="skeleton-name"></div>
                      <div className="skeleton-time"></div>
                    </div>
                    <div className="skeleton-text" style={{ width: `${Math.random() * 40 + 40}%` }}></div>
                    {i % 2 === 0 && <div className="skeleton-text" style={{ width: `${Math.random() * 30 + 30}%` }}></div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            messages.map((msg, index) => (
                    <div className="message-item" key={msg._id || msg.id || index}>
                      <div className="message-avatar" style={{ overflow: 'hidden', position: 'relative' }}>
                        {msg.user?.profilePictureUrl ? (
                          <img src={msg.user.profilePictureUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          (msg.user?.username || 'S')[0].toUpperCase()
                        )}
                      </div>
                      <div className="message-content">
                        <div className="message-meta" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                          <span className="message-author">{msg.user?.username || msg.user || 'Unknown Scout'}</span>
                          {msg.user?.level && <span style={{ fontSize: '10px', color: '#ff6b2b', marginLeft: '6px' }}>Lv.{msg.user.level}</span>}
                          <span className="message-time" style={{ marginLeft: '10px', flexGrow: 1 }}>{msg.time}</span>
                          <button 
                            onClick={() => handleCopyMessage(msg)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', opacity: 0.5, display: 'flex', alignItems: 'center', padding: '4px', marginRight: '4px' }}
                            title="Copy"
                          >
                            <Copy size={14} />
                          </button>
                          <button 
                            onClick={() => setMessageToDelete({ 
                              id: msg._id || msg.id, 
                              channelKey: currentChannelKey,
                              isOwnMessage: msg.user?.username === currentUser?.username || msg.user === currentUser?.username 
                            })}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', opacity: 0.5, display: 'flex', alignItems: 'center', padding: '4px' }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="message-text">
                          {(!msg.type || msg.type === "text") && msg.text}
                          
                          {msg.type === "media" && msg.mediaType === "image" && (
                            <motion.img
                              whileHover={{ scale: 1.01 }}
                              src={msg.body}
                              alt="Shared asset"
                              className="mt-2 rounded-xl border border-zinc-900 shadow-xl"
                              style={{ maxWidth: '100%', maxHeight: '250px', cursor: 'zoom-in' }}
                              onClick={() => setSelectedImage(msg.body)}
                            />
                          )}

                          {msg.type === "media" && msg.mediaType === "video" && (
                            <video src={msg.body} controls className="mt-2 rounded-xl border border-zinc-900 shadow-xl" style={{ maxWidth: '100%', maxHeight: '300px' }} />
                          )}

                          {msg.type === "media" && msg.mediaType === "audio" && (
                            <audio src={msg.body} controls className="mt-2" style={{ width: '100%', maxWidth: '300px', height: '40px' }} />
                          )}

                          {msg.type === "poll" && (
                            <div className="mt-3 bg-zinc-900/40 border border-zinc-900 p-4 rounded-xl backdrop-blur-sm font-sans" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px', borderRadius: '12px', marginTop: '12px', width: '100%', maxWidth: '350px' }}>
                              <p className="font-bold font-mono tracking-wide text-xs uppercase mb-3" style={{ color: 'var(--brand-primary)', marginBottom: '12px', fontWeight: 'bold' }}>📊 {msg.pollData.question}</p>
                              <div className="space-y-2.5" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {msg.pollData.options.map((option, idx) => {
                                  const totalVotes = msg.pollData.votesArray?.length || 0;
                                  const optionVotes = msg.pollData.votesMap?.[idx]?.length || 0;
                                  const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
                                  
                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => handleVoteSubmission(msg._id || msg.id, idx)}
                                      style={{ position: 'relative', overflow: 'hidden', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', color: '#fff', cursor: 'pointer', outline: 'none' }}
                                    >
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        style={{ position: 'absolute', top: 0, left: 0, bottom: 0, background: 'var(--brand-primary)', opacity: 0.2, pointerEvents: 'none' }}
                                      />
                                      <span style={{ position: 'relative', zIndex: 10, fontSize: '0.85rem' }}>{option}</span>
                                      <span style={{ position: 'relative', zIndex: 10, fontSize: '0.75rem', opacity: 0.7 }}>{percentage}% ({optionVotes})</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <AnimatePresence>
          {activeTypers.length > 0 && (
            <motion.div 
              className="typing-indicator"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', marginBottom: '10px', color: 'var(--brand-primary)', fontStyle: 'italic', fontSize: '0.85rem' }}
            >
              <Bot size={16} />
              <div className="flex gap-1 items-center justify-center" style={{ display: 'flex', gap: '4px', marginRight: '4px' }}>
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
              <span style={{ color: 'var(--text-secondary)' }}>
                {activeTypers.length === 1 ? `${activeTypers[0]} is typing...` :
                 activeTypers.length === 2 ? `${activeTypers[0]} and ${activeTypers[1]} are typing...` :
                 "Several Scouts are typing..."}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="chat-input-wrapper">
          <div className="chat-input-container" style={{ position: 'relative', overflow: 'visible' }}>
            <AttachmentPopover 
              isOpen={isAttachmentOpen}
              onClose={() => setIsAttachmentOpen(false)}
              onSendMedia={handleSendMediaMessage}
              onSendPoll={handleSendPollMessage}
            />
            <button 
              className="chat-attach-btn" 
              onClick={() => setIsAttachmentOpen(!isAttachmentOpen)}
              style={isAttachmentOpen ? { background: 'var(--brand-primary)', color: '#fff', transform: 'rotate(45deg)', transition: 'all 0.2s' } : { transition: 'all 0.2s' }}
            >
              <Plus size={20} />
            </button>
            <input 
              type="text" 
              placeholder={`Message #${activeChannel}`} 
              className="chat-input"
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
            />
            <button className="chat-send-btn" onClick={handleSendMessage}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </main>
      </>
      )}

      {/* Notifications */}
      <AnimatePresence>
        {joinNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(52, 199, 89, 0.9)', // Sweet green
              backdropFilter: 'blur(10px)',
              padding: '16px 24px',
              borderRadius: '12px',
              color: '#fff',
              fontWeight: '600',
              zIndex: 9999,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            {joinNotification}
          </motion.div>
        )}
        {adminNotification && (
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            style={{
              position: 'fixed',
              top: '80px',
              right: '20px',
              background: 'var(--bg-secondary)', // Glassmorphic background
              border: '1px solid #ff9500', // Amber border
              backdropFilter: 'blur(10px)',
              padding: '16px 20px',
              borderRadius: '12px',
              color: 'var(--text-primary)',
              fontWeight: '600',
              zIndex: 9999,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div style={{ padding: '8px', background: 'rgba(255, 149, 0, 0.1)', borderRadius: '8px', color: '#ff9500' }}>
              🛡️
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#ff9500', letterSpacing: '1px' }}>Perimeter Breached</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{adminNotification}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateCampsiteModal 
            isOpen={isCreateModalOpen} 
            onClose={() => setIsCreateModalOpen(false)}
            onCampsiteCreated={handleCampsiteCreated}
          />
        )}
        {channelToDelete && (
          <motion.div 
            className="welcome-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ zIndex: 300 }}
          >
            <motion.div 
              className="welcome-modal-content"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{ maxWidth: '400px', textAlign: 'center' }}
            >
              <Trash2 size={48} color="var(--danger)" style={{ margin: '0 auto 16px' }} />
              <h2>Delete Campside</h2>
              <p>Are you sure you want to delete <strong>#{channelToDelete.name}</strong>? This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px' }}>
                <button className="btn-secondary" onClick={() => setChannelToDelete(null)}>Cancel</button>
                <button className="btn-danger" onClick={() => handleDeleteChannel(channelToDelete.id)} style={{ background: 'var(--danger)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Modals */}
      <AnimatePresence>
        {isCampOpsModalOpen && (
          <CampOperationsModal
            isOpen={isCampOpsModalOpen}
            onClose={() => setIsCampOpsModalOpen(false)}
            campsite={activeCampsite}
            isAdmin={isCampAdmin}
            onDeleteCampsite={handleDeleteCampsite}
            onUpdateCampsite={handleUpdateCampsite}
            onLeaveCampsite={handleLeaveCampsite}
          />
        )}
        <UserProfileModal 
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={currentUser}
          onSave={(updatedUser, didChangePassword) => {
            if (didChangePassword) {
              // Log the user out immediately
              localStorage.removeItem('outpost_user');
              navigate('/');
            } else {
              setCurrentUser(updatedUser);
              localStorage.setItem('outpost_user', JSON.stringify(updatedUser));
              setIsProfileModalOpen(false);
            }
          }}
        />
        {isCreateChannelModalOpen && (
          <CreateChannelModal
            isOpen={isCreateChannelModalOpen}
            onClose={() => setIsCreateChannelModalOpen(false)}
            onCreateChannel={handleCreateChannel}
          />
        )}
      </AnimatePresence>
      
    </div>
  </div>
  );
};

export default Basecamp;
