import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';
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
  Lock,
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
  LifeBuoy,
  Cpu,
  MoreVertical,
  Heart,
  Pin,
  Smile,
  CheckSquare,
  Info,
  MapPin,
  Music
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { supabase } from '../lib/supabaseClient';
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
import AiNexus from '../components/AiNexus';
import DeveloperFeedback from '../components/operator/DeveloperFeedback';
import GradientBars from '../components/ui/gradient-bars-background';
import HelpDesk from '../components/HelpDesk';
import FeedbackForm from '../components/FeedbackForm';
import GroupAdminPanelModal from '../components/modals/GroupAdminPanelModal';
import BasecampBoard from '../components/board/BasecampBoard';

// Socket is created lazily inside the component so it always has a fresh token.
// Creating it at module level causes authentication failures because the token
// is not yet in localStorage at import time.
const CHAT_URL = import.meta.env.VITE_CHAT_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5003');

const TrailMarkers = ({ campsite, onConditionChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [weather, setWeather] = useState({ temperature: null, code: null, label: 'Locating trail...', source: 'local' });
  const [time, setTime] = useState(new Date());

  const weatherLabel = (code) => {
    if (code === 0) return ['☀️', 'Clear skies'];
    if ([1, 2, 3].includes(code)) return ['⛅', 'Partly cloudy'];
    if ([45, 48].includes(code)) return ['🌫️', 'Low visibility'];
    if ([51, 53, 55, 56, 57, 61, 63, 65, 80, 81, 82].includes(code)) return ['🌧️', 'Rain on the trail'];
    if ([71, 73, 75, 77, 85, 86].includes(code)) return ['❄️', 'Snow conditions'];
    return ['🌩️', 'Storm watch'];
  };

  const refreshWeather = () => {
    if (!navigator.geolocation) { setWeather({ temperature: null, code: null, label: 'Location unavailable', source: 'fallback' }); return; }
    setWeather(previous => ({ ...previous, label: 'Updating trail...' }));
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=temperature_2m,weather_code&temperature_unit=celsius`);
        const data = await response.json();
        const [icon, label] = weatherLabel(data.current.weather_code);
        setWeather({ temperature: Math.round(data.current.temperature_2m), code: icon, label, source: 'live' });
      } catch { setWeather({ temperature: null, code: null, label: 'Weather signal offline', source: 'fallback' }); }
    }, () => setWeather({ temperature: null, code: null, label: 'Location off — camp status', source: 'fallback' }), { enableHighAccuracy: false, timeout: 8000, maximumAge: 900000 });
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    refreshWeather();
    const clock = window.setInterval(() => setTime(new Date()), 60000);
    return () => window.clearInterval(clock);
  }, [isOpen]);

  const condition = campsite?.trailStatus?.label || 'Clear Skies';

  return <>
    <button className="trail-markers-trigger" onClick={() => setIsOpen(true)} title="Trail Markers"><MapPin size={18} /></button>
    {isOpen && <div className="trail-markers-backdrop" onClick={() => setIsOpen(false)}>
      <section className="trail-markers-modal" onClick={event => event.stopPropagation()} aria-label="Trail Markers">
        <button className="trail-markers-close" onClick={() => setIsOpen(false)} aria-label="Close Trail Markers"><X size={17} /></button>
        <div className="trail-markers-heading"><span>⛺</span><strong>Trail Markers</strong><button onClick={refreshWeather} title="Refresh local weather">↻</button></div>
        <p className="trail-markers-subtitle">Weather is private to your device. Camp condition is shared with members.</p>
        <div className="trail-weather"><span className="trail-weather-icon">{weather.code || '◌'}</span><div><strong>{weather.temperature === null ? 'Local weather unavailable' : `${weather.temperature}°C`}</strong><small>{weather.temperature === null ? weather.label : weather.label}</small></div><time>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div>
        <button className="trail-location-btn" onClick={refreshWeather}>⌖ {weather.temperature === null ? 'Use my location for weather' : 'Refresh local weather'}</button>
        <div className="trail-condition-heading"><span>Basecamp condition</span><small>Shared</small></div>
        <div className="trail-condition-options">
          {['Clear Skies', 'Campfire Active', 'Trail Watch'].map(option => <button key={option} className={condition === option ? 'active' : ''} onClick={() => onConditionChange(option)}>{option}</button>)}
        </div>
      </section>
    </div>}
  </>;
};

const Basecamp = ({ isDarkMode, toggleTheme }) => {
  const navigate = useNavigate();
  const { activeTheme } = useTheme();

  // Socket ref — initialized once with the real token so it never connects with null auth
  const socketRef = useRef(null);
  if (!socketRef.current) {
    const token = localStorage.getItem('outpost_token');
    socketRef.current = io(CHAT_URL, {
      auth: { token: token || '' },
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });
  }
  const socket = socketRef.current;

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
  const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);
  const typingTimeoutRef = useRef(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCampOpsModalOpen, setIsCampOpsModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);
  const [starredMessageIds, setStarredMessageIds] = useState([]);
  const [messageInfo, setMessageInfo] = useState(null);
  const [forwardMessageIds, setForwardMessageIds] = useState([]);
  const [isForwardPickerOpen, setIsForwardPickerOpen] = useState(false);
  const chatInputRef = useRef(null);

  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveDropdownId(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const toggleDropdown = (id) => {
    setActiveDropdownId(prev => prev === id ? null : id);
  };

  const toggleMessageSelection = (id) => {
    setSelectedMessageIds(prev => prev.includes(id) ? prev.filter(messageId => messageId !== id) : [...prev, id]);
  };

  const toggleMessageStar = (id) => {
    setStarredMessageIds(prev => prev.includes(id) ? prev.filter(messageId => messageId !== id) : [...prev, id]);
  };

  const openForwardPicker = (messageIds) => {
    setForwardMessageIds(messageIds);
    setIsForwardPickerOpen(true);
    setActiveDropdownId(null);
  };

  const forwardMessagesToChannel = (target) => {
    const chosen = messages.filter(message => forwardMessageIds.includes(message._id || message.id));
    const channelKey = `${target.campsiteId}_${target.channel.id}`;
    const now = new Date();
    const forwarded = chosen.map((message, index) => ({
      channelKey,
      user: { username: currentUser?.username || 'Scout', profilePictureUrl: currentUser?.profilePictureUrl || '', level: currentUser?.level || 1 },
      time: 'Today at ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      text: `Forwarded from ${message.user?.username || message.user || 'Scout'}: ${message.text || message.body || ''}`,
      id: `local-forward-${now.getTime()}-${index}`,
      receivedAt: Date.now()
    }));
    setMessagesByChannel(prev => ({ ...prev, [channelKey]: [...(prev[channelKey] || []), ...forwarded] }));
    forwarded.forEach(message => socket?.connected && socket.emit('send_message', message));
    setSelectedMessageIds([]);
    setForwardMessageIds([]);
    setIsForwardPickerOpen(false);
  };

  const deleteSelectedMessages = () => {
    const ids = new Set(selectedMessageIds);
    const selected = messages.filter(message => ids.has(message._id || message.id));
    if (selected.some(message => starredMessageIds.includes(message._id || message.id)) && !window.confirm('One or more selected messages are starred. Do you want to delete them?')) return;
    setMessagesByChannel(prev => ({ ...prev, [currentChannelKey]: (prev[currentChannelKey] || []).filter(message => !ids.has(message._id || message.id)) }));
    selected.filter(message => (message.user?.username || message.user) === currentUser?.username && !String(message._id || message.id).startsWith('local-')).forEach(message => socket?.emit('delete_message_for_all', { messageId: message._id || message.id, channelKey: currentChannelKey, username: currentUser?.username || 'Scout' }));
    setSelectedMessageIds([]);
  };

  const handleLikeMessage = (msgId, channelKey) => {
    // Optimistic UI update
    setMessagesByChannel(prev => {
      const currentMessages = prev[channelKey] || [];
      const existingIndex = currentMessages.findIndex(m => (m._id || m.id) === msgId);
      if (existingIndex !== -1) {
        const updatedMessages = [...currentMessages];
        const msg = updatedMessages[existingIndex];
        const currentLikes = msg.likes || [];
        const hasLiked = currentLikes.includes(currentUser?.username);
        
        updatedMessages[existingIndex] = {
          ...msg,
          likes: hasLiked 
            ? currentLikes.filter(u => u !== currentUser?.username)
            : [...currentLikes, currentUser?.username]
        };
        
        return {
          ...prev,
          [channelKey]: updatedMessages
        };
      }
      return prev;
    });
    
    socket.emit("like_message", { messageId: msgId, channelKey, username: currentUser?.username || 'Scout' });
  };

  const handleReactMessage = (msgId, channelKey, emoji) => {
    const username = currentUser?.username || 'Scout';
    // Optimistic UI update
    setMessagesByChannel(prev => {
      const currentMessages = prev[channelKey] || [];
      const existingIndex = currentMessages.findIndex(m => (m._id || m.id) === msgId);
      if (existingIndex !== -1) {
        const updatedMessages = [...currentMessages];
        const msg = updatedMessages[existingIndex];
        const currentReactions = (msg.reactions || []).map(r => ({ ...r, users: [...r.users] }));
        const reactionIndex = currentReactions.findIndex(r => r.emoji === emoji);
        if (reactionIndex > -1) {
          const userIndex = currentReactions[reactionIndex].users.indexOf(username);
          if (userIndex > -1) {
            currentReactions[reactionIndex].users.splice(userIndex, 1);
            if (currentReactions[reactionIndex].users.length === 0) {
              currentReactions.splice(reactionIndex, 1);
            }
          } else {
            currentReactions[reactionIndex].users.push(username);
          }
        } else {
          currentReactions.push({ emoji, users: [username] });
        }
        updatedMessages[existingIndex] = { ...msg, reactions: currentReactions };
        return { ...prev, [channelKey]: updatedMessages };
      }
      return prev;
    });
    socket.emit("react_message", { messageId: msgId, channelKey, emoji, username });
  };

  const handlePinMessage = (msg, channelKey) => {
    const isPinnedNow = !msg.isPinned;
    const msgId = msg._id || msg.id;
    setMessagesByChannel(prev => {
      const currentMessages = prev[channelKey] || [];
      const existingIndex = currentMessages.findIndex(m => (m._id || m.id) === msgId);
      if (existingIndex !== -1) {
        const updatedMessages = [...currentMessages];
        updatedMessages[existingIndex] = { ...msg, isPinned: isPinnedNow };
        return { ...prev, [channelKey]: updatedMessages };
      }
      return prev;
    });

    if (isPinnedNow) {
      setPinnedMessages(prev => {
        const exists = prev.some(m => (m.id || m._id) === msgId);
        if (exists) return prev;
        return [{ ...msg, isPinned: true }, ...prev];
      });
    } else {
      setPinnedMessages(prev => prev.filter(m => (m.id || m._id) !== msgId));
    }

    socket.emit("pin_message", { messageId: msgId, channelKey, isPinned: isPinnedNow });
  };
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

  // User identity
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('outpost_user');
    if (!saved || saved === 'undefined' || saved === 'null') return null;
    try { return JSON.parse(saved); } catch (e) { return null; }
  });

  // Validate session on mount
  useEffect(() => {
    const saved = localStorage.getItem('outpost_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Fetch latest restriction status from backend
      fetch(`${(import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002'))}/api/users`)
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

  // Keep currentUser fresh from localStorage/backend syncs
  useEffect(() => {
    const interval = setInterval(() => {
      const saved = localStorage.getItem('outpost_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed.profilePictureUrl !== currentUser?.profilePictureUrl || 
          parsed.username !== currentUser?.username ||
          parsed.level !== currentUser?.level ||
          parsed.xp !== currentUser?.xp
        ) {
          setCurrentUser(parsed);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Refresh socket auth token when it changes (e.g., after OAuth login)
  // This ensures the socket always connects with a valid JWT, never with null
  useEffect(() => {
    const token = localStorage.getItem('outpost_token');
    if (!token || !socket) return;

    if (socket.auth.token !== token) {
      socket.auth.token = token;
      // If currently disconnected, reconnect with fresh credentials
      if (!socket.connected) {
        socket.connect();
      }
    }
  }, [currentUser, socket]);

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
        { id: 'Ai-Scout', name: 'Ai-Scout', type: 'text' },
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

  const [messagesByChannel, setMessagesByChannel] = useState(() => {
    try {
      const saved = localStorage.getItem('outpost_cached_messages');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse cached messages from localStorage', e);
    }
    return {};
  });

  useEffect(() => {
    try {
      const trimmed = {};
      Object.keys(messagesByChannel).forEach(key => {
        const msgs = messagesByChannel[key];
        if (Array.isArray(msgs)) {
          trimmed[key] = msgs.slice(-100);
        }
      });
      localStorage.setItem('outpost_cached_messages', JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to cache messages to localStorage', e);
    }
  }, [messagesByChannel]);

  const [discoverRefreshTrigger, setDiscoverRefreshTrigger] = useState(0);


  const activeCampsite = campsites && campsites.length > 0 ? (campsites.find(c => c.active) || campsites[0]) : null;
  const expeditions = activeCampsite?.expeditions || [];
  const currentCampsiteId = activeCampsite?.id || activeCampsite?._id || 'global';
  const currentChannelKey = activeCampsite ? `${currentCampsiteId}_${activeChannel}` : 'fallback';
  const handleTrailConditionChange = async (label) => {
    if (!activeCampsite) return;
    const campsiteId = activeCampsite._id || activeCampsite.id;
    const trailStatus = { label, updatedBy: currentUser?.username || 'Scout', updatedAt: new Date().toISOString() };
    setCampsites(prev => prev.map(campsite => String(campsite._id || campsite.id) === String(campsiteId) ? { ...campsite, trailStatus } : campsite));
    try {
      const token = localStorage.getItem('outpost_token');
      const apiBase = import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002');
      const response = await fetch(`${apiBase}/api/campsites/${campsiteId}/trail-status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ label, username: currentUser?.username || 'Scout' }) });
      if (!response.ok) throw new Error('Trail status service unavailable');
    } catch (error) {
      console.warn('[Trail Markers] Status saved locally only:', error.message);
    }
  };
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isPinPopupOpen, setIsPinPopupOpen] = useState(false);
  
  // Spotify Chill Zone State
  const [isMusicOpen, setIsMusicOpen] = useState(false);
  const [isMusicMinimized, setIsMusicMinimized] = useState(false);
  const [isSpotifyLoggedIn, setIsSpotifyLoggedIn] = useState(false);
  const [selectedPlaylistUrl, setSelectedPlaylistUrl] = useState("https://open.spotify.com/embed/playlist/37i9dQZF1DX2pSTOxoPbx9?utm_source=generator"); // Chill Jazz default (verified working)

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
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const pinnedCount = pinnedMessages.length;
  
  const handleTogglePinPopup = () => {
    setIsPinPopupOpen(prev => !prev);
    setIsAlertOpen(false);
    setIsAIOpen(false);
  };

  const changeViewChannelCallback = (campsiteId, channelId) => {
    setCampsites(prev => prev.map(c => ({
      ...c,
      active: c.id === campsiteId || String(c._id) === String(campsiteId)
    })));
    const pureChannel = channelId.split('_').slice(1).join('_');
    setActiveChannel(pureChannel);
  };

  const { alerts, setAlerts, handleSelectNotification } = useSignalRadar(socket, currentChannelKey, setSelectedPopupAlert, currentUser);

  // Helper to map DB/Socket payload into unified frontend message structure with accurate timestamp
  const parseIncomingMessage = (m, fallbackChannelKey = currentChannelKey) => {
    let safeTime = m.time || '';
    let safeReceivedAt = Date.now();

    if (m.createdAt) {
      const d = new Date(m.createdAt);
      if (!isNaN(d.getTime())) {
        if (!safeTime) {
          safeTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        safeReceivedAt = d.getTime();
      }
    } else if (m.receivedAt && !isNaN(new Date(m.receivedAt).getTime())) {
      safeReceivedAt = new Date(m.receivedAt).getTime();
    } else if (m.timestamp && !isNaN(new Date(m.timestamp).getTime())) {
      safeReceivedAt = new Date(m.timestamp).getTime();
    }

    let safeUser = m.user;
    if (!safeUser || typeof safeUser !== 'object') {
      safeUser = { username: m.username || (typeof m.user === 'string' ? m.user : 'Scout'), profilePictureUrl: m.profilePictureUrl || null };
    }

    const generateSecureId = () => {
      if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
      }
      return Date.now().toString(36) + Math.abs(Date.now() ^ 0x12345678).toString(36);
    };

    return {
      id: m.id || m._id || generateSecureId(),
      channelKey: m.channelKey || m.channel || fallbackChannelKey,
      user: safeUser,
      text: m.text || m.content || '',
      time: safeTime || 'Just now',
      receivedAt: safeReceivedAt,
      type: m.type || 'text',
      mediaType: m.mediaType,
      body: m.body,
      pollData: m.pollData,
      replyTo: m.replyTo,
      isPinned: m.isPinned || false,
      likes: m.likes || [],
      reactions: m.reactions || []
    };
  };

  const fetchPins = async () => {
    try {
      const token = localStorage.getItem('outpost_token');
      const apiBase = CHAT_URL || import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5003');
      const res = await fetch(`${apiBase}/api/messages/pins`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const apiData = await res.json();
        if (Array.isArray(apiData)) {
          setPinnedMessages(apiData.map(m => parseIncomingMessage(m, m.channelKey)));
        }
      }
    } catch (err) {
      console.warn("Failed to fetch pinned messages:", err);
    }
  };

  useEffect(() => {
    fetchPins();
  }, [currentChannelKey]);

  // Fetch messages using Dual-Tier Architecture (Primary Backend API + Supabase Backup)
  useEffect(() => {
    setIsFetchingMessages(true);
    
    const fetchMessages = async () => {
      let fetchedMsgs = null;

      // 1. Primary: Fetch from Node.js Chat Server REST API
      try {
        const token = localStorage.getItem('outpost_token');
        const apiBase = CHAT_URL || import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5003');
        const res = await fetch(`${apiBase}/api/messages/${currentChannelKey}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (res.ok) {
          const apiData = await res.json();
          if (Array.isArray(apiData)) {
            fetchedMsgs = apiData.map(m => parseIncomingMessage(m, currentChannelKey));
          }
        }
      } catch (err) {
        console.warn("Backend API message fetch attempt failed, trying Supabase fallback...", err);
      }

      // 2. Secondary: Fallback to Supabase if primary failed or returned null
      if (fetchedMsgs === null) {
        try {
          const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('channelKey', currentChannelKey)
            .order('createdAt', { ascending: true });

          if (!error && Array.isArray(data)) {
            fetchedMsgs = data.map(m => parseIncomingMessage(m, currentChannelKey));
          }
        } catch (err) {
          console.warn("Supabase message fetch fallback failed:", err);
        }
      }

      if (fetchedMsgs !== null) {
        setMessagesByChannel(prev => {
          const existing = prev[currentChannelKey] || [];
          const fetchedIds = new Set(fetchedMsgs.map(m => String(m.id || m._id)));
          // Keep local-only optimistic messages not yet confirmed by the server
          const localOnly = existing.filter(m => {
            const id = String(m.id || m._id || '');
            return id.startsWith('local-') && !fetchedIds.has(id);
          });
          const merged = [...fetchedMsgs, ...localOnly].sort(
            (a, b) => (a.receivedAt || 0) - (b.receivedAt || 0)
          );
          return { ...prev, [currentChannelKey]: merged };
        });
      }

      setIsFetchingMessages(false);
    };

    fetchMessages();

    // Subscribe to Supabase Real-time messages with a unique channel name
    const messageSubscription = supabase
      .channel(`public:messages:${currentChannelKey}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channelKey=eq.${currentChannelKey}` }, payload => {
        const mappedMsg = parseIncomingMessage(payload.new, currentChannelKey);
        
        setMessagesByChannel(prev => {
          const current = prev[currentChannelKey] || [];
          const exists = current.some(m => (m._id === mappedMsg.id || m.id === mappedMsg.id));
          if (exists) return prev;
          return { ...prev, [currentChannelKey]: [...current, mappedMsg] };
        });
      })
      .subscribe();

    // Join the socket room
    socket.emit('join_channel', currentChannelKey);
    setActiveTypers([]); // Reset typers when changing channels
    
    // Auto re-join on reconnect
    const handleReconnect = () => {
      socket.emit('join_channel', currentChannelKey);
      if (currentUser?.email) {
        socket.emit('join_admin_room', currentUser?.email);
      }
      if (currentUser?.username) {
        socket.emit('join_user_room', currentUser?.username);
      }
    };
    socket.on('connect', handleReconnect);
    
    return () => {
      socket.off('connect', handleReconnect);
      supabase.removeChannel(messageSubscription);
    };
  }, [currentChannelKey, currentUser]);

  useEffect(() => {
    const handleMessageLiked = (data) => {
      setMessagesByChannel(prev => {
        const currentMessages = prev[data.channelKey] || [];
        const existingIndex = currentMessages.findIndex(m => (m._id || m.id) === data.messageId);
        if (existingIndex !== -1) {
          const updatedMessages = [...currentMessages];
          updatedMessages[existingIndex] = { ...updatedMessages[existingIndex], likes: data.likes };
          return {
            ...prev,
            [data.channelKey]: updatedMessages
          };
        }
        return prev;
      });
    };

    const handleMessageReacted = (data) => {
      setMessagesByChannel(prev => {
        const currentMessages = prev[data.channelKey] || [];
        const existingIndex = currentMessages.findIndex(m => (m._id || m.id) === data.messageId);
        if (existingIndex !== -1) {
          const updatedMessages = [...currentMessages];
          updatedMessages[existingIndex] = { ...updatedMessages[existingIndex], reactions: data.reactions };
          return { ...prev, [data.channelKey]: updatedMessages };
        }
        return prev;
      });
    };

    socket.on('message_liked', handleMessageLiked);
    socket.on('message_reacted', handleMessageReacted);
    return () => {
      socket.off('message_liked', handleMessageLiked);
      socket.off('message_reacted', handleMessageReacted);
    };
  }, []);

  useEffect(() => {
    if (campsites && campsites.length > 0) {
      campsites.forEach(camp => {
        socket.emit('join_campsite_room', camp.id);
      });
    }
    if (activeCampsite) {
      setActiveMembersList(activeCampsite.members || []);
    }
  }, [campsites, activeCampsite]);

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
      fetch(`${(import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002'))}/api/health`).catch(err => {});
    }, 10 * 60 * 1000); // 10 minutes
    
    return () => clearInterval(interval);
  }, []);

  // Listen for real-time messages and member events
  useEffect(() => {
    const handleReceiveMessage = (newMessage) => {
      setMessagesByChannel(prev => {
        const currentMessages = prev[newMessage.channelKey] || [];
        const incomingId = newMessage._id || newMessage.id;
        
        // Find if we already have this exact message (either by real ID or optimistic match)
        const existingIndex = currentMessages.findIndex(m => 
          (m._id === incomingId || m.id === incomingId) || 
          (String(m.id).startsWith('local-') && m.text === newMessage.text && (m.user?.username === newMessage.user?.username || m.user === newMessage.user))
        );

        if (existingIndex !== -1) {
          // Update the optimistic message with the real MongoDB ID and data
          const updatedMessages = [...currentMessages];
          updatedMessages[existingIndex] = { ...newMessage, receivedAt: currentMessages[existingIndex].receivedAt || Date.now() };
          return {
            ...prev,
            [newMessage.channelKey]: updatedMessages
          };
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
      
      // Update localStorage and state so the new level persists across refresh
      const saved = localStorage.getItem('outpost_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.level = newLevel;
        parsed.xp = xp;
        localStorage.setItem('outpost_user', JSON.stringify(parsed));
        setCurrentUser(prev => ({ ...prev, level: newLevel, xp }));
      }
      
      setTimeout(() => setLevelUpData(null), 6000); // hide celebration after 6 seconds
    };

    // Sync XP + Level on every message (not just on level-up)
    const handleXpUpdate = ({ level, xp }) => {
      const saved = localStorage.getItem('outpost_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.level = level;
        parsed.xp = xp;
        localStorage.setItem('outpost_user', JSON.stringify(parsed));
        setCurrentUser(prev => ({ ...prev, level, xp }));
      }
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

    const handleMessagePinned = ({ messageId, channelKey, isPinned }) => {
      setMessagesByChannel(prev => {
        const currentMessages = prev[channelKey] || [];
        const updated = currentMessages.map(msg => {
          if ((msg._id || msg.id) === messageId) {
            return { ...msg, isPinned };
          }
          return msg;
        });
        return { ...prev, [channelKey]: updated };
      });

      if (isPinned) {
        // If pinned, try to find the full message in messagesByChannel to add it, or fall back to fetchPins()
        setPinnedMessages(prev => {
          const exists = prev.some(m => (m.id || m._id) === messageId);
          if (exists) return prev;
          
          // Look for it in the channel messages
          const currentChannelMessages = messagesByChannel[channelKey] || [];
          const found = currentChannelMessages.find(m => (m.id || m._id) === messageId);
          if (found) {
            return [{ ...found, isPinned: true }, ...prev];
          }
          // If not in cache, refetch pins to be accurate
          fetchPins();
          return prev;
        });
      } else {
        setPinnedMessages(prev => prev.filter(m => (m.id || m._id) !== messageId));
      }
    };
    socket.on("message_pinned", handleMessagePinned);

    const handleMessageDeleted = ({ messageId, channelKey }) => {
      setMessagesByChannel(prev => {
        const currentMessages = prev[channelKey] || [];
        return {
          ...prev,
          [channelKey]: currentMessages.filter(m => (m._id || m.id) !== messageId)
        };
      });
      setPinnedMessages(prev => prev.filter(m => (m.id || m._id) !== messageId));
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
      setPinnedMessages(prev => prev.map(msg => 
        (msg.id || msg._id) === payload.messageId
          ? {
              ...msg,
              text: payload.replacementText,
              isSystemDeleted: true
            }
          : msg
      ));
    };

    const handleOperatorPurge = (payload) => {
      alert(payload.message);
      window.location.href = "/"; // Instantly route them back safely
    };

    const handleKicked = (data) => {
      setKickNotification(`⚠️ KICKED: ${data.message}`);
      
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

    const handlePermissionDenied = (data) => {
      alert(`⚠️ ${data.message}`);
    };

    const handleServerAlert = (data) => {
      alert(`⚠️ ${data.message}`);
    };

    socket.on("scout-joined-list", handleScoutJoinedList);
    socket.on("campsite-admin-notification", handleAdminNotification);
    socket.on("level_up_alert", handleLevelUp);
    socket.on("xp_update", handleXpUpdate);
    socket.on("broadcast-updated-vote", handleUpdatedVote);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("operator-erasure-cascade", handleOperatorErasure);
    socket.on("operator-basecamp-purge", handleOperatorPurge);
    socket.on("user_kicked", handleKicked);
    socket.on("user_banned", handleBanned);
    socket.on("global-restricted", handleGlobalRestricted);
    socket.on("permission_denied", handlePermissionDenied);
    socket.on("server_alert", handleServerAlert);
    socket.on("new_public_campsite", () => {
      setDiscoverRefreshTrigger(prev => prev + 1);
    });

    const handleCampsiteUpdated = (updatedCampsite) => {
      setCampsites(prev => prev.map(c => (c._id || c.id) === (updatedCampsite._id || updatedCampsite.id) ? { ...c, ...updatedCampsite } : c));
    };
    socket.on('campsite_updated', handleCampsiteUpdated);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off("broadcast-typing-start", handleTypingStart);
      socket.off("broadcast-typing-stop", handleTypingStop);
      socket.off("scout-joined-list", handleScoutJoinedList);
      socket.off("campsite-admin-notification", handleAdminNotification);
      socket.off("level_up_alert", handleLevelUp);
      socket.off("xp_update", handleXpUpdate);
      socket.off("broadcast-updated-vote", handleUpdatedVote);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("operator-erasure-cascade", handleOperatorErasure);
      socket.off("operator-basecamp-purge", handleOperatorPurge);
      socket.off("user_kicked", handleKicked);
      socket.off("user_banned", handleBanned);
      socket.off("global-restricted", handleGlobalRestricted);
      socket.off("permission_denied", handlePermissionDenied);
      socket.off("server_alert", handleServerAlert);
      socket.off("new_public_campsite");
      socket.off("campsite_updated", handleCampsiteUpdated);
    };
  }, [currentChannelKey]);

  useEffect(() => {
    if (!currentUser || !currentUser.username || !currentUser.email) return;

    fetch(`${(import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002'))}/api/campsites/user/${currentUser.username}/${currentUser.email}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const formattedCamps = data.map(camp => ({
            ...camp,
            id: camp._id || camp.id,
            active: (camp._id || camp.id) === (activeCampsite ? activeCampsite.id : 1)
          }));
          setCampsites(prev => {
            let hq = prev.find(c => c.id === 1);
            
            // Always ensure Outpost HQ has the Ai-Scout channel and explicitly remove the old ai-nexus
            if (hq) {
              const cleanedExpeditions = (hq.expeditions || []).filter(e => e.id !== 'community-chat' && e.id !== 'ai-nexus' && e.id !== 'Ai-Scout');
              hq = {
                ...hq,
                expeditions: [
                  { id: 'community-chat', name: 'community-chat', type: 'text' },
                  { id: 'Ai-Scout', name: 'Ai-Scout', type: 'text' },
                  ...cleanedExpeditions
                ]
              };
            }
            
            // Only show campsites the user is a member of in the sidebar
            const merged = [...formattedCamps];
            
            return hq ? [hq, ...merged] : merged;
          });
        }
      })
      .catch(err => console.warn("Backend offline, utilizing cached/default campsites.", err));
  }, [currentUser?.username, currentUser?.email, activeCampsite?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputText.trim()) {
      // The AI Ranger check was blocking message sending and causing lag because the endpoint doesn't exist.
      // We skip this check to fix the message sending delay.
      /*
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
      */

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
      
      // Optimistic UI logic re-enabled to fix delay issue
      const optimisticMsg = { ...messageData, id: 'local-' + Date.now(), receivedAt: Date.now() };
      setMessagesByChannel(prev => {
        const current = prev[currentChannelKey] || [];
        return { ...prev, [currentChannelKey]: [...current, optimisticMsg] };
      });
      
      if (socket && socket.connected) {
        socket.emit("send_message", messageData);
      } else {
        // Socket not connected — try to reconnect with a fresh token and queue the message
        console.warn('[Outpost] Socket disconnected when sending message. Reconnecting...');
        const freshToken = localStorage.getItem('outpost_token');
        if (freshToken && socket) {
          socket.auth.token = freshToken;
          socket.connect();
          // Retry after reconnect
          socket.once('connect', () => {
            socket.emit('send_message', messageData);
          });
        }
      }

      if (socket && socket.connected) {
        socket.emit("scout-typing-stop", { 
          channelId: currentChannelKey, 
          scoutName: currentUser?.username || 'Scout' 
        });
      }
      
      // Multi-player AI Nexus Interception
      if (currentChannelKey === '1_Ai-Scout') {
        const token = localStorage.getItem('outpost_token');
        const aiApiBase = import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002');
        fetch(aiApiBase + '/api/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            message: messageData.text,
            channelKey: currentChannelKey
          })
        })
        .then(async res => {
          const data = await res.json();
          if (!res.ok) {
            console.error('AI Error Response:', data);
            return;
          }
          // Inject AI response directly from HTTP as guaranteed fallback
          // (Socket.io room event may not arrive if user wasn't in the room)
          if (data.success && data.message) {
            const aiMsg = data.message;
            setMessagesByChannel(prev => {
              const channelMsgs = prev['1_Ai-Scout'] || [];
              const alreadyExists = channelMsgs.some(m => (m._id || m.id) === (aiMsg._id || aiMsg.id));
              if (alreadyExists) return prev;
              return {
                ...prev,
                '1_Ai-Scout': [...channelMsgs, { ...aiMsg, receivedAt: Date.now() }]
              };
            });
          }
        })
        .catch(err => console.error("AI Communication Failure:", err));
      }
      
      // Stop typing
      debouncedTypingStop.cancel();
      setIsTyping(false);

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

    // Client-side image compression to avoid WebSocket 1MB frame limits
    if (fileType === 'image') {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        // Max dimension 800px
        const maxDim = 800;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        messageData.body = canvas.toDataURL('image/jpeg', 0.7);
        emitOrAppend(messageData);
      };
      img.src = base64Data;
    } else {
      emitOrAppend(messageData);
    }

    function emitOrAppend(finalMessageData) {
      if (socket && socket.connected) {
        socket.emit('send_message', finalMessageData);
      } else {
        console.warn("Socket offline, appending media message locally.");
        const localMessage = { ...finalMessageData, id: 'local-' + Date.now() };
        setMessagesByChannel(prev => {
          const current = prev[currentChannelKey] || [];
          return { ...prev, [currentChannelKey]: [...current, localMessage] };
        });
      }
    }
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
    if (socket && socket.connected) {
      socket.emit('send_message', messageData);
    } else {
      console.warn("Socket offline, appending poll message locally.");
      const localMessage = { ...messageData, id: 'local-' + Date.now() };
      setMessagesByChannel(prev => {
        const current = prev[currentChannelKey] || [];
        return { ...prev, [currentChannelKey]: [...current, localMessage] };
      });
    }
  };

  const handleVoteSubmission = (messageId, optionIndex) => {
    socket.emit("submit-scout-vote", { 
      messageId, 
      channelKey: currentChannelKey, 
      optionIndex, 
      scoutId: currentUser?.username || 'Scout' 
    });
  };

  const debouncedTypingStop = React.useMemo(
    () => debounce((channelKey, username) => {
      setIsTyping(false);
      socket.emit("scout-typing-stop", { 
        channelId: channelKey, 
        scoutName: username 
      });
    }, 1500),
    []
  );

  useEffect(() => {
    return () => {
      debouncedTypingStop.cancel();
    };
  }, [debouncedTypingStop]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      socket.emit("scout-typing-start", { 
        channelId: currentChannelKey, 
        scoutName: currentUser?.username || 'Scout' 
      });
    }

    debouncedTypingStop(currentChannelKey, currentUser?.username || 'Scout');
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
      imageUrl: data.imageUrl || '',
      members: [currentUser?.username || 'Scout'], // Creator is automatically a member
      expeditions: newExpeditions
    };

    fetch(`${(import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002'))}/api/campsites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('outpost_token')}`
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
      // Instantly add to local sidebar and make it active
      setCampsites(prev => {
        const disabledPrev = prev.map(c => ({...c, active: false}));
        const normalizedCamp = { ...savedData, id: savedData._id || savedData.id, active: true };
        return [...disabledPrev, normalizedCamp];
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
      console.warn("Backend offline, creating outpost locally:", err);
      
      if (err.message && err.message.toLowerCase().includes('globally restricted')) {
        setJoinNotification(`🚫 ACCESS DENIED: ${err.message}`);
        setTimeout(() => setJoinNotification(null), 6000);
        const updatedUser = { ...currentUser, isGloballyRestricted: true };
        setCurrentUser(updatedUser);
        localStorage.setItem('outpost_user', JSON.stringify(updatedUser));
        return;
      }
      
      // Fallback: update local UI for offline demo mode
      const mockOutpost = {
        ...newCampData,
        id: 'local-' + Date.now(),
        members: [currentUser?.username || 'Scout'],
        expeditions: [{ id: 'general', name: 'general', type: 'text' }],
        roles: [{ name: 'Commander', color: '#ffb732' }, { name: 'Scout', color: '#4facfe' }],
        memberRoles: { [currentUser?.username || 'Scout']: 'Commander' },
        active: true
      };
      
      setCampsites(prev => {
        const disabledPrev = prev.map(c => ({...c, active: false}));
        return [...disabledPrev, mockOutpost];
      });
      setActiveCampsite(mockOutpost);
      setActiveChannel('general');
      setIsCreateModalOpen(false);
    });
    
    setIsCreateModalOpen(false);
  };

  const handleDeleteCampsite = (campId) => {
    fetch(`${(import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002'))}/api/campsites/${campId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('outpost_token')}`
      }
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
    .catch(err => {
      console.warn("Backend offline, deleting campsite locally:", err);
      setCampsites(prev => {
        const filtered = prev.filter(c => c.id !== campId);
        if (filtered.length > 0) {
          filtered[0].active = true;
          const firstText = filtered[0].expeditions?.find(e => e.type === 'text');
          if (firstText) setActiveChannel(firstText.id);
        }
        return filtered;
      });
    });
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
        const response = await fetch(`${(import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002'))}/api/users/global-restrict`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('outpost_token')}` },
          body: JSON.stringify({ targetUsername: username })
        });
        const data = await response.json();
        if (!response.ok) { alert(data.error || 'Failed to kick user from HQ'); return; }
        
        socket.emit('kick_user_event', { username, campsiteId: 1, message: 'Developer has kicked you from Outpost HQ' });
        setActiveMembersList(prev => prev.filter(m => m !== username && m.username !== username));
        alert(`${username} kicked from Outpost HQ`);
        return;
      }

      const response = await fetch(`${(import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002'))}/api/campsites/${activeCampsite.id}/kick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('outpost_token')}` },
        body: JSON.stringify({ username })
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || data.error || 'Failed to kick user');
        return;
      }
      
      const isGlobalAdmin = currentUser?.email?.toLowerCase()?.trim() === 'harshitmehta1012@gmail.com';
      const actor = isGlobalAdmin ? 'Developer' : 'Admin';

      socket.emit('kick_user_event', { 
        username, 
        campsiteId: activeCampsite.id,
        message: `${actor} has kicked you`
      });

      setActiveMembersList(prev => prev.filter(m => m !== username && m.username !== username));
      alert(data.message);
    } catch (err) {
      console.warn("Backend offline, simulating kick locally:", err);
      setActiveMembersList(prev => prev.filter(m => m !== username && m.username !== username));
      alert(`${username} kicked offline`);
    }
  };

  const handleBanMember = async (username) => {
    try {
      if (activeCampsite.id === 1) {
        // Outpost HQ special ban -> Global Restrict
        const response = await fetch(`${(import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002'))}/api/users/global-restrict`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('outpost_token')}` },
          body: JSON.stringify({ targetUsername: username })
        });
        const data = await response.json();
        if (!response.ok) { alert(data.error || 'Failed to ban user from HQ'); return; }
        
        socket.emit('ban_user_event', { username, campsiteId: 1, message: 'Developer has globally banned you from Outpost HQ' });
        setActiveMembersList(prev => prev.filter(m => m !== username && m.username !== username));
        alert(`${username} banned from Outpost HQ`);
        return;
      }

      const response = await fetch(`${(import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002'))}/api/campsites/${activeCampsite.id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('outpost_token')}` },
        body: JSON.stringify({ username })
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || data.error || 'Failed to ban user');
        return;
      }
      
      const isGlobalAdmin = currentUser?.email?.toLowerCase()?.trim() === 'harshitmehta1012@gmail.com';
      const actor = isGlobalAdmin ? 'Developer' : 'Admin';

      socket.emit('ban_user_event', { 
        username, 
        campsiteId: activeCampsite.id,
        message: `${actor} has banned you`
      });

      setActiveMembersList(prev => prev.filter(m => m !== username && m.username !== username));
      alert(data.message);
    } catch (err) {
      console.warn("Backend offline, simulating ban locally:", err);
      setActiveMembersList(prev => prev.filter(m => m !== username && m.username !== username));
      alert(`${username} banned offline`);
    }
  };

  const handleGlobalBan = async (username) => {
    try {
      const response = await fetch(`${(import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002'))}/api/users/global-restrict`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('outpost_token')}` },
        body: JSON.stringify({ targetUsername: username })
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Failed to issue Global Ban');
        return;
      }
      
      alert(data.message);
    } catch (err) {
      console.warn("Backend offline, simulating global ban locally:", err);
      alert(`${username} globally banned offline`);
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
    fetch(`${(import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002'))}/api/campsites/${campId}/leave`, {
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
    .catch(err => {
      console.warn("Backend offline, leaving campsite locally:", err);
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
    });
  };

  const handleUpdateCampsite = (campId, updates) => {
    setCampsites(prev => prev.map(c => {
      if (c.id === campId || c._id === campId) {
        return { ...c, ...updates };
      }
      return c;
    }));
  };

  const handleOperatorEraseMessage = async (msgId) => {
    try {
      await fetch(`${(import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002'))}/api/operator/erase-message/${msgId}`, {
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
      console.warn("Backend offline, simulating Operator Erase locally:", err);
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
    }
  };

  const handleOperatorDecommissionCampsite = async (campId) => {
    try {
      await fetch(`${(import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002'))}/api/operator/decommission-campsite/${campId}`, {
        method: "DELETE",
        headers: {
          "x-operator-email": currentUser?.email
        }
      });
    } catch (err) {
      console.warn("Backend offline, simulating Operator Decommission locally:", err);
      // Remove campsite visually from sidebar
      setCampsites(prev => {
        const filtered = prev.filter(c => c.id !== campId);
        if (filtered.length > 0 && activeCampsite?.id === campId) {
          filtered[0].active = true;
          const firstText = filtered[0].expeditions?.find(e => e.type === 'text');
          if (firstText) setActiveChannel(firstText.id);
        }
        return filtered;
      });
    }
  };

  // Determine if the current user is an admin for the active campsite
  const normalizedUserEmail = currentUser?.email?.toLowerCase()?.trim();
  const isGlobalAdmin = normalizedUserEmail === 'harshitmehta1012@gmail.com';
  const isCampAdmin = activeCampsite?.id === 1 
    ? isGlobalAdmin 
    : (activeCampsite?.adminEmail?.toLowerCase()?.trim() === normalizedUserEmail || isGlobalAdmin);

  const handleLogout = async () => {
    localStorage.removeItem('outpost_user'); 
    localStorage.removeItem('outpost_token');
    localStorage.removeItem('outpost_campsites');
    localStorage.removeItem('outpost_messages');
    localStorage.removeItem('oauth_in_progress');
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Supabase signout failed:", e);
    }
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
              <h3 style={{ color: 'var(--accent-primary)', marginBottom: '16px' }}>Delete Content?</h3>
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
                      // Always delete from local state immediately for instant UI feedback
                      setMessagesByChannel(prev => {
                        const currentMessages = prev[messageToDelete.channelKey] || [];
                        return {
                          ...prev,
                          [messageToDelete.channelKey]: currentMessages.filter(m => (m._id || m.id) !== messageToDelete.id)
                        };
                      });
                      // Fire socket to delete on server + for all other users (only if we have a real DB ID)
                      if (!String(messageToDelete.id).startsWith('local-')) {
                        socket.emit("delete_message_for_all", { 
                          messageId: messageToDelete.id, 
                          channelKey: messageToDelete.channelKey,
                          username: currentUser?.username || 'Scout'
                        });
                      }
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
              onBack={() => setShowDiscover(false)}
              onJoinCampsite={(camp) => {
              fetch(`${(import.meta.env.VITE_CORE_API_URL || (import.meta.env.PROD ? 'https://outpost-app.onrender.com' : 'http://localhost:5002'))}/api/campsites/${camp.id}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: currentUser?.username || 'Scout' })
              })
              .then(async res => {
                const data = await res.json();
                if (!res.ok) {
                  // This handles 403 Forbidden (e.g. user was kicked)
                  setKickNotification(`🚫 ACCESS DENIED: ${data.message}`);
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
              .catch(err => {
                console.warn("Backend offline, joining campsite locally:", err);
                setCampsites(prev => {
                  const exists = prev.find(c => c.id === camp.id);
                  if (exists) {
                    return prev.map(c => ({ ...c, active: c.id === camp.id }));
                  }
                  return [...prev.map(c => ({...c, active: false})), { ...camp, active: true }];
                });
                setActiveChannel('lobby');
                setShowDiscover(false);
                setJoinNotification(`🏕️ Offline Mode: You've joined ${camp.name} locally!`);
                setTimeout(() => setJoinNotification(null), 4000);
              });
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

              <div 
                className={`expedition-item ${activeChannel === 'Basecamp-Board' ? 'active' : ''}`}
                onClick={() => setActiveChannel('Basecamp-Board')}
                style={{ marginBottom: '8px', borderLeft: '2px solid var(--accent-primary)', backgroundColor: activeChannel === 'Basecamp-Board' ? 'var(--bg-active)' : 'transparent' }}
              >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Pin size={18} className="exp-icon" style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ fontWeight: '600' }}>Basecamp Board</span>
                </div>
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
                <img src={currentUser?.profilePictureUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Scout'} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
        
        {/* Scout-Guardian Security Badge */}
        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--border)', background: 'rgba(0, 0, 0, 0.2)', fontSize: '0.75rem', color: 'var(--text-secondary)' }} title="Scout-Guardian is actively protecting your session.">
          <Shield size={14} color="#059669" />
          <span style={{ fontWeight: '600', letterSpacing: '0.5px' }}>Protected by Scout-Guardian</span>
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
              <Menu size={20} style={{ color: 'var(--text-primary)' }} />
            </button>
            <button 
              className="icon-btn menu-toggle-btn mobile-only" 
              onClick={() => setIsMobileDrawerOpen(true)}
              title="Toggle Mobile Sidebar"
            >
              <Menu size={20} style={{ color: 'var(--text-primary)' }} />
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
            {/* SPOTIFY MUSIC CHILL ZONE TRIGGER */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setActiveChannel('Chill-Zone');
                  setIsPinPopupOpen(false);
                  setIsAlertOpen(false);
                  setIsAIOpen(false);
                }}
                className={`theme-trigger-btn ${activeChannel === 'Chill-Zone' ? 'active music-active' : ''}`}
                title="Chill Zone (Spotify)"
              >
                <Music size={18} />
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <button
                onClick={handleTogglePinPopup}
                className={`theme-trigger-btn ${isPinPopupOpen ? 'active pin-active' : ''}`}
                title="Pinned Messages"
              >
                <Pin size={18} />
                {pinnedCount > 0 && <span className="pin-badge">{pinnedCount}</span>}
              </button>
            </div>
            <TrailMarkers campsite={activeCampsite} onConditionChange={handleTrailConditionChange} />
            {/* NOTIFICATION BELL OUTSIDE SYSTEM TOOLS */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setIsAlertOpen(!isAlertOpen);
                  setIsAIOpen(false);
                  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
                    Notification.requestPermission();
                  }
                }}
                className={`theme-trigger-btn ${isAlertOpen ? 'active bell-active' : ''}`}
                title="Alerts"
              >
                <Bell size={18} />
                {alerts.length > 0 && (
                  <span style={{ width: '8px', height: '8px', position: 'absolute', top: '6px', right: '6px', borderRadius: '50%', background: 'rgb(var(--brand-primary))', boxShadow: '0 0 8px rgba(var(--brand-primary),0.7)', animation: 'pulse 2s infinite' }} />
                )}
              </button>
            </div>

            {/* SYSTEM TOOLS: fixed-width trigger + floating dropdown */}
            <div className="dev-menu-container" style={{ position: 'relative' }}>
              <button
                onClick={() => setIsDevMenuOpen(!isDevMenuOpen)}
                className={`theme-trigger-btn ${isDevMenuOpen ? 'active' : ''}`}
                style={isDevMenuOpen ? { background: 'var(--accent-primary)', color: 'white', borderColor: 'var(--accent-primary)' } : undefined}
                title="System Tools"
              >
                <Target size={18} className={isDevMenuOpen ? '' : 'animate-pulse'} />
              </button>

              <AnimatePresence>
                {isDevMenuOpen && (
                  <>
                    {/* Invisible backdrop to close on outside click */}
                    <div
                      style={{ position: 'fixed', inset: 0, zIndex: 1199 }}
                      onClick={() => setIsDevMenuOpen(false)}
                    />
                    <motion.div
                      className="dev-menu-dropdown"
                      initial={{ opacity: 0, scale: 0.92, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: -8 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 10px)',
                        right: 0,
                        zIndex: 1200,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '16px',
                        padding: '10px',
                        boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(16px)',
                        minWidth: '52px',
                        alignItems: 'center',
                      }}
                    >
                      {/* AI ASSISTANT */}
                      {isCampAdmin && (
                        <button
                          onClick={() => { setIsAIOpen(!isAIOpen); setIsThemeOpen(false); setIsDevMenuOpen(false); }}
                          className={`theme-trigger-btn ${isAIOpen ? 'active' : ''}`}
                          style={isAIOpen ? { background: 'var(--bg-card)', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' } : undefined}
                          title="Compute Intelligence Matrices"
                        >
                          <Brain size={16} />
                        </button>
                      )}

                      {/* THEME TOGGLE */}
                      <button
                        onClick={(e) => { toggleTheme(e); }}
                        className={`theme-trigger-btn ${!isDarkMode ? 'active' : ''}`}
                        title="Toggle Light/Dark Mode"
                      >
                        {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                      </button>

                      {/* PALETTE TOGGLE */}
                      <button
                        onClick={() => { setIsThemeOpen(!isThemeOpen); setIsAIOpen(false); setIsDevMenuOpen(false); }}
                        className={`theme-trigger-btn ${isThemeOpen ? 'active' : ''}`}
                        title="Modulate Theme Matrix"
                      >
                        <Palette size={16} />
                      </button>

                      {/* HELP DESK */}
                      <button
                        onClick={() => { isGlobalAdmin ? setIsHelpDeskOpen(true) : setIsUserHelpDeskOpen(true); setIsDevMenuOpen(false); }}
                        className={`theme-trigger-btn ${(isGlobalAdmin ? isHelpDeskOpen : isUserHelpDeskOpen) ? 'active' : ''}`}
                        style={(isGlobalAdmin ? isHelpDeskOpen : isUserHelpDeskOpen) ? {
                          background: 'rgba(20, 83, 45, 0.4)', borderColor: 'rgba(34, 197, 94, 0.8)', color: '#4ade80'
                        } : undefined}
                        title="Help Desk"
                      >
                        {isGlobalAdmin ? <HelpCircle size={16} className="animate-pulse" /> : <LifeBuoy size={16} />}
                      </button>

                      {/* FEEDBACK */}
                      <button
                        onClick={() => { isGlobalAdmin ? setIsDeveloperFeedbackOpen(true) : setIsUserFeedbackOpen(true); setIsDevMenuOpen(false); }}
                        className={`theme-trigger-btn ${(isGlobalAdmin ? isDeveloperFeedbackOpen : isUserFeedbackOpen) ? 'active' : ''}`}
                        style={(isGlobalAdmin ? isDeveloperFeedbackOpen : isUserFeedbackOpen) ? {
                          background: 'rgba(184, 115, 51, 0.4)', borderColor: 'rgba(255, 165, 0, 0.8)', color: '#ffa500'
                        } : undefined}
                        title="Feedback"
                      >
                        <MessageSquare size={16} className={isGlobalAdmin ? 'animate-pulse' : ''} />
                      </button>

                      {/* COMMAND GATE (GLOBAL ADMIN ONLY) */}
                      {isGlobalAdmin && (
                        <button
                          onClick={() => { setIsOperatorOpen(true); setIsDevMenuOpen(false); }}
                          className={`theme-trigger-btn ${isOperatorOpen ? 'active' : ''}`}
                          style={isOperatorOpen ? {
                            background: 'rgba(69, 10, 10, 0.4)', borderColor: 'rgba(153, 27, 27, 0.8)', color: '#f87171'
                          } : undefined}
                          title="Operator Command Panel"
                        >
                          <Eye size={16} className="animate-pulse" />
                        </button>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Notification Portal & Popups */}
            <NotificationDropdown 
              isOpen={isAlertOpen} 
              alerts={alerts} 
              onSelectAlert={handleSelectNotification} 
              onDismissAlert={(id) => setAlerts(prev => prev.filter(a => a.id !== id))}
              onClearAll={() => setAlerts([])} 
            />
            <AnimatePresence>
              {isPinPopupOpen && (
                <motion.div
                  className="pin-popup-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 9998,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                  }}
                  onClick={() => setIsPinPopupOpen(false)}
                >
                  <motion.section
                    className="pin-popup-panel"
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    style={{
                      background: 'rgba(15, 23, 42, 0.98)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '24px',
                      width: 'min(720px, 100%)',
                      maxHeight: 'min(90vh, 720px)',
                      overflow: 'hidden',
                      boxShadow: '0 30px 80px rgba(0, 0, 0, 0.55)',
                      padding: '0',
                      position: 'relative'
                    }}
                    onClick={event => event.stopPropagation()}
                  >
                    <div className="pin-popup-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '22px 26px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-primary)', marginBottom: '6px' }}>
                          <Pin size={18} />
                          <strong style={{ fontSize: '1rem', letterSpacing: '0.06em' }}>Pinned Messages</strong>
                        </div>
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{pinnedCount > 0 ? `Showing ${pinnedCount} pinned message${pinnedCount === 1 ? '' : 's'}` : 'No pinned messages yet.'}</p>
                      </div>
                      <button
                        onClick={() => setIsPinPopupOpen(false)}
                        className="icon-btn"
                        style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', padding: '8px' }}
                        title="Close pinned messages"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="pin-popup-content" style={{ maxHeight: 'calc(90vh - 130px)', overflowY: 'auto', padding: '20px 24px', display: 'grid', gap: '16px' }}>
                      {pinnedMessages.length > 0 ? pinnedMessages.map((msg, index) => {
                        const channelName = msg.channelKey ? msg.channelKey.split('_').slice(1).join('_') : '';
                        return (
                          <article key={msg._id || msg.id || `pin-${index}`} className="pin-item-card" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '18px', display: 'grid', gap: '12px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(251, 191, 36, 0.15)', display: 'grid', placeItems: 'center', color: '#fbbf24' }}><Pin size={16} /></div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                  <strong style={{ color: 'var(--text-primary)' }}>{msg.user?.username || 'Scout'}</strong>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{msg.time}</span>
                                </div>
                                <span style={{ fontSize: '0.8rem', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pinned {channelName ? `in #${channelName}` : ''}</span>
                              </div>
                            </div>
                            <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.75, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.text || msg.body || '[No text content]'}</p>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                              <button
                                className="pin-action-btn"
                                onClick={() => handlePinMessage(msg, msg.channelKey || currentChannelKey)}
                              >
                                <Pin size={14} /> Unpin
                              </button>
                              {channelName && (
                                <button
                                  className="pin-action-btn pin-action-btn-primary"
                                  onClick={() => {
                                    const campsiteId = msg.channelKey.split('_')[0];
                                    changeViewChannelCallback(campsiteId, msg.channelKey);
                                    setIsPinPopupOpen(false);
                                  }}
                                >
                                  Jump to Channel
                                </button>
                              )}
                            </div>
                          </article>
                        );
                      }) : (
                        <div style={{ padding: '32px', borderRadius: '16px', border: '1px dashed rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', textAlign: 'center' }}>
                          <p style={{ margin: 0, fontWeight: '600', color: 'var(--text-primary)' }}>No pins here yet.</p>
                          <p style={{ margin: '10px 0 0' }}>Use the message dropdown menu to pin important content, and it will stay available after refresh.</p>
                        </div>
                      )}
                    </div>
                  </motion.section>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {selectedPopupAlert && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)' }}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-primary)', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '90%', color: 'var(--text-primary)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '14px', fontFamily: 'monospace', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>INTERCEPT: {selectedPopupAlert.campsiteName}</h3>
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
                      }} style={{ padding: '8px 16px', borderRadius: '8px', background: 'var(--accent-primary)', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>Jump to Channel</button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            <button className="camp-ops-btn" onClick={() => setIsCampOpsModalOpen(true)}>
              <Settings size={18} />
              <span className="hide-on-mobile">Camp Operations</span>
            </button>
            {isCampAdmin && (
              <button className="camp-ops-btn" style={{ marginLeft: '8px' }} onClick={() => setIsAdminPanelOpen(true)}>
                <ShieldAlert size={18} />
                <span className="hide-on-mobile">Manage Members</span>
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
              <Trash2 size={14} /> <span className="hide-on-mobile uppercase-text" style={{textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px'}}>Clear Chat</span>
            </button>
            <button 
              className={`icon-btn ${isDrawerOpen ? 'active' : ''}`}
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              style={{
                background: isDrawerOpen ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: isDrawerOpen ? 'var(--accent-primary)' : 'var(--text-secondary)'
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

        {activeChannel === 'Ai-Scout' ? (
          <AiNexus currentUser={currentUser} />
        ) : activeChannel === 'Basecamp-Board' ? (
          <BasecampBoard campsiteId={currentCampsiteId} currentUser={currentUser} />
        ) : activeChannel === 'Chill-Zone' ? (
          <div className="chill-zone-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', padding: '24px', background: 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(9,15,32,0.99))' }}>
            <div className="chill-zone-bg-glow" style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.6 }} />
            
            {/* Ambient Equalizer Visualizer Background lines */}
            <div className="visualizer-background" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '180px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '6px', padding: '0 40px', pointerEvents: 'none', zIndex: 1, opacity: 0.15 }}>
              {Array.from({ length: 40 }).map((_, i) => (
                <div 
                  key={i} 
                  style={{ 
                    flex: 1, 
                    height: '100%', 
                    background: 'linear-gradient(to top, #1db954, transparent)', 
                    transformOrigin: 'bottom', 
                    borderRadius: '4px 4px 0 0',
                    animation: `soundBarBounce ${0.6 + (i % 5) * 0.15}s ease infinite alternate` 
                  }} 
                />
              ))}
            </div>

            <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ padding: '8px', background: 'rgba(29, 185, 84, 0.15)', borderRadius: '12px' }}>
                    <Music size={24} style={{ color: '#1db954' }} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#fff', fontWeight: 800 }}>Spotify Chill Zone</h2>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Listen to chill lofi beats & ambient music directly inside Outpost</p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    const width = 450;
                    const height = 680;
                    const left = window.screen.width / 2 - width / 2;
                    const top = window.screen.height / 2 - height / 2;
                    const popup = window.open(
                      "https://accounts.spotify.com/login?continue=https%3A%2F%2Fopen.spotify.com%2F",
                      "SpotifyLogin",
                      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
                    );
                    // Poll until popup closes, then mark as logged in
                    const pollTimer = setInterval(() => {
                      if (!popup || popup.closed) {
                        clearInterval(pollTimer);
                        setIsSpotifyLoggedIn(true);
                        // Reload iframe to pick up the new session cookie
                        const iframe = document.getElementById('spotify-bg-iframe');
                        if (iframe) { const s = iframe.src; iframe.src = ''; iframe.src = s; }
                      }
                    }, 500);
                  }}
                  className="chill-action-btn accent"
                  style={{ background: isSpotifyLoggedIn ? 'rgba(29,185,84,0.2)' : '#1db954', border: isSpotifyLoggedIn ? '1px solid #1db954' : 'none', color: '#fff', padding: '10px 20px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {isSpotifyLoggedIn ? '✅ Logged In to Spotify' : '🎵 Log In with Spotify'}
                </button>
              </div>

              {/* Station Grid Options */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', flex: 1, minHeight: 0 }}>
                <div className="spotify-iframe-container" style={{ flex: 1, height: '100%', minHeight: '380px', background: 'rgba(0,0,0,0.4)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' }}>
                  {/* iframe lives here visually but is the same persistent DOM node below */}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '18px' }}>
                  <h3 style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255, 255, 255, 0.6)' }}>Select Station</h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                      className={`playlist-btn ${selectedPlaylistUrl.includes('37i9dQZF1DX4wta20PHI0l') ? 'active' : ''}`}
                      onClick={() => setSelectedPlaylistUrl("https://open.spotify.com/embed/playlist/37i9dQZF1DX4wta20PHI0l?utm_source=generator")}
                      style={{ padding: '12px', fontSize: '13px', borderRadius: '10px', textAlign: 'left' }}
                    >
                      ☕ Lofi Beats
                    </button>
                    <button
                      className={`playlist-btn ${selectedPlaylistUrl.includes('37i9dQZF1DXcFszNC9iFUT') ? 'active' : ''}`}
                      onClick={() => setSelectedPlaylistUrl("https://open.spotify.com/embed/playlist/37i9dQZF1DXcFszNC9iFUT?utm_source=generator")}
                      style={{ padding: '12px', fontSize: '13px', borderRadius: '10px', textAlign: 'left' }}
                    >
                      📚 Chill Lofi Study
                    </button>
                    <button
                      className={`playlist-btn ${selectedPlaylistUrl.includes('37i9dQZF1DX2pSTOxoPbx9') ? 'active' : ''}`}
                      onClick={() => setSelectedPlaylistUrl("https://open.spotify.com/embed/playlist/37i9dQZF1DX2pSTOxoPbx9?utm_source=generator")}
                      style={{ padding: '12px', fontSize: '13px', borderRadius: '10px', textAlign: 'left' }}
                    >
                      🎷 Chill Jazz
                    </button>
                  </div>

                  <div style={{ marginTop: 'auto', padding: '12px', borderRadius: '10px', background: 'rgba(29, 185, 84, 0.08)', border: '1px solid rgba(29, 185, 84, 0.2)' }}>
                    <strong style={{ display: 'block', fontSize: '12px', color: '#1db954', marginBottom: '4px' }}>🔒 HOW TO USE</strong>
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', display: 'block' }}>
                      1. Click <strong style={{color:'#1db954'}}>Log In</strong> above — a small Spotify popup opens.
                      <br/>2. Sign in to your account in that popup.
                      <br/>3. Close the popup &amp; enjoy full tracks here!
                      <br/><br/><em>Without login: 30s previews only.</em>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* ===== ALWAYS-MOUNTED SPOTIFY IFRAME (keeps playing across navigation) ===== */}
        <iframe
          id="spotify-bg-iframe"
          src={selectedPlaylistUrl}
          width="100%"
          height="100%"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          style={{
            border: 'none',
            position: 'absolute',
            top: 0, left: 0,
            // Show in Chill-Zone container, hide (but KEEP MOUNTED) elsewhere
            display: activeChannel === 'Chill-Zone' ? 'block' : 'none',
            zIndex: activeChannel === 'Chill-Zone' ? 1 : -1,
            pointerEvents: activeChannel === 'Chill-Zone' ? 'auto' : 'none'
          }}
        />

        {/* ===== MINI FLOATING PLAYER (shows when music is active but on another section) ===== */}
        {activeChannel !== 'Chill-Zone' && (
          <div style={{
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            width: '280px',
            background: 'linear-gradient(135deg, rgba(29,185,84,0.15), rgba(0,0,0,0.9))',
            border: '1px solid rgba(29,185,84,0.35)',
            borderRadius: '14px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 9999,
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(29,185,84,0.2)',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }} onClick={() => setActiveChannel('Chill-Zone')} title="Go to Chill Zone">
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(29,185,84,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Music size={18} style={{ color: '#1db954' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', color: '#1db954', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>🎵 Chill Zone Playing</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedPlaylistUrl.includes('37i9dQZF1DX4wta20PHI0l') ? 'Lofi Beats' : selectedPlaylistUrl.includes('37i9dQZF1DXcFszNC9iFUT') ? 'Chill Lofi Study' : 'Chill Jazz'}
              </div>
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>▶ Open</div>
          </div>
        )}

        <div className="chat-messages" style={{ display: (activeChannel === 'Ai-Scout' || activeChannel === 'Basecamp-Board' || activeChannel === 'Chill-Zone') ? 'none' : undefined }}>
          <div className="chat-welcome">
            <div className="welcome-icon">
              <Hash size={40} />
            </div>
            <h1>Welcome to #{activeChannel}!</h1>
            <p>This is the start of the #{activeChannel} expedition. Please review the community guidelines before participating.</p>
            
            <div className="community-guidelines" style={{ marginTop: '20px', padding: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', borderLeft: '4px solid var(--accent-primary)' }}>
              <h3 style={{ marginBottom: '15px', color: 'var(--accent-primary)' }}>🏕️ Outpost Community Guidelines</h3>
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
                    <div className="skeleton-text" style={{ width: `${(i * 15) % 40 + 40}%` }}></div>
                    {i % 2 === 0 && <div className="skeleton-text" style={{ width: `${(i * 10) % 30 + 30}%` }}></div>}
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

              const isAiMessage = (msg.user?.username || msg.user) === 'Ai-Scout';
              if (isAiMessage) {
                return (
                  <div
                    key={msg._id || msg.id || index}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '14px 16px',
                      margin: '8px 0',
                      background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.08) 0%, rgba(0, 242, 254, 0.05) 100%)',
                      border: '1px solid rgba(79, 172, 254, 0.25)',
                      borderRadius: '12px',
                      position: 'relative',
                      overflow: 'hidden',
                      animation: 'fadeInUp 0.4s ease'
                    }}
                  >
                    {/* Animated shimmer line */}
                    <div style={{
                      position: 'absolute',
                      top: 0, left: '-100%',
                      width: '60%', height: '2px',
                      background: 'linear-gradient(90deg, transparent, rgba(79,172,254,0.6), transparent)',
                      animation: 'shimmerLine 2s ease-in-out infinite'
                    }} />
                    {/* Bot avatar */}
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '20px', flexShrink: 0, flexGrow: 0,
                      boxShadow: '0 0 12px rgba(79,172,254,0.5)',
                      animation: 'botPulse 3s ease-in-out infinite'
                    }}>
                      🤖
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{
                          fontWeight: 700, fontSize: '14px',
                          background: 'linear-gradient(90deg, #4facfe, #00f2fe)',
                          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                        }}>Ai-Scout</span>
                        <span style={{
                          fontSize: '10px', padding: '2px 7px', borderRadius: '20px',
                          background: 'rgba(79,172,254,0.15)', color: '#4facfe',
                          border: '1px solid rgba(79,172,254,0.3)', fontWeight: 600, letterSpacing: '0.5px'
                        }}>BOT</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>{msg.time}</span>
                      </div>
                      <div style={{
                        fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)',
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                    <div className={`message-item${highlightClass}${selectedMessageIds.includes(msg._id || msg.id) ? ' message-item-selected' : ''}`} key={msg._id || msg.id || index}>
                      <div className="message-avatar" style={{ overflow: 'hidden', position: 'relative' }}>
                        {msg.user?.profilePictureUrl ? (
                          <img src={msg.user.profilePictureUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          (msg.user?.username || 'S')[0].toUpperCase()
                        )}
                      </div>
                      <div className="message-content">
                        <div className="message-meta" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', width: '100%', overflow: 'visible' }}>
                          {(() => {
                            const username = msg.user?.username || msg.user || 'Unknown Scout';
                            const userEmail = msg.user?.email || '';
                            const userRoleName = activeCampsite?.memberRoles?.[username];
                            const userRoleColor = activeCampsite?.roles?.find(r => r.name === userRoleName)?.color || 'var(--text-primary)';
                            
                            const isDeveloper = msg.user?.isGlobalAdmin || username.toLowerCase().includes('harshit mehta');
                            const isAdmin = !isDeveloper && ((activeCampsite?.adminUsername && username === activeCampsite?.adminUsername) || (activeCampsite?.adminEmail && userEmail === activeCampsite?.adminEmail) || userRoleName?.toUpperCase() === 'ADMIN');
                            
                            return (
                              <span className="message-author" style={{ color: userRoleColor, fontWeight: userRoleName ? 'bold' : 'normal', display: 'flex', alignItems: 'center', flexShrink: 1, minWidth: 0, overflow: 'hidden' }}>
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{username}</span>
                                {isDeveloper && <span className="role-tag developer" style={{flexShrink: 0}}>DEVELOPER</span>}
                                {isAdmin && <span className="role-tag admin" style={{flexShrink: 0}}>ADMIN</span>}
                                {msg.isPinned && <span className="role-tag" style={{flexShrink: 0, background: 'rgba(255, 193, 7, 0.2)', color: '#ffc107', marginLeft: '6px', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px'}}><Pin size={10} /> PINNED</span>}
                              </span>
                            );
                          })()}
                          {msg.user?.level && <span style={{ fontSize: '10px', color: '#ff6b2b', marginLeft: '6px' }}>Lv.{msg.user.level}</span>}
                          <span className="message-time" style={{ marginLeft: '10px', flexGrow: 1 }}>{msg.time}</span>
                          <div className="message-actions-container">
                            {/* Emoji Reaction Picker */}
                            <div className="emoji-picker-wrapper" onClick={e => e.stopPropagation()}>
                              <button className="message-action-btn message-emoji-trigger-btn" title="Add Reaction">
                                <Smile size={14} />
                              </button>
                              <div className="emoji-quick-picker">
                                {['👍','❤️','🔥','😂','👀'].map(emoji => (
                                  <button
                                    key={emoji}
                                    className={`emoji-quick-btn ${msg.reactions?.find(r => r.emoji === emoji && r.users.includes(currentUser?.username)) ? 'reacted' : ''}`}
                                    onClick={() => handleReactMessage(msg._id || msg.id, currentChannelKey, emoji)}
                                    title={emoji}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <button
                              className={`message-action-btn message-like-btn ${msg.likes?.includes(currentUser?.username) ? 'liked' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleLikeMessage(msg._id || msg.id, currentChannelKey);
                              }}
                              title={msg.likes?.includes(currentUser?.username) ? "Unlike" : "Like"}
                            >
                              <Heart size={14} fill={msg.likes?.includes(currentUser?.username) ? "currentColor" : "none"} />
                              {msg.likes?.length > 0 && <span className="message-like-count">{msg.likes.length}</span>}
                            </button>
                            <div className="dropdown-wrapper">
                              <button
                                className="message-action-btn message-more-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDropdown(msg._id || msg.id);
                                }}
                                title="More Options"
                              >
                                <MoreVertical size={14} />
                              </button>
                              <AnimatePresence>
                                {activeDropdownId === (msg._id || msg.id) && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                    transition={{ duration: 0.15 }}
                                    className="message-dropdown-menu"
                                  >
                                    <button onClick={() => { handleCopyMessage(msg); setActiveDropdownId(null); }}>
                                      <Copy size={14} /> Copy
                                    </button>
                                    <button onClick={() => { toggleMessageSelection(msg._id || msg.id); setActiveDropdownId(null); }}>
                                      {selectedMessageIds.includes(msg._id || msg.id) ? <CheckSquare size={14} /> : <Square size={14} />} {selectedMessageIds.includes(msg._id || msg.id) ? 'Deselect' : 'Select'}
                                    </button>
                                    <button onClick={() => { toggleMessageStar(msg._id || msg.id); setActiveDropdownId(null); }}>
                                      <Star size={14} fill={starredMessageIds.includes(msg._id || msg.id) ? 'currentColor' : 'none'} /> {starredMessageIds.includes(msg._id || msg.id) ? 'Unstar' : 'Star'}
                                    </button>
                                    <button onClick={() => openForwardPicker([msg._id || msg.id])}>
                                      <Forward size={14} /> Forward
                                    </button>
                                    <button onClick={() => { setMessageInfo(msg); setActiveDropdownId(null); }}>
                                      <Info size={14} /> Message info
                                    </button>
                                    <button onClick={() => { setReplyingTo(msg); setActiveDropdownId(null); }}>
                                      <Reply size={14} /> Reply
                                    </button>
                                    <button onClick={() => { handlePinMessage(msg, currentChannelKey); setActiveDropdownId(null); }}>
                                      <Pin size={14} /> {msg.isPinned ? "Unpin" : "Pin"}
                                    </button>
                                    <button 
                                      onClick={() => {
                                        if (starredMessageIds.includes(msg._id || msg.id) && !window.confirm('This message is starred. Do you want to delete it?')) return;
                                        setMessageToDelete({ 
                                          id: msg._id || msg.id, 
                                          channelKey: currentChannelKey,
                                          isOwnMessage: msg.user?.username === currentUser?.username || msg.user === currentUser?.username 
                                        });
                                        setActiveDropdownId(null);
                                      }}
                                      className="dropdown-delete"
                                    >
                                      <Trash2 size={14} /> Delete
                                    </button>
                                    {isGlobalAdmin && !msg.isSystemDeleted && (
                                      <button 
                                        onClick={() => {
                                          setMessageToDelete({ 
                                            id: msg._id || msg.id, 
                                            channelKey: currentChannelKey,
                                            isOwnMessage: msg.user?.username === currentUser?.username || msg.user === currentUser?.username,
                                            isOperatorMode: true
                                          });
                                          setActiveDropdownId(null);
                                        }}
                                        className="dropdown-delete"
                                        title="Operator Override"
                                      >
                                        <ShieldAlert size={14} /> Override
                                      </button>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>
                        <div className="message-text">
                          {(() => {
                            let parsedReply = msg.replyTo;
                            if (!parsedReply && (!msg.type || msg.type === 'text') && msg.body) {
                              try { parsedReply = JSON.parse(msg.body); } catch(e) {}
                            }
                            if (!parsedReply) return null;
                            return (
                              <div className="reply-reference" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '6px 10px', borderRadius: '6px', marginBottom: '8px', borderLeft: '3px solid var(--accent-primary)', opacity: 0.8, display: 'flex', flexDirection: 'column', gap: '2px', cursor: 'pointer' }}>
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
                              <p className="font-bold font-mono tracking-wide text-xs uppercase mb-3" style={{ color: 'var(--accent-primary)', marginBottom: '12px', fontWeight: 'bold' }}>📊 {msg.pollData.question}</p>
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
                                      style={{ position: 'relative', overflow: 'hidden', background: votedForThisOption ? 'var(--accent-glow)' : 'var(--bg-glass)', border: votedForThisOption ? '1px solid var(--accent-primary)' : '1px solid var(--border-glass)', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', cursor: hasVotedInPoll ? 'default' : 'pointer', outline: 'none', transition: 'all 0.2s ease', opacity: hasVotedInPoll && !votedForThisOption ? 0.6 : 1 }}
                                    >
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
                                        style={{ position: 'absolute', top: 0, left: 0, bottom: 0, background: 'var(--accent-primary)', opacity: votedForThisOption ? 0.4 : 0.2, pointerEvents: 'none' }}
                                      />
                                      <span style={{ position: 'relative', zIndex: 10, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {option}
                                        {votedForThisOption && <Check size={14} style={{ color: 'var(--accent-primary)' }} />}
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
                          {/* Emoji Reaction Pills */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="message-reactions-row">
                              {msg.reactions.map((reaction) => (
                                <button
                                  key={reaction.emoji}
                                  className={`reaction-pill ${reaction.users.includes(currentUser?.username) ? 'reacted' : ''}`}
                                  onClick={() => handleReactMessage(msg._id || msg.id, currentChannelKey, reaction.emoji)}
                                  title={reaction.users.join(', ')}
                                >
                                  <span>{reaction.emoji}</span>
                                  <span className="reaction-count">{reaction.users.length}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })
          )}
          {/* Spacer to prevent chat input from overlapping the bottom content (browsers ignore bottom padding on scroll containers) */}
          <div ref={messagesEndRef} style={{ height: '32px', flexShrink: 0 }} />
        </div>

        {(activeChannel !== 'Ai-Scout' && activeChannel !== 'Basecamp-Board') && <AnimatePresence>
          {activeTypers.length > 0 && (
            <motion.div 
              className="typing-indicator"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', marginBottom: '10px', color: 'var(--accent-primary)', fontStyle: 'italic', fontSize: '0.85rem' }}
            >
              <MessageSquare size={16} />
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
        </AnimatePresence>}
        {(activeChannel !== 'Ai-Scout' && activeChannel !== 'Basecamp-Board') && <AnimatePresence>
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
        </AnimatePresence>}

        {selectedMessageIds.length > 0 && (
          <div className="bulk-message-toolbar">
            <span>{selectedMessageIds.length} message{selectedMessageIds.length === 1 ? '' : 's'} selected</span>
            <button onClick={() => openForwardPicker(selectedMessageIds)}><Forward size={15} /> Forward</button>
            <button className="bulk-delete-btn" onClick={deleteSelectedMessages}><Trash2 size={15} /> Delete selected</button>
            <button className="bulk-cancel-btn" onClick={() => setSelectedMessageIds([])}>Cancel</button>
          </div>
        )}
        <div className="chat-input-wrapper" style={{ display: (activeChannel === 'Ai-Scout' || activeChannel === 'Basecamp-Board' || activeChannel === 'Chill-Zone') ? 'none' : undefined }}>
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
                  style={isAttachmentOpen ? { background: 'var(--accent-primary)', color: '#fff', transform: 'rotate(45deg)', transition: 'all 0.2s' } : { transition: 'all 0.2s' }}
                >
                  <Plus size={20} />
                </button>
                <input 
                  ref={chatInputRef}
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
          <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', opacity: 0.8 }}>
            <Lock size={12} /> <span>End-to-End Encrypted Chat</span>
          </div>
        </div>
        {messageInfo && (
          <div className="message-info-backdrop" onClick={() => setMessageInfo(null)}>
            <section className="message-info-panel" onClick={e => e.stopPropagation()} aria-label="Message information">
              <button className="message-info-close" onClick={() => setMessageInfo(null)} aria-label="Close message information"><X size={17} /></button>
              <Info size={19} className="message-info-icon" />
              <h3>Message information</h3>
              <p><strong>From</strong> {messageInfo.user?.username || messageInfo.user || 'Unknown Scout'}</p>
              <p><strong>Sent</strong> {messageInfo.time || 'Just now'}</p>
              <p><strong>Channel</strong> #{activeChannel}</p>
              <button className="message-info-forward" onClick={() => { openForwardPicker([messageInfo._id || messageInfo.id]); setMessageInfo(null); }}><Forward size={14} /> Forward message</button>
            </section>
          </div>
        )}
        {isForwardPickerOpen && (
          <div className="message-info-backdrop" onClick={() => setIsForwardPickerOpen(false)}>
            <section className="forward-picker-panel" onClick={e => e.stopPropagation()} aria-label="Forward messages">
              <button className="message-info-close" onClick={() => setIsForwardPickerOpen(false)} aria-label="Close forward dialog"><X size={17} /></button>
              <Forward size={19} className="message-info-icon" />
              <h3>Forward {forwardMessageIds.length} message{forwardMessageIds.length === 1 ? '' : 's'}</h3>
              <p>Choose a group and channel where you are a member.</p>
              <div className="forward-target-list">
                {campsites.flatMap(campsite => (campsite.expeditions || []).filter(channel => channel.type === 'text' && channel.id !== 'Ai-Scout').map(channel => ({ campsiteId: campsite.id || campsite._id, campsiteName: campsite.name || 'Outpost', channel }))).map(target => (
                  <button key={`${target.campsiteId}-${target.channel.id}`} onClick={() => forwardMessagesToChannel(target)}>
                    <span>{target.campsiteName}</span><strong>#{target.channel.name || target.channel.id}</strong>
                  </button>
                ))}
              </div>
            </section>
          </div>
        )}
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
                      handleCampsiteClick(camp.id);
                      setIsMobileDrawerOpen(false);
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
                      {currentUser?.profilePictureUrl ? (
                        <img 
                          src={currentUser?.profilePictureUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Scout'} 
                          alt="Profile" 
                          style={{width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover'}}
                        />
                      ) : (
                        <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'bold', fontSize:'0.9rem'}}>
                          {currentUser?.username?.substring(0, 2)?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="status-dot online"></div>
                    </div>
                    <div className="user-name">
                      <strong>{currentUser?.username || 'Scout'}</strong>
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
                    <button className="icon-btn" style={{ color: '#ff6b6b' }} title="Log Out" onClick={() => { 
                      setIsMobileDrawerOpen(false);
                      handleLogout();
                    }}>
                      <LogOut size={18} />
                    </button>
                  </div>
                </div>
                
                {/* Scout-Guardian Security Badge */}
                <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--border)', background: 'rgba(0, 0, 0, 0.2)', fontSize: '0.75rem', color: 'var(--text-secondary)' }} title="Scout-Guardian is actively protecting your session.">
                  <Shield size={14} color="#059669" />
                  <span style={{ fontWeight: '600', letterSpacing: '0.5px' }}>Protected by Scout-Guardian</span>
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
              position: 'relative',
              background: 'rgba(255, 59, 48, 0.2)',
              border: '2px solid #ff3b30',
              padding: '40px 60px',
              borderRadius: '24px',
              color: '#fff',
              textAlign: 'center',
              boxShadow: '0 0 50px rgba(255, 59, 48, 0.4)',
              maxWidth: '80%'
            }}>
              <button 
                onClick={() => {
                  setKickNotification(null);
                  handleCampsiteClick(1);
                }}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '20px',
                  background: 'transparent',
                  border: 'none',
                  color: '#ff3b30',
                  fontSize: '28px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  lineHeight: 1
                }}
                title="Close and return to HQ"
              >
                &times;
              </button>
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
          onFreshData={({ level, xp }) => {
            setCurrentUser(prev => ({ ...prev, level, xp }));
          }}
          onSave={(updatedUser, didChangePassword) => {
            if (didChangePassword) {
              // Log the user out immediately
              localStorage.removeItem('outpost_user');
              localStorage.removeItem('outpost_token');
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
