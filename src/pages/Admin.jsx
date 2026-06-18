import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';
import { 
  Users, Tent, MessageSquare, Trash2, Ban, ShieldCheck, ChevronLeft
} from 'lucide-react';
import { GeometricBorder } from '../components/ui/GeometricBorder';
import { Button } from '../components/ui/button';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('users');
  const [data, setData] = useState({ users: [], campsites: [], messages: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('outpost_token');

  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }
    fetchAllData();
  }, [token]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const baseUrl = import.meta.env.VITE_API_URL || 'https://outpost-app.onrender.com';

      const [usersRes, campsRes, msgRes] = await Promise.all([
        fetch(`${baseUrl}/api/admin/users`, { headers }),
        fetch(`${baseUrl}/api/admin/campsites`, { headers }),
        fetch(`${baseUrl}/api/admin/messages`, { headers })
      ]);

      if (!usersRes.ok) throw new Error('Access Denied or Failed to fetch');

      setData({
        users: await usersRes.json(),
        campsites: await campsRes.json(),
        messages: await msgRes.json()
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId, currentStatus) => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://outpost-app.onrender.com';
      const res = await fetch(`${baseUrl}/api/admin/users/${userId}/ban`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ isGloballyRestricted: !currentStatus })
      });
      if (res.ok) fetchAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'https://outpost-app.onrender.com';
      const res = await fetch(`${baseUrl}/api/admin/${type}s/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchAllData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="flex items-center gap-2">
          <ShieldCheck style={{width:'1.5rem', height:'1.5rem'}} /> VERIFYING ADMIN CREDENTIALS...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <ShieldCheck style={{width:'4rem', height:'4rem', color:'#ef4444', marginBottom:'1rem'}} />
        <h1>ACCESS DENIED</h1>
        <p>{error}</p>
        <Button onClick={() => navigate('/app')}>Return to Basecamp</Button>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-max-w">
        
        {/* Header */}
        <div className="admin-header">
          <div className="admin-header-left">
            <button 
              onClick={() => navigate('/app')}
              className="admin-back-btn"
            >
              <ChevronLeft style={{width:'1.5rem', height:'1.5rem'}} />
            </button>
            <div>
              <h1 className="admin-title">
                <ShieldCheck style={{width:'2rem', height:'2rem', color:'var(--brand-primary)'}} />
                OUTPOST GOD MODE
              </h1>
              <p className="admin-subtitle">System Administration Dashboard</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs-container">
          <TabButton 
            active={activeTab === 'users'} 
            onClick={() => setActiveTab('users')}
            icon={<Users />} label={`Users (${data.users.length})`} 
          />
          <TabButton 
            active={activeTab === 'campsites'} 
            onClick={() => setActiveTab('campsites')}
            icon={<Tent />} label={`Campsites (${data.campsites.length})`} 
          />
          <TabButton 
            active={activeTab === 'messages'} 
            onClick={() => setActiveTab('messages')}
            icon={<MessageSquare />} label={`Logs (${data.messages.length})`} 
          />
        </div>

        {/* Content Area */}
        <GeometricBorder className="admin-content">
          
          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="admin-th">User</th>
                    <th className="admin-th">Email</th>
                    <th className="admin-th">Level</th>
                    <th className="admin-th">Joined</th>
                    <th className="admin-th">Status</th>
                    <th className="admin-th admin-td text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map(user => (
                    <tr key={user._id} className="admin-tr">
                      <td className="admin-td" style={{display:'flex', alignItems:'center', gap:'0.5rem', fontWeight: 500}}>
                        {user.profilePictureUrl && <img src={user.profilePictureUrl} style={{width:'2rem', height:'2rem', borderRadius:'9999px'}} />}
                        {user.username}
                      </td>
                      <td className="admin-td" style={{color: '#9ca3af'}}>{user.email}</td>
                      <td className="admin-td">{user.level}</td>
                      <td className="admin-td" style={{fontSize: '0.875rem', color: '#6b7280'}}>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="admin-td">
                        {user.isGloballyRestricted ? 
                          <span className="admin-badge-banned">BANNED</span> : 
                          <span className="admin-badge-active">ACTIVE</span>
                        }
                      </td>
                      <td className="admin-td text-right">
                        <button onClick={() => handleBanUser(user._id, user.isGloballyRestricted)} className="admin-action-btn admin-action-ban" title={user.isGloballyRestricted ? 'Unban' : 'Ban'}>
                          <Ban style={{width:'1rem', height:'1rem'}} />
                        </button>
                        <button onClick={() => handleDelete('user', user._id)} className="admin-action-btn admin-action-delete" title="Delete Account">
                          <Trash2 style={{width:'1rem', height:'1rem'}} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* CAMPSITES TAB */}
          {activeTab === 'campsites' && (
            <div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="admin-th">Name</th>
                    <th className="admin-th">Location</th>
                    <th className="admin-th">Visibility</th>
                    <th className="admin-th">Created At</th>
                    <th className="admin-th admin-td text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.campsites.map(camp => (
                    <tr key={camp._id} className="admin-tr">
                      <td className="admin-td" style={{fontWeight: 500}}>{camp.name}</td>
                      <td className="admin-td" style={{color: '#9ca3af'}}>{camp.location}</td>
                      <td className="admin-td">
                        <span className="admin-badge-default">{camp.visibility}</span>
                      </td>
                      <td className="admin-td" style={{fontSize: '0.875rem', color: '#6b7280'}}>{new Date(camp.createdAt).toLocaleDateString()}</td>
                      <td className="admin-td text-right">
                        <button onClick={() => handleDelete('campsite', camp._id)} className="admin-action-btn admin-action-delete">
                          <Trash2 style={{width:'1rem', height:'1rem'}} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* MESSAGES TAB */}
          {activeTab === 'messages' && (
            <div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th className="admin-th">User</th>
                    <th className="admin-th">Content</th>
                    <th className="admin-th">Time</th>
                    <th className="admin-th admin-td text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.messages.map(msg => (
                    <tr key={msg._id} className="admin-tr">
                      <td className="admin-td" style={{fontWeight: 500, fontSize: '0.875rem'}}>{msg.userName}</td>
                      <td className="admin-td" style={{color: '#d1d5db', fontSize: '0.875rem', maxWidth: '28rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{msg.text || '[Media]'}</td>
                      <td className="admin-td" style={{fontSize: '0.75rem', color: '#6b7280'}}>{new Date(msg.timestamp).toLocaleString()}</td>
                      <td className="admin-td text-right">
                        <button onClick={() => handleDelete('message', msg._id)} className="admin-action-btn admin-action-delete">
                          <Trash2 style={{width:'1rem', height:'1rem'}} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </GeometricBorder>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`admin-tab ${active ? 'active' : 'inactive'}`}
    >
      {React.cloneElement(icon, { style: {width: '1.25rem', height: '1.25rem'} })}
      {label}
    </button>
  );
}
