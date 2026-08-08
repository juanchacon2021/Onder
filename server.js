import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const app = express();
const port = Number.parseInt(process.env.PORT || '3000', 10);
const jwtSecret = process.env.JWT_SECRET || 'change-me';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dataMode = (process.env.DATA_MODE || 'auto').toLowerCase();
const allowMockFallback = dataMode !== 'supabase';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn('⚠️  Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el archivo .env');
}

const supabase = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null;

const nowIso = () => new Date().toISOString();
const daysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const mockPasswordHash = bcrypt.hashSync('admin123', 10);

const mockStore = {
  settings: [
    {
      id: 'settings-1',
      business_name: 'Onder Barbershop',
      currency: 'USD',
      created_at: daysFromNow(-30)
    }
  ],
  roles: [
    { id: 'role-admin', name: 'Administrador', created_at: daysFromNow(-30) },
    { id: 'role-barber', name: 'Barbero', created_at: daysFromNow(-30) }
  ],
  users: [
    {
      id: 'user-1',
      full_name: 'Administrador',
      email: 'admin@onder.test',
      phone: '+1 555 0100',
      password_hash: mockPasswordHash,
      role_id: 'role-admin',
      is_active: true,
      created_at: daysFromNow(-18)
    },
    {
      id: 'user-2',
      full_name: 'Luis Barbero',
      email: 'luis@onder.test',
      phone: '+1 555 0101',
      password_hash: mockPasswordHash,
      role_id: 'role-barber',
      is_active: true,
      created_at: daysFromNow(-12)
    }
  ],
  clients: [
    {
      id: 'client-1',
      full_name: 'Juan Pérez',
      email: 'juan@example.com',
      phone: '+1 555 1001',
      instagram: '@juanp',
      favorite_style: 'Fade',
      last_visit: daysFromNow(-2),
      next_visit: daysFromNow(2),
      is_active: true,
      created_at: daysFromNow(-12)
    },
    {
      id: 'client-2',
      full_name: 'Carlos Rodríguez',
      email: 'carlos@example.com',
      phone: '+1 555 1002',
      instagram: '@carlosr',
      favorite_style: 'Corte clásico',
      last_visit: daysFromNow(-5),
      next_visit: daysFromNow(5),
      is_active: true,
      created_at: daysFromNow(-10)
    },
    {
      id: 'client-3',
      full_name: 'Marcos Díaz',
      email: 'marcos@example.com',
      phone: '+1 555 1003',
      instagram: '@marcosd',
      favorite_style: 'Barba',
      last_visit: daysFromNow(-1),
      next_visit: daysFromNow(7),
      is_active: true,
      created_at: daysFromNow(-1)
    }
  ],
  services: [
    {
      id: 'service-1',
      name: 'Corte Clásico',
      description: 'Ajuste limpio y detallado',
      price: 15,
      duration_minutes: 30,
      is_active: true,
      created_at: daysFromNow(-20)
    },
    {
      id: 'service-2',
      name: 'Fade',
      description: 'Degradado preciso',
      price: 20,
      duration_minutes: 40,
      is_active: true,
      created_at: daysFromNow(-18)
    },
    {
      id: 'service-3',
      name: 'Barba',
      description: 'Perfilado y acabado',
      price: 10,
      duration_minutes: 20,
      is_active: true,
      created_at: daysFromNow(-15)
    }
  ],
  inventory: [
    {
      id: 'inventory-1',
      name: 'Gel Fijador',
      category: 'Styling',
      stock: 3,
      minimum_stock: 5,
      supplier: 'Proveedor A',
      created_at: daysFromNow(-8)
    },
    {
      id: 'inventory-2',
      name: 'Cera Mate',
      category: 'Styling',
      stock: 2,
      minimum_stock: 4,
      supplier: 'Proveedor B',
      created_at: daysFromNow(-7)
    },
    {
      id: 'inventory-3',
      name: 'Espuma de barba',
      category: 'Cuidado',
      stock: 9,
      minimum_stock: 3,
      supplier: 'Proveedor C',
      created_at: daysFromNow(-5)
    }
  ],
  payment_methods: [
    { id: 'payment-method-cash', name: 'Efectivo', created_at: daysFromNow(-30) },
    { id: 'payment-method-card', name: 'Tarjeta', created_at: daysFromNow(-30) },
    { id: 'payment-method-transfer', name: 'Transferencia', created_at: daysFromNow(-30) }
  ],
  visits: [
    {
      id: 'visit-1',
      client_id: 'client-1',
      service_id: 'service-2',
      barber_id: 'user-2',
      payment_method_id: 'payment-method-cash',
      next_visit_date: daysFromNow(2),
      amount: 20,
      status: 'programado',
      created_at: daysFromNow(-2)
    },
    {
      id: 'visit-2',
      client_id: 'client-2',
      service_id: 'service-1',
      barber_id: 'user-2',
      payment_method_id: 'payment-method-card',
      next_visit_date: daysFromNow(5),
      amount: 15,
      status: 'programado',
      created_at: daysFromNow(-1)
    },
    {
      id: 'visit-3',
      client_id: 'client-3',
      service_id: 'service-3',
      barber_id: 'user-2',
      payment_method_id: 'payment-method-transfer',
      next_visit_date: daysFromNow(7),
      amount: 10,
      status: 'programado',
      created_at: daysFromNow(-1)
    }
  ],
  payments: [
    {
      id: 'payment-1',
      client_id: 'client-1',
      payment_method_id: 'payment-method-cash',
      amount: 20,
      payment_date: daysFromNow(-1),
      status: 'pagado',
      created_at: daysFromNow(-1)
    },
    {
      id: 'payment-2',
      client_id: 'client-2',
      payment_method_id: 'payment-method-card',
      amount: 15,
      payment_date: nowIso(),
      status: 'pagado',
      created_at: nowIso()
    }
  ],
  notifications: [
    { id: 'notification-1', title: 'Recordatorio', is_sent: false, created_at: nowIso() },
    { id: 'notification-2', title: 'Inventario bajo', is_sent: false, created_at: nowIso() },
    { id: 'notification-3', title: 'Mensaje enviado', is_sent: true, created_at: nowIso() }
  ]
};

function cloneRow(row) {
  return JSON.parse(JSON.stringify(row));
}

function sortByCreatedAtDescending(rows) {
  return [...rows].sort((left, right) => new Date(right.created_at || 0) - new Date(left.created_at || 0));
}

function getMockRows(table) {
  const rows = mockStore[table] || [];
  return sortByCreatedAtDescending(rows).map(cloneRow);
}

function nextMockId(table) {
  return `${table}-${(mockStore[table]?.length || 0) + 1}`;
}

function insertMockRow(table, payload) {
  const row = {
    id: payload.id || nextMockId(table),
    created_at: payload.created_at || nowIso(),
    ...payload
  };

  if (table === 'clients') {
    row.is_active = payload.is_active !== false;
  }

  if (table === 'inventory') {
    row.stock = numberValue(payload.stock);
    row.minimum_stock = numberValue(payload.minimum_stock);
  }

  if (table === 'payments') {
    row.amount = numberValue(payload.amount);
    row.payment_date = payload.payment_date || nowIso();
  }

  if (table === 'visits') {
    row.amount = numberValue(payload.amount);
    row.status = payload.status || 'programado';
  }

  if (!mockStore[table]) {
    mockStore[table] = [];
  }

  mockStore[table].unshift(row);
  return cloneRow(row);
}

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

const isSupabaseReady = () => Boolean(supabase);

function requireSupabase(res) {
  if (!isSupabaseReady() && !allowMockFallback) {
    res.status(500).json({
      error: 'Supabase no está configurado. Revisa SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.'
    });
    return false;
  }
  return true;
}

function sameDay(value) {
  const current = new Date();
  const candidate = new Date(value);
  return candidate.toDateString() === current.toDateString();
}

function withinDays(value, days) {
  const candidate = new Date(value);
  if (Number.isNaN(candidate.getTime())) {
    return false;
  }
  const target = new Date();
  target.setDate(target.getDate() + days);
  return candidate >= new Date() && candidate <= target;
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

async function fetchRows(table, query = '*') {
  if (isSupabaseReady()) {
    try {
      const { data, error } = await supabase.from(table).select(query).order('created_at', { ascending: false });
      if (error) {
        throw error;
      }
      return data ?? [];
    } catch (error) {
      if (!allowMockFallback) {
        throw error;
      }
      console.warn(`Usando datos mock para ${table}: ${error.message}`);
    }
  }
  return getMockRows(table);
}

function signUser(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role_id: user.role_id,
      full_name: user.full_name
    },
    jwtSecret,
    { expiresIn: '7d' }
  );
}

function buildActivityFeed({ clients, visits, payments }) {
  const clientItems = clients.slice(0, 3).map((client) => ({
    title: 'Nuevo cliente registrado',
    meta: `${client.full_name}${client.phone ? ` • ${client.phone}` : ''}`,
    type: 'green',
    createdAt: client.created_at
  }));

  const visitItems = visits.slice(0, 4).map((visit) => ({
    title: 'Visita registrada',
    meta: `${visit.client_name || 'Cliente'} • ${visit.payment_method_name || 'Sin método'}`,
    type: 'blue',
    createdAt: visit.created_at
  }));

  const paymentItems = payments.slice(0, 4).map((payment) => ({
    title: 'Pago recibido',
    meta: `${payment.amount.toFixed(2)} ${payment.currency} • ${payment.payment_method_name || 'Sin método'}`,
    type: 'orange',
    createdAt: payment.created_at
  }));

  return [...clientItems, ...visitItems, ...paymentItems]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 6)
    .map(({ createdAt, ...item }) => item);
}

async function sendWhatsAppText({ to, message }) {
  const provider = (process.env.WHATSAPP_PROVIDER || '').toLowerCase();

  if (!provider || provider === 'mock' || !isSupabaseReady()) {
    return { ok: true, provider: 'mock', messageId: `mock-${Date.now()}` };
  }

  if (provider !== 'cloud-api') {
    throw new Error('Proveedor de WhatsApp no soportado. Usa WHATSAPP_PROVIDER=cloud-api o mock.');
  }

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    throw new Error('Faltan credenciales de WhatsApp Cloud API.');
  }

  const response = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message }
    })
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message || 'No se pudo enviar el mensaje de WhatsApp.');
  }

  return { ok: true, provider: 'cloud-api', payload };
}

// ===== HEALTH CHECK =====
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    supabaseReady: isSupabaseReady(),
    configuredDataMode: dataMode,
    effectiveDataMode: isSupabaseReady() ? 'supabase' : 'mock'
  });
});

// ===== SETTINGS =====
app.get('/api/settings', async (_req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const settings = await fetchRows('settings');
    res.json(settings[0] || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== DASHBOARD =====
app.get('/api/dashboard/summary', async (_req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const [clients, services, inventory, visits, payments, users, notifications, settings, paymentMethods] = await Promise.all([
      fetchRows('clients'),
      fetchRows('services'),
      fetchRows('inventory'),
      fetchRows('visits'),
      fetchRows('payments'),
      fetchRows('users'),
      fetchRows('notifications'),
      fetchRows('settings'),
      fetchRows('payment_methods')
    ]);

    const clientMap = new Map(clients.map((client) => [client.id, client]));
    const paymentMethodMap = new Map(paymentMethods.map((method) => [method.id, method]));
    const serviceMap = new Map(services.map((service) => [service.id, service]));
    const userMap = new Map(users.map((user) => [user.id, user]));

    const enrichedVisits = visits.map((visit) => {
      const client = clientMap.get(visit.client_id);
      const paymentMethod = paymentMethodMap.get(visit.payment_method_id);
      const service = serviceMap.get(visit.service_id);
      const barber = userMap.get(visit.barber_id);
      return {
        ...visit,
        client_name: client?.full_name || 'Cliente sin nombre',
        client_phone: client?.phone || '',
        service_name: service?.name || 'Servicio',
        barber_name: barber?.full_name || 'Barbero',
        payment_method_name: paymentMethod?.name || 'Sin método'
      };
    });

    const enrichedPayments = payments.map((payment) => {
      const client = clientMap.get(payment.client_id);
      const paymentMethod = paymentMethodMap.get(payment.payment_method_id);
      return {
        ...payment,
        client_name: client?.full_name || 'Cliente sin nombre',
        payment_method_name: paymentMethod?.name || 'Sin método',
        currency: settings[0]?.currency || 'USD',
        amount: numberValue(payment.amount)
      };
    });

    const lowStockItems = inventory
      .filter((item) => numberValue(item.stock) <= numberValue(item.minimum_stock))
      .sort((left, right) => numberValue(left.stock) - numberValue(right.stock))
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        name: item.name,
        stock: numberValue(item.stock),
        minimumStock: numberValue(item.minimum_stock),
        percent: Math.max(4, Math.round((numberValue(item.stock) / Math.max(1, numberValue(item.minimum_stock))) * 100))
      }));

    const upcomingVisits = enrichedVisits
      .filter((visit) => visit.next_visit_date && withinDays(visit.next_visit_date, 7))
      .sort((left, right) => new Date(left.next_visit_date) - new Date(right.next_visit_date))
      .slice(0, 6)
      .map((visit) => ({
        id: visit.id,
        clientId: visit.client_id,
        clientName: visit.client_name,
        clientPhone: visit.client_phone,
        serviceName: visit.service_name,
        date: visit.next_visit_date,
        amount: numberValue(visit.amount),
        status: visit.status,
        initials: initials(visit.client_name)
      }));

    const todayRevenue = enrichedPayments
      .filter((payment) => payment.payment_date && sameDay(payment.payment_date))
      .reduce((total, payment) => total + numberValue(payment.amount), 0);

    const todaysClients = clients.filter((client) => client.created_at && sameDay(client.created_at)).length;
    const todaysVisits = enrichedVisits.filter((visit) => visit.created_at && sameDay(visit.created_at)).length;
    const activeServices = services.filter((service) => service.is_active !== false).length;

    res.json({
      businessName: settings[0]?.business_name || 'Onder Barbershop',
      currency: settings[0]?.currency || 'USD',
      metrics: {
        clientsToday: todaysClients,
        upcomingVisits: upcomingVisits.length,
        dailyRevenue: todayRevenue,
        servicesDone: todaysVisits,
        totalClients: clients.length,
        totalServices: activeServices,
        totalUsers: users.length,
        notifications: notifications.filter((notification) => !notification.is_sent).length
      },
      upcomingVisits,
      lowStockItems,
      recentActivity: buildActivityFeed({
        clients: clients.slice(0, 4),
        visits: enrichedVisits.slice(0, 4),
        payments: enrichedPayments.slice(0, 4)
      })
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== CLIENTES =====

// GET /api/clients - Listar clientes
app.get('/api/clients', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const { search = '' } = req.query;
    const clients = await fetchRows('clients');
    const filtered = search
      ? clients.filter((client) => 
          [client.full_name, client.phone, client.instagram, client.email]
            .join(' ')
            .toLowerCase()
            .includes(String(search).toLowerCase())
        )
      : clients;
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/clients/:id - Obtener un cliente
app.get('/api/clients/:id', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const { id } = req.params;
    if (isSupabaseReady()) {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return res.json(data);
    }
    const client = mockStore.clients.find(c => c.id === id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(client);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/clients - Crear cliente (CORREGIDO)
app.post('/api/clients', async (req, res) => {
  console.log('📥 POST /api/clients - Body recibido:', JSON.stringify(req.body, null, 2));
  
  if (!requireSupabase(res)) return;

  try {
    const payload = req.body || {};

    // Validación
    if (!payload.full_name || !payload.full_name.trim()) {
      return res.status(400).json({ error: 'El nombre completo es obligatorio' });
    }
    if (!payload.phone || !payload.phone.trim()) {
      return res.status(400).json({ error: 'El teléfono es obligatorio' });
    }

    // Construir objeto de datos
    const clientData = {
      full_name: payload.full_name.trim(),
      phone: payload.phone.trim()
    };

    // Agregar campos opcionales si existen
    if (payload.email) clientData.email = payload.email.trim();
    if (payload.instagram) clientData.instagram = payload.instagram.trim();
    if (payload.favorite_style) clientData.favorite_style = payload.favorite_style.trim();
    if (payload.last_visit) clientData.last_visit = payload.last_visit;
    if (payload.next_visit) clientData.next_visit = payload.next_visit;
    if (payload.is_active !== undefined) clientData.is_active = payload.is_active;

    console.log('📝 Datos a insertar en Supabase:', clientData);

    if (isSupabaseReady()) {
      try {
        const { data, error } = await supabase
          .from('clients')
          .insert([clientData])
          .select()
          .single();

        if (error) {
          console.error('❌ Error de Supabase:', error);
          return res.status(400).json({ 
            error: error.message,
            details: error.details,
            hint: error.hint
          });
        }

        console.log('✅ Cliente creado exitosamente:', data);
        return res.status(201).json(data);
      } catch (error) {
        console.error('❌ Error en try Supabase:', error);
        if (!allowMockFallback) throw error;
      }
    }

    // Mock fallback
    const newClient = insertMockRow('clients', clientData);
    console.log('✅ Cliente creado en mock:', newClient);
    res.status(201).json(newClient);
  } catch (error) {
    console.error('❌ Error general en POST:', error);
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/clients/:id - Actualizar cliente
app.put('/api/clients/:id', async (req, res) => {
  console.log('📥 PUT /api/clients/:id - Body:', req.body);
  
  if (!requireSupabase(res)) return;
  
  try {
    const { id } = req.params;
    const payload = req.body || {};

    if (!payload.full_name || !payload.full_name.trim()) {
      return res.status(400).json({ error: 'El nombre completo es obligatorio' });
    }

    const clientData = {
      full_name: payload.full_name.trim(),
      phone: payload.phone?.trim() || null,
      email: payload.email || null,
      instagram: payload.instagram || null,
      favorite_style: payload.favorite_style || null,
      last_visit: payload.last_visit || null,
      next_visit: payload.next_visit || null,
      is_active: payload.is_active !== false
    };
    
    if (isSupabaseReady()) {
      const { data, error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    }
    
    // Mock
    const index = mockStore.clients.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ error: 'Cliente no encontrado' });
    mockStore.clients[index] = { ...mockStore.clients[index], ...clientData };
    res.json(mockStore.clients[index]);
  } catch (error) {
    console.error('❌ Error en PUT:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/clients/:id - Eliminar cliente
app.delete('/api/clients/:id', async (req, res) => {
  if (!requireSupabase(res)) return;
  
  try {
    const { id } = req.params;
    
    if (isSupabaseReady()) {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }
    
    // Mock
    const index = mockStore.clients.findIndex(c => c.id === id);
    if (index === -1) return res.status(404).json({ error: 'Cliente no encontrado' });
    mockStore.clients.splice(index, 1);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error en DELETE:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== SERVICIOS =====
app.get('/api/services', async (_req, res) => {
  if (!requireSupabase(res)) return;
  try {
    res.json(await fetchRows('services'));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== INVENTARIO =====
app.get('/api/inventory', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const inventory = await fetchRows('inventory');
    const lowOnly = String(req.query.lowStock || '').toLowerCase() === 'true';
    const filtered = lowOnly
      ? inventory.filter((item) => numberValue(item.stock) <= numberValue(item.minimum_stock))
      : inventory;
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/inventory', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const payload = req.body || {};
    if (isSupabaseReady()) {
      try {
        const { data, error } = await supabase.from('inventory').insert([payload]).select().single();
        if (error) throw error;
        return res.status(201).json(data);
      } catch (error) {
        if (!allowMockFallback) throw error;
        console.warn(`Insertando inventario en mock: ${error.message}`);
      }
    }
    res.status(201).json(insertMockRow('inventory', payload));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===== VISITAS =====
app.get('/api/visits/upcoming', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const days = Number.parseInt(req.query.days || '7', 10);
    const [clients, services, paymentMethods, visits] = await Promise.all([
      fetchRows('clients'),
      fetchRows('services'),
      fetchRows('payment_methods'),
      fetchRows('visits')
    ]);

    const clientMap = new Map(clients.map((client) => [client.id, client]));
    const serviceMap = new Map(services.map((service) => [service.id, service]));
    const paymentMethodMap = new Map(paymentMethods.map((method) => [method.id, method]));

    const upcomingVisits = visits
      .filter((visit) => visit.next_visit_date && withinDays(visit.next_visit_date, days))
      .sort((left, right) => new Date(left.next_visit_date) - new Date(right.next_visit_date))
      .map((visit) => ({
        ...visit,
        client_name: clientMap.get(visit.client_id)?.full_name || 'Cliente',
        client_phone: clientMap.get(visit.client_id)?.phone || '',
        service_name: serviceMap.get(visit.service_id)?.name || 'Servicio',
        payment_method_name: paymentMethodMap.get(visit.payment_method_id)?.name || 'Sin método'
      }));

    res.json(upcomingVisits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== PAGOS =====
app.get('/api/payment-methods', async (_req, res) => {
  if (!requireSupabase(res)) return;
  try {
    res.json(await fetchRows('payment_methods'));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/payments', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const { search = '', paymentMethod = '', status = '' } = req.query;
    const [clients, paymentMethods, payments] = await Promise.all([
      fetchRows('clients'),
      fetchRows('payment_methods'),
      fetchRows('payments')
    ]);

    const clientMap = new Map(clients.map((client) => [client.id, client]));
    const paymentMethodMap = new Map(paymentMethods.map((method) => [method.id, method]));

    const enrichedPayments = payments.map((payment) => ({
      ...payment,
      amount: numberValue(payment.amount),
      client_name: clientMap.get(payment.client_id)?.full_name || 'Cliente',
      payment_method_name: paymentMethodMap.get(payment.payment_method_id)?.name || 'Sin método'
    }));

    const filteredPayments = enrichedPayments.filter((payment) => {
      const searchText = String(search).trim().toLowerCase();
      const matchesSearch = !searchText || [
        payment.client_name,
        payment.payment_method_name,
        payment.status,
        payment.amount
      ].join(' ').toLowerCase().includes(searchText);
      const matchesMethod = !paymentMethod || payment.payment_method_id === paymentMethod;
      const matchesStatus = !status || String(payment.status || '').toLowerCase() === String(status).toLowerCase();
      return matchesSearch && matchesMethod && matchesStatus;
    });

    res.json(filteredPayments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/payments/:id', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const { id } = req.params;
    if (isSupabaseReady()) {
      const { data, error } = await supabase.from('payments').select('*').eq('id', id).single();
      if (error) throw error;
      return res.json(data);
    }
    const payment = mockStore.payments.find((item) => item.id === id);
    if (!payment) return res.status(404).json({ error: 'Pago no encontrado' });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payments', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const payload = req.body || {};

    if (!payload.client_id) {
      return res.status(400).json({ error: 'El cliente es obligatorio' });
    }
    if (!payload.payment_method_id) {
      return res.status(400).json({ error: 'El método de pago es obligatorio' });
    }
    if (payload.amount === undefined || Number(payload.amount) <= 0) {
      return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
    }

    const paymentData = {
      client_id: payload.client_id,
      payment_method_id: payload.payment_method_id,
      amount: numberValue(payload.amount),
      payment_date: payload.payment_date || nowIso(),
      status: payload.status || 'pagado'
    };

    if (isSupabaseReady()) {
      try {
        const { data, error } = await supabase.from('payments').insert([paymentData]).select().single();
        if (error) throw error;
        return res.status(201).json(data);
      } catch (error) {
        if (!allowMockFallback) throw error;
        console.warn(`Insertando pago en mock: ${error.message}`);
      }
    }

    res.status(201).json(insertMockRow('payments', paymentData));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/payments/:id', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const { id } = req.params;
    const payload = req.body || {};

    if (!payload.client_id) {
      return res.status(400).json({ error: 'El cliente es obligatorio' });
    }
    if (!payload.payment_method_id) {
      return res.status(400).json({ error: 'El método de pago es obligatorio' });
    }
    if (payload.amount === undefined || Number(payload.amount) <= 0) {
      return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
    }

    const paymentData = {
      client_id: payload.client_id,
      payment_method_id: payload.payment_method_id,
      amount: numberValue(payload.amount),
      payment_date: payload.payment_date || nowIso(),
      status: payload.status || 'pagado'
    };

    if (isSupabaseReady()) {
      const { data, error } = await supabase
        .from('payments')
        .update(paymentData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    }

    const index = mockStore.payments.findIndex((payment) => payment.id === id);
    if (index === -1) return res.status(404).json({ error: 'Pago no encontrado' });
    mockStore.payments[index] = { ...mockStore.payments[index], ...paymentData };
    res.json(mockStore.payments[index]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/payments/:id', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const { id } = req.params;

    if (isSupabaseReady()) {
      const { error } = await supabase.from('payments').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    const index = mockStore.payments.findIndex((payment) => payment.id === id);
    if (index === -1) return res.status(404).json({ error: 'Pago no encontrado' });
    mockStore.payments.splice(index, 1);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== USUARIOS =====
function stripPasswordAndAttachRole(user, roleName = 'Sin rol') {
  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  return {
    ...safeUser,
    role_name: roleName
  };
}

app.get('/api/roles', async (_req, res) => {
  if (!requireSupabase(res)) return;
  try {
    res.json(await fetchRows('roles'));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const { search = '', roleId = '' } = req.query;
    const [users, roles] = await Promise.all([fetchRows('users'), fetchRows('roles')]);
    const roleMap = new Map(roles.map((role) => [role.id, role]));

    const filteredUsers = users.filter((user) => {
      const searchText = String(search).trim().toLowerCase();
      const matchesSearch = !searchText || [user.full_name, user.email, user.phone]
        .join(' ')
        .toLowerCase()
        .includes(searchText);
      const matchesRole = !roleId || user.role_id === roleId;
      return matchesSearch && matchesRole;
    });

    res.json(filteredUsers.map((user) => stripPasswordAndAttachRole(user, roleMap.get(user.role_id)?.name || 'Sin rol')));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const { id } = req.params;
    const [roles, users] = await Promise.all([fetchRows('roles'), fetchRows('users')]);
    const roleMap = new Map(roles.map((role) => [role.id, role]));
    const user = users.find((item) => item.id === id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(stripPasswordAndAttachRole(user, roleMap.get(user.role_id)?.name || 'Sin rol'));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const payload = req.body || {};

    if (!payload.full_name || !payload.full_name.trim()) {
      return res.status(400).json({ error: 'El nombre completo es obligatorio' });
    }
    if (!payload.email || !payload.email.trim()) {
      return res.status(400).json({ error: 'El email es obligatorio' });
    }
    if (!payload.role_id) {
      return res.status(400).json({ error: 'El rol es obligatorio' });
    }
    if (!payload.password || String(payload.password).length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const userData = {
      full_name: payload.full_name.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone?.trim() || null,
      role_id: payload.role_id,
      is_active: payload.is_active !== false,
      password_hash: await bcrypt.hash(String(payload.password), 10)
    };

    if (isSupabaseReady()) {
      try {
        const { data, error } = await supabase.from('users').insert([userData]).select().single();
        if (error) throw error;
        const { data: role } = await supabase.from('roles').select('id, name').eq('id', data.role_id).maybeSingle();
        return res.status(201).json(stripPasswordAndAttachRole(data, role?.name || 'Sin rol'));
      } catch (error) {
        if (!allowMockFallback) throw error;
        console.warn(`Insertando usuario en mock: ${error.message}`);
      }
    }

    const newUser = insertMockRow('users', userData);
    const roleName = mockStore.roles.find((item) => item.id === newUser.role_id)?.name || 'Sin rol';
    res.status(201).json(stripPasswordAndAttachRole(newUser, roleName));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const { id } = req.params;
    const payload = req.body || {};

    if (!payload.full_name || !payload.full_name.trim()) {
      return res.status(400).json({ error: 'El nombre completo es obligatorio' });
    }
    if (!payload.email || !payload.email.trim()) {
      return res.status(400).json({ error: 'El email es obligatorio' });
    }
    if (!payload.role_id) {
      return res.status(400).json({ error: 'El rol es obligatorio' });
    }

    const userData = {
      full_name: payload.full_name.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone?.trim() || null,
      role_id: payload.role_id,
      is_active: payload.is_active !== false
    };

    if (payload.password) {
      if (String(payload.password).length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }
      userData.password_hash = await bcrypt.hash(String(payload.password), 10);
    }

    if (isSupabaseReady()) {
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      const { data: role } = await supabase.from('roles').select('id, name').eq('id', data.role_id).maybeSingle();
      return res.json(stripPasswordAndAttachRole(data, role?.name || 'Sin rol'));
    }

    const index = mockStore.users.findIndex((item) => item.id === id);
    if (index === -1) return res.status(404).json({ error: 'Usuario no encontrado' });
    mockStore.users[index] = { ...mockStore.users[index], ...userData };
    const roleName = mockStore.roles.find((item) => item.id === mockStore.users[index].role_id)?.name || 'Sin rol';
    res.json(stripPasswordAndAttachRole(mockStore.users[index], roleName));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const { id } = req.params;

    if (isSupabaseReady()) {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }

    const index = mockStore.users.findIndex((item) => item.id === id);
    if (index === -1) return res.status(404).json({ error: 'Usuario no encontrado' });
    mockStore.users.splice(index, 1);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== NOTIFICACIONES =====
app.get('/api/notifications', async (_req, res) => {
  if (!requireSupabase(res)) return;
  try {
    res.json(await fetchRows('notifications'));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== AUTENTICACIÓN =====
app.post('/api/auth/login', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios.' });
    }

    if (allowMockFallback || !isSupabaseReady() || dataMode === 'mock') {
      const user = mockStore.users.find((item) => item.email.toLowerCase() === String(email).toLowerCase());
      if (!user || !user.is_active) {
        return res.status(401).json({ error: 'Credenciales inválidas.' });
      }
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Credenciales inválidas.' });
      }
      const role = mockStore.roles.find((item) => item.id === user.role_id);
      const token = signUser(user);
      return res.json({
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          role_id: user.role_id,
          role_name: role?.name || 'Sin rol'
        }
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, full_name, email, phone, password_hash, role_id, is_active')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }
    if (!user.password_hash) {
      return res.status(409).json({ error: 'El usuario no tiene contraseña configurada.' });
    }
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const { data: role } = await supabase.from('roles').select('id, name').eq('id', user.role_id).maybeSingle();
    const token = signUser(user);
    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role_id: user.role_id,
        role_name: role?.name || 'Sin rol'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/me', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    return res.status(401).json({ error: 'No autenticado.' });
  }
  try {
    const payload = jwt.verify(token, jwtSecret);
    res.json({ user: payload });
  } catch (_error) {
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
});

// ===== WHATSAPP =====
app.post('/api/notifications/whatsapp', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const { to, message, clientId } = req.body || {};
    let recipient = to;
    if (!recipient && clientId) {
      if (isSupabaseReady()) {
        const { data: client } = await supabase.from('clients').select('phone, full_name').eq('id', clientId).maybeSingle();
        recipient = client?.phone;
      } else {
        recipient = mockStore.clients.find((client) => client.id === clientId)?.phone;
      }
    }
    if (!recipient || !message) {
      return res.status(400).json({ error: 'to y message son obligatorios.' });
    }
    const result = await sendWhatsAppText({ to: String(recipient).replace(/\D/g, ''), message });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/whatsapp/send', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const { to, message } = req.body || {};
    if (!to || !message) {
      return res.status(400).json({ error: 'to y message son obligatorios.' });
    }
    const result = await sendWhatsAppText({ to: String(to).replace(/\D/g, ''), message });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== FRONTEND =====
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ===== INICIAR SERVIDOR =====
app.listen(port, () => {
  console.log(`🚀 Onder backend listo en http://localhost:${port}`);
  console.log(`📊 Modo: ${isSupabaseReady() ? 'Supabase' : 'Mock'}`);
  console.log(`📝 Puerto: ${port}`);
});

// ===== SERVICIOS =====

// GET /api/services - Listar servicios
app.get('/api/services', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const { search = '' } = req.query;
    let services = await fetchRows('services');
    if (search) {
      services = services.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(search.toLowerCase()))
      );
    }
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/services/:id - Obtener un servicio
app.get('/api/services/:id', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const { id } = req.params;
    if (isSupabaseReady()) {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return res.json(data);
    }
    const service = mockStore.services.find(s => s.id === id);
    if (!service) return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/services - Crear servicio
app.post('/api/services', async (req, res) => {
  console.log('📥 POST /api/services - Body:', req.body);
  
  if (!requireSupabase(res)) return;

  try {
    const payload = req.body || {};

    if (!payload.name || !payload.name.trim()) {
      return res.status(400).json({ error: 'El nombre del servicio es obligatorio' });
    }
    if (!payload.price || payload.price <= 0) {
      return res.status(400).json({ error: 'El precio debe ser mayor a 0' });
    }

    const serviceData = {
      name: payload.name.trim(),
      description: payload.description || null,
      price: parseFloat(payload.price),
      duration_minutes: payload.duration_minutes ? parseInt(payload.duration_minutes) : null,
      is_active: payload.is_active !== false
    };

    console.log('📝 Datos a insertar:', serviceData);

    if (isSupabaseReady()) {
      try {
        const { data, error } = await supabase
          .from('services')
          .insert([serviceData])
          .select()
          .single();

        if (error) {
          console.error('❌ Error de Supabase:', error);
          return res.status(400).json({ 
            error: error.message,
            details: error.details,
            hint: error.hint
          });
        }

        console.log('✅ Servicio creado:', data);
        return res.status(201).json(data);
      } catch (error) {
        console.error('❌ Error en try Supabase:', error);
        if (!allowMockFallback) throw error;
      }
    }

    const newService = insertMockRow('services', serviceData);
    console.log('✅ Servicio creado en mock:', newService);
    res.status(201).json(newService);
  } catch (error) {
    console.error('❌ Error general en POST:', error);
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/services/:id - Actualizar servicio
app.put('/api/services/:id', async (req, res) => {
  console.log('📥 PUT /api/services/:id - Body:', req.body);
  
  if (!requireSupabase(res)) return;
  
  try {
    const { id } = req.params;
    const payload = req.body || {};

    if (!payload.name || !payload.name.trim()) {
      return res.status(400).json({ error: 'El nombre del servicio es obligatorio' });
    }

    const serviceData = {
      name: payload.name.trim(),
      description: payload.description || null,
      price: parseFloat(payload.price) || 0,
      duration_minutes: payload.duration_minutes ? parseInt(payload.duration_minutes) : null,
      is_active: payload.is_active !== false
    };
    
    if (isSupabaseReady()) {
      const { data, error } = await supabase
        .from('services')
        .update(serviceData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    }
    
    const index = mockStore.services.findIndex(s => s.id === id);
    if (index === -1) return res.status(404).json({ error: 'Servicio no encontrado' });
    mockStore.services[index] = { ...mockStore.services[index], ...serviceData };
    res.json(mockStore.services[index]);
  } catch (error) {
    console.error('❌ Error en PUT:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/services/:id - Eliminar servicio
app.delete('/api/services/:id', async (req, res) => {
  if (!requireSupabase(res)) return;
  
  try {
    const { id } = req.params;
    
    if (isSupabaseReady()) {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }
    
    const index = mockStore.services.findIndex(s => s.id === id);
    if (index === -1) return res.status(404).json({ error: 'Servicio no encontrado' });
    mockStore.services.splice(index, 1);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error en DELETE:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== INVENTARIO =====

// GET /api/inventory - Listar productos
app.get('/api/inventory', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const { search = '', lowStock = false } = req.query;
    let inventory = await fetchRows('inventory');
    
    if (search) {
      inventory = inventory.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    if (lowStock === 'true') {
      inventory = inventory.filter(p => 
        (p.stock || 0) <= (p.minimum_stock || 0)
      );
    }
    
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/inventory/:id - Obtener un producto
app.get('/api/inventory/:id', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const { id } = req.params;
    if (isSupabaseReady()) {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return res.json(data);
    }
    const product = mockStore.inventory.find(p => p.id === id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/inventory - Crear producto
app.post('/api/inventory', async (req, res) => {
  console.log('📥 POST /api/inventory - Body:', req.body);
  
  if (!requireSupabase(res)) return;

  try {
    const payload = req.body || {};

    if (!payload.name || !payload.name.trim()) {
      return res.status(400).json({ error: 'El nombre del producto es obligatorio' });
    }

    const productData = {
      name: payload.name.trim(),
      category: payload.category || null,
      stock: parseInt(payload.stock) || 0,
      minimum_stock: parseInt(payload.minimum_stock) || 0,
      purchase_price: payload.purchase_price ? parseFloat(payload.purchase_price) : null,
      sale_price: payload.sale_price ? parseFloat(payload.sale_price) : null,
      supplier: payload.supplier || null,
      image_url: payload.image_url || null,
      updated_at: new Date().toISOString()
    };

    console.log('📝 Datos a insertar:', productData);

    if (isSupabaseReady()) {
      try {
        const { data, error } = await supabase
          .from('inventory')
          .insert([productData])
          .select()
          .single();

        if (error) {
          console.error('❌ Error de Supabase:', error);
          return res.status(400).json({ 
            error: error.message,
            details: error.details,
            hint: error.hint
          });
        }

        console.log('✅ Producto creado:', data);
        return res.status(201).json(data);
      } catch (error) {
        console.error('❌ Error en try Supabase:', error);
        if (!allowMockFallback) throw error;
      }
    }

    const newProduct = insertMockRow('inventory', productData);
    console.log('✅ Producto creado en mock:', newProduct);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('❌ Error general en POST:', error);
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/inventory/:id - Actualizar producto
app.put('/api/inventory/:id', async (req, res) => {
  console.log('📥 PUT /api/inventory/:id - Body:', req.body);
  
  if (!requireSupabase(res)) return;
  
  try {
    const { id } = req.params;
    const payload = req.body || {};

    if (!payload.name || !payload.name.trim()) {
      return res.status(400).json({ error: 'El nombre del producto es obligatorio' });
    }

    const productData = {
      name: payload.name.trim(),
      category: payload.category || null,
      stock: parseInt(payload.stock) || 0,
      minimum_stock: parseInt(payload.minimum_stock) || 0,
      purchase_price: payload.purchase_price ? parseFloat(payload.purchase_price) : null,
      sale_price: payload.sale_price ? parseFloat(payload.sale_price) : null,
      supplier: payload.supplier || null,
      image_url: payload.image_url || null,
      updated_at: new Date().toISOString()
    };
    
    if (isSupabaseReady()) {
      const { data, error } = await supabase
        .from('inventory')
        .update(productData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    }
    
    const index = mockStore.inventory.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ error: 'Producto no encontrado' });
    mockStore.inventory[index] = { ...mockStore.inventory[index], ...productData };
    res.json(mockStore.inventory[index]);
  } catch (error) {
    console.error('❌ Error en PUT:', error);
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/inventory/:id - Eliminar producto
app.delete('/api/inventory/:id', async (req, res) => {
  if (!requireSupabase(res)) return;
  
  try {
    const { id } = req.params;
    
    if (isSupabaseReady()) {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return res.json({ success: true });
    }
    
    const index = mockStore.inventory.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ error: 'Producto no encontrado' });
    mockStore.inventory.splice(index, 1);
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error en DELETE:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== MOVIMIENTOS DE INVENTARIO =====

// POST /api/inventory/movements - Registrar movimiento
app.post('/api/inventory/movements', async (req, res) => {
  console.log('📥 POST /api/inventory/movements - Body:', req.body);
  
  if (!requireSupabase(res)) return;

  try {
    const payload = req.body || {};

    if (!payload.inventory_id) {
      return res.status(400).json({ error: 'inventory_id es obligatorio' });
    }
    if (!payload.type || !['entrada', 'salida', 'ajuste'].includes(payload.type)) {
      return res.status(400).json({ error: 'Tipo de movimiento inválido' });
    }
    if (!payload.quantity || payload.quantity <= 0) {
      return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
    }

    const movementData = {
      inventory_id: payload.inventory_id,
      type: payload.type,
      quantity: parseInt(payload.quantity),
      notes: payload.notes || null,
      created_at: new Date().toISOString()
    };

    console.log('📝 Movimiento a insertar:', movementData);

    if (isSupabaseReady()) {
      try {
        // Insertar movimiento
        const { data: movement, error: movementError } = await supabase
          .from('inventory_movements')
          .insert([movementData])
          .select()
          .single();

        if (movementError) {
          console.error('❌ Error al insertar movimiento:', movementError);
          return res.status(400).json({ 
            error: movementError.message,
            details: movementError.details
          });
        }

        // Actualizar stock en inventory
        const { data: product, error: productError } = await supabase
          .from('inventory')
          .select('stock')
          .eq('id', payload.inventory_id)
          .single();

        if (productError) {
          console.error('❌ Error al obtener producto:', productError);
          return res.status(400).json({ error: productError.message });
        }

        let newStock = product.stock || 0;
        if (payload.type === 'entrada') {
          newStock += parseInt(payload.quantity);
        } else if (payload.type === 'salida' || payload.type === 'ajuste') {
          newStock -= parseInt(payload.quantity);
        }

        // Asegurar que no quede negativo
        if (newStock < 0) newStock = 0;

        const { error: updateError } = await supabase
          .from('inventory')
          .update({ 
            stock: newStock,
            updated_at: new Date().toISOString()
          })
          .eq('id', payload.inventory_id);

        if (updateError) {
          console.error('❌ Error al actualizar stock:', updateError);
          return res.status(400).json({ error: updateError.message });
        }

        console.log('✅ Movimiento registrado y stock actualizado:', { movement, newStock });
        return res.status(201).json({ movement, newStock });
      } catch (error) {
        console.error('❌ Error en try Supabase:', error);
        if (!allowMockFallback) throw error;
      }
    }

    // Mock fallback
    const newMovement = insertMockRow('inventory_movements', movementData);
    // Actualizar stock en mock
    const productIndex = mockStore.inventory.findIndex(p => p.id === payload.inventory_id);
    if (productIndex !== -1) {
      let newStock = mockStore.inventory[productIndex].stock || 0;
      if (payload.type === 'entrada') {
        newStock += parseInt(payload.quantity);
      } else if (payload.type === 'salida' || payload.type === 'ajuste') {
        newStock -= parseInt(payload.quantity);
      }
      if (newStock < 0) newStock = 0;
      mockStore.inventory[productIndex].stock = newStock;
    }
    
    console.log('✅ Movimiento registrado en mock:', newMovement);
    res.status(201).json(newMovement);
  } catch (error) {
    console.error('❌ Error general en POST movements:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/inventory/:id/movements - Obtener movimientos de un producto
app.get('/api/inventory/:id/movements', async (req, res) => {
  if (!requireSupabase(res)) return;
  try {
    const { id } = req.params;
    
    if (isSupabaseReady()) {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*')
        .eq('inventory_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.json(data);
    }
    
    // Mock
    const movements = mockStore.inventory_movements?.filter(m => m.inventory_id === id) || [];
    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});