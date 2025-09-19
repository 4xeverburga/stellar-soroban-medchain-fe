import SupplyChainScreen from '@/components/SupplyChainScreen';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { huaweiBCS, VerificationResult } from '@/services/huaweiBCS';
import { Camera } from 'expo-camera';
import { AlertTriangle, CheckCircle, Package, Scan } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showSupplyChain, setShowSupplyChain] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [stats, setStats] = useState({
    totalVerifications: 0,
    authenticMedications: 0,
    alertsActive: 0
  });
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    const initializeService = async () => {
      try {
        await huaweiBCS.initialize();
        const verificationStats = await huaweiBCS.getVerificationStats();
        setStats(verificationStats);
      } catch (error) {
        console.error('Failed to initialize service:', error);
      }
    };

    getCameraPermissions();
    initializeService();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setShowCamera(false);
    
    try {
      // Try to verify the medication
      const result = await huaweiBCS.verifyMedication(data);
      
      // Store the verification result and show the supply chain screen
      setVerificationResult(result);
      setShowSupplyChain(true);
      
    } catch (error) {
      console.error('Verification error:', error);
      Alert.alert(
        'Error de Verificación',
        'No se pudo verificar el medicamento. Revisa tu conexión a internet.',
        [{ text: 'Cerrar', onPress: () => setScanned(false) }]
      );
    }
  };

  const showFullTrackingChain = (verificationResult: VerificationResult) => {
    const med = verificationResult.medicationData;
    if (!med) return;
    
    const events = verificationResult.trackingHistory;
    
    let chainDetails = `🔗 CADENA DE TRAZABILIDAD COMPLETA\n\n`;
    chainDetails += `📦 MEDICAMENTO: ${med.productName}\n`;
    chainDetails += `🏭 FABRICANTE: ${med.manufacturer}\n`;
    chainDetails += `📊 LOTE: ${med.batch}\n`;
    chainDetails += `📅 VENCE: ${med.expiryDate}\n`;
    chainDetails += `🔐 BLOCKCHAIN: ${verificationResult.blockchainHash}\n\n`;
    
    chainDetails += `📋 EVENTOS DE TRAZABILIDAD:\n\n`;
    
    events.forEach((event: any, index: number) => {
      const date = new Date(event.timestamp).toLocaleString('es-PE');
      chainDetails += `${index + 1}. ${getEventEmoji(event.event)} ${event.event.toUpperCase()}\n`;
      chainDetails += `   📍 ${event.location}\n`;
      chainDetails += `   👤 ${event.actor}\n`;
      chainDetails += `   ⏰ ${date}\n`;
      if (event.transactionHash) {
        chainDetails += `   🔗 ${event.transactionHash.substring(0, 12)}...\n`;
      }
      chainDetails += `\n`;
    });
    
    Alert.alert('Trazabilidad Completa', chainDetails, [{ text: 'Cerrar' }]);
  };

  const getEventEmoji = (eventType: string): string => {
    switch (eventType) {
      case 'commission': return '🏭';
      case 'ship': return '🚚';
      case 'receive': return '📦';
      case 'dispense': return '💊';
      case 'recall': return '⚠️';
      default: return '📋';
    }
  };

  const simulateMockScan = async () => {
    setShowCamera(true);
    setScanned(true);
    setShowCamera(false);


    // Always use the medicationId returned by commissionMedication
    let medicationId = 'abc123demo456';
    let verificationResult = await huaweiBCS.verifyMedication(medicationId);

    if (!verificationResult.isValid) {
      // Create a complete sample medication with full tracking chain (rich mockup)
      const sampleMed = {
        gtin: '7501001234567',
        batch: 'PCT2024001',
        serialNumber: medicationId,
        expiryDate: '2025-12-31',
        manufacturer: 'Laboratorios Unidos S.A.',
        productName: 'Paracetamol 500mg'
      };

      medicationId = await huaweiBCS.commissionMedication(sampleMed);

      // Add a detailed supply chain (do NOT add commission event)
      const trackingEvents = [
        {
          event: 'ship' as const,
          location: 'Planta Lima',
          actor: 'Laboratorios Unidos',
          medicationId,
          timestamp: '2024-01-11T09:00:00'
        },
        {
          event: 'ship' as const,
          location: 'Centro Distribución Lima',
          actor: 'LogiMed Perú',
          medicationId,
          timestamp: '2024-01-12T14:30:00'
        },
        {
          event: 'receive' as const,
          location: 'Centro Distribución Lima',
          actor: 'LogiMed Perú',
          medicationId,
          timestamp: '2024-01-13T10:15:00'
        },
        {
          event: 'ship' as const,
          location: 'Ruta Lima - Miraflores',
          actor: 'Transporte Seguro SAC',
          medicationId,
          timestamp: '2024-01-14T12:00:00'
        },
        {
          event: 'receive' as const,
          location: 'Farmacia San Juan, Miraflores',
          actor: 'Farmacia San Juan',
          medicationId,
          timestamp: '2024-01-15T16:20:00'
        },
        {
          event: 'dispense' as const,
          location: 'Farmacia San Juan, Miraflores',
          actor: 'Dra. María González',
          medicationId,
          timestamp: '2024-01-16T09:30:00'
        }
      ];

      for (const event of trackingEvents) {
        await huaweiBCS.addTrackingEvent(medicationId, event);
      }

      verificationResult = await huaweiBCS.verifyMedication(medicationId);
    }

    // Show the supply chain screen directly
    setVerificationResult(verificationResult);
    setShowSupplyChain(true);

    // Refresh stats
    const newStats = await huaweiBCS.getVerificationStats();
    setStats(newStats);
  };

  const openScanner = () => {
    if (hasPermission) {
      setShowCamera(true);
      setScanned(false);
    } else {
      Alert.alert('Permiso requerido', 'Se necesita acceso a la cámara para escanear códigos.');
    }
  };

  const addSampleMedication = async () => {
    try {
      const sampleMed = {
        gtin: '7501001234567',
        batch: 'PCT2024001',
        serialNumber: '123456789',
        expiryDate: '2025-12-31',
        manufacturer: 'Laboratorios Unidos S.A.',
        productName: 'Paracetamol 500mg'
      };
      
      const medicationId = await huaweiBCS.commissionMedication(sampleMed);
      
      // Add tracking events
      await huaweiBCS.addTrackingEvent(medicationId, {
        event: 'ship',
        location: 'Centro Distribución Lima',
        timestamp: new Date().toISOString(),
        actor: 'LogiMed Perú',
        medicationId
      });
      
      Alert.alert(
        'Medicamento de Prueba Creado',
        `ID: ${medicationId}\nEscaneando este ID podrás ver la verificación completa.`,
        [{ text: 'OK' }]
      );
      
      // Refresh stats
      const newStats = await huaweiBCS.getVerificationStats();
      setStats(newStats);
    } catch (error) {
      console.error('Failed to create sample medication:', error);
      Alert.alert('Error', 'No se pudo crear el medicamento de prueba');
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: '100%' }}
    >


      {/* Remove header logo, move logo into dashboardCard below */}

      <ThemedView style={styles.content}>
        <View style={styles.dashboardCard}>
          <Image
            source={require('@/assets/images/icon.jpeg')}
            style={styles.logoImageLarge}
            resizeMode="contain"
          />
          <TouchableOpacity 
            style={[styles.scanButton, { backgroundColor: themeColors.tint, marginBottom: 24, marginTop: 8 }]}
            onPress={simulateMockScan}
          >
            <Scan size={28} color="white" />
            <ThemedText style={styles.scanButtonText}>Escanear Medicamento</ThemedText>
          </TouchableOpacity>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#e0f7fa', borderColor: '#22c55e', borderWidth: 1 }]}> 
              <CheckCircle size={36} color="#22c55e" />
              <ThemedText type="defaultSemiBold" style={styles.statNumber}>{stats.totalVerifications}</ThemedText>
              <ThemedText style={styles.statLabel}>Verificaciones</ThemedText>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#e0e7ff', borderColor: '#3b82f6', borderWidth: 1 }]}> 
              <Package size={36} color="#3b82f6" />
              <ThemedText type="defaultSemiBold" style={styles.statNumber}>{stats.authenticMedications}</ThemedText>
              <ThemedText style={styles.statLabel}>Auténticos</ThemedText>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#fee2e2', borderColor: '#ef4444', borderWidth: 1 }]}> 
              <AlertTriangle size={36} color="#ef4444" />
              <ThemedText type="defaultSemiBold" style={styles.statNumber}>{stats.alertsActive}</ThemedText>
              <ThemedText style={styles.statLabel}>Alertas</ThemedText>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.demoButton, { backgroundColor: themeColors.borderSecondary, marginTop: 24 }]}
            onPress={addSampleMedication}
          >
            <Package size={22} color="white" />
            <ThemedText style={styles.demoButtonText}>Crear Medicamento de Prueba</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      {showCamera && hasPermission && (
        <View style={styles.camera}>
          <View style={styles.cameraOverlay}>
            <View style={styles.scanningFrame}>
              <ThemedText style={styles.cameraText}>
                {scanned ? 
                  '📱 Procesando código escaneado...' : 
                  'Apunta la cámara hacia el código DataMatrix del medicamento'
                }
              </ThemedText>
              
              {/* Scanning animation */}
              <View style={styles.scanningArea}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                
                <View style={styles.scanLine} />
              </View>
              
              <ThemedText style={styles.instructionText}>
                📋 El medicamento será verificado automáticamente en la blockchain
              </ThemedText>
            </View>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowCamera(false)}
            >
              <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showSupplyChain && verificationResult && (
        <SupplyChainScreen
          visible={showSupplyChain}
          onClose={() => {
            setShowSupplyChain(false);
            setScanned(false);
          }}
          verificationResult={verificationResult}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: '100%',
  },
  header: {
    padding: 32,
    alignItems: 'center',
    paddingTop: 48,
    marginBottom: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginBottom: 8,
    alignSelf: 'center',
  },
  logoImageLarge: {
    width: 180,
    height: 180,
    marginBottom: 8,
    alignSelf: 'center',
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#e0e7ff',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  dashboardTagline: {
    textAlign: 'center',
    opacity: 0.8,
    fontSize: 18,
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: 0,
  },
  dashboardCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    marginBottom: 24,
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    width: '100%',
    marginHorizontal: 0,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  demoScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 24,
  },
  demoScanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  demoButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    margin: 4,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 20,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
    marginTop: 4,
  },
  featuresContainer: {
    marginTop: 8,
  },
  featuresTitle: {
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  featureText: {
    marginLeft: 12,
    flex: 1,
  },
  camera: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cameraText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  cancelButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
  },
  scanningFrame: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningArea: {
    width: 250,
    height: 250,
    position: 'relative',
    marginVertical: 30,
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#00ff00',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#00ff00',
    opacity: 0.8,
  },
  instructionText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
    marginTop: 10,
  },
});
