import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { VerificationResult } from '@/services/stellarMediTrack';
import {
	AlertTriangle,
	Building,
	Calendar,
	CheckCircle,
	Clock,
	Factory,
	Hospital,
	MapPin,
	Package,
	Shield,
	Truck,
	X
} from 'lucide-react-native';
import React from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface SupplyChainScreenProps {
  visible: boolean;
  onClose: () => void;
  verificationResult: VerificationResult | null;
}

export default function SupplyChainScreen({ visible, onClose, verificationResult }: SupplyChainScreenProps) {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  if (!verificationResult) return null;

  const { medicationData, trackingHistory, isValid, blockchainHash } = verificationResult;

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'commission': return <Factory size={24} color="#3b82f6" />;
      case 'ship': return <Truck size={24} color="#f59e0b" />;
      case 'receive': return <Building size={24} color="#10b981" />;
      case 'dispense': return <Hospital size={24} color="#8b5cf6" />;
      case 'recall': return <AlertTriangle size={24} color="#ef4444" />;
      default: return <Package size={24} color="#6b7280" />;
    }
  };

  const getEventTitle = (eventType: string) => {
    switch (eventType) {
      case 'commission': return 'Fabricación';
      case 'ship': return 'Envío';
      case 'receive': return 'Recepción';
      case 'dispense': return 'Dispensación';
      case 'recall': return 'Recall';
      default: return 'Evento';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={[styles.header, { borderBottomColor: themeColors.tabIconDefault }]}>
          <View style={styles.headerContent}>
            <View style={styles.statusContainer}>
              {isValid ? (
                <CheckCircle size={32} color="#22c55e" />
              ) : (
                <AlertTriangle size={32} color="#ef4444" />
              )}
              <View style={styles.statusTextContainer}>
                <ThemedText type="title" style={styles.statusTitle}>
                  {isValid ? 'Medicamento Auténtico' : 'Medicamento No Verificado'}
                </ThemedText>
                <ThemedText style={styles.statusSubtitle}>
                  {isValid ? 'Verificado en Stellar Blockchain' : 'No registrado en blockchain'}
                </ThemedText>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Medication Information */}
          <ThemedView style={[styles.section, { backgroundColor: themeColors.background }]}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Información del Medicamento
            </ThemedText>
            
            <View style={styles.medicationInfo}>
              <View style={styles.infoRow}>
                <Package size={20} color={themeColors.icon} />
                <View style={styles.infoContent}>
                  <ThemedText style={styles.infoLabel}>Producto</ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.infoValue}>
                    {medicationData?.productName}
                  </ThemedText>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <Building size={20} color={themeColors.icon} />
                <View style={styles.infoContent}>
                  <ThemedText style={styles.infoLabel}>Fabricante</ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.infoValue}>
                    {medicationData?.manufacturer}
                  </ThemedText>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <Calendar size={20} color={themeColors.icon} />
                <View style={styles.infoContent}>
                  <ThemedText style={styles.infoLabel}>Lote</ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.infoValue}>
                    {medicationData?.batch}
                  </ThemedText>
                </View>
              </View>
              
              <View style={styles.infoRow}>
                <Clock size={20} color={themeColors.icon} />
                <View style={styles.infoContent}>
                  <ThemedText style={styles.infoLabel}>Fecha de Vencimiento</ThemedText>
                  <ThemedText type="defaultSemiBold" style={styles.infoValue}>
                    {medicationData?.expiryDate}
                  </ThemedText>
                </View>
              </View>
            </View>
          </ThemedView>

          {/* Blockchain Information */}
          <ThemedView style={[styles.section, { backgroundColor: themeColors.background }]}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Información Blockchain
            </ThemedText>
            
            <View style={styles.blockchainInfo}>
              <View style={styles.hashContainer}>
                <Shield size={20} color="#3b82f6" />
                <View style={styles.hashContent}>
                  <ThemedText style={styles.infoLabel}>Hash de Transacción</ThemedText>
                  <ThemedText style={styles.hashValue} numberOfLines={1}>
                    {blockchainHash}
                  </ThemedText>
                </View>
              </View>
              
              <View style={styles.networkInfo}>
                <ThemedText style={styles.networkText}>
                  Red: Stellar Testnet
                </ThemedText>
                <View style={[styles.networkStatus, { backgroundColor: '#22c55e' }]}>
                  <ThemedText style={styles.networkStatusText}>CONFIRMADO</ThemedText>
                </View>
              </View>
            </View>
          </ThemedView>

          {/* Supply Chain Timeline */}
          <ThemedView style={[styles.section, { backgroundColor: themeColors.background }]}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Cadena de Suministro
            </ThemedText>
            
            <View style={styles.timeline}>
              {trackingHistory.map((event, index) => (
                <View key={index} style={styles.timelineItem}>
                  <View style={styles.timelineIconContainer}>
                    {getEventIcon(event.event)}
                    {index < trackingHistory.length - 1 && (
                      <View style={[styles.timelineLine, { backgroundColor: themeColors.tabIconDefault }]} />
                    )}
                  </View>
                  
                  <View style={styles.timelineContent}>
                    <View style={styles.eventHeader}>
                      <ThemedText type="defaultSemiBold" style={styles.eventTitle}>
                        {getEventTitle(event.event)}
                      </ThemedText>
                      <ThemedText style={styles.eventTime}>
                        {formatDate(event.timestamp)}
                      </ThemedText>
                    </View>
                    
                    <View style={styles.eventDetails}>
                      <View style={styles.eventDetailRow}>
                        <MapPin size={16} color={themeColors.icon} />
                        <ThemedText style={styles.eventLocation}>
                          {event.location}
                        </ThemedText>
                      </View>
                      
                      <View style={styles.eventDetailRow}>
                        <Building size={16} color={themeColors.icon} />
                        <ThemedText style={styles.eventActor}>
                          {event.actor}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ThemedView>

          {/* Alert Section for Recalls */}
          {!isValid && (
            <ThemedView style={[styles.section, styles.alertSection]}>
              <View style={styles.alertHeader}>
                <AlertTriangle size={24} color="#ef4444" />
                <ThemedText type="subtitle" style={styles.alertTitle}>
                  ⚠️ ALERTA DE SEGURIDAD
                </ThemedText>
              </View>
              
              <ThemedText style={styles.alertText}>
                Este medicamento ha sido retirado del mercado o no está registrado en la blockchain. 
                No debe ser dispensado ni administrado.
              </ThemedText>
              
              <TouchableOpacity style={styles.reportButton}>
                <ThemedText style={styles.reportButtonText}>
                  Reportar Medicamento Sospechoso
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          )}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: themeColors.tabIconDefault }]}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: themeColors.tint }]}
            onPress={onClose}
          >
            <ThemedText style={styles.actionButtonText}>
              Cerrar
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 20,
    marginBottom: 4,
  },
  statusSubtitle: {
    opacity: 0.7,
    fontSize: 14,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  medicationInfo: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
  },
  blockchainInfo: {
    gap: 16,
  },
  hashContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hashContent: {
    marginLeft: 12,
    flex: 1,
  },
  hashValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    opacity: 0.8,
  },
  networkInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  networkText: {
    fontSize: 14,
    opacity: 0.7,
  },
  networkStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  networkStatusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  timeline: {
    gap: 24,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineIconContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineLine: {
    width: 2,
    height: 40,
    marginTop: 8,
  },
  timelineContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
  },
  eventTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  eventDetails: {
    gap: 4,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventLocation: {
    marginLeft: 8,
    fontSize: 14,
    opacity: 0.8,
  },
  eventActor: {
    marginLeft: 8,
    fontSize: 14,
    opacity: 0.8,
  },
  alertSection: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
    borderWidth: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    marginLeft: 8,
    color: '#ef4444',
  },
  alertText: {
    color: '#dc2626',
    lineHeight: 20,
    marginBottom: 16,
  },
  reportButton: {
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  reportButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  actionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
