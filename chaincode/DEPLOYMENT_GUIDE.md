# Guía de Despliegue en Huawei BCS

Esta guía explica cómo empaquetar, instalar y desplegar el chaincode de trazabilidad de medicamentos en Huawei BCS (Blockchain Service).

## Prerrequisitos

1. **Cuenta de Huawei Cloud** con acceso a BCS
2. **Instancia de BCS** configurada con Hyperledger Fabric
3. **Organizaciones configuradas**:
   - Manufacturer (Fabricantes)
   - Distributor (Distribuidores) 
   - Pharmacy (Farmacias)
   - Regulator (Reguladores - DIGEMID)
4. **Canal creado**: `medchain-channel`

## Paso 1: Empaquetado del Chaincode

### Opción A: Usar el script automatizado
```bash
cd chaincode
./scripts/package.sh
```

### Opción B: Empaquetado manual
```bash
cd chaincode

# Crear directorio temporal
mkdir package
cd package

# Copiar archivos necesarios
cp ../package.json .
cp ../index.js .
cp -r ../lib .
cp -r ../test .
cp ../README.md .

# Instalar dependencias de producción
npm install --production

# Crear archivo tar.gz
tar -czf ../drug-traceability-1.0.0.tar.gz .

# Limpiar
cd ..
rm -rf package
```

## Paso 2: Subir Chaincode a Huawei BCS

1. **Acceder a la consola de administración** de Huawei BCS
2. **Navegar a "Chaincode Management"**
3. **Hacer clic en "Upload Chaincode"**
4. **Seleccionar el archivo**: `drug-traceability-1.0.0.tar.gz`
5. **Configurar metadatos**:
   - **Nombre**: `drug-traceability`
   - **Versión**: `1.0.0`
   - **Lenguaje**: `Node.js`
   - **Descripción**: `Drug Traceability Chaincode for Pharmaceutical Supply Chain`

## Paso 3: Instalar Chaincode en los Peers

### Para cada organización:

1. **Seleccionar la organización** (Manufacturer, Distributor, Pharmacy, Regulator)
2. **Hacer clic en "Install Chaincode"**
3. **Seleccionar el chaincode**: `drug-traceability-1.0.0`
4. **Seleccionar los peers** donde instalar
5. **Confirmar la instalación**

### Verificar instalación:
- El chaincode debe aparecer como "Installed" en todos los peers
- Estado: "Ready for instantiation"

## Paso 4: Instanciar Chaincode en el Canal

1. **Navegar a "Channel Management"**
2. **Seleccionar el canal**: `medchain-channel`
3. **Hacer clic en "Instantiate Chaincode"**
4. **Configurar la instanciación**:
   - **Chaincode**: `drug-traceability`
   - **Versión**: `1.0.0`
   - **Función de inicialización**: `Init`
   - **Argumentos**: `[]` (vacío)
   - **Política de endorsamiento**: Configurar según necesidades

### Política de Endorsamiento Recomendada:
```json
{
  "identities": [
    {
      "role": {
        "name": "member",
        "mspId": "ManufacturerMSP"
      }
    },
    {
      "role": {
        "name": "member", 
        "mspId": "DistributorMSP"
      }
    },
    {
      "role": {
        "name": "member",
        "mspId": "PharmacyMSP"
      }
    },
    {
      "role": {
        "name": "member",
        "mspId": "RegulatorMSP"
      }
    }
  ],
  "policy": {
    "2-of": [
      {"signed-by": 0},
      {"signed-by": 1},
      {"signed-by": 2},
      {"signed-by": 3}
    ]
  }
}
```

## Paso 5: Configurar Permisos y Roles

### Configurar políticas de acceso:

1. **CommissionMedication**: Solo Manufacturer
2. **AddTrackingEvent**: Manufacturer, Distributor, Pharmacy
3. **VerifyMedication**: Todos los roles (lectura pública)
4. **IssueMedicationRecall**: Solo Regulator (DIGEMID)
5. **GetMedication**: Todos los roles
6. **GetTrackingHistory**: Todos los roles
7. **SearchMedications**: Todos los roles
8. **GetVerificationStats**: Todos los roles

## Paso 6: Verificar el Despliegue

### Usar la consola de administración:

1. **Navegar a "Transaction Management"**
2. **Hacer clic en "Invoke Chaincode"**
3. **Seleccionar**:
   - Canal: `medchain-channel`
   - Chaincode: `drug-traceability`
   - Función: `GetVerificationStats`
   - Argumentos: `[]`
4. **Ejecutar la transacción**
5. **Verificar respuesta**: Debe retornar estadísticas vacías inicialmente

### Usar SDK o CLI:

```bash
# Ejemplo usando Fabric CLI
peer chaincode query -C medchain-channel -n drug-traceability -c '{"Args":["GetVerificationStats"]}'
```

## Paso 7: Configurar el Frontend

### Actualizar configuración de conexión:

1. **Obtener información de conexión** de la consola BCS:
   - Endpoint del peer
   - Certificados de usuario
   - Configuración del canal

2. **Configurar SDK de Fabric** en el frontend
3. **Actualizar el servicio** `stellarMediTrack.ts` para usar Fabric SDK

## Paso 8: Pruebas de Integración

### Probar funciones principales:

1. **CommissionMedication**:
   ```javascript
   await contract.submitTransaction('CommissionMedication', 
     '7501001234567', 'PCT2024001', '123456789', 
     '2025-12-31', 'Laboratorios Unidos S.A.', 
     'Paracetamol 500mg', 'Planta Lima');
   ```

2. **AddTrackingEvent**:
   ```javascript
   await contract.submitTransaction('AddTrackingEvent',
     'medicationId', 'ship', 'Centro Distribución', 
     'LogiMed Perú', 'signature123');
   ```

3. **VerifyMedication**:
   ```javascript
   const result = await contract.evaluateTransaction('VerifyMedication', 'medicationId');
   ```

## Monitoreo y Mantenimiento

### Herramientas de monitoreo:

1. **Dashboard de BCS**: Monitorear transacciones y rendimiento
2. **Logs de chaincode**: Revisar logs en la consola
3. **Métricas de red**: Monitorear uso de recursos

### Actualizaciones:

1. **Nueva versión del chaincode**:
   - Empaquetar nueva versión
   - Instalar en peers
   - Actualizar en el canal

2. **Configuración de red**:
   - Agregar nuevas organizaciones
   - Modificar políticas de endorsamiento
   - Actualizar certificados

## Solución de Problemas

### Problemas comunes:

1. **Chaincode no se instala**:
   - Verificar formato del archivo .tar.gz
   - Revisar dependencias en package.json
   - Verificar permisos de usuario

2. **Transacciones fallan**:
   - Verificar políticas de endorsamiento
   - Revisar certificados de usuario
   - Verificar configuración del canal

3. **Errores de conexión**:
   - Verificar endpoints de red
   - Revisar configuración de firewall
   - Verificar certificados SSL

### Logs importantes:

- **Chaincode logs**: Disponibles en la consola BCS
- **Peer logs**: Para debugging de red
- **Application logs**: En el frontend

## Contacto y Soporte

Para soporte técnico:
- **Documentación Huawei BCS**: [Enlace a documentación oficial]
- **Soporte técnico**: [Contacto de soporte]
- **Comunidad**: [Foros de Huawei Cloud]
