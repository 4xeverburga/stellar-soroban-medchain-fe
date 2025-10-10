#!/bin/bash

# Script para ejecutar pruebas locales del chaincode
# No requiere Huawei BCS ni créditos

echo "🧪 Ejecutando Pruebas Locales del Chaincode de Trazabilidad"
echo "=========================================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "../index.js" ]; then
    echo "❌ Error: Ejecutar desde el directorio chaincode/local-testing/"
    exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Instalar dependencias si es necesario
if [ ! -d "../node_modules" ]; then
    echo "📦 Instalando dependencias..."
    cd ..
    npm install
    cd local-testing
fi

# Ejecutar pruebas
echo "🚀 Iniciando pruebas..."
node test-chaincode.js

echo ""
echo "🎯 Pruebas completadas!"
echo "📋 Para ver más detalles, revisa la salida anterior"
echo ""
echo "💡 Próximos pasos:"
echo "   1. Si las pruebas pasaron, el chaincode está listo para Huawei BCS"
echo "   2. Puedes usar este simulador para desarrollo local"
echo "   3. Cuando tengas créditos, despliega en Huawei BCS"
