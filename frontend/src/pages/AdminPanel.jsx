// frontend/src/pages/AdminPanel.jsx
import { useState, useEffect } from 'react';
import { Link2, Copy, Users, LogOut, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

function AdminPanel() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [winners, setWinners] = useState([]);
  const [eventDate, setEventDate] = useState(''); // State untuk input tanggal event

  const login = async () => {
    try {
      const { data } = await axios.post('http://localhost:3001/api/admin/login', { username, password });
      setToken(data.token);
      localStorage.setItem('adminToken', data.token);
      toast.success('Login berhasil!');
      await fetchWinners(data.token);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login gagal!');
    }
  };

  const generateLink = async () => {
    try {
      const { data } = await axios.post('http://localhost:3001/api/generate-link', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGeneratedLink(`${window.location.origin}/submit/${data.linkId}`);
      toast.success('Link berhasil digenerate!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal generate link!');
    }
  };

  const fetchWinners = async (authToken = token) => {
    console.log('Fetching winners with token:', authToken);
    try {
      const response = await axios.get('http://localhost:3001/api/winners', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setWinners(response.data);
    } catch (error) {
      console.error('Error fetching winners:', error.response?.data || error.message);
      toast.error('Gagal memuat riwayat pemenang!');
    }
  };

  const addEvent = async () => {
    if (!eventDate) {
      toast.error('Masukkan tanggal dan waktu event!');
      return;
    }
    try {
      // eventDate dari input datetime-local dalam waktu lokal (WIB)
      const localDate = new Date(eventDate);
      // Konversi ke UTC dengan mengurangi offset WIB (UTC+7 = 7 jam = 420 menit)
      const utcDate = new Date(localDate.getTime() - (7 * 60 * 60 * 1000)).toISOString();
  
      const { data } = await axios.post(
        'http://localhost:3001/api/admin/add-event',
        { eventDate: utcDate }, // Kirim dalam UTC
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(data.message);
      setEventDate(''); // Reset input setelah sukses
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menambah event!');
    }
  };

  const logout = () => {
    setToken('');
    localStorage.removeItem('adminToken');
    setGeneratedLink('');
    setWinners([]);
    toast.success('Logged out!');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    toast.success('Link disalin ke clipboard!');
  };

  useEffect(() => {
    if (token) fetchWinners();
  }, [token]);

  if (!token) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="container mx-auto p-4 flex items-center justify-center min-h-screen"
      >
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Admin Login</h2>
          <div className="space-y-6">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={login}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
            >
              Login
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto p-4"
    >
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Admin Panel</h2>
          <button
            onClick={logout}
            className="flex items-center text-red-600 hover:text-red-700"
          >
            <LogOut className="w-5 h-5 mr-2" /> Logout
          </button>
        </div>

        {/* Generate Link */}
        <button
          onClick={generateLink}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 flex items-center justify-center mb-6"
        >
          <Link2 className="w-5 h-5 mr-2" /> Generate Link Baru
        </button>
        {generatedLink && (
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-2">Link Generated:</p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={generatedLink}
                readOnly
                className="flex-1 p-3 border rounded-lg bg-gray-50"
              />
              <button
                onClick={copyToClipboard}
                className="p-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition duration-300"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Tambah Event */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-700">
            <Calendar className="w-6 h-6 mr-2" /> Tambah Event Baru
          </h3>
          <div className="flex flex-col space-y-4">
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addEvent}
              className="py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300 flex items-center justify-center"
            >
              <Calendar className="w-5 h-5 mr-2" /> Tambah Event
            </button>
          </div>
        </div>

        {/* Riwayat Pemenang */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center text-gray-700">
            <Users className="w-6 h-6 mr-2" /> Riwayat Pemenang
          </h3>
          {winners.length === 0 ? (
            <p className="text-gray-500">Belum ada pemenang.</p>
          ) : (
            <ul className="space-y-3">
              {winners.map((winner) => (
                <li key={winner.id} className="p-3 bg-gray-50 rounded-lg text-gray-700">
                  <span className="font-semibold">{winner.winner_username}</span> (ID: {winner.discord_id}) - 
                  Role: <span className="text-blue-600">{winner.role_reward}</span> - 
                  {new Date(winner.created_at).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default AdminPanel;