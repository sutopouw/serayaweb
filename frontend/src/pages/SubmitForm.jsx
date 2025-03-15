import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from 'axios';

function SubmitForm() {
  const { linkId } = useParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [roleReward, setRoleReward] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [attemptCount, setAttemptCount] = useState(null); // State baru untuk attempt_count

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await axios.post(`http://localhost:3001/api/submit/${linkId}`, { username, discordId });
      setMessage(data.message);
      setIsSuccess(true);
      setExpiresAt(data.expiresAt);
      setRoleReward(data.roleReward);
      toast.success(`Selamat! Anda mendapatkan role: ${data.roleReward}`);
      setCountdown(15);
    } catch (error) {
      const errMsg = error.response?.data?.message || 'Terjadi kesalahan, coba lagi!';
      const attempts = error.response?.data?.attempt_count || 0;
      setMessage(`${errMsg} ${attempts > 0 ? `(Ada ${attempts} orang yang mencoba sebelum Anda)` : ''}`);
      setAttemptCount(attempts);
      setIsSuccess(false);
      toast.error(errMsg);
    }
    setIsLoading(false);
  };

  // Hitungan mundur untuk link kadaluarsa
  useEffect(() => {
    if (expiresAt) {
      const interval = setInterval(() => {
        const now = new Date();
        const expires = new Date(expiresAt);
        const diff = expires - now;
        if (diff <= 0) {
          setTimeLeft('Kadaluarsa');
          clearInterval(interval);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`${hours}j ${minutes}m ${seconds}d`);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [expiresAt]);

  // Hitungan mundur untuk redirect
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (countdown === 0) {
      navigate('/');
    }
  }, [countdown, navigate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto p-4 flex items-center justify-center min-h-screen"
    >
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">Submit Daget</h2>
        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username Discord
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full p-3 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Discord ID
              </label>
              <input
                type="text"
                value={discordId}
                onChange={(e) => setDiscordId(e.target.value)}
                className="mt-1 block w-full p-3 rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 transition duration-300"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <><Send className="w-5 h-5 mr-2" /> Submit</>
              )}
            </button>
          </form>
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-800 mb-2">{message}</h3>
            <p className="text-gray-600 mb-4">
              Anda mendapatkan role: <span className="font-bold text-blue-600">{roleReward}</span>
            </p>
            <div className="relative w-20 h-20 mx-auto mb-4">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2.8"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.8"
                  strokeDasharray={`${(countdown / 15) * 100}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-gray-800">
                {countdown}
              </span>
            </div>
            <p className="text-gray-500">
              Anda akan diarahkan ke halaman utama dalam {countdown} detik...
            </p>
          </motion.div>
        )}
        {message && !isSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-3 rounded-lg flex items-center bg-red-100 text-red-700"
          >
            <XCircle className="w-5 h-5 mr-2" />
            {message}
          </motion.div>
        )}
        {expiresAt && !isSuccess && (
          <div className="mt-4 text-center text-gray-600">
            Waktu tersisa: <span className="font-semibold">{timeLeft}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default SubmitForm;