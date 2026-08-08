Onder Barbershop

Arquitectura actual:
- `server.js` — backend Node/Express con Supabase, login JWT y WhatsApp.
- `package.json` — scripts y dependencias del servidor.
- `scripts.js` — frontend conectado al API del dashboard y al login.
- `index.html`, `login.html`, `users.html`, `clients.html`, `inventory.html`, `services.html`, `payments.html` — vistas del panel.
- `style.css` — estilos del dashboard y de los formularios básicos.

Variables de entorno:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `WHATSAPP_PROVIDER` (`mock` o `cloud-api`)
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`

Endpoints principales:
- `GET /api/health`
- `GET /api/dashboard/summary`
- `GET /api/clients`
- `POST /api/clients`
- `GET /api/services`
- `GET /api/inventory`
- `GET /api/visits/upcoming`
- `GET /api/payment-methods`
- `GET /api/payments`
- `POST /api/payments`
- `PUT /api/payments/:id`
- `DELETE /api/payments/:id`
- `GET /api/roles`
- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`
- `POST /api/auth/login`
- `POST /api/whatsapp/send`

Cómo ejecutarlo:
1. Copia `.env.example` a `.env` y completa tus credenciales de Supabase.
2. Instala dependencias con `npm install`.
3. Levanta el servidor con `npm run dev` o `npm start`.
4. Abre `http://localhost:3000`.

Notas:
- Si `WHATSAPP_PROVIDER=mock`, el backend responde como si enviara el mensaje, sin tocar Meta.
- El dashboard usa `/api/dashboard/summary` y cae a datos de respaldo si el backend no responde.
