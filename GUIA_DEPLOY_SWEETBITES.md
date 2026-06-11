# 🚀 GUÍA DE DEPLOY - SweetBites

**Proyecto:** SweetBites - Plataforma de Recetas de Postres  
**Tecnologías:** React + Vite, Node.js + Express, MySQL  
**Containerización:** Docker + Docker Compose  
**Fecha:** 11 de Junio 2026

---

## 📋 REQUISITOS PREVIOS

Antes de comenzar, asegúrate de tener:

- ✅ Cuenta en GitHub
- ✅ Acceso al VPS de Contabo (IP: 185.245.182.220)
- ✅ Dominio o subdominio configurado en Hostinger
- ✅ Docker y Docker Compose instalados en el VPS

---

## 🎯 OBJETIVO

Deployar SweetBites con **2 links (URLs)**:

1. **Link 1 (Aplicación completa):** `https://sweetbites.proyectoscampus.top`
   - Frontend (React) + Backend (Node.js) juntos

2. **Link 2 (Base de datos - opcional/admin):** Acceso directo a MySQL vía puerto 3306
   - Solo para administración con herramientas como MySQL Workbench

---

## 📦 PASO 1: PREPARAR EL PROYECTO LOCALMENTE

### 1.1 Verificar archivos Docker creados

Tu proyecto ya tiene estos archivos (generados automáticamente):

```
appnueva/
├── docker-compose.yml          ← Orquestador de contenedores
├── .dockerignore              ← Archivos a ignorar
├── .env.production            ← Variables de entorno
├── backend/
│   └── Dockerfile             ← Imagen del backend
└── frontend/
    ├── Dockerfile             ← Imagen del frontend
    └── nginx.conf             ← Configuración de Nginx
```

### 1.2 Actualizar variables de entorno

Edita el archivo `.env.production` y cambia las contraseñas:

```bash
DB_ROOT_PASSWORD=TU_CONTRASEÑA_ROOT_SEGURA
DB_PASSWORD=TU_CONTRASEÑA_DB_SEGURA
JWT_SECRET=TU_SECRET_JWT_ALEATORIO_MUY_LARGO
```

**Genera contraseñas seguras:**
```bash
# En tu terminal local (Git Bash)
openssl rand -base64 32
```

---

## 📤 PASO 2: SUBIR A GITHUB

### 2.1 Inicializar Git (si aún no lo has hecho)

```bash
cd C:/xampp/htdocs/ProSweetBites/appnueva

# Inicializar repositorio
git init

# Agregar archivos
git add .

# Primer commit
git commit -m "feat: Preparar proyecto para deploy con Docker"

# Crear rama main
git branch -M main
```

### 2.2 Conectar con GitHub

```bash
# Reemplaza con tu usuario y nombre de repositorio
git remote add origin https://github.com/TU_USUARIO/sweetbites.git

# Push inicial
git push -u origin main
```

**IMPORTANTE:** Si ya tienes el proyecto en GitHub, solo haz:

```bash
git add .
git commit -m "feat: Agregar configuración Docker para deploy"
git push
```

---

## 🖥️ PASO 3: CONECTAR AL VPS DE CONTABO

### 3.1 Conectar vía SSH

Abre tu terminal (Git Bash, PowerShell, o CMD) y ejecuta:

```bash
ssh root@185.245.182.220
```

**Contraseña:** `MsuvT6cpONg6O9o6dMj`

### 3.2 Navegar al directorio de proyectos

```bash
cd /var/www
```

Este directorio contiene todos los proyectos desplegados.

### 3.3 Verificar que Docker esté instalado

```bash
docker --version
docker compose version
```

**Si no está instalado:**

```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
apt update
apt install docker-compose-plugin -y
```

---

## 📥 PASO 4: CLONAR EL REPOSITORIO EN EL VPS

```bash
# Asegúrate de estar en /var/www
cd /var/www

# Clonar tu repositorio (reemplaza con tu URL)
git clone https://github.com/TU_USUARIO/sweetbites.git

# Entrar al proyecto
cd sweetbites
```

---

## 🐳 PASO 5: CONFIGURAR VARIABLES DE ENTORNO

### 5.1 Copiar el archivo de producción

```bash
cp .env.production .env
```

### 5.2 Editar variables (IMPORTANTE)

```bash
nano .env
```

Cambia las contraseñas por las que generaste antes:

```env
DB_ROOT_PASSWORD=TU_CONTRASEÑA_ROOT_SEGURA
DB_NAME=sweetbites_db
DB_USER=sweetbites_user
DB_PASSWORD=TU_CONTRASEÑA_DB_SEGURA
JWT_SECRET=TU_SECRET_JWT_ALEATORIO
PORT=3000
```

**Guardar:** `Ctrl + O` → `Enter` → `Ctrl + X`

---

## 🚀 PASO 6: LEVANTAR DOCKER COMPOSE

### 6.1 Construir y levantar los contenedores

```bash
docker compose up -d --build
```

Esto creará y levantará **3 contenedores:**

1. **sweetbites-db** (MySQL 8.0) - Puerto 3306
2. **sweetbites-backend** (Node.js) - Puerto 3000
3. **sweetbites-frontend** (React + Nginx) - Puerto 80

### 6.2 Verificar que estén corriendo

```bash
docker ps
```

Deberías ver algo como:

```
CONTAINER ID   IMAGE              STATUS         PORTS                    NAMES
abc123...      sweetbites-frontend   Up 2 minutes   0.0.0.0:80->80/tcp       sweetbites-frontend
def456...      sweetbites-backend    Up 2 minutes   0.0.0.0:3000->3000/tcp   sweetbites-backend
ghi789...      mysql:8.0             Up 2 minutes   0.0.0.0:3306->3306/tcp   sweetbites-db
```

### 6.3 Ver logs (si hay problemas)

```bash
# Ver logs de todos los contenedores
docker compose logs

# Ver logs de un contenedor específico
docker compose logs frontend
docker compose logs backend
docker compose logs database

# Seguir los logs en tiempo real
docker compose logs -f
```

---

## 🌐 PASO 7: CONFIGURAR NGINX EN EL VPS

### 7.1 Crear configuración de Nginx

```bash
nano /etc/nginx/sites-available/sweetbites.proyectoscampus.top
```

Pega esta configuración:

```nginx
# Redirigir HTTP a HTTPS
server {
    listen 80;
    server_name sweetbites.proyectoscampus.top;

    # Permitir Certbot para validación
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirigir todo lo demás a HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# Servidor HTTPS
server {
    listen 443 ssl http2;
    server_name sweetbites.proyectoscampus.top;

    # Certificados SSL (se generarán después)
    ssl_certificate /etc/letsencrypt/live/sweetbites.proyectoscampus.top/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sweetbites.proyectoscampus.top/privkey.pem;

    # Configuración SSL moderna
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Seguridad adicional
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Proxy a Docker (puerto 80 del contenedor frontend)
    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 60s;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # Aumentar tamaño de upload para fotos
    client_max_body_size 10M;
}
```

**Guardar:** `Ctrl + O` → `Enter` → `Ctrl + X`

### 7.2 Habilitar el sitio

```bash
# Crear enlace simbólico
ln -s /etc/nginx/sites-available/sweetbites.proyectoscampus.top /etc/nginx/sites-enabled/

# Verificar configuración
nginx -t

# Si todo está OK, recargar Nginx
systemctl reload nginx
```

---

## 🔒 PASO 8: GENERAR CERTIFICADO SSL (HTTPS)

### 8.1 Instalar Certbot

```bash
apt update
apt install certbot python3-certbot-nginx -y
```

### 8.2 Generar certificado

```bash
certbot --nginx -d sweetbites.proyectoscampus.top
```

**Durante el proceso:**
1. Ingresa tu email
2. Acepta los términos (Y)
3. Acepta compartir email (Y o N)
4. Selecciona opción 2 (Redirect HTTP to HTTPS)

### 8.3 Renovación automática

Certbot ya configura renovación automática. Verifica:

```bash
certbot renew --dry-run
```

---

## 🔗 PASO 9: CONFIGURAR DNS EN HOSTINGER

### 9.1 Ir al panel de Hostinger

1. Accede a https://hostinger.com
2. Ve a **Dominios** → **proyectoscampus.top**
3. Click en **DNS / Name Servers**

### 9.2 Agregar registro A

**Crear nuevo registro:**

- **Tipo:** A
- **Nombre:** sweetbites
- **Apunta a:** `185.245.182.220`
- **TTL:** 14400 (o el mínimo permitido)

**Guardar cambios**

### 9.3 Esperar propagación DNS

La propagación puede tardar de **5 minutos a 24 horas**.

Verifica con:

```bash
nslookup sweetbites.proyectoscampus.top
```

O en: https://dnschecker.org

---

## ✅ PASO 10: VERIFICAR EL DEPLOY

### 10.1 Probar la aplicación

Abre en tu navegador:

```
https://sweetbites.proyectoscampus.top
```

Deberías ver la página principal de SweetBites.

### 10.2 Verificar funcionalidades

- ✅ Registro de usuario
- ✅ Login
- ✅ Ver recetas
- ✅ Crear receta (con upload de imagen)
- ✅ Comentarios
- ✅ Favoritos
- ✅ Panel de admin

### 10.3 Verificar API directamente

```bash
curl https://sweetbites.proyectoscampus.top/api/recipes
```

---

## 🔧 COMANDOS ÚTILES

### Gestionar contenedores

```bash
# Ver contenedores corriendo
docker ps

# Ver todos los contenedores (incluso detenidos)
docker ps -a

# Ver logs
docker compose logs -f

# Reiniciar servicios
docker compose restart

# Detener todo
docker compose down

# Levantar todo
docker compose up -d

# Reconstruir imágenes
docker compose up -d --build

# Ver uso de recursos
docker stats
```

### Actualizar código

```bash
# Conectar al VPS
ssh root@185.245.182.220

# Ir al proyecto
cd /var/www/sweetbites

# Pull de cambios
git pull origin main

# Reconstruir y reiniciar
docker compose up -d --build

# Ver logs para verificar
docker compose logs -f
```

### Backup de base de datos

```bash
# Hacer backup
docker exec sweetbites-db mysqldump -u root -p sweetbites_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
docker exec -i sweetbites-db mysql -u root -p sweetbites_db < backup_20260611.sql
```

### Acceso directo a MySQL

```bash
# Desde el VPS
docker exec -it sweetbites-db mysql -u root -p

# Desde tu PC (si el puerto 3306 está abierto)
mysql -h 185.245.182.220 -P 3306 -u sweetbites_user -p sweetbites_db
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Problema 1: "Cannot connect to database"

**Solución:**

```bash
# Verificar que la DB esté corriendo
docker compose ps

# Ver logs de la base de datos
docker compose logs database

# Reiniciar servicio de DB
docker compose restart database
```

### Problema 2: "502 Bad Gateway"

**Solución:**

```bash
# Verificar que el backend esté corriendo
docker compose logs backend

# Verificar conectividad
docker exec sweetbites-backend ping -c 3 database

# Reiniciar backend
docker compose restart backend
```

### Problema 3: Imágenes no se suben

**Solución:**

```bash
# Verificar permisos del directorio uploads
docker exec sweetbites-backend ls -la /app/uploads

# Crear directorios si no existen
docker exec sweetbites-backend mkdir -p /app/uploads/recipes /app/uploads/profiles

# Dar permisos
docker exec sweetbites-backend chmod -R 777 /app/uploads
```

### Problema 4: Certificado SSL no se genera

**Solución:**

```bash
# Asegúrate de que el puerto 80 esté abierto
ufw allow 80/tcp
ufw allow 443/tcp

# Verifica que el dominio apunte al VPS
nslookup sweetbites.proyectoscampus.top

# Intenta de nuevo
certbot --nginx -d sweetbites.proyectoscampus.top
```

---

## 📊 ARQUITECTURA FINAL

```
Internet
   |
   v
[DNS Hostinger: sweetbites.proyectoscampus.top]
   |
   v
[VPS Contabo: 185.245.182.220]
   |
   ├─> [Nginx] (Puerto 443 HTTPS)
   |      |
   |      v
   |   [Docker Network: sweetbites-network]
   |      |
   |      ├─> [sweetbites-frontend] (Nginx:80)
   |      |      └─> Sirve React build + proxy a backend
   |      |
   |      ├─> [sweetbites-backend] (Node.js:3000)
   |      |      └─> API REST + uploads
   |      |
   |      └─> [sweetbites-db] (MySQL:3306)
   |             └─> Base de datos
   |
   └─> [Volumen: mysql_data]
          └─> Persistencia de datos
```

---

## 🎯 RESULTADO FINAL

Tendrás **2 links funcionales:**

1. **Aplicación Web:**
   - URL: `https://sweetbites.proyectoscampus.top`
   - Frontend + Backend integrados
   - Certificado SSL (HTTPS)
   - Listo para usuarios finales

2. **Base de Datos (acceso admin):**
   - Host: `185.245.182.220`
   - Puerto: `3306`
   - Usuario: `sweetbites_user`
   - Password: (tu contraseña configurada)
   - Acceso desde MySQL Workbench u otras herramientas

---

## 📝 CHECKLIST FINAL

Antes de presentar, verifica:

- [ ] La aplicación carga en `https://sweetbites.proyectoscampus.top`
- [ ] El certificado SSL es válido (candado verde en el navegador)
- [ ] Puedes registrarte como usuario nuevo
- [ ] Puedes iniciar sesión
- [ ] Puedes crear una receta (con foto)
- [ ] Puedes ver recetas
- [ ] Puedes comentar y valorar
- [ ] Puedes agregar a favoritos
- [ ] El panel de admin funciona
- [ ] Las imágenes se suben y ven correctamente
- [ ] Todos los contenedores están corriendo (`docker ps`)
- [ ] Los logs no muestran errores críticos (`docker compose logs`)

---

## 🚀 ¡DEPLOY COMPLETO!

Tu proyecto SweetBites está ahora desplegado profesionalmente con Docker.

**¿Necesitas ayuda?** Revisa la sección de **Solución de Problemas** arriba.

---

**Creado el:** 11 de Junio 2026  
**Proyecto:** SweetBites v1.0  
**Stack:** React + Vite, Node.js + Express, MySQL, Docker, Nginx
