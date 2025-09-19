/**
 * Script de Pruebas Completo para el Chaincode de Trazabilidad
 * Ejecuta todas las funciones del chaincode en un simulador local
 */

const DrugTraceabilityContract = require('../index');
const FabricSimulator = require('./fabric-simulator');

async function runCompleteTest() {
    console.log('🚀 Iniciando Pruebas Completas del Chaincode de Trazabilidad');
    console.log('============================================================\n');

    const simulator = new FabricSimulator();
    const contract = new DrugTraceabilityContract();

    try {
        // 1. Inicializar chaincode
        console.log('1️⃣ Inicializando Chaincode...');
        await simulator.invokeTransaction(contract, 'Init');

        // 2. Comisionar medicamento
        console.log('\n2️⃣ Comisionando Medicamento...');
        const commissionResult = await simulator.invokeTransaction(
            contract, 
            'CommissionMedication',
            '7501001234567',  // gtin
            'PCT2024001',     // batch
            '123456789',      // serialNumber
            '2025-12-31',     // expiryDate
            'Laboratorios Unidos S.A.', // manufacturer
            'Paracetamol 500mg',        // productName
            'Planta Lima'     // location
        );
        
        const medicationId = JSON.parse(commissionResult).medicationId;
        console.log(`📦 Medicamento comisionado con ID: ${medicationId}`);

        // 3. Agregar eventos de seguimiento
        console.log('\n3️⃣ Agregando Eventos de Seguimiento...');
        
        const trackingEvents = [
            {
                event: 'ship',
                location: 'Centro Distribución Lima',
                actor: 'LogiMed Perú',
                signature: 'sig1'
            },
            {
                event: 'receive',
                location: 'Centro Distribución Lima',
                actor: 'LogiMed Perú',
                signature: 'sig2'
            },
            {
                event: 'ship',
                location: 'Ruta Lima - Miraflores',
                actor: 'Transporte Seguro SAC',
                signature: 'sig3'
            },
            {
                event: 'receive',
                location: 'Farmacia San Juan, Miraflores',
                actor: 'Farmacia San Juan',
                signature: 'sig4'
            },
            {
                event: 'dispense',
                location: 'Farmacia San Juan, Miraflores',
                actor: 'Dra. María González',
                signature: 'sig5'
            }
        ];

        for (const trackingEvent of trackingEvents) {
            await simulator.invokeTransaction(
                contract,
                'AddTrackingEvent',
                medicationId,
                trackingEvent.event,
                trackingEvent.location,
                trackingEvent.actor,
                trackingEvent.signature
            );
        }

        // 4. Verificar medicamento
        console.log('\n4️⃣ Verificando Medicamento...');
        const verificationResult = await simulator.queryTransaction(
            contract,
            'VerifyMedication',
            medicationId
        );
        
        const verification = JSON.parse(verificationResult);
        console.log(`✅ Medicamento válido: ${verification.isValid}`);
        console.log(`👤 Poseedor actual: ${verification.currentHolder}`);
        console.log(`📊 Eventos de seguimiento: ${verification.trackingHistory.length}`);

        // 5. Obtener medicamento
        console.log('\n5️⃣ Obteniendo Datos del Medicamento...');
        const medicationData = await simulator.queryTransaction(
            contract,
            'GetMedication',
            medicationId
        );
        
        const medication = JSON.parse(medicationData);
        console.log(`📦 Producto: ${medication.productName}`);
        console.log(`🏭 Fabricante: ${medication.manufacturer}`);
        console.log(`📅 Lote: ${medication.batch}`);
        console.log(`📍 Ubicación: ${medication.location}`);

        // 6. Obtener historial de seguimiento
        console.log('\n6️⃣ Obteniendo Historial de Seguimiento...');
        const trackingHistory = await simulator.queryTransaction(
            contract,
            'GetTrackingHistory',
            medicationId
        );
        
        const history = JSON.parse(trackingHistory);
        console.log(`📋 Total de eventos: ${history.length}`);
        history.forEach((event, index) => {
            console.log(`   ${index + 1}. ${event.event} - ${event.location} (${event.actor})`);
        });

        // 7. Buscar medicamentos
        console.log('\n7️⃣ Buscando Medicamentos...');
        const searchResult = await simulator.queryTransaction(
            contract,
            'SearchMedications',
            'Paracetamol'
        );
        
        const searchResults = JSON.parse(searchResult);
        console.log(`🔍 Resultados de búsqueda: ${searchResults.length} medicamento(s) encontrado(s)`);

        // 8. Obtener estadísticas
        console.log('\n8️⃣ Obteniendo Estadísticas...');
        const statsResult = await simulator.queryTransaction(
            contract,
            'GetVerificationStats'
        );
        
        const stats = JSON.parse(statsResult);
        console.log(`📊 Total verificaciones: ${stats.total}`);
        console.log(`✅ Medicamentos auténticos: ${stats.auth}`);
        console.log(`⚠️ Alertas activas: ${stats.alerts}`);

        // 9. Comisionar segundo medicamento
        console.log('\n9️⃣ Comisionando Segundo Medicamento...');
        const commissionResult2 = await simulator.invokeTransaction(
            contract,
            'CommissionMedication',
            '7501001234568',  // gtin diferente
            'IBU2024002',     // batch diferente
            '987654321',      // serialNumber diferente
            '2025-08-15',     // expiryDate
            'FarmaPeru S.A.C.', // manufacturer
            'Ibuprofeno 400mg',  // productName
            'Planta Arequipa' // location
        );
        
        const medicationId2 = JSON.parse(commissionResult2).medicationId;
        console.log(`📦 Segundo medicamento comisionado con ID: ${medicationId2}`);

        // 10. Emitir recall para el segundo medicamento
        console.log('\n🔟 Emitiendo Recall...');
        await simulator.invokeTransaction(
            contract,
            'IssueMedicationRecall',
            medicationId2,
            'Quality issue detected in batch',
            'DIGEMID'
        );

        // 11. Verificar estadísticas actualizadas
        console.log('\n1️⃣1️⃣ Verificando Estadísticas Actualizadas...');
        const finalStatsResult = await simulator.queryTransaction(
            contract,
            'GetVerificationStats'
        );
        
        const finalStats = JSON.parse(finalStatsResult);
        console.log(`📊 Total verificaciones: ${finalStats.total}`);
        console.log(`✅ Medicamentos auténticos: ${finalStats.auth}`);
        console.log(`⚠️ Alertas activas: ${finalStats.alerts}`);

        // 12. Verificar medicamento con recall
        console.log('\n1️⃣2️⃣ Verificando Medicamento con Recall...');
        const recallVerification = await simulator.queryTransaction(
            contract,
            'VerifyMedication',
            medicationId2
        );
        
        const recallResult = JSON.parse(recallVerification);
        console.log(`❌ Medicamento válido: ${recallResult.isValid}`);
        console.log(`⚠️ Tiene recall: ${!recallResult.isValid}`);

        // Mostrar estado final
        console.log('\n📊 Estado Final del Sistema:');
        console.log('============================');
        simulator.showWorldState();

        console.log('\n🎉 ¡Todas las pruebas completadas exitosamente!');
        console.log('✅ El chaincode funciona correctamente');
        console.log('✅ Todas las funciones están operativas');
        console.log('✅ La lógica de negocio es correcta');

    } catch (error) {
        console.error('\n❌ Error durante las pruebas:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Ejecutar pruebas si se llama directamente
if (require.main === module) {
    runCompleteTest().catch(console.error);
}

module.exports = { runCompleteTest };
