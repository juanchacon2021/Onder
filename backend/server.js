require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'onder-barbershop-secret-2024';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Helper to handle Supabase responses
const handleResponse = (res, { data, error }, status = 200) => {
  if (error) return res.status(500).json({ error: error.message });
  res.status(status).json(data);
};

// --- Auth Routes ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const { data: user, error } = await supabase
    .from('users')
    .select('*, roles(name)')
    .eq('email', email)
    .single();

  if (error || !user) return res.status(401).json({ error: 'Invalid credentials' });

  const validPassword = user.password_hash ? await bcrypt.compare(password, user.password_hash) : (password === 'admin');

  if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, email: user.email, role: user.roles?.name }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, user: { id: user.id, full_name: user.full_name, email: user.email, role: user.roles?.name } });
});

// --- API Routes (Protected) ---

// Clients
app.get('/api/clients', authenticateToken, async (req, res) => {
  handleResponse(res, await supabase.from('clients').select('*').order('full_name'));
});
app.post('/api/clients', authenticateToken, async (req, res) => {
  handleResponse(res, await supabase.from('clients').insert([req.body]).select(), 201);
});

// Services
app.get('/api/services', authenticateToken, async (req, res) => {
  handleResponse(res, await supabase.from('services').select('*').eq('is_active', true));
});

// Visits
app.get('/api/visits', authenticateToken, async (req, res) => {
  handleResponse(res, await supabase.from('visits').select('*, clients(full_name), users(full_name), services(name)').order('visit_date', { ascending: false }));
});
app.post('/api/visits', authenticateToken, async (req, res) => {
  handleResponse(res, await supabase.from('visits').insert([req.body]).select(), 201);
});

// Inventory
app.get('/api/inventory', authenticateToken, async (req, res) => {
  handleResponse(res, await supabase.from('inventory').select('*').order('name'));
});
app.post('/api/inventory/movements', authenticateToken, async (req, res) => {
  handleResponse(res, await supabase.from('inventory_movements').insert([req.body]).select(), 201);
});

// Payments
app.get('/api/payments', authenticateToken, async (req, res) => {
    handleResponse(res, await supabase.from('payments').select('*, clients(full_name), payment_methods(name)'));
});

// Debts
app.get('/api/debts', authenticateToken, async (req, res) => {
    handleResponse(res, await supabase.from('debts').select('*, clients(full_name)'));
});

// Notifications
app.get('/api/notifications', authenticateToken, async (req, res) => {
    handleResponse(res, await supabase.from('notifications').select('*, clients(full_name)'));
});

// Settings & Social
app.get('/api/settings', authenticateToken, async (req, res) => {
    handleResponse(res, await supabase.from('settings').select('*').single());
});
app.get('/api/social-links', authenticateToken, async (req, res) => {
    handleResponse(res, await supabase.from('social_links').select('*'));
});

// --- WhatsApp Service Structure ---
const sendWhatsApp = async (phone, message) => {
    // This is where integration with Twilio, Gupshup, or similar would go
    console.log(`[WhatsApp Service] To: ${phone}, Msg: ${message}`);
    return { success: true, sid: 'mock_sid_' + Date.now() };
};

app.post('/api/notifications/whatsapp', authenticateToken, async (req, res) => {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ error: 'Phone and message are required' });

    try {
        const result = await sendWhatsApp(phone, message);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Failed to send WhatsApp' });
    }
});

app.get('/', (req, res) => {
  res.json({ message: 'Onder Barbershop API - Full' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
