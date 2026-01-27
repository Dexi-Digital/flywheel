#!/bin/bash

# Script para iniciar o servidor de desenvolvimento
# Uso: ./scripts/dev.sh

echo "🚀 Iniciando Command Center em modo desenvolvimento..."
echo ""

# Verificar se a porta 3000 está em uso
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Porta 3000 já está em uso. Matando processo..."
    lsof -ti:3000 | xargs kill -9
    sleep 1
fi

# Iniciar servidor
npm run dev

