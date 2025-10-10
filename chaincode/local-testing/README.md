# Pruebas Locales del Chaincode

Esta guía te permite probar el chaincode de trazabilidad de medicamentos en una red local de Hyperledger Fabric, sin necesidad de Huawei BCS.

## Opción 1: TestRPC (Más Simple)

### Instalación
```bash
# Instalar TestRPC (simulador de blockchain)
npm install -g ethereumjs-testrpc

# O usar Ganache (versión moderna)
npm install -g ganache-cli
```

### Uso
```bash
# Iniciar red local
ganache-cli --port 8545

# En otra terminal, probar el chaincode
cd chaincode
npm test
```

## Opción 2: Hyperledger Fabric Local

### Prerrequisitos
- Docker y Docker Compose
- Node.js >= 14
- Go >= 1.15 (para herramientas de Fabric)

### Instalación
```bash
# Clonar ejemplos de Fabric
git clone https://github.com/hyperledger/fabric-samples.git
cd fabric-samples

# Descargar binarios de Fabric
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.2.3 1.4.9

# Configurar PATH
export PATH=$PWD/bin:$PATH
```

### Configurar Red Local
```bash
# Ir al directorio de ejemplos
cd fabric-samples/test-network

# Crear red de prueba
./network.sh up createChannel

# Desplegar chaincode de ejemplo
./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-javascript -ccl javascript
```

## Opción 3: Simulador de Chaincode

Crear un simulador que imite el comportamiento de Fabric sin necesidad de red real.
