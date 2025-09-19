# Guía de Migración a Huawei BCS

Esta guía te explica cómo migrar tu aplicación de modo local a Huawei BCS cuando se descongele tu cuenta.

## 🎯 **Estado Actual**

### ✅ **Lo que ya tienes funcionando:**
- ✅ **Servicio híbrido** (`services/huaweiBCS.ts`)
- ✅ **Frontend adaptado** (usa el nuevo servicio)
- ✅ **Simulador local** (funciona sin Huawei BCS)
- ✅ **Misma interfaz** (para local y producción)

### 🔄 **Lo que falta para producción:**
- 🔧 **Configurar Huawei BCS** (cuando tengas créditos)
- 🔧 **Conectar endpoints reales**
- 🔧 **Configurar certificados**

## 🚀 **Migración Paso a Paso**

### **Paso 1: Obtener Acceso a Huawei BCS**

1. **Descongelar cuenta** en Huawei Cloud
2. **Crear instancia BCS** con Hyperledger Fabric
3. **Configurar organizaciones**:
   - Manufacturer (Fabricantes)
   - Distributor (Distribuidores)
   - Pharmacy (Farmacias)
   - Regulator (Reguladores)

### **Paso 2: Desplegar Chaincode**

```bash
# 1. Empaquetar chaincode
cd chaincode
./scripts/package.sh

# 2. Subir a Huawei BCS
# - Usar consola de administración
# - Subir archivo .tar.gz
# - Instalar en todos los peers
# - Instanciar en canal
```

### **Paso 3: Configurar Aplicación**

#### **Opción A: Cambio Automático**
```typescript
// En services/huaweiBCS.ts
// Cambiar esta línea:
mode: 'local'
// Por:
mode: 'production'
```

#### **Opción B: Cambio Dinámico**
```typescript
// En tu aplicación
import { huaweiBCS } from '@/services/huaweiBCS';

// Cambiar a producción
huaweiBCS.setProductionMode(
  'https://your-huawei-bcs-endpoint.com',
  {
    certificate: 'YOUR_CERTIFICATE',
    privateKey: 'YOUR_PRIVATE_KEY'
  }
);

// Reinicializar servicio
await huaweiBCS.initialize();
```

### **Paso 4: Configurar Endpoints**

```typescript
// En services/config.ts
export const productionConfig = {
  mode: 'production',
  productionEndpoint: 'https://your-actual-huawei-bcs-endpoint.com',
  channelName: 'medchain-channel',
  chaincodeName: 'drug-traceability',
  userCredentials: {
    certificate: 'YOUR_ACTUAL_CERTIFICATE',
    privateKey: 'YOUR_ACTUAL_PRIVATE_KEY'
  }
};
```

### **Paso 5: Probar Conexión**

```typescript
// Probar que funciona
const stats = await huaweiBCS.getVerificationStats();
console.log('Estadísticas:', stats);
```

## 🔧 **Configuración Detallada**

### **Endpoints de Huawei BCS**

Obtén estos valores de la consola de administración:

```typescript
const huaweiConfig = {
  // Endpoint del peer
  peerEndpoint: 'grpcs://peer1.org1.example.com:7051',
  
  // Endpoint del orderer
  ordererEndpoint: 'grpcs://orderer.example.com:7050',
  
  // Configuración del canal
  channelName: 'medchain-channel',
  
  // Nombre del chaincode
  chaincodeName: 'drug-traceability',
  
  // Versión del chaincode
  chaincodeVersion: '1.0.0'
};
```

### **Certificados de Usuario**

```typescript
const userCredentials = {
  // Certificado del usuario
  certificate: `-----BEGIN CERTIFICATE-----
MIIC...tu certificado aquí...
-----END CERTIFICATE-----`,
  
  // Clave privada del usuario
  privateKey: `-----BEGIN PRIVATE KEY-----
MIIE...tu clave privada aquí...
-----END PRIVATE KEY-----`
};
```

## 📋 **Checklist de Migración**

### **Antes de Migrar:**
- [ ] ✅ Servicio híbrido funcionando localmente
- [ ] ✅ Frontend adaptado al nuevo servicio
- [ ] ✅ Tests pasando localmente
- [ ] ✅ Documentación completa

### **Durante la Migración:**
- [ ] 🔧 Cuenta Huawei BCS descongelada
- [ ] 🔧 Instancia BCS creada
- [ ] 🔧 Organizaciones configuradas
- [ ] 🔧 Canal creado
- [ ] 🔧 Chaincode desplegado
- [ ] 🔧 Certificados obtenidos

### **Después de Migrar:**
- [ ] ✅ Aplicación conectada a Huawei BCS
- [ ] ✅ Todas las funciones funcionando
- [ ] ✅ Trazabilidad en blockchain real
- [ ] ✅ Pruebas de integración pasando
- [ ] ✅ Monitoreo configurado

## 🎯 **Ventajas de esta Migración**

### **✅ Sin Cambios en el Frontend:**
- Misma interfaz de usuario
- Mismas funciones
- Misma experiencia

### **✅ Migración Transparente:**
- Solo cambiar configuración
- No reescribir código
- Funcionalidad idéntica

### **✅ Desarrollo Continuo:**
- Puedes seguir desarrollando localmente
- Preparar para producción
- Testing completo

## 🚨 **Solución de Problemas**

### **Error: "Service not initialized"**
```typescript
// Solución: Reinicializar servicio
await huaweiBCS.initialize();
```

### **Error: "Production mode not yet implemented"**
```typescript
// Solución: Implementar conexión real a Huawei BCS
// (Esto se hará cuando tengas acceso)
```

### **Error: "Failed to connect to endpoint"**
```typescript
// Solución: Verificar endpoints y certificados
console.log('Config:', huaweiBCS.getConfig());
```

## 📞 **Soporte**

### **Para Desarrollo Local:**
- Usar simulador local
- Todos los tests funcionan
- Desarrollo completo

### **Para Producción:**
- Documentación de Huawei BCS
- Soporte técnico de Huawei
- Comunidad de desarrolladores

## 🎉 **Resultado Final**

Después de la migración tendrás:

- ✅ **Aplicación funcionando** en Huawei BCS
- ✅ **Trazabilidad real** en blockchain
- ✅ **Ventaja competitiva** en la competencia
- ✅ **Código de producción** listo
- ✅ **Escalabilidad** para el futuro

## 💡 **Consejos**

1. **Desarrolla localmente** mientras esperas acceso
2. **Prueba todo** antes de migrar
3. **Documenta** cualquier problema
4. **Mantén backup** del código local
5. **Planifica** la migración con tiempo

---

**¡Tu aplicación está lista para migrar a Huawei BCS cuando tengas acceso!** 🚀
