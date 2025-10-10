# MediTrack Latam - Frontend

## 📱 Aplicación de Trazabilidad Farmacéutica con Huawei Cloud BCS

MediTrack Latam es una aplicación móvil desarrollada con React Native y Expo que permite la trazabilidad completa de medicamentos utilizando Huawei Cloud Blockchain Service (BCS) sobre Hyperledger Fabric. La aplicación está diseñada para combatir la falsificación de medicamentos en América Latina mediante verificación criptográfica instantánea vía un gateway HTTP hacia BCS.

## 🚀 Características Principales

### 🔍 Verificación Instantánea
- Escaneo de códigos DataMatrix y QR en medicamentos
- Verificación criptográfica en tiempo real usando Huawei Cloud BCS (Fabric) a través de un gateway HTTP
- Detección inmediata de medicamentos falsificados o no autorizados

### 📦 Trazabilidad Completa
- Seguimiento desde fabricación hasta dispensación
- Registro de eventos: comisión, envío, recepción, dispensación
- Historial completo de la cadena de custodia

### ⚠️ Sistema de Alertas
- Notificaciones inmediatas para recalls de medicamentos
- Alertas automáticas para productos vencidos
- Bloqueo de distribución de productos comprometidos

### 🔐 Seguridad Blockchain
- Registro inmutable en Huawei Cloud BCS (Hyperledger Fabric)
- Verificación criptográfica de autenticidad
- Protección contra manipulación de datos

## 🛠️ Tecnologías Utilizadas

- **React Native** con Expo SDK 54
- **TypeScript** para tipado fuerte
- **Huawei Cloud Blockchain Service (BCS)** sobre **Hyperledger Fabric** (vía API Gateway REST)
- **Fabric SDK** (en el gateway/backend, no dentro de la app móvil)
- **Expo Camera / Barcode Scanner** para escaneo de códigos
- **AsyncStorage** para persistencia local y modo demo
- **Lucide React Native** para iconografía

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Expo CLI
- Cuenta de desarrollador de Expo (para testing en dispositivos)

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone [repository-url]
cd stellar-hackathon-fe
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Iniciar el proyecto
```bash
npm start
```

### 4. Ejecutar en dispositivos
```bash
# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

## 📁 Estructura del Proyecto

```
app/
├── (tabs)/                 # Rutas de la aplicación (Expo Router)
│   ├── index.tsx           # Pantalla principal
│   ├── explore.tsx         # Explorador de medicamentos
│   └── _layout.tsx         # Layout de tabs
├── _layout.tsx             # Layout raíz
components/                 # Componentes reutilizables
├── ThemedText.tsx     
├── ThemedView.tsx
└── ui/                     # Componentes UI específicos
services/                   # Servicios y lógica de negocio
├── huaweiBcs.ts            # Cliente del gateway HTTP hacia Huawei BCS
└── stellarMediTrack.ts     # Servicio de demo/offline usando AsyncStorage
constants/                  # Constantes y configuraciones
└── Colors.ts
hooks/                      # Custom hooks
└── useColorScheme.ts
```

## 🔧 Servicios Principales

### HuaweiBCSService (`services/huaweiBcs.ts`)

Cliente HTTP del gateway que conecta con Huawei Cloud BCS (Fabric):

- `commissionMedication()` - Registra un nuevo medicamento en el ledger (vía gateway)
- `verifyMedication()` - Verifica autenticidad y obtiene historial
- `addTrackingEvent()` - Añade eventos de trazabilidad
- `getVerificationStats()` - Estadísticas de verificaciones

Base URL configurable con `CHAINMED_GATEWAY_URL` (default: `http://localhost:3001/api`).

### StellarMediTrackService (`services/stellarMediTrack.ts`)

Servicio de demo que simula operaciones blockchain con `AsyncStorage` para escenarios offline y pruebas locales.

## 📱 Funcionalidades por Pantalla

### Pantalla Principal (Home)
- Dashboard con estadísticas de verificaciones
- Botón principal para escanear medicamentos
- Acceso rápido a funciones principales
- Creación de medicamentos de prueba

### Pantalla de Exploración
- Búsqueda avanzada de medicamentos
- Filtros por estado (verificado, pendiente, alerta)
- Lista detallada con información de trazabilidad
- Historial de eventos por medicamento

## 🔐 Modelo de Datos

### MedicationData
```typescript
interface MedicationData {
  gtin: string;              // Código global de producto
  batch: string;             // Número de lote
  serialNumber: string;      // Número de serie único
  expiryDate: string;        // Fecha de vencimiento
  manufacturer: string;      // Fabricante
  productName: string;       // Nombre del producto
  location?: string;         // Ubicación actual
  timestamp?: string;        // Timestamp de registro
}
```

### TrackingEvent
```typescript
interface TrackingEvent {
  event: 'commission' | 'ship' | 'receive' | 'dispense' | 'recall';
  location: string;          // Ubicación del evento
  timestamp: string;         // Momento del evento
  actor: string;            // Entidad responsable
  medicationId: string;     // ID del medicamento
}
```

## 🌐 Integración con Huawei Cloud BCS

La aplicación se integra con Huawei Cloud Blockchain Service (Hyperledger Fabric) mediante un gateway HTTP:

- **Gateway REST**: traduce llamadas de la app a invocaciones/query de chaincode en BCS.
- **Endpoints** (en el gateway):
  - `POST /commissionMedication`
  - `POST /addTrackingEvent`
  - `GET  /verifyMedication?id=...`
  - `GET  /getVerificationStats`
- **Seguridad**: manejo de identidades MSP/TLS ocurre en el backend/gateway (no en la app móvil).
- **Configuración**: `CHAINMED_GATEWAY_URL` define el endpoint base del gateway.

## 🧪 Testing y Desarrollo

### Medicamentos de Prueba
La aplicación incluye funcionalidad para crear medicamentos de prueba:

```typescript
const sampleMed = {
  gtin: '7501001234567',
  batch: 'PCT2024001',
  serialNumber: '123456789',
  expiryDate: '2025-12-31',
  manufacturer: 'Laboratorios Unidos S.A.',
  productName: 'Paracetamol 500mg'
};
```

### Casos de Uso de Testing
1. Crear medicamento de prueba
2. Escanear código generado
3. Verificar autenticidad
4. Añadir eventos de trazabilidad
5. Simular recall de medicamento

## 🚀 Deployment

### Build para Producción
```bash
# EAS Build
eas build --platform android
eas build --platform ios
```

## 🛡️ Seguridad

### Medidas Implementadas
- Verificación criptográfica mediante Huawei Cloud BCS (a través de gateway)
- Almacenamiento seguro de datos de medicamentos
- Validación de códigos de medicamentos
- Protección contra manipulación de datos

### Consideraciones de Privacidad
- Datos sensibles almacenados localmente de forma segura
- Solo información necesaria para verificación
- Cumplimiento con regulaciones de privacidad

## ⚙️ Configuración

Variables relevantes (app/gateway):

- `CHAINMED_GATEWAY_URL` (app): URL base del gateway HTTP hacia BCS. Si no se define, usa `http://localhost:3001/api`.
- Variables backend opcionales (si usas tu propio gateway): `PORT`, `NODE_ENV`, `JWT_SECRET`, entre otras.

## 📄 Características Implementadas

### ✅ Funcionalidades Completas
- [x] Interfaz de usuario completa en español
- [x] Escáner de códigos QR/DataMatrix
- [x] Sistema de verificación de medicamentos
- [x] Dashboard con estadísticas
- [x] Búsqueda y filtrado de medicamentos
- [x] Historial de trazabilidad
- [x] Sistema de alertas y recalls
- [x] Creación de medicamentos de prueba
- [x] Integración con AsyncStorage
- [x] Diseño responsive para móviles

### 🚧 Para Implementación Futura
- [ ] Integración completa con chaincode en Huawei Cloud BCS (end-to-end)
- [ ] Endpoints adicionales (recalls) en el gateway
- [ ] Autenticación de usuarios (JWT/OAuth2)
- [ ] Notificaciones push
- [ ] Sincronización en tiempo real
- [ ] Reporting avanzado

## 🤝 Uso de la Aplicación

1. **Inicio**: La pantalla principal muestra estadísticas y el botón principal para escanear
2. **Crear Muestra**: Usa el botón "Crear Medicamento de Prueba" para generar datos de ejemplo
3. **Escanear**: Usa el escáner para verificar códigos (puedes usar el ID generado en el paso anterior)
4. **Explorar**: Ve a la pestaña "Explorar" para buscar medicamentos registrados
5. **Verificar**: Los medicamentos muestran su estado de verificación y historial de trazabilidad

## 📧 Contacto

Desarrollado para demostraciones y PoC de trazabilidad farmacéutica con Huawei Cloud BCS.

---

**MediTrack Latam** - Revolucionando la trazabilidad farmacéutica en América Latina con tecnología blockchain.
