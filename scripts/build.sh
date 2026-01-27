#!/bin/bash

# Script para build e iniciar servidor de produção
# Uso: ./scripts/build.sh

echo "🏗️  Construindo Command Center para produção..."
echo ""

# Build
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build concluído com sucesso!"
    echo ""
    echo "🚀 Iniciando servidor de produção..."
    echo ""
    
    # Verificar se a porta 3000 está em uso
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Porta 3000 já está em uso. Matando processo..."
        lsof -ti:3000 | xargs kill -9
        sleep 1
    fi
    
    # Iniciar servidor
    npm start
else
    echo ""
    echo "❌ Build falhou. Verifique os erros acima."
    exit 1
fi

