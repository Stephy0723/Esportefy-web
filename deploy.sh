#!/bin/bash
# Forzar la carga de NVM o el PATH de Node
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Ir al directorio
cd /var/www/Esportefy-web

# Git pull
git pull origin main

# Backend
cd Backend
npm install
pm2 restart 0

# Frontend
cd ../frontend
npm install
npm run build
