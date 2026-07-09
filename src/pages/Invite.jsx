import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Users, Hash } from 'lucide-react';

const Invite = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campsite, setCampsite] = useState(null);

  useEffect(() => {
    // Try to find campsite in local storage, or mock one
    const saved = localStorage.getItem('outpost_campsites');
    let found = null;
    if (saved) {
      const parsed = JSON.parse(saved);
      found = parsed.find(c => c.id.toString() === id);
    }
    
    if (!found) {
      // Create a mock campsite for the invite
      found = {
        id: parseInt(id) || Date.now(),
        name: `Campsite #${id || 'Unknown'}`,
        active: false,
        expeditions: [
          { id: 'general', name: 'general', type: 'text' }
        ],
        members: []
      };
    }
    setCampsite(found);
  }, [id]);

  const handleJoin = () => {
    // Add to local storage
    const saved = localStorage.getItem('outpost_campsites');
    let parsed = saved ? JSON.parse(saved) : [];
    
    // Check if user is already in this campsite
    const existingIndex = parsed.findIndex(c => c.id.toString() === id);
    
    let currentUser = { name: 'Guest Scout' };
    try {
      const saved = localStorage.getItem('outpost_user');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        currentUser = JSON.parse(saved);
      }
    } catch(e) {}

    if (existingIndex >= 0) {
      // User already has this campsite, just make sure they are in members
      const members = parsed[existingIndex].members || [];
      if (!members.includes(currentUser.name)) {
        parsed[existingIndex].members = [...members, currentUser.name];
      }
      parsed.forEach(c => c.active = false);
      parsed[existingIndex].active = true;
    } else {
      // Add the campsite to their local storage
      const newCamp = {
        ...campsite,
        active: true,
        members: [...(campsite.members || []), currentUser.name]
      };
      parsed.forEach(c => c.active = false);
      parsed.push(newCamp);
    }

    localStorage.setItem('outpost_campsites', JSON.stringify(parsed));
    
    // Redirect to app
    navigate('/app');
  };

  if (!campsite) return null;

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      
      {/* Background element just for the invite page since app layout might not cover it fully */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at center, rgba(255,107,43,0.1) 0%, rgba(0,0,0,0) 70%)', zIndex: 1 }}></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        style={{
          background: 'rgba(20, 20, 20, 0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '50px 40px',
          borderRadius: '24px',
          textAlign: 'center',
          maxWidth: '450px',
          width: '90%',
          zIndex: 10,
          boxShadow: '0 30px 60px rgba(0,0,0,0.6)'
        }}
      >
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, var(--primary-color), #ff8e53)',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 25px',
          boxShadow: '0 10px 30px rgba(255, 107, 43, 0.4)',
          transform: 'rotate(-5deg)'
        }}>
          <Hash size={40} color="white" style={{ transform: 'rotate(5deg)' }} />
        </div>
        
        <h2 style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '600' }}>
          You've been invited to join
        </h2>
        
        <h1 style={{ color: 'var(--text-primary)', marginBottom: '24px', fontSize: '2.2rem', fontFamily: "'Space Grotesk', sans-serif" }}>
          {campsite.name}
        </h1>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '40px', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '30px', display: 'inline-flex' }}>
          <Users size={16} />
          <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{campsite.members?.length || 1} Member{campsite.members?.length !== 1 ? 's' : ''}</span>
        </div>

        <button 
          className="btn-primary" 
          style={{ width: '100%', padding: '16px', fontSize: '1.1rem', borderRadius: '12px', fontWeight: 'bold' }}
          onClick={handleJoin}
        >
          Accept Invite
        </button>
        
        <button 
          style={{ 
            width: '100%', 
            padding: '16px', 
            fontSize: '1rem', 
            background: 'transparent', 
            border: 'none', 
            color: 'var(--text-secondary)',
            marginTop: '10px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
          onClick={() => navigate('/')}
        >
          Maybe Later
        </button>
      </motion.div>
    </div>
  );
};

export default Invite;
