import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const [usersRes, campsRes, msgRes] = await Promise.all([
        fetch(`${baseUrl}/admin/users`, { headers }),
        fetch(`${baseUrl}/admin/campsites`, { headers }),
        fetch(`${baseUrl}/admin/messages`, { headers })
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
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${baseUrl}/admin/users/${userId}/ban`, {
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
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${baseUrl}/admin/${type}s/${id}`, {
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--brand-primary)]">
        <div className="text-white font-mono animate-pulse flex items-center gap-2">
          <ShieldCheck className="w-6 h-6" /> VERIFYING ADMIN CREDENTIALS...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
        <ShieldCheck className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-3xl font-bold mb-2">ACCESS DENIED</h1>
        <p className="text-gray-400 mb-8">{error}</p>
        <Button onClick={() => navigate('/app')}>Return to Basecamp</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/app')}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--brand-primary)] to-white flex items-center gap-2">
                <ShieldCheck className="w-8 h-8 text-[var(--brand-primary)]" />
                OUTPOST GOD MODE
              </h1>
              <p className="text-gray-400 text-sm">System Administration Dashboard</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
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
        <GeometricBorder className="bg-gray-900/50 backdrop-blur-md rounded-xl p-6">
          
          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400">
                    <th className="p-3">User</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Level</th>
                    <th className="p-3">Joined</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map(user => (
                    <tr key={user._id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="p-3 font-medium flex items-center gap-2">
                        {user.profilePictureUrl && <img src={user.profilePictureUrl} className="w-8 h-8 rounded-full" />}
                        {user.username}
                      </td>
                      <td className="p-3 text-gray-400">{user.email}</td>
                      <td className="p-3">{user.level}</td>
                      <td className="p-3 text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="p-3">
                        {user.isGloballyRestricted ? 
                          <span className="px-2 py-1 bg-red-900/50 text-red-400 text-xs rounded-full">BANNED</span> : 
                          <span className="px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded-full">ACTIVE</span>
                        }
                      </td>
                      <td className="p-3 text-right">
                        <button onClick={() => handleBanUser(user._id, user.isGloballyRestricted)} className="p-2 text-yellow-500 hover:bg-yellow-500/10 rounded mr-2" title={user.isGloballyRestricted ? 'Unban' : 'Ban'}>
                          <Ban className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete('user', user._id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded" title="Delete Account">
                          <Trash2 className="w-4 h-4" />
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
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400">
                    <th className="p-3">Name</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Visibility</th>
                    <th className="p-3">Created At</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.campsites.map(camp => (
                    <tr key={camp._id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="p-3 font-medium">{camp.name}</td>
                      <td className="p-3 text-gray-400">{camp.location}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-full">{camp.visibility}</span>
                      </td>
                      <td className="p-3 text-sm text-gray-500">{new Date(camp.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => handleDelete('campsite', camp._id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded">
                          <Trash2 className="w-4 h-4" />
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
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400">
                    <th className="p-3">User</th>
                    <th className="p-3">Content</th>
                    <th className="p-3">Time</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.messages.map(msg => (
                    <tr key={msg._id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="p-3 font-medium text-sm">{msg.userName}</td>
                      <td className="p-3 text-gray-300 text-sm max-w-md truncate">{msg.text || '[Media]'}</td>
                      <td className="p-3 text-xs text-gray-500">{new Date(msg.timestamp).toLocaleString()}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => handleDelete('message', msg._id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded">
                          <Trash2 className="w-4 h-4" />
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
      className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-medium transition-all ${
        active 
          ? 'bg-gray-900/50 text-white border-b-2 border-[var(--brand-primary)]' 
          : 'bg-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
      }`}
    >
      {React.cloneElement(icon, { className: 'w-5 h-5' })}
      {label}
    </button>
  );
}
