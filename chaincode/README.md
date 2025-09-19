# Drug Traceability Chaincode

Este chaincode implementa la funcionalidad de trazabilidad de medicamentos migrada desde el contrato de Stellar a Hyperledger Fabric, compatible con Huawei BCS (Blockchain Service).

## Funcionalidades

### Funciones Principales

1. **CommissionMedication** - Registrar un nuevo medicamento en la blockchain
2. **AddTrackingEvent** - Agregar evento de seguimiento a un medicamento
3. **VerifyMedication** - Verificar la autenticidad de un medicamento y obtener su historial
4. **IssueMedicationRecall** - Emitir un recall para un medicamento
5. **GetMedication** - Obtener datos de un medicamento por ID
6. **GetTrackingHistory** - Obtener historial de seguimiento de un medicamento
7. **GetMedicationsByManufacturer** - Obtener medicamentos por fabricante
8. **GetVerificationStats** - Obtener estadísticas de verificación
9. **SearchMedications** - Buscar medicamentos por criterios

### Estructuras de Datos

#### MedicationData
```javascript
{
  id: string,                    // ID único del medicamento
  gtin: string,                  // Global Trade Item Number
  batch: string,                 // Número de lote
  serialNumber: string,          // Número de serie
  expiryDate: string,            // Fecha de vencimiento
  manufacturer: string,          // Nombre del fabricante
  productName: string,           // Nombre del producto
  location: string,              // Ubicación actual
  timestamp: string,             // Timestamp de registro
  transactionHash: string,       // Hash de transacción blockchain
  status: string,                // Estado: commissioned, recalled
  commissionTime: string,        // Timestamp de comisión
  recallReason: string           // Razón del recall (si aplica)
}
```

#### TrackingEvent
```javascript
{
  event: string,                 // commission, ship, receive, dispense, recall
  location: string,              // Ubicación del evento
  timestamp: string,             // Timestamp del evento
  actor: string,                 // Entidad responsable del evento
  medicationId: string,          // ID del medicamento
  signature: string,             // Firma digital (opcional)
  transactionHash: string        // Hash de transacción
}
```

#### VerificationResult
```javascript
{
  isValid: boolean,              // Si el medicamento es válido
  medicationData: object,        // Datos del medicamento si se encuentra
  trackingHistory: array,        // Historial completo de seguimiento
  currentHolder: string,         // Poseedor actual
  blockchainHash: string         // Hash de blockchain
}
```

## Instalación y Desarrollo

### Prerrequisitos
- Node.js >= 14.0.0
- npm o yarn

### Instalación
```bash
cd chaincode
npm install
```

### Ejecutar Tests
```bash
npm test
```

### Estructura del Proyecto
```
chaincode/
├── index.js              # Implementación principal del chaincode
├── lib/
│   └── contract.js       # Interfaz del contrato
├── test/
│   └── contract.test.js  # Tests unitarios
├── package.json          # Dependencias y scripts
└── README.md            # Documentación
```

## Uso en Huawei BCS

### Empaquetado
El chaincode debe ser empaquetado como un archivo .tar.gz para su instalación en Huawei BCS.

### Despliegue
1. Subir el chaincode empaquetado a Huawei BCS
2. Instalar el chaincode en los peers
3. Instanciar el chaincode en el canal
4. Configurar las políticas de endorsamiento

### Configuración de Red
- **Canal**: medchain-channel
- **Organizaciones**: 
  - Manufacturer (Fabricantes)
  - Distributor (Distribuidores)
  - Pharmacy (Farmacias)
  - Regulator (Reguladores - DIGEMID)

## Eventos Emitidos

El chaincode emite los siguientes eventos:

1. **MedicationCommissioned** - Cuando se registra un medicamento
2. **TrackingEventAdded** - Cuando se agrega un evento de seguimiento
3. **MedicationRecalled** - Cuando se emite un recall

## Seguridad

- Validación de parámetros de entrada
- Verificación de existencia de medicamentos
- Control de acceso basado en roles
- Firmas digitales para eventos críticos

## Migración desde Stellar

Este chaincode mantiene la misma lógica y estructura de datos que el contrato original de Stellar, adaptado a las capacidades de Hyperledger Fabric:

- **Almacenamiento**: De Map/Storage de Stellar a World State de Fabric
- **Eventos**: De log! de Stellar a setEvent de Fabric
- **Consultas**: De iteración manual a CouchDB queries de Fabric
- **Transacciones**: De funciones directas a invocaciones de chaincode

## Soporte

Para soporte técnico o preguntas sobre la implementación, contactar al equipo de desarrollo de MedChain.
