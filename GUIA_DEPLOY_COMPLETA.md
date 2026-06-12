# 🚀 GUÍA COMPLETA DE DEPLOY - SWEETBITES

## 🎯 Opciones de Deploy Disponibles

Te presento **4 opciones** desde la más fácil hasta la más profesional:

| Opción | Dificultad | Costo | Tiempo | Recomendación |
|--------|------------|-------|--------|---------------|
| **A) Railway** | ⭐ Muy Fácil | Gratis ($5 crédito) | 30 min | ✅ **RECOMENDADA** para empezar |
| **B) Render + PlanetScale** | ⭐⭐ Fácil | Gratis | 45 min | ✅ Buena opción gratis |
| **C) Vercel + Railway** | ⭐⭐ Fácil | Gratis | 40 min | ✅ Muy popular |
| **D) AWS/DigitalOcean** | ⭐⭐⭐⭐⭐ Difícil | $5-10/mes | 2-3 hrs | ❌ Solo si sabes Linux |

---

## 🏆 OPCIÓN A: RAILWAY (RECOMENDADA)

**✅ Ventajas:**
- Deploy en un solo lugar (frontend + backend + BD)
- $5 de crédito gratis (suficiente para 1-2 meses)
- Deploy automático desde GitHub
- MySQL incluido
- HTTPS automático
- Muy fácil de configurar

**❌ Desventajas:**
- Después de $5 hay que pagar (~$5-10/mes)
- Puede suspenderse si no hay tráfico

### PASO A PASO - RAILWAY

#### 1️⃣ Preparar el Código

**A) Crear archivo `.gitignore` en la raíz del proyecto:**

```gitignore
# Node modules
node_modules/
frontend/node_modules/
backend/node_modules/

# Environment variables
.env
backend/.env
frontend/.env

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# Build
frontend/dist/
frontend/build/

# Uploads (no subir imágenes locales)
backend/uploads/*
!backend/uploads/.gitkeep

# IDE
.vscode/
.idea/
```

**B) Crear `backend/uploads/.gitkeep`:**
```bash
# Archivo vacío para que Git conserve la carpeta
```

**C) Modificar `backend/server.js` para puerto dinámico:**

Cambiar línea 7:
```javascript
// ANTES:
const PORT = process.env.PORT || 3000;

// DESPUÉS (ya debería estar así):
const PORT = process.env.PORT || 3000;
```

**D) Crear `backend/.env.example`:**
```env
DB_HOST=mysql_container
DB_USER=root
DB_PASSWORD=tu_password_aqui
DB_NAME=sweetbites_db
JWT_SECRET=cambia_esto_por_algo_seguro
PORT=3000
```

**E) Configurar CORS en `backend/server.js`:**

Buscar la configuración de CORS y actualizar:
```javascript
// Configuración de CORS
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL // Agregar esta línea
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
```

**F) Agregar a `backend/.env` (local):**
```env
FRONTEND_URL=http://localhost:5173
```

#### 2️⃣ Subir a GitHub

```bash
# Navegar a la raíz del proyecto
cd C:\xampp\htdocs\ProSweetBites\appnueva

# Inicializar Git (si no está iniciado)
git init

# Agregar .gitignore
# (crear el archivo .gitignore con el contenido de arriba)

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Initial commit: SweetBites v1.0 - Ready for deployment"

# Crear repositorio en GitHub
# Ve a https://github.com/new
# Nombre: sweetbites-deploy
# Público o Privado (lo que prefieras)
# NO inicializar con README

# Conectar con GitHub (reemplaza TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/sweetbites-deploy.git
git branch -M main
git push -u origin main
```

#### 3️⃣ Deploy en Railway

**A) Crear cuenta:**
1. Ir a https://railway.app
2. Click en "Start a New Project"
3. Login con GitHub

**B) Crear proyecto:**
1. Click "New Project"
2. Seleccionar "Deploy from GitHub repo"
3. Conectar tu repositorio `sweetbites-deploy`
4. Railway detectará Node.js

**C) Configurar Backend:**

Railway creará un servicio, configurarlo:

1. Click en el servicio
2. Ir a "Settings" → "Environment"
3. Agregar variables:

```env
PORT=3000
NODE_ENV=production
DB_HOST=${MYSQL_HOST}
DB_USER=${MYSQL_USER}
DB_PASSWORD=${MYSQL_PASSWORD}
DB_NAME=${MYSQL_DATABASE}
JWT_SECRET=tu_secreto_super_seguro_cambiar_esto_12345
```

4. En "Settings" → "Service":
   - Root Directory: `/backend`
   - Start Command: `npm start`
   - Build Command: `npm install`

**D) Agregar Base de Datos MySQL:**

1. Click "+ New" en el proyecto
2. Seleccionar "Database" → "MySQL"
3. Railway creará la BD automáticamente
4. Copiar las credenciales que aparecen en "Variables"

**E) Conectar Backend con MySQL:**

1. Ir al servicio Backend → "Variables"
2. Click "+ Reference" y vincular las variables de MySQL:
   - `MYSQL_HOST` → `DB_HOST`
   - `MYSQL_USER` → `DB_USER`
   - `MYSQL_PASSWORD` → `DB_PASSWORD`
   - `MYSQL_DATABASE` → `DB_NAME`

**F) Importar Base de Datos:**

1. Ir al servicio MySQL → "Data" tab
2. Click "Query"
3. Copiar el contenido de `database/schema.sql`
4. Ejecutar
5. Copiar el contenido de `database/add_special_recipes_fields.sql`
6. Ejecutar

O usando MySQL Workbench:
1. Obtener credenciales de Railway MySQL
2. Conectar desde Workbench
3. Importar archivos SQL

**G) Deploy Frontend:**

1. Click "+ New" en el proyecto
2. "Deploy from GitHub repo" → mismo repositorio
3. Configurar servicio:
   - Root Directory: `/frontend`
   - Build Command: `npm run build`
   - Start Command: `npx vite preview --host 0.0.0.0 --port $PORT`

4. Agregar variable de entorno:
```env
VITE_API_URL=https://tu-backend.railway.app
```

**H) Actualizar archivo `frontend/src/config/api.js`:**

Crear o modificar:
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default API_URL;
```

**I) Actualizar llamadas a API en frontend:**

Buscar todas las llamadas a `axios` y cambiar:
```javascript
// ANTES:
axios.get('http://localhost:3000/api/recipes')

// DESPUÉS:
import API_URL from '../config/api';
axios.get(`${API_URL}/api/recipes`)
```

**J) Obtener URLs públicas:**

1. Backend: `https://sweetbites-backend-production.up.railway.app`
2. Frontend: `https://sweetbites-frontend-production.up.railway.app`

**K) Actualizar CORS en backend con URL de Railway:**

En `backend/.env` de Railway agregar:
```env
FRONTEND_URL=https://sweetbites-frontend-production.up.railway.app
```

#### 4️⃣ Verificar Deploy

1. Abrir URL del frontend
2. Intentar registrarse
3. Crear una receta
4. Verificar que funcione todo

---

## 🌐 OPCIÓN B: RENDER + PLANETSCALE

**✅ Ventajas:**
- 100% gratis para siempre
- No requiere tarjeta de crédito
- HTTPS automático

**❌ Desventajas:**
- BD PlanetScale tiene límites (5GB, 1 billón de lecturas/mes)
- Backend se duerme después de 15 min sin uso (tarda ~30s en despertar)

### PASO A PASO - RENDER

#### 1️⃣ Preparar Código (igual que Railway paso 1)

#### 2️⃣ Crear Base de Datos en PlanetScale

1. Ir a https://planetscale.com
2. Sign up gratis
3. Create database: `sweetbites`
4. Región: elegir la más cercana
5. Plan: Hobby (gratis)

**Importar schema:**
1. Click en "Console"
2. Copiar contenido de `database/schema.sql`
3. Ejecutar
4. Copiar contenido de `database/add_special_recipes_fields.sql`
5. Ejecutar

**Obtener credenciales:**
1. Click "Connect"
2. Copiar: host, username, password

#### 3️⃣ Deploy Backend en Render

1. Ir a https://render.com
2. Sign up con GitHub
3. New → Web Service
4. Conectar repositorio GitHub
5. Configuración:
   - Name: `sweetbites-backend`
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: `Free`

**Variables de entorno:**
```env
NODE_ENV=production
PORT=3000
DB_HOST=tu_host_planetscale.us-east-3.psdb.cloud
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_NAME=sweetbites
JWT_SECRET=tu_secreto_super_seguro_cambiar
FRONTEND_URL=https://sweetbites-frontend.onrender.com
```

**IMPORTANTE para PlanetScale:**

Modificar `backend/config/database.js`:
```javascript
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: true // Agregar esto para PlanetScale
    }
});
```

#### 4️⃣ Deploy Frontend en Render

1. New → Static Site
2. Mismo repositorio
3. Configuración:
   - Name: `sweetbites-frontend`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

**Variable de entorno:**
```env
VITE_API_URL=https://sweetbites-backend.onrender.com
```

#### 5️⃣ Configurar redirects para React Router

Crear `frontend/public/_redirects`:
```
/*    /index.html   200
```

---

## ⚡ OPCIÓN C: VERCEL (Frontend) + RAILWAY (Backend + BD)

**✅ Mejor opción para Frontend rápido**

### Frontend en Vercel:

1. Ir a https://vercel.com
2. Import Git Repository
3. Root Directory: `frontend`
4. Framework: Vite
5. Environment Variables:
```env
VITE_API_URL=https://tu-backend.railway.app
```

### Backend en Railway (igual que Opción A)

---

## 📋 CHECKLIST POST-DEPLOY

Después de deployar, verificar:

- [ ] Frontend carga correctamente
- [ ] Backend responde en `/` con mensaje de bienvenida
- [ ] Registro de usuario funciona
- [ ] Login funciona
- [ ] Crear receta funciona
- [ ] Upload de imágenes funciona
- [ ] Ver recetas funciona
- [ ] Comentarios funcionan
- [ ] Admin panel funciona (si eres admin)
- [ ] URLs son HTTPS (candado verde)
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en logs del servidor

---

## 🐛 PROBLEMAS COMUNES

### 1. Error CORS
**Síntoma:** Frontend no puede conectar con backend

**Solución:**
- Verificar que `FRONTEND_URL` en backend sea correcto
- Verificar configuración CORS en `backend/server.js`

### 2. Error 404 en rutas de React
**Síntoma:** Al refrescar una ruta como `/recipes/123` da 404

**Solución:**
- Agregar archivo `_redirects` en Vercel/Render
- En Railway configurar redirect rules

### 3. Imágenes no se muestran
**Síntoma:** Recetas no muestran imagen

**Solución:**
- Las imágenes en Railway se pierden al redeploy
- Usar servicio externo: Cloudinary, AWS S3, UploadThing

### 4. Base de datos desconectada
**Síntoma:** Error "Cannot connect to database"

**Solución:**
- Verificar credenciales en variables de entorno
- Verificar que BD esté activa
- Revisar firewall/whitelist IPs

### 5. Backend se duerme (Render Free Tier)
**Síntoma:** Primera petición tarda 30 segundos

**Solución:**
- Normal en plan gratis de Render
- Usar Railway ($5 crédito gratis)
- Pagar plan Starter de Render ($7/mes)

---

## 💰 RESUMEN DE COSTOS

| Opción | Mes 1 | Mes 2+ | Total Año 1 |
|--------|-------|--------|-------------|
| **Railway (Recomendada)** | Gratis | $5-10 | $50-100 |
| **Render + PlanetScale** | Gratis | Gratis | Gratis |
| **Vercel + Railway** | Gratis | $5-10 | $50-100 |
| **AWS/DigitalOcean** | $5 | $5-10 | $60-120 |

---

## 🎓 MI RECOMENDACIÓN PARA TU PROYECTO

**Si es solo para presentar al instructor:**
→ **Render + PlanetScale** (100% gratis, no requiere tarjeta)

**Si quieres tenerlo online por varios meses:**
→ **Railway** ($5 de crédito gratis te dan 1-2 meses, después ~$7/mes)

**Si quieres la mejor velocidad:**
→ **Vercel (frontend) + Railway (backend)**

---

## 🚀 ¿EMPEZAMOS?

Dime qué opción prefieres y te guío paso a paso:

**A)** Railway (todo en uno, más fácil)  
**B)** Render + PlanetScale (100% gratis)  
**C)** Vercel + Railway (más rápido)  

También puedo:
- Crear los archivos de configuración necesarios
- Actualizar el código para producción
- Ayudarte a subir todo a GitHub
- Guiarte en el proceso de deploy

**¿Con cuál empezamos?** 🎯
