import { Gift, Trophy, ArrowRight, Clock, Info, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

function Home() {
  const [winnerCount, setWinnerCount] = useState(0);
  const [recentWinners, setRecentWinners] = useState([]);
  const [eventCountdown, setEventCountdown] = useState('Memuat...');
  const [eventLink, setEventLink] = useState(''); // State untuk menyimpan link event
  const [eventStarted, setEventStarted] = useState(false); // State untuk menentukan apakah event sudah dimulai

  // Ambil data pemenang dan hitung jumlah
  useEffect(() => {
    const fetchWinners = async () => {
      try {
        const { data } = await axios.get('http://localhost:3001/api/public/winners');
        setWinnerCount(data.length);
        setRecentWinners(data.slice(0, 3));
      } catch (error) {
        console.error('Error fetching winners:', error);
      }
    };
    fetchWinners();
  }, []);

  // Hitungan mundur dan link untuk event berikutnya
  useEffect(() => {
    let interval;
  
    const fetchNextEvent = async () => {
      try {
        const { data } = await axios.get('http://localhost:3001/api/public/next-event');
        if (!data.event_date) {
          setEventCountdown('Belum ada event');
          setEventLink('');
          setEventStarted(false);
          return;
        }
  
        const eventDateUTC = new Date(data.event_date); // Waktu dari database dalam UTC
        const eventDateLocal = new Date(eventDateUTC.getTime() + (7 * 60 * 60 * 1000)); // Konversi ke WIB (UTC+7)
        const linkId = data.link_id;
  
        interval = setInterval(async () => {
          const now = new Date(); // Waktu lokal (WIB)
          const diff = eventDateLocal - now;
  
          if (diff <= 0) {
            setEventStarted(true);
            setEventCountdown('Event Dimulai!');
  
            if (linkId && !eventLink) {
              setEventLink(`${window.location.origin}/submit/${linkId}`);
            }
  
            if (linkId) {
              try {
                const { data: linkStatus } = await axios.get(`http://localhost:3001/api/check-link/${linkId}`);
                if (linkStatus.is_used) {
                  setEventCountdown('Event Berakhir');
                  setEventLink('');
                  clearInterval(interval);
                  return;
                }
              } catch (error) {
                console.error('Error checking link status:', error);
              }
            }
          } else {
            setEventStarted(false);
            setEventLink('');
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            setEventCountdown(`${days}h ${hours}j ${minutes}m`);
          }
        }, 1000);
      } catch (error) {
        console.error('Error fetching next event:', error);
        setEventCountdown('Error memuat event');
        setEventLink('');
        setEventStarted(false);
      }
    };
  
    fetchNextEvent();
    const pollingInterval = setInterval(fetchNextEvent, 5000);
  
    return () => {
      clearInterval(interval);
      clearInterval(pollingInterval);
    };
  }, []);

  const copyToClipboard = () => {
    if (eventLink) {
      navigator.clipboard.writeText(eventLink);
      toast.success('Link disalin ke clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex flex-col">
      {/* Hero Section dengan Countdown Event dan Link */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex-1 flex flex-col items-center justify-center text-center py-20 px-4"
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-6"
        >
          <Gift className="w-24 h-24 text-blue-500" />
        </motion.div>
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-800 mb-4">
          Selamat Datang di <span className="text-blue-600">Seraya</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mb-6">
          Disini kecepatan tangamu di uji, dapatkan role, dan nikmati hadiah-hadiah menarik!
        </p>
        <div className="flex items-center bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-4">
          <Clock className="w-5 h-5 mr-2" />
          <span className="font-semibold">Kaget Berikutnya: {eventCountdown}</span>
        </div>
        {eventStarted && eventLink && (
          <div className="flex items-center space-x-2 mb-8">
            <input
              type="text"
              value={eventLink}
              readOnly
              className="p-2 border rounded-lg bg-gray-50 text-gray-700"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={copyToClipboard}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
            >
              <Copy className="w-5 h-5" />
            </motion.button>
          </div>
        )}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
          onClick={() => window.open('https://discord.gg/your-server', '_blank')}
        >
          Gabung Discord <ArrowRight className="w-5 h-5 ml-2" />
        </motion.button>
      </motion.section>

      {/* Statistik dan Leaderboard Mini */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="py-16 bg-white shadow-inner"
      >
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Statistik</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div>
              <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <p className="text-4xl font-bold text-gray-800">{winnerCount}</p>
              <p className="text-gray-600">Tergercep</p>
            </div>
            <div>
              <Gift className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <p className="text-4xl font-bold text-gray-800">10+</p>
              <p className="text-gray-600">Role Member</p>
            </div>
          </div>
          {/* Leaderboard Mini */}
          <div className="mt-12">
            <h3 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Pemenang Tergercep</h3>
            {recentWinners.length === 0 ? (
              <p className="text-gray-500 text-center">Belum ada pemenang tergercep.</p>
            ) : (
              <ul className="space-y-4 max-w-md mx-auto">
                {recentWinners.map((winner) => (
                  <motion.li
                    key={winner.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <Trophy className="w-6 h-6 text-yellow-500 mr-3" />
                    <span className="text-gray-700">
                      {winner.winner_username} - <span className="text-blue-600">{winner.role_reward}</span>
                    </span>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </motion.section>

      {/* FAQ How-To Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.8 }}
        className="py-16 bg-gray-50"
      >
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Cara Bermain Kaget</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-white rounded-lg shadow-md text-center"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Dapatkan Link</h3>
              <p className="text-gray-600">Menunggu link kaget dari admin di server Discord kami.</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-white rounded-lg shadow-md text-center"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Submit Cepat</h3>
              <p className="text-gray-600">Masukkan username dan Discord ID secepat mungkin.</p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-white rounded-lg shadow-md text-center"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Menang Role</h3>
              <p className="text-gray-600">Dapatkan role eksklusif secara acak jika kamu tercepat!</p>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}

export default Home;