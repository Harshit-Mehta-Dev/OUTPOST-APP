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
  Palette
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

const socket = io('https://outpost-app.onrender.com');

const Basecamp = ({ isDarkMode, toggleTheme }) => {
  const navigate = useNavigate();
  const [activeChannel, setActiveChannel] = useState('community-chat');
  const [showWelcome, setShowWelcome] = useState(true);
  const [showDiscover, setShowDiscover] = useState(false);
  const [joinNotification, setJoinNotification] = useState(null);
  const [inputText, setInputText] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCampOpsModalOpen, setIsCampOpsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState(null);
  const messagesEndRef = useRef(null);

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
    fetch(`https://outpost-app.onrender.com/api/messages/${currentChannelKey}`)
      .then(res => res.json())
      .then(data => {
        setMessagesByChannel(prev => ({
          ...prev,
          [currentChannelKey]: data
        }));
      })
      .catch(err => console.error("Failed to fetch messages:", err));

    // Join the socket room
    socket.emit('join_channel', currentChannelKey);
  }, [currentChannelKey]);

  // Listen for real-time messages
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
    return () => socket.off('receive_message', handleReceiveMessage);
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

  const handleSendMessage = () => {
    if (inputText.trim()) {
      const messageData = {
        channelKey: currentChannelKey,
        user: {
          username: currentUser?.username || 'Scout',
          profilePictureUrl: currentUser?.profilePictureUrl || '',
          level: currentUser?.level || 1
        },
        time: 'Today at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: inputText.trim()
      };
      
      // Emit to server
      socket.emit('send_message', messageData);
      
      setInputText('');
    }
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

    // Save to global public campsites if public
    if (data.isPublic) {
      let category = "Casual";
      let icon = "🏕️";
      if (data.template === 'gaming') { category = "Gaming"; icon = "🎮"; }
      if (data.template === 'dev') { category = "Tech & Dev"; icon = "💻"; }

      const publicCampData = {
        id: newCampId,
        name: data.name,
        description: `A brand new ${category} Outpost created by ${currentUser?.username || 'a Scout'}.`,
        category: category,
        icon: icon,
        totalScouts: 0,
        activeScouts: 0,
        color: data.template === 'gaming' ? '#ff3b30' : data.template === 'dev' ? '#4facfe' : '#ffcc00',
        adminEmail: currentUser?.email,
        isPublic: true,
        template: data.template,
        imageUrl: data.imageUrl,
        members: [], // User is NOT automatically joined
        expeditions: newExpeditions
      };

      fetch('https://outpost-app.onrender.com/api/campsites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(publicCampData)
      })
      .then(res => res.json())
      .then(savedData => {
        console.log("Campsite successfully built in Discover panel:", savedData);
        setDiscoverRefreshTrigger(prev => prev + 1); // Trigger Discover refetch
        
        // Show sweet notification AFTER successful creation
        setJoinNotification(`🏕️ You've successfully built ${data.name}! Head over to Discover to venture inside.`);
        setTimeout(() => {
          setJoinNotification(null);
        }, 4000);
      })
      .catch(err => {
        console.error("Error creating campsite in API:", err);
        setJoinNotification(`⚠️ Failed to connect to server. Is your backend running?`);
        setTimeout(() => setJoinNotification(null), 4000);
      });
    }
    
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
    navigate('/auth'); 
  };

  return (
    <div className="outpost-app-wrapper">
      <div 
        className="basecamp-layout" 
        style={{ gridTemplateColumns: showDiscover ? '72px 1fr' : (isSidebarOpen ? '72px 280px 1fr' : '72px 1fr') }}
      >
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
            <button
              onClick={() => setIsThemeOpen(!isThemeOpen)}
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
              {isThemeOpen && <ThemeController onClose={() => setIsThemeOpen(false)} />}
            </AnimatePresence>
          </div>
        </header>

        <header className="chat-header">
          <div className="chat-title">
            <Hash size={24} className="chat-title-icon" />
            <h2>{activeChannel}</h2>
          </div>
          <div className="chat-header-actions">
            <Users size={20} className="header-icon" />
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

          {messages.map((msg, index) => (
                  <div className="message-item" key={msg._id || msg.id || index}>
                    <div className="message-avatar" style={{ overflow: 'hidden', position: 'relative' }}>
                      {msg.user?.profilePictureUrl ? (
                        <img src={msg.user.profilePictureUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        (msg.user?.username || 'S')[0].toUpperCase()
                      )}
                    </div>
                    <div className="message-content">
                      <div className="message-meta">
                        <span className="message-author">{msg.user?.username || msg.user || 'Unknown Scout'}</span>
                        {msg.user?.level && <span style={{ fontSize: '10px', color: '#ff6b2b', marginLeft: '6px' }}>Lv.{msg.user.level}</span>}
                        <span className="message-time">{msg.time}</span>
                      </div>
                      <div className="message-text">{msg.text}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <AnimatePresence>
          {inputText.length > 0 && (
            <motion.div 
              className="typing-indicator"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Bot size={16} className="typing-icon" />
              <span><strong>Someone</strong> is typing</span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="typing-dots"
              >
                ...
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="chat-input-wrapper">
          <div className="chat-input-container">
            <button className="chat-attach-btn">
              <Plus size={20} />
            </button>
            <input 
              type="text" 
              placeholder={`Message #${activeChannel}`} 
              className="chat-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
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
