import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Compass, Users, Globe, Code, Gamepad2, Palette, BookOpen } from 'lucide-react';
import './Discover.css';

// Removing mock database

const FILTERS = ["All", "Gaming", "Tech & Dev", "Art & Creative", "Study Camps", "Global Hubs"];
const PLACEHOLDERS = [
  "Scan the horizon for Dev Taverns...",
  "Locate Competitive Esports Guilds...",
  "Find a cozy campfire..."
];

const Discover = ({ onJoinCampsite, refreshTrigger }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [joiningCampId, setJoiningCampId] = useState(null);
  const [isExiting, setIsExiting] = useState(false);

  const [publicCampsites, setPublicCampsites] = useState([]);
  const [connectionError, setConnectionError] = useState(false);
  const [isDiscoverLoading, setIsDiscoverLoading] = useState(true);

  // Load campsites
  useEffect(() => {
    setIsDiscoverLoading(true);
    setConnectionError(false);
    fetch(`${(import.meta.env.VITE_API_URL || 'https://outpost-app.onrender.com')}/api/campsites/public`)
      .then(res => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setPublicCampsites(data.map(c => ({ ...c, id: c._id || c.id })));
        }
        // Artificially delay hiding the skeleton for 800ms
        setTimeout(() => setIsDiscoverLoading(false), 800);
      })
      .catch(err => {
        console.error("Error loading public campsites:", err);
        setConnectionError(true);
        setIsDiscoverLoading(false);
      });
  }, [refreshTrigger]); // re-run when refreshTrigger changes

  // Rotate placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredCamps = publicCampsites.filter(camp => {
    const matchesFilter = activeFilter === "All" || camp.category === activeFilter;
    const campName = camp.name || '';
    const campDesc = camp.description || '';
    const matchesSearch = campName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          campDesc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleVentureInside = (camp) => {
    setJoiningCampId(camp.id);
    
    // Simulate network delay and joining process
    setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onJoinCampsite(camp);
      }, 600); // Wait for exit animation
    }, 1500); // 1.5s simulated loading
  };

  // Framer Motion Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      y: 40,
      transition: { duration: 0.5, ease: "easeInOut" }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (isExiting) {
    return (
      <motion.div 
        className="discover-container"
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
    );
  }

  return (
    <motion.div 
      className="discover-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="discover-background" />
      
      <div className="discover-content">
        <header className="discover-hero">
          <h1>DISCOVER CAMPSITES ON OUTPOST</h1>
          <p>Explore thousands of public communities and find your next squad.</p>
          
          <div className="radar-search-box">
            <Search className="radar-search-icon" size={20} />
            <input 
              type="text" 
              className="radar-search-input"
              placeholder={PLACEHOLDERS[placeholderIndex]}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        <div className="terrain-filters">
          {FILTERS.map(filter => (
            <button 
              key={filter} 
              className={`filter-pill ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter === 'All' && <Compass size={16} />}
              {filter === 'Gaming' && <Gamepad2 size={16} />}
              {filter === 'Tech & Dev' && <Code size={16} />}
              {filter === 'Art & Creative' && <Palette size={16} />}
              {filter === 'Study Camps' && <BookOpen size={16} />}
              {filter === 'Global Hubs' && <Globe size={16} />}
              {filter}
            </button>
          ))}
        </div>

        <motion.div 
          className="campsite-grid"
          variants={containerVariants}
          initial="hidden"
          animate="show"
          key={activeFilter + searchQuery + (isDiscoverLoading ? 'loading' : 'loaded')} // Re-trigger stagger on filter/search change
        >
          {isDiscoverLoading ? (
            [...Array(6)].map((_, i) => (
              <motion.div 
                key={`skel-${i}`}
                variants={itemVariants}
                className="signal-card skeleton-card"
              >
                <div className="card-header">
                  <div className="skeleton-icon"></div>
                  <div className="card-metrics">
                    <div className="skeleton-metric"></div>
                    <div className="skeleton-metric"></div>
                  </div>
                </div>
                <div className="card-body" style={{ marginTop: '16px' }}>
                  <div className="skeleton-title"></div>
                  <div className="skeleton-desc" style={{ width: '90%' }}></div>
                  <div className="skeleton-desc" style={{ width: '60%' }}></div>
                </div>
                <div className="card-footer" style={{ marginTop: 'auto' }}>
                  <div className="skeleton-btn"></div>
                </div>
              </motion.div>
            ))
          ) : (
            filteredCamps.map((camp) => {
              const isJoining = joiningCampId === camp.id;
            
            return (
              <motion.div 
                key={camp.id}
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
                className="signal-card"
                style={{ 
                  borderColor: isJoining ? camp.color : 'rgba(255, 255, 255, 0.08)',
                  boxShadow: isJoining ? `0 0 20px ${camp.color}40` : 'none'
                }}
              >
                {/* Simulated progress border on join */}
                {isJoining && (
                  <motion.div 
                    className="border-progress"
                    initial={{ opacity: 0, boxShadow: `inset 0 0 0 2px ${camp.color}` }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}

                <div className="card-header">
                  <div className="card-icon">{camp.icon}</div>
                  <div className="card-metrics">
                    <div className="metric-pill">
                      <span className="dot-online"></span>
                      {camp.activeScouts} Active
                    </div>
                    <div className="metric-pill" style={{ background: 'transparent' }}>
                      <span className="dot-total"></span>
                      {camp.totalScouts} Total
                    </div>
                  </div>
                </div>

                <div className="card-body">
                  <h3>{camp.name}</h3>
                  <p>{camp.description}</p>
                </div>

                <div className="card-footer">
                  <button 
                    className={`btn-venture ${isJoining ? 'loading' : ''}`}
                    onClick={() => handleVentureInside(camp)}
                    disabled={joiningCampId !== null} // Disable all buttons while joining
                  >
                    {isJoining ? 'Joining...' : 'Venture Inside'}
                  </button>
                </div>
              </motion.div>
            );
            })
          )}
          
          {!isDiscoverLoading && filteredCamps.length === 0 && !connectionError && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
              <Search size={48} style={{ margin: '0 auto 20px', opacity: 0.2 }} />
              <h3>No signal found on this frequency.</h3>
              <p>Try adjusting your radar search or scanning a different terrain.</p>
            </div>
          )}

          {connectionError && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#ff3b30' }}>
              <Globe size={48} style={{ margin: '0 auto 20px', opacity: 0.5 }} />
              <h3>Failed to establish connection with Command Center</h3>
              <p>The backend database is offline or unreachable. Please ensure `node server.js` is running locally.</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Discover;
