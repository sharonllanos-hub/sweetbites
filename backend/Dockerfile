# Backend Dockerfile para SweetBites
FROM node:18-alpine

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar el resto del código
COPY . .

# Crear directorio para uploads
RUN mkdir -p uploads/recipes uploads/profiles

# Exponer puerto
EXPOSE 3000

# Comando para iniciar
CMD ["npm", "start"]
