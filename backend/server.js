const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios'); // Tambahkan axios
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Log environment untuk debugging
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT
});

// Koneksi ke TiDB
const dbConfig = {
  host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: 'WT99dVZbbW3Tjmo.root',
  password: '12MC9mgpYStsYkMB',
  database: 'daget_db',
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  },
  connectTimeout: 30000, // 30 detik timeout
  waitForConnections: true,
  connectionLimit: 1, // Mengurangi ke 1 koneksi
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  multipleStatements: true,
  timezone: '+00:00'
};

console.log('Attempting to connect to database with config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database
});

const db = mysql.createPool(dbConfig);

// Cek koneksi database dengan retry mechanism
const checkDBConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting database connection (attempt ${i + 1}/${retries})...`);
      const connection = await db.getConnection();
      console.log('Database connection successful');
      
      // Test query sederhana
      const [result] = await connection.query('SELECT 1 as test');
      console.log('Test query result:', result);
      
      connection.release();
      return true;
    } catch (err) {
      console.error(`Database connection attempt ${i + 1} failed:`, {
        message: err.message,
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        sqlMessage: err.sqlMessage,
        stack: err.stack
      });
      
      if (i === retries - 1) return false;
      console.log(`Waiting 5 seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  return false;
};

// Inisialisasi database dengan retry
async function initDB(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Starting database initialization (attempt ${i + 1}/${retries})...`);
      
      // Cek koneksi terlebih dahulu
      const isConnected = await checkDBConnection();
      if (!isConnected) {
        throw new Error('Could not establish database connection');
      }

      console.log('Creating events table...');
      // Buat tabel events terlebih dahulu
      await db.execute(`
        CREATE TABLE IF NOT EXISTS events (
          id INT AUTO_INCREMENT PRIMARY KEY,
          event_date TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Events table created/verified successfully');

      console.log('Creating links table...');
      // Baru kemudian buat tabel links yang mereferensikan events
      await db.execute(`
        CREATE TABLE IF NOT EXISTS links (
          id VARCHAR(36) PRIMARY KEY,
          event_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP,
          is_used BOOLEAN DEFAULT FALSE,
          winner_username VARCHAR(100),
          discord_id VARCHAR(50),
          role_reward VARCHAR(50),
          attempt_count INT DEFAULT 0,
          FOREIGN KEY (event_id) REFERENCES events(id)
        )
      `);
      console.log('Links table created/verified successfully');

      console.log('Database initialized successfully');
      return true;
    } catch (err) {
      console.error(`Database initialization attempt ${i + 1} failed:`, {
        message: err.message,
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        sqlMessage: err.sqlMessage,
        stack: err.stack
      });
      
      if (i === retries - 1) {
        console.error('All database initialization attempts failed');
        throw err;
      }
      console.log(`Waiting 5 seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  return false;
}

// Seed data dummy untuk events
async function seedEvents() {
  try {
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM events');
    if (rows[0].count === 0) {
      const nextEventDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 hari ke depan
      await db.execute('INSERT INTO events (event_date) VALUES (?)', [nextEventDate]);
      console.log('Dummy event added');
    }
  } catch (err) {
    console.error('Error seeding events:', err);
  }
}

// Jalankan inisialisasi dengan penanganan error yang lebih baik
const startServer = async () => {
  try {
    console.log('Starting server initialization...');
    const dbInitialized = await initDB();
    
    if (!dbInitialized) {
      throw new Error('Failed to initialize database after all retries');
    }

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize application:', {
      message: err.message,
      stack: err.stack
    });
    process.exit(1);
  }
};

startServer();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password123';

// Daftar role untuk gacha
const ROLES = ['Alya', 'Amanda', 'Anindya', 'Aralie', 'Cathy', 'Chelsea', 'Christy', 'Cynthia', 'Daisy',
  'Danella', 'Delynn', 'Eli', 'Elin', 'Ella', 'Erine', 'Feni', 'Fiony', 'Freya', 'Fritzy', 'Gendis', 'Gita',
  'Gracia', 'Gracie', 'Greesel', 'Indah', 'Indira', 'Jessi', 'Kathrina', 'Kimmy', 'Lana', 'Levi', 'Lia', 'Lily',
  'Lulu', 'Lyn', 'Marsha', 'Michie', 'Moreen', 'Muthe', 'Nachia', 'Nala', 'Nayla', 'Oline', 'Olla', 'Oniel',
  'Raisha', 'Regie', 'Ribka', 'Trisha'];

// Fungsi gacha role
const getRandomRole = () => {
  const randomIndex = Math.floor(Math.random() * ROLES.length);
  return ROLES[randomIndex];
};

// Login admin
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Middleware autentikasi JWT
const authenticateAdmin = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

// Generate link baru
app.post('/api/generate-link', authenticateAdmin, async (req, res) => {
  const linkId = uuidv4();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  try {
    await db.execute('INSERT INTO links (id, expires_at) VALUES (?, ?)', [linkId, expiresAt]);
    res.json({ linkId });
  } catch (err) {
    res.status(500).json({ message: 'Failed to generate link', error: err.message });
  }
});

// Submit form dengan gacha role
app.post('/api/submit/:linkId', async (req, res) => {
  const { linkId } = req.params;
  const { username, discordId } = req.body;

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [link] = await connection.execute('SELECT * FROM links WHERE id = ? FOR UPDATE', [linkId]);
    if (!link || link.length === 0) {
      await connection.execute('UPDATE links SET attempt_count = attempt_count + 1 WHERE id = ?', [linkId]);
      await connection.commit();
      return res.status(404).json({ message: 'Link tidak valid!', attempt_count: 1 });
    }

    if (link[0].is_used) {
      await connection.execute('UPDATE links SET attempt_count = attempt_count + 1 WHERE id = ?', [linkId]);
      await connection.commit();
      return res.status(400).json({ message: 'Link sudah digunakan!', attempt_count: link[0].attempt_count + 1 });
    }

    const now = new Date();
    if (new Date(link[0].expires_at) < now) {
      await connection.execute('UPDATE links SET attempt_count = attempt_count + 1 WHERE id = ?', [linkId]);
      await connection.commit();
      return res.status(400).json({ message: 'Link telah kadaluarsa!', attempt_count: link[0].attempt_count + 1 });
    }

    const roleReward = getRandomRole();
    await connection.execute(
      'UPDATE links SET is_used = TRUE, winner_username = ?, discord_id = ?, role_reward = ? WHERE id = ? AND is_used = FALSE',
      [username, discordId, roleReward, linkId]
    );

    const [result] = await connection.execute('SELECT ROW_COUNT() as affected');
    if (result[0].affected === 0) {
      await connection.execute('UPDATE links SET attempt_count = attempt_count + 1 WHERE id = ?', [linkId]);
      await connection.commit();
      return res.status(400).json({ message: 'Link sudah digunakan oleh orang lain!', attempt_count: link[0].attempt_count + 1 });
    }

    await connection.commit();

    // Kirim notifikasi ke Discord webhook
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await axios.post(webhookUrl, {
          embeds: [{
            title: '🏆 Pemenang Kaget Baru!',
            description: `🔥 **User tergercep!** 🚀\n\n🎉 **Selamat ya wak~:**`,
            color: 0xffd700, // Warna emas (gold)
            fields: [
              { name: '👤 Username', value: `\`${username}\``, inline: true },
              { name: '🆔 Discord ID', value: `\`${discordId}\``, inline: true },
              { name: '🏅 Role Dimenangkan', value: `\`${roleReward}\``, inline: false },
              { name: '🔗 Link ID', value: `\`${linkId}\``, inline: false },
              { name: '⏳ Waktu Kemenangan', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            ],
            timestamp: new Date().toISOString()
          }]
        });        
      } catch (webhookError) {
        console.error('Gagal mengirim webhook:', webhookError.message);
      }
    }

    res.json({
      message: 'Selamat! Anda adalah pemenangnya. Role Discord akan segera diberikan.',
      expiresAt: link[0].expires_at,
      roleReward
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      await connection.execute('UPDATE links SET attempt_count = attempt_count + 1 WHERE id = ?', [linkId]);
      await connection.commit();
    }
    res.status(500).json({ message: 'Terjadi kesalahan server!', error: error.message, attempt_count: link ? link[0].attempt_count + 1 : 1 });
  } finally {
    if (connection) connection.release();
  }
});

// Riwayat pemenang (admin)
app.get('/api/winners', authenticateAdmin, async (req, res) => {
  try {
    const [winners] = await db.execute(
      'SELECT id, winner_username, discord_id, role_reward, created_at FROM links WHERE is_used = TRUE ORDER BY created_at DESC'
    );
    res.json(winners);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch winners', error: err.message });
  }
});

// Pemenang publik
app.get('/api/public/winners', async (req, res) => {
  try {
    const [winners] = await db.execute(
      'SELECT winner_username, role_reward, id FROM links WHERE is_used = TRUE ORDER BY created_at DESC'
    );
    res.json(winners);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch winners', error: err.message });
  }
});

app.post('/api/admin/add-event', authenticateAdmin, async (req, res) => {
  const { eventDate } = req.body; // eventDate sudah dalam UTC dari frontend
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const eventDateUTC = new Date(eventDate); // Langsung gunakan waktu UTC yang diterima
    const [eventResult] = await connection.execute(
      'INSERT INTO events (event_date) VALUES (?)',
      [eventDateUTC]
    );
    const eventId = eventResult.insertId;

    const linkId = uuidv4();
    const expiresAt = new Date(eventDateUTC.getTime() + 24 * 60 * 60 * 1000);
    await connection.execute(
      'INSERT INTO links (id, event_id, expires_at) VALUES (?, ?, ?)',
      [linkId, eventId, expiresAt]
    );

    await connection.commit();
    res.json({
      message: 'Event dan link berhasil ditambahkan',
      linkId,
      eventId
    });
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ message: 'Gagal menambah event dan link', error: err.message });
  } finally {
    if (connection) connection.release();
  }
});

app.get('/api/public/next-event', async (req, res) => {
  try {
    const [events] = await db.execute(
      'SELECT e.event_date, l.id AS link_id FROM events e LEFT JOIN links l ON e.id = l.event_id WHERE e.event_date > NOW() ORDER BY e.event_date ASC LIMIT 1'
    );
    if (events.length === 0) {
      res.json({ event_date: null, link_id: null, message: 'Belum ada event berikutnya.' });
    } else {
      res.json({
        event_date: events[0].event_date.toISOString(), // Kirim dalam UTC
        link_id: events[0].link_id
      });
    }
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch next event', error: err.message });
  }
});

// Cek status link
app.get('/api/check-link/:linkId', async (req, res) => {
  const { linkId } = req.params;
  try {
    const [link] = await db.execute('SELECT is_used FROM links WHERE id = ?', [linkId]);
    if (!link || link.length === 0) {
      return res.status(404).json({ message: 'Link tidak ditemukan' });
    }
    res.json({ is_used: link[0].is_used });
  } catch (err) {
    res.status(500).json({ message: 'Gagal memeriksa status link', error: err.message });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = await checkDBConnection();
    res.json({
      status: dbStatus ? 'ok' : 'error',
      message: dbStatus ? 'Server is running and database is connected' : 'Server is running but database connection failed',
      database: dbStatus ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});