#!/bin/bash

# Script para empaquetar el chaincode para Huawei BCS
# Este script crea un archivo .tar.gz listo para subir a la consola de administración

set -e

CHAINCODE_NAME="drug-traceability"
VERSION="1.0.0"
PACKAGE_DIR="package"
PACKAGE_FILE="${CHAINCODE_NAME}-${VERSION}.tar.gz"

echo "Empaquetando chaincode para Huawei BCS..."

# Crear directorio de empaquetado
rm -rf $PACKAGE_DIR
mkdir -p $PACKAGE_DIR

# Copiar archivos necesarios
cp package.json $PACKAGE_DIR/
cp index.js $PACKAGE_DIR/
cp -r lib $PACKAGE_DIR/
cp -r test $PACKAGE_DIR/
cp README.md $PACKAGE_DIR/

# Instalar dependencias en el directorio de empaquetado
cd $PACKAGE_DIR
npm install --production
cd ..

# Crear archivo tar.gz
tar -czf $PACKAGE_FILE -C $PACKAGE_DIR .

echo "Chaincode empaquetado exitosamente: $PACKAGE_FILE"
echo "Tamaño del archivo: $(du -h $PACKAGE_FILE | cut -f1)"

# Limpiar directorio temporal
rm -rf $PACKAGE_DIR

echo "Archivo listo para subir a Huawei BCS: $PACKAGE_FILE"
