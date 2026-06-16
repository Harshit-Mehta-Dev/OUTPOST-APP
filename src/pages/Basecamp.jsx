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
  Brain,
  Bell,
  Award,
  Zap,
  Check,
  Shield,
  ShieldAlert,
  Reply,
  AlertOctagon,
  Eye,
  HelpCircle,
  LifeBuoy
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
import NotificationDropdown from '../components/navigation/NotificationDropdown';
import { useSignalRadar } from '../hooks/useSignalRadar';
import { useTheme } from '../context/ThemeContext';
import OperatorTerminalTab from '../components/operator/OperatorTerminalTab';
import DeveloperHelpDesk from '../components/operator/DeveloperHelpDesk';
import DeveloperFeedback from '../components/operator/DeveloperFeedback';
import GradientBars from '../components/ui/gradient-bars-background';
import HelpDesk from '../components/HelpDesk';
import FeedbackForm from '../components/FeedbackForm';
import GroupAdminPanelModal from '../components/modals/GroupAdminPanelModal';

const socket = io('https://outpost-app.onrender.com');

const Basecamp = ({ isDarkMode, toggleTheme }) => {
  const navigate = useNavigate();
  const { activeTheme } = useTheme();
  const [activeChannel, setActiveChannel] = useState('community-chat');
  const [showWelcome, setShowWelcome] = useState(true);
  const [showDiscover, setShowDiscover] = useState(false);
  const [joinNotification, setJoinNotification] = useState(null);
  const [kickNotification, setKickNotification] = useState(null);
  const [adminNotification, setAdminNotification] = useState(null);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [activeTypers, setActiveTypers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isFetchingMessages, setIsFetchingMessages] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isOperatorOpen, setIsOperatorOpen] = useState(false);
  const [isHelpDeskOpen, setIsHelpDeskOpen] = useState(false);
  const [isDeveloperFeedbackOpen, setIsDeveloperFeedbackOpen] = useState(false);
  const [isUserHelpDeskOpen, setIsUserHelpDeskOpen] = useState(false);
  const [isUserFeedbackOpen, setIsUserFeedbackOpen] = useState(false);
  const [activeMembersList, setActiveMembersList] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCampOpsModalOpen, setIsCampOpsModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
  const [activeMobileTab, setActiveMobileTab] = useState('chat'); // Mobile Bottom Dock Tab
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false); // Mobile Sliding Drawer
  const [channelToDelete, setChannelToDelete] = useState(null);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [levelUpData, setLevelUpData] = useState(null);
  const messagesEndRef = useRef(null);

  const handleCopyMessage = (msg) => {
    let textToCopy = "";
    if (msg.type === "media") textToCopy = msg.body;
    else if (msg.type === "poll") textToCopy = msg.pollData?.question || "";
    else textToCopy = msg.text;
    
    navigator.clipboard.writeText(textToCopy).catch(err => console.error("Failed to copy", err));
  };

  // User identity  // Validate session on mount
  useEffect(() => {
    const saved = localStorage.getItem('outpost_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Fetch latest restriction status from backend
      fetch('https://outpost-app.onrender.com/api/users')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const serverUser = data.find(u => u.username === parsed.username);
            if (serverUser && serverUser.isGloballyRestricted !== parsed.isGloballyRestricted) {
              const updatedUser = { ...parsed, isGloballyRestricted: serverUser.isGloballyRestricted };
              setCurrentUser(updatedUser);
              localStorage.setItem('outpost_user', JSON.stringify(updatedUser));
            }
          }
        })
        .catch(err => console.error("Error fetching user status:", err));
    }
  }, []);

  // User identity
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('outpost_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Keep currentUser fresh from localStorage/backend syncs
  useEffect(() => {
    const interval = setInterval(() => {
      const saved = localStorage.getItem('outpost_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.profilePictureUrl !== currentUser.profilePictureUrl || 
          parsed.username !== currentUser.username ||
          parsed.level !== currentUser.level ||
          parsed.xp !== currentUser.xp
        ) {
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
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [selectedPopupAlert, setSelectedPopupAlert] = useState(null);
  const [clearedTimestamps, setClearedTimestamps] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('outpost_cleared_chats') || '{}');
    } catch {
      return {};
    }
  });
  
  const rawMessages = messagesByChannel[currentChannelKey] || [];
  const clearTime = clearedTimestamps[currentChannelKey] || 0;
  const messages = rawMessages.filter(msg => (msg.receivedAt || 0) >= clearTime);
  
  const changeViewChannelCallback = (campsiteId, channelId) => {
    setCampsites(prev => prev.map(c => ({
      ...c,
      active: c.id === campsiteId || String(c._id) === String(campsiteId)
    })));
    const pureChannel = channelId.split('_').slice(1).join('_');
    setActiveChannel(pureChannel);
  };

  const { alerts, setAlerts, handleSelectNotification } = useSignalRadar(socket, currentChannelKey, setSelectedPopupAlert, currentUser);

  // Fetch messages from MongoDB when joining a new channel
  useEffect(() => {
    setIsFetchingMessages(true);
    fetch(`https://outpost-app.onrender.com/api/messages/${currentChannelKey}`)
      .then(res => res.json())
      .then(data => {
        const mappedData = data.map(m => ({ ...m, receivedAt: m.createdAt ? new Date(m.createdAt).getTime() : Date.now() }));
        setMessagesByChannel(prev => ({
          ...prev,
          [currentChannelKey]: mappedData
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
    if (currentUser?.username) {
      socket.emit('join_user_room', currentUser.username);
    }
  }, [currentUser?.email, currentUser?.username]);

  // Reconnect logic to never lose channel assignment
  useEffect(() => {
    const onConnect = () => {
      console.log("Socket reconnected! Re-joining rooms...");
      socket.emit('join_channel', currentChannelKey);
      if (activeCampsite) socket.emit('join_campsite_room', activeCampsite.id);
      if (currentUser?.email) socket.emit('join_admin_room', currentUser.email);
      if (currentUser?.username) socket.emit('join_user_room', currentUser.username);
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
          [newMessage.channelKey]: [...currentMessages, { ...newMessage, receivedAt: Date.now() }]
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

    const handleLevelUp = ({ newLevel, xp }) => {
      setLevelUpData({ newLevel, xp });
      
      // Update local storage so the new level persists across refresh
      const saved = localStorage.getItem('outpost_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.level = newLevel;
        parsed.xp = xp;
        localStorage.setItem('outpost_user', JSON.stringify(parsed));
      }
      
      setTimeout(() => setLevelUpData(null), 6000); // hide celebration after 6 seconds
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

    const handleOperatorErasure = (payload) => {
      setMessagesByChannel(prev => {
        const currentMessages = prev[currentChannelKey] || [];
        return {
          ...prev,
          [currentChannelKey]: currentMessages.map((msg) =>
            (msg._id || msg.id) === payload.messageId
              ? { 
                  ...msg, 
                  text: payload.replacementText, 
                  isSystemDeleted: true 
                }
              : msg
          )
        };
      });
    };

    const handleOperatorPurge = (payload) => {
      alert(payload.message);
      window.location.href = "/"; // Instantly route them back safely
    };

    const handleKicked = (data) => {
      setKickNotification(`⚠️ KICKED: ${data.message}`);
      setTimeout(() => setKickNotification(null), 8000);
      
      setCampsites(prev => {
        // Remove the campsite
        const filtered = prev.filter(c => c.id !== data.campsiteId);
        // Make sure no campsite is active so they return to Dashboard smoothly
        return filtered.map(c => ({ ...c, active: false }));
      });
    };

    const handleBanned = (data) => {
      alert(`🚫 ${data.message} You can no longer send messages in this group.`);
      setCampsites(prev => prev.map(c => {
        if (c.id === data.campsiteId) {
          return { ...c, bannedUsers: [...(c.bannedUsers || []), currentUser?.username] };
        }
        return c;
      }));
    };

    const handleGlobalRestricted = (data) => {
      if (currentUser?.username === data.targetUsername) {
        alert("🚨 GLOBAL BAN ISSUED: You have been permanently restricted by the Developer from creating new outposts or expeditions.");
        const updatedUser = { ...currentUser, isGloballyRestricted: true };
        setCurrentUser(updatedUser);
        localStorage.setItem('outpost_user', JSON.stringify(updatedUser));
      }
    };

    socket.on("scout-joined-list", handleScoutJoinedList);
    socket.on("campsite-admin-notification", handleAdminNotification);
    socket.on("level_up_alert", handleLevelUp);
    socket.on("broadcast-updated-vote", handleUpdatedVote);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("operator-erasure-cascade", handleOperatorErasure);
    socket.on("operator-basecamp-purge", handleOperatorPurge);
    socket.on("user_kicked", handleKicked);
    socket.on("user_banned", handleBanned);
    socket.on("global-restricted", handleGlobalRestricted);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off("broadcast-typing-start", handleTypingStart);
      socket.off("broadcast-typing-stop", handleTypingStop);
      socket.off("scout-joined-list", handleScoutJoinedList);
      socket.off("campsite-admin-notification", handleAdminNotification);
      socket.off("level_up_alert", handleLevelUp);
      socket.off("broadcast-updated-vote", handleUpdatedVote);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("operator-erasure-cascade", handleOperatorErasure);
      socket.off("operator-basecamp-purge", handleOperatorPurge);
      socket.off("user_kicked", handleKicked);
      socket.off("user_banned", handleBanned);
      socket.off("global-restricted", handleGlobalRestricted);
    };
  }, [currentChannelKey]);

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
        text: inputText.trim(),
        body: replyingTo ? JSON.stringify({
          username: replyingTo.user?.username || replyingTo.user || 'Unknown Scout',
          text: replyingTo.text,
          id: replyingTo._id || replyingTo.id
        }) : undefined,
        replyTo: replyingTo ? {
          username: replyingTo.user?.username || replyingTo.user || 'Unknown Scout',
          text: replyingTo.text,
          id: replyingTo._id || replyingTo.id
        } : null
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
      setReplyingTo(null);
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

  const handleOpenCreateCampsite = () => {
    if (currentUser?.isGloballyRestricted) {
      alert("🚫 ACCESS DENIED: You have been permanently banned by the Developer from creating new outposts.");
      return;
    }
    setIsCreateModalOpen(true);
  };

  const handleOpenCreateChannel = () => {
    if (currentUser?.isGloballyRestricted) {
      alert("🚫 ACCESS DENIED: You have been permanently banned by the Developer from initiating expeditions.");
      return;
    }
    setIsCreateChannelModalOpen(true);
  };

  const handleCampsiteCreated = (data) => {
    if (currentUser?.isGloballyRestricted) {
      alert("🚫 You have been permanently banned by the Developer from creating new outposts and expeditions.");
      return;
    }
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
      adminUsername: currentUser?.username,
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
    .then(async res => {
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create campsite on server');
      }
      return res.json();
    })
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
      
      if (err.message && err.message.toLowerCase().includes('globally restricted')) {
        setJoinNotification(`🚫 ACCESS DENIED: ${err.message}`);
        setTimeout(() => setJoinNotification(null), 6000);
        // Force update the local user state
        const updatedUser = { ...currentUser, isGloballyRestricted: true };
        setCurrentUser(updatedUser);
        localStorage.setItem('outpost_user', JSON.stringify(updatedUser));
        return; // DO NOT create locally
      }
      
      // Fallback: still add it locally if backend fails for other reasons (like timeout)
      setCampsites(prev => {
        const disabledPrev = prev.map(c => ({...c, active: false}));
        return [...disabledPrev, { ...newCampData, active: true }];
      });
      const firstTextChannel = newCampData.expeditions?.find(e => e.type === 'text');
      if (firstTextChannel) setActiveChannel(firstTextChannel.id);
      
      setJoinNotification(`⚠️ Established locally, but failed to sync to server: ${err.message}`);
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
    if (currentUser?.isGloballyRestricted) {
      alert("🚫 You have been permanently banned by the Developer from creating new outposts and expeditions.");
      return;
    }
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

  const handleKickMember = async (username) => {
    try {
      if (activeCampsite.id === 1) {
        // Outpost HQ special kick -> Global Restrict
        const response = await fetch(`https://outpost-app.onrender.com/api/users/global-restrict`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ developerEmail: currentUser.email, targetUsername: username })
        });
        const data = await response.json();
        if (!response.ok) { alert(data.error || 'Failed to kick user from HQ'); return; }
        
        socket.emit('kick_user_event', { username, campsiteId: 1, message: 'Developer has kicked you from Outpost HQ' });
        setActiveMembersList(prev => prev.filter(m => m !== username && m.username !== username));
        alert(`${username} kicked from Outpost HQ`);
        return;
      }

      const response = await fetch(`https://outpost-app.onrender.com/api/campsites/${activeCampsite.id}/kick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: currentUser.email, username })
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || 'Failed to kick user');
        return;
      }
      
      const isGlobalAdmin = currentUser.email.toLowerCase().trim() === 'harshitmehta1012@gmail.com';
      const actor = isGlobalAdmin ? 'Developer' : 'Admin';

      socket.emit('kick_user_event', { 
        username, 
        campsiteId: activeCampsite.id,
        message: `${actor} has kicked you`
      });

      setActiveMembersList(prev => prev.filter(m => m !== username && m.username !== username));
      alert(data.message);
    } catch (err) {
      console.error(err);
      alert('Error kicking user');
    }
  };

  const handleBanMember = async (username) => {
    try {
      if (activeCampsite.id === 1) {
        // Outpost HQ special ban -> Global Restrict
        const response = await fetch(`https://outpost-app.onrender.com/api/users/global-restrict`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ developerEmail: currentUser.email, targetUsername: username })
        });
        const data = await response.json();
        if (!response.ok) { alert(data.error || 'Failed to ban user from HQ'); return; }
        
        socket.emit('ban_user_event', { username, campsiteId: 1, message: 'Developer has globally banned you from Outpost HQ' });
        setActiveMembersList(prev => prev.filter(m => m !== username && m.username !== username));
        alert(`${username} banned from Outpost HQ`);
        return;
      }

      const response = await fetch(`https://outpost-app.onrender.com/api/campsites/${activeCampsite.id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: currentUser.email, username })
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || 'Failed to ban user');
        return;
      }
      
      const isGlobalAdmin = currentUser.email.toLowerCase().trim() === 'harshitmehta1012@gmail.com';
      const actor = isGlobalAdmin ? 'Developer' : 'Admin';

      socket.emit('ban_user_event', { 
        username, 
        campsiteId: activeCampsite.id,
        message: `${actor} has banned you`
      });

      setActiveMembersList(prev => prev.filter(m => m !== username && m.username !== username));
      alert(data.message);
    } catch (err) {
      console.error(err);
      alert('Error banning user');
    }
  };

  const handleGlobalBan = async (username) => {
    try {
      const response = await fetch(`https://outpost-app.onrender.com/api/users/global-restrict`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ developerEmail: currentUser.email, targetUsername: username })
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Failed to issue Global Ban');
        return;
      }
      
      alert(data.message);
    } catch (err) {
      console.error(err);
      alert('Error issuing global ban');
    }
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

  const handleOperatorEraseMessage = async (msgId) => {
    try {
      await fetch(`https://outpost-app.onrender.com/api/operator/erase-message/${msgId}`, {
        method: "DELETE",
        headers: {
          "x-operator-email": currentUser?.email,
          "x-operator-id": currentUser?._id || currentUser?.id || ""
        }
      });
      // Optionally remove it from local state immediately for a snappy feel
      setMessagesByChannel(prev => {
        const currentMessages = prev[currentChannelKey] || [];
        return {
          ...prev,
          [currentChannelKey]: currentMessages.map(m => 
            (m._id || m.id) === msgId 
              ? { ...m, text: "SYSTEM DECREE: Our Operator has decided to delete this message under community violation guidelines.", isSystemDeleted: true } 
              : m
          )
        };
      });
    } catch (err) {
      console.error("Operator Error erasing message:", err);
    }
  };

  const handleOperatorDecommissionCampsite = async (campId) => {
    try {
      await fetch(`https://outpost-app.onrender.com/api/operator/decommission-campsite/${campId}`, {
        method: "DELETE",
        headers: {
          "x-operator-email": currentUser?.email
        }
      });
    } catch (err) {
      console.error("Operator Error decommissioning campsite:", err);
    }
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
      {!activeTheme?.isDynamic && <AnimatedMesh />}
      {activeTheme?.isDynamic && activeTheme?.id.startsWith('gradient-bars') && (
        <div style={{ opacity: 0.15, position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <GradientBars 
            numBars={15}
            gradientFrom={activeTheme.dynamicColor || "#ff3c00"}
            gradientTo="transparent"
            animationDuration={2}
            className="w-full h-full"
          />
        </div>
      )}
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
                      socket.emit("delete_message_for_all", { 
                        messageId: messageToDelete.id, 
                        channelKey: messageToDelete.channelKey,
                        username: currentUser.username
                      });
                      setMessageToDelete(null);
                    }}
                  >
                    Delete for everyone
                  </button>
                )}
                {messageToDelete?.isOperatorMode && (
                  <button 
                    className="btn-primary" 
                    style={{ background: 'rgba(69, 10, 10, 0.8)', color: '#f87171', borderColor: '#f87171', textTransform: 'uppercase', letterSpacing: '1px' }}
                    onClick={() => {
                      handleOperatorEraseMessage(messageToDelete.id);
                      setMessageToDelete(null);
                    }}
                  >
                    <ShieldAlert size={14} style={{ display: 'inline', marginRight: '6px', marginBottom: '-2px' }} />
                    Force Purge Everywhere
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
            style={{ position: 'relative' }}
          >
            {camp.id === 1 ? (
              <img src={logoUrl} alt="HQ" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
            ) : camp.imageUrl ? (
              <img src={camp.imageUrl} alt={camp.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              camp.name.charAt(0)
            )}
            
            {/* Operator Developer Eye Overlay for Hidden Outposts */}
            {isGlobalAdmin && camp.isPublic === false && (
              <div 
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: '#09090b',
                  borderRadius: '50%',
                  padding: '4px',
                  border: '1px solid rgba(127, 29, 29, 0.5)',
                  color: '#f87171',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 10px rgba(127, 29, 29, 0.4)'
                }}
                title="Hidden Outpost (Operator View)"
              >
                <Eye size={10} />
              </div>
            )}
          </div>
        ))}

        <div className="campsite-item add-button" onClick={handleOpenCreateCampsite}>
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
              .then(async res => {
                const data = await res.json();
                if (!res.ok) {
                  // This handles 403 Forbidden (e.g. user was kicked)
                  setKickNotification(`🚫 ACCESS DENIED: ${data.message}`);
                  setTimeout(() => setKickNotification(null), 6000);
                  throw new Error(data.message);
                }
                return data;
              })
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
                <span className="font-malinton" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.25em', fontWeight: 'normal', letterSpacing: 'normal' }}>OUTPOST <span style={{ fontSize: '16px', padding: '2px 6px', background: '#ff3c00', color: '#ffffff', borderRadius: '4px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif', lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>β</span></span>
              </div>
            </div>
            
            <div className="expedition-list">
              <div className="expedition-category" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>CAMPSITES</span>
                <button className="icon-btn" onClick={handleOpenCreateChannel} style={{ padding: '2px', background: 'transparent' }}>
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
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <strong>{currentUser?.username || 'YourUser'}</strong>
                {isGlobalAdmin && <span className="role-tag developer">DEVELOPER</span>}
              </div>
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
              className="icon-btn menu-toggle-btn desktop-only-menu-toggle" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title="Toggle Sidebar"
            >
              <Menu size={20} style={{ color: 'var(--text-secondary)' }} />
            </button>
            <button 
              className="icon-btn menu-toggle-btn mobile-only" 
              onClick={() => setIsMobileDrawerOpen(true)}
              title="Toggle Mobile Sidebar"
            >
              <Menu size={20} style={{ color: 'var(--text-secondary)' }} />
            </button>
            <span className="active-camp-name"># {activeCampsite?.name || 'Loading...'}</span>
          </div>
          <div className="top-bar-center">
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Target size={16} />
              <span>Outpost Status: Active</span>
            </div>
          </div>
          <div className="top-bar-right" style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
            
            {isGlobalAdmin && (
              <>
                <button
                  onClick={() => setIsHelpDeskOpen(true)}
                  className={`theme-trigger-btn flex items-center justify-center transition-all duration-200 ${
                    isHelpDeskOpen 
                      ? "active shadow-[0_0_15px_rgba(74,222,128,0.2)]" 
                      : ""
                  }`}
                  style={isHelpDeskOpen ? {
                    background: 'rgba(20, 83, 45, 0.4)',
                    borderColor: 'rgba(34, 197, 94, 0.8)',
                    color: '#4ade80'
                  } : undefined}
                  title="DEVELOPER HELP DESK"
                >
                  <HelpCircle size={18} className="animate-pulse" />
                </button>
                <button
                  onClick={() => setIsDeveloperFeedbackOpen(true)}
                  className={`theme-trigger-btn flex items-center justify-center transition-all duration-200 ${
                    isDeveloperFeedbackOpen 
                      ? "active shadow-[0_0_15px_rgba(255,165,0,0.2)]" 
                      : ""
                  }`}
                  style={isDeveloperFeedbackOpen ? {
                    background: 'rgba(184, 115, 51, 0.4)',
                    borderColor: 'rgba(255, 165, 0, 0.8)',
                    color: '#ffa500'
                  } : undefined}
                  title="DEVELOPER FEEDBACK DASHBOARD"
                >
                  <MessageSquare size={18} className="animate-pulse" />
                </button>
                <button
                  onClick={() => setIsOperatorOpen(true)}
                  className={`theme-trigger-btn flex items-center justify-center transition-all duration-200 ${
                    isOperatorOpen 
                      ? "active shadow-[0_0_15px_rgba(239,68,68,0.2)]" 
                      : ""
                  }`}
                  style={isOperatorOpen ? {
                    background: 'rgba(69, 10, 10, 0.4)',
                    borderColor: 'rgba(153, 27, 27, 0.8)',
                    color: '#f87171'
                  } : undefined}
                  title="OPERATOR COMMAND PANEL GATE"
                >
                  <Eye size={18} className="animate-pulse" />
                </button>
              </>
            )}

            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setIsAlertOpen(!isAlertOpen);
                  setIsAIOpen(false); // Close AI panel to prevent stacked layout collisions
                  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
                    Notification.requestPermission();
                  }
                }}
                className={`theme-trigger-btn ${isAlertOpen ? 'active' : ''}`}
                  style={isAlertOpen ? {
                    background: 'var(--bg-card)',
                    color: 'var(--brand-primary)'
                  } : undefined}
              >
                <Bell size={18} />
                {alerts.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-brand animate-pulse shadow-[0_0_8px_rgba(var(--brand-primary),0.6)]" style={{ width: '8px', height: '8px', position: 'absolute' }} />
                )}
              </button>

              {/* Dropdown Card Injection Portal */}
              <NotificationDropdown 
                isOpen={isAlertOpen} 
                alerts={alerts} 
                onSelectAlert={handleSelectNotification} 
                onDismissAlert={(id) => setAlerts(prev => prev.filter(a => a.id !== id))}
                onClearAll={() => setAlerts([])} 
              />

              {/* Message Read Popup Modal */}
              <AnimatePresence>
                {selectedPopupAlert && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)' }}>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      style={{ background: 'var(--bg-card)', border: '1px solid var(--brand-primary)', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '90%', color: 'var(--text-primary)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '14px', fontFamily: 'monospace', color: 'var(--brand-primary)', textTransform: 'uppercase' }}>INTERCEPT: {selectedPopupAlert.campsiteName}</h3>
                        <button onClick={() => setSelectedPopupAlert(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={18} /></button>
                      </div>
                      <div style={{ marginBottom: '20px' }}>
                        <p style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '8px' }}>From: {selectedPopupAlert.senderName}</p>
                        <p style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>{selectedPopupAlert.textPreview}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button onClick={() => {
                          setAlerts(prev => prev.filter(a => a.id !== selectedPopupAlert.id));
                          setSelectedPopupAlert(null);
                        }} style={{ padding: '8px 16px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={(e) => e.target.style.color = '#ff3b30'} onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}>Delete</button>
                        <button onClick={() => {
                          changeViewChannelCallback(selectedPopupAlert.campsiteId, selectedPopupAlert.channelId);
                          setSelectedPopupAlert(null);
                        }} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--brand-primary)', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>Jump to Channel</button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {isCampAdmin && (
              <button
                onClick={() => {
                  setIsAIOpen(!isAIOpen);
                  setIsThemeOpen(false);
                }}
                className={`theme-trigger-btn ${isAIOpen ? 'active' : ''}`}
                  style={isAIOpen ? {
                    background: 'var(--bg-card)',
                    color: 'var(--brand-primary)'
                  } : undefined}
                title="Compute Intelligence Matrices"
              >
                <Brain size={18} />
              </button>
            )}

            <button
              onClick={toggleTheme}
              className={`theme-trigger-btn ${!isDarkMode ? 'active' : ''}`}
              title="Toggle Light/Dark Mode"
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>


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

            {!isGlobalAdmin && (
              <>
                <button className={`theme-trigger-btn ${isUserHelpDeskOpen ? 'active' : ''}`} onClick={() => setIsUserHelpDeskOpen(true)} title="Help Desk">
                  <LifeBuoy size={18} />
                </button>
                <button className={`theme-trigger-btn ${isUserFeedbackOpen ? 'active' : ''}`} onClick={() => setIsUserFeedbackOpen(true)} title="Feedback">
                  <MessageSquare size={18} />
                </button>
              </>
            )}

            <button className="camp-ops-btn" onClick={() => setIsCampOpsModalOpen(true)}>
              <Settings size={18} />
              Camp Operations
            </button>
            {isCampAdmin && (
              <button className="camp-ops-btn" style={{ marginLeft: '8px' }} onClick={() => setIsAdminPanelOpen(true)}>
                <ShieldAlert size={18} />
                Manage Members
              </button>
            )}

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
          <div className="chat-header-actions" style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              className="clear-chat-btn"
              onClick={() => {
                if (window.confirm("Are you sure you want to permanently clear this chat history from your dashboard? Other users will still see it.")) {
                   const newTimestamps = { ...clearedTimestamps, [currentChannelKey]: Date.now() };
                   setClearedTimestamps(newTimestamps);
                   localStorage.setItem('outpost_cleared_chats', JSON.stringify(newTimestamps));
                }
              }}
              style={{
                background: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-glass)',
                padding: '0 12px',
                height: '32px',
                borderRadius: '8px',
                fontSize: '11px',
                fontFamily: 'monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => { e.currentTarget.style.color = '#ff3b30'; e.currentTarget.style.borderColor = 'rgba(255, 59, 48, 0.4)'; e.currentTarget.style.background = 'rgba(255, 59, 48, 0.05)'; }}
              onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-glass)'; e.currentTarget.style.background = 'transparent'; }}
              title="Clear Chat For Me"
            >
              <Trash2 size={14} /> Clear Chat
            </button>
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
              campsite={activeCampsite}
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
            
            <div className="community-guidelines" style={{ marginTop: '20px', padding: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', borderLeft: '4px solid var(--brand-primary)' }}>
              <h3 style={{ marginBottom: '15px', color: 'var(--brand-primary)' }}>🏕️ Outpost Community Guidelines</h3>
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
            messages.map((msg, index) => {
              const evaluateFlash = localStorage.getItem("highlight_message_trigger");
              const isThisTheNewestMessage = index === messages.length - 1;
              let highlightClass = "";
              if (evaluateFlash && isThisTheNewestMessage) {
                localStorage.removeItem("highlight_message_trigger");
                highlightClass = " animate-signal-glow";
              }

              return (
                    <div className={`message-item${highlightClass}`} key={msg._id || msg.id || index}>
                      <div className="message-avatar" style={{ overflow: 'hidden', position: 'relative' }}>
                        {msg.user?.profilePictureUrl ? (
                          <img src={msg.user.profilePictureUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          (msg.user?.username || 'S')[0].toUpperCase()
                        )}
                      </div>
                      <div className="message-content">
                        <div className="message-meta" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                          {(() => {
                            const username = msg.user?.username || msg.user || 'Unknown Scout';
                            const userRoleName = activeCampsite?.memberRoles?.[username];
                            const userRoleColor = activeCampsite?.roles?.find(r => r.name === userRoleName)?.color || 'var(--text-primary)';
                            return (
                              <span className="message-author" style={{ color: userRoleColor, fontWeight: userRoleName ? 'bold' : 'normal', display: 'flex', alignItems: 'center' }}>
                                {username}
                                {username.toLowerCase() === 'harshit mehta' && <span className="role-tag developer">DEVELOPER</span>}
                                {((activeCampsite?.adminUsername && username === activeCampsite?.adminUsername) || (activeCampsite?.adminEmail === currentUser?.email && username === currentUser?.username)) && username.toLowerCase() !== 'harshit mehta' && <span className="role-tag admin">ADMIN</span>}
                              </span>
                            );
                          })()}
                          {msg.user?.level && <span style={{ fontSize: '10px', color: '#ff6b2b', marginLeft: '6px' }}>Lv.{msg.user.level}</span>}
                          <span className="message-time" style={{ marginLeft: '10px', flexGrow: 1 }}>{msg.time}</span>
                          <button 
                            className="message-action-btn"
                            onClick={() => handleCopyMessage(msg)}
                            title="Copy"
                          >
                            <Copy size={14} />
                          </button>
                          <button 
                            className="message-action-btn"
                            onClick={() => setReplyingTo(msg)}
                            title="Reply"
                          >
                            <Reply size={14} />
                          </button>
                          <button 
                            className="message-action-btn"
                            onClick={() => setMessageToDelete({ 
                              id: msg._id || msg.id, 
                              channelKey: currentChannelKey,
                              isOwnMessage: msg.user?.username === currentUser?.username || msg.user === currentUser?.username 
                            })}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                          {isGlobalAdmin && !msg.isSystemDeleted && (
                            <button
                              className="operator-action-btn"
                              onClick={() => setMessageToDelete({ 
                                  id: msg._id || msg.id, 
                                  channelKey: currentChannelKey,
                                  isOwnMessage: msg.user?.username === currentUser?.username || msg.user === currentUser?.username,
                                  isOperatorMode: true
                              })}
                              title="Operator Override: Delete Content"
                            >
                              <ShieldAlert size={14} />
                            </button>
                          )}
                        </div>
                        <div className="message-text">
                          {(() => {
                            let parsedReply = msg.replyTo;
                            if (!parsedReply && (!msg.type || msg.type === 'text') && msg.body) {
                              try { parsedReply = JSON.parse(msg.body); } catch(e) {}
                            }
                            if (!parsedReply) return null;
                            return (
                              <div className="reply-reference" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '6px 10px', borderRadius: '6px', marginBottom: '8px', borderLeft: '3px solid var(--brand-primary)', opacity: 0.8, display: 'flex', flexDirection: 'column', gap: '2px', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                                  <Reply size={12} />
                                  {parsedReply.username}
                                </div>
                                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.8rem' }}>
                                  {parsedReply.text}
                                </div>
                              </div>
                            );
                          })()}
                          {msg.isSystemDeleted ? (
                            <div className="mt-1.5 px-3 py-2 bg-red-950/10 border border-red-950/40 rounded-xl flex items-center gap-2 text-red-400/80 max-w-2xl shadow-[inset_0_1px_10px_rgba(239,68,68,0.02)]" style={{ marginTop: '6px', padding: '8px 12px', backgroundColor: 'rgba(69, 10, 10, 0.1)', border: '1px solid rgba(69, 10, 10, 0.4)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(248, 113, 113, 0.8)', maxWidth: '42rem' }}>
                              <AlertOctagon size={14} className="shrink-0" style={{ flexShrink: 0 }} />
                              <p className="text-[11px] font-mono italic leading-normal" style={{ fontSize: '11px', fontFamily: 'monospace', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
                                SYSTEM DECREE: Our Operator has decided to delete this message under community violation guidelines.
                              </p>
                            </div>
                          ) : (
                            (!msg.type || msg.type === "text") && msg.text
                          )}
                          
                          {!msg.isSystemDeleted && msg.type === "media" && msg.mediaType === "image" && (
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
                            <div className="mt-3 p-4 rounded-xl font-sans" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', padding: '16px', borderRadius: '12px', marginTop: '12px', width: '100%', maxWidth: '350px' }}>
                              <p className="font-bold font-mono tracking-wide text-xs uppercase mb-3" style={{ color: 'var(--brand-primary)', marginBottom: '12px', fontWeight: 'bold' }}>📊 {msg.pollData.question}</p>
                              <div className="space-y-2.5" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {msg.pollData.options.map((option, idx) => {
                                  const totalVotes = msg.pollData.votesArray?.length || 0;
                                  const optionVotes = msg.pollData.votesMap?.[idx]?.length || 0;
                                  const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
                                  
                                  const currentUsername = currentUser?.username || 'Scout';
                                  const hasVotedInPoll = msg.pollData.votesArray?.includes(currentUsername);
                                  const votedForThisOption = msg.pollData.votesMap?.[idx]?.includes(currentUsername);
                                  
                                  return (
                                    <button
                                      key={idx}
                                      disabled={hasVotedInPoll}
                                      onClick={() => { if (!hasVotedInPoll) handleVoteSubmission(msg._id || msg.id, idx); }}
                                      style={{ position: 'relative', overflow: 'hidden', background: votedForThisOption ? 'var(--accent-glow)' : 'var(--bg-glass)', border: votedForThisOption ? '1px solid var(--brand-primary)' : '1px solid var(--border-glass)', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', cursor: hasVotedInPoll ? 'default' : 'pointer', outline: 'none', transition: 'all 0.2s ease', opacity: hasVotedInPoll && !votedForThisOption ? 0.6 : 1 }}
                                    >
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
                                        style={{ position: 'absolute', top: 0, left: 0, bottom: 0, background: 'var(--brand-primary)', opacity: votedForThisOption ? 0.4 : 0.2, pointerEvents: 'none' }}
                                      />
                                      <span style={{ position: 'relative', zIndex: 10, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {option}
                                        {votedForThisOption && <Check size={14} style={{ color: 'var(--brand-primary)' }} />}
                                      </span>
                                      <span style={{ position: 'relative', zIndex: 10, fontSize: '0.75rem', opacity: 0.9, fontWeight: votedForThisOption ? 'bold' : 'normal' }}>
                                        {percentage}% ({optionVotes})
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })
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
        <AnimatePresence>
          {replyingTo && (
            <motion.div 
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 10, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', background: 'var(--bg-glass)', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', borderBottom: '1px solid var(--border-glass)', margin: '0 24px', position: 'relative', top: '10px', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <Reply size={14} />
                  <span>Replying to <strong style={{ color: 'var(--text-primary)' }}>{replyingTo.user?.username || replyingTo.user || 'Unknown Scout'}</strong></span>
                </div>
                <button onClick={() => setReplyingTo(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={16} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="chat-input-wrapper">
          <div className="chat-input-container" style={{ position: 'relative', overflow: 'visible' }}>
            {activeCampsite?.bannedUsers?.includes(currentUser?.username) ? (
              <div style={{ width: '100%', textAlign: 'center', padding: '12px', color: '#ff4444', fontWeight: 'bold', background: 'rgba(255,0,0,0.1)', borderRadius: '8px' }}>
                🚫 You have been permanently banned from chatting in this group.
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </main>
      </>
      )}

      {/* 📱 MOBILE SLIDING DRAWER (Visible only on mobile when isMobileDrawerOpen is true) */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <motion.div 
            className="mobile-drawer-overlay mobile-only"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileDrawerOpen(false)}
          >
            <motion.div 
              className="mobile-drawer-content"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Clone of Campsite Sidebar */}
              <nav className="campsite-sidebar glass-panel-dark">
                {campsites.map((camp) => (
                  <div
                    key={camp.id}
                    className={`campsite-item ${activeCampsite?.id === camp.id ? 'active' : ''}`}
                    onClick={() => {
                      handleSelectCampsite(camp);
                    }}
                    title={camp.name}
                  >
                    {camp.name.substring(0, 2).toUpperCase()}
                  </div>
                ))}
                <div className="campsite-separator"></div>
                <button 
                  className="campsite-item add-button" 
                  onClick={() => { handleOpenCreateCampsite(); setIsMobileDrawerOpen(false); }}
                  title="Establish New Campsite"
                >
                  <Plus size={24} />
                </button>
                <div className="campsite-separator"></div>
                <button 
                  className="campsite-item" 
                  onClick={() => { setShowDiscover(true); setIsMobileDrawerOpen(false); }}
                  title="Discover Outposts"
                  style={{ background: showDiscover ? 'rgba(255,255,255,0.1)' : 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  <Compass size={24} />
                </button>
              </nav>

              {/* Clone of Expedition Sidebar */}
              <aside className="expedition-sidebar glass-panel">
                <div className="expedition-header">
                  <div className="expedition-header-logo">
                    <img src={logoUrl} alt="Outpost Logo" />
                    <span className="font-malinton" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.25em', fontWeight: 'normal', letterSpacing: 'normal' }}>OUTPOST <span style={{ fontSize: '16px', padding: '2px 6px', background: '#ff3c00', color: '#ffffff', borderRadius: '4px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif', lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>β</span></span>
                  </div>
                </div>

                <div className="expedition-list">
                  <div className="expedition-category">EXPEDITIONS</div>
                  {expeditions.filter(e => e.type === 'text').map((channel) => (
                    <div 
                      key={channel.id}
                      className={`expedition-item ${activeChannel === channel.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveChannel(channel.id);
                        setShowDiscover(false);
                        setIsMobileDrawerOpen(false); // Close drawer on selection
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Hash size={18} className="exp-icon" />
                        <span>{channel.name}</span>
                      </div>
                    </div>
                  ))}

                  <button 
                    className="expedition-item mt-4" 
                    onClick={() => { handleOpenCreateChannel(); setIsMobileDrawerOpen(false); }}
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Plus size={18} className="exp-icon" />
                      <span>New Expedition</span>
                    </div>
                  </button>
                </div>

                {/* User Controls Mobile */}
                <div className="user-profile">
                  <div className="user-info" onClick={() => { setIsProfileModalOpen(true); setIsMobileDrawerOpen(false); }}>
                    <div className="user-avatar">
                      {currentUser.profilePictureUrl ? (
                        <img 
                          src={currentUser.profilePictureUrl} 
                          alt="Profile" 
                          style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}}
                        />
                      ) : (
                        <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'bold', fontSize:'0.9rem'}}>
                          {currentUser.username.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="status-dot online"></div>
                    </div>
                    <div className="user-name">
                      <strong>{currentUser.username}</strong>
                      <span>Active</span>
                    </div>
                  </div>
                  <div className="user-actions">
                    <button className="icon-btn" title="AI Operations" onClick={() => { setIsAIOpen(true); setIsMobileDrawerOpen(false); }}>
                      <Brain size={18} />
                    </button>
                    {!isGlobalAdmin && (
                      <>
                        <button className="icon-btn" title="Help Desk" onClick={() => { setIsUserHelpDeskOpen(true); setIsMobileDrawerOpen(false); }}>
                          <LifeBuoy size={18} />
                        </button>
                        <button className="icon-btn" title="Feedback" onClick={() => { setIsUserFeedbackOpen(true); setIsMobileDrawerOpen(false); }}>
                          <MessageSquare size={18} />
                        </button>
                      </>
                    )}
                    <button className="icon-btn" title="Camp Operations" onClick={() => { setIsCampOpsModalOpen(true); setIsMobileDrawerOpen(false); }}>
                      <Settings size={18} />
                    </button>
                    {isCampAdmin && (
                      <button className="icon-btn" title="Manage Members" onClick={() => { setIsAdminPanelOpen(true); setIsMobileDrawerOpen(false); }}>
                        <ShieldAlert size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </aside>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📱 MOBILE FLOATING DOCK TOOLBAR */}
      <nav className="mobile-bottom-dock mobile-only">
        <button
          onClick={() => { setActiveMobileTab("campsites"); setShowDiscover(true); setIsMobileDrawerOpen(false); }}
          className={`dock-item ${showDiscover ? "active" : ""}`}
        >
          <Compass size={22} />
          <span>Discover</span>
        </button>
        <button
          onClick={() => { setActiveMobileTab("chat"); setShowDiscover(false); setIsMobileDrawerOpen(false); }}
          className={`dock-item ${!showDiscover && activeMobileTab === "chat" ? "active" : ""}`}
        >
          <MessageSquare size={22} />
          <span>Comms</span>
        </button>
        <button
          onClick={() => { setActiveMobileTab("standing"); setIsCampOpsModalOpen(true); setIsMobileDrawerOpen(false); }}
          className={`dock-item ${isCampOpsModalOpen ? "active" : ""}`}
        >
          <Shield size={22} />
          <span>Standing</span>
        </button>
      </nav>      {/* Notifications */}
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
        {kickNotification && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
            transition={{ type: 'spring', bounce: 0.5 }}
            style={{
              position: 'fixed',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.85)',
              zIndex: 99999,
              backdropFilter: 'blur(15px)'
            }}
          >
            <div style={{
              background: 'rgba(255, 59, 48, 0.2)',
              border: '2px solid #ff3b30',
              padding: '40px 60px',
              borderRadius: '24px',
              color: '#fff',
              textAlign: 'center',
              boxShadow: '0 0 50px rgba(255, 59, 48, 0.4)',
              maxWidth: '80%'
            }}>
              <AlertOctagon size={64} color="#ff3b30" style={{ marginBottom: '24px', animation: 'pulse 2s infinite' }} />
              <h2 style={{ fontSize: '28px', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '2px', color: '#ff3b30' }}>
                Action Prohibited
              </h2>
              <p style={{ fontSize: '18px', margin: 0, fontWeight: '500' }}>
                {kickNotification}
              </p>
            </div>
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
        {levelUpData && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            style={{
              position: 'fixed',
              bottom: '40px',
              right: '40px',
              background: 'linear-gradient(135deg, rgba(88, 101, 242, 0.9), rgba(41, 128, 185, 0.9))',
              border: '2px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(15px)',
              padding: '20px 24px',
              borderRadius: '16px',
              color: '#fff',
              zIndex: 10000,
              boxShadow: '0 20px 40px rgba(0,0,0,0.6), 0 0 30px rgba(88, 101, 242, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              minWidth: '300px'
            }}
          >
            <div style={{ 
              padding: '12px', 
              background: 'rgba(255,255,255,0.2)', 
              borderRadius: '50%',
              boxShadow: '0 0 20px rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Award size={28} color="#f1c40f" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', letterSpacing: '2px', fontWeight: 'bold' }}>Level Up Achieved!</span>
              <span style={{ fontSize: '1.4rem', fontWeight: '800', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Scout Level {levelUpData.newLevel}</span>
            </div>
            <div style={{ marginLeft: 'auto', background: 'rgba(0,0,0,0.3)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
              <Zap size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} color="#f1c40f"/>
              {levelUpData.xp} XP
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
      
      <OperatorTerminalTab 
        isOpen={isOperatorOpen} 
        onClose={() => setIsOperatorOpen(false)} 
        campsiteName={activeCampsite?.name} 
        currentCampsiteId={activeCampsite?.id}
        currentUser={currentUser}
      />
      
      <AnimatePresence>
        {isHelpDeskOpen && (
          <DeveloperHelpDesk 
            onClose={() => setIsHelpDeskOpen(false)} 
            currentUser={currentUser} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDeveloperFeedbackOpen && (
          <DeveloperFeedback 
            onClose={() => setIsDeveloperFeedbackOpen(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isUserHelpDeskOpen && (
          <motion.div 
            key="user-helpdesk-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="user-feature-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="user-feature-modal-content relative" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', background: 'var(--bg-primary)', borderRadius: '16px', overflowY: 'auto', border: '1px solid var(--border-color)', position: 'relative' }}>
               <button 
                 style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 50, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                 onClick={() => setIsUserHelpDeskOpen(false)}
               ><X size={20} /></button>
               <div style={{ padding: '32px 16px', minHeight: '100%' }}>
                 <HelpDesk />
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isUserFeedbackOpen && (
          <motion.div 
            key="user-feedback-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="user-feature-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="user-feature-modal-content relative" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', background: 'var(--bg-primary)', borderRadius: '16px', overflowY: 'auto', border: '1px solid var(--border-color)', position: 'relative' }}>
               <button 
                 style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 50, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                 onClick={() => setIsUserFeedbackOpen(false)}
               ><X size={20} /></button>
               <div style={{ padding: '32px 16px', minHeight: '100%' }}>
                 <FeedbackForm />
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <GroupAdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        campsite={activeCampsite}
        currentUser={currentUser}
        onKick={handleKickMember}
        onBan={handleBanMember}
        onGlobalBan={handleGlobalBan}
      />

    </div>
  </div>
  );
};

export default Basecamp;
