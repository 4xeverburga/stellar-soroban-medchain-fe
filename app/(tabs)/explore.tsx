import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AlertTriangle, Building, Calendar, CheckCircle, MapPin, Package, Search, Truck } from 'lucide-react-native';
import React, { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface MedicationRecord {
  id: string;
  name: string;
  batch: string;
  manufacturer: string;
  expiryDate: string;
  status: 'verified' | 'pending' | 'alert';
  lastLocation: string;
  trackingEvents: Array<{
    event: string;
    location: string;
    timestamp: string;
    actor: string;
  }>;
}

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMed, setSelectedMed] = useState<MedicationRecord | null>(null);
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? 'light'];

  // Mock data for demonstration
  const medicationRecords: MedicationRecord[] = [
    {
      id: '1',
      name: 'Paracetamol 500mg',
      batch: 'PCT2024001',
      manufacturer: 'Laboratorios Unidos S.A.',
      expiryDate: '2025-12-31',
      status: 'verified',
      lastLocation: 'Farmacia San Juan, Lima',
      trackingEvents: [
        { event: 'Comisionado', location: 'Planta Lima', timestamp: '2024-01-10 07:45', actor: 'Laboratorios Unidos' },
        { event: 'Empaquetado', location: 'Planta Lima', timestamp: '2024-01-11 09:00', actor: 'Laboratorios Unidos' },
        { event: 'Enviado', location: 'Centro Distribución Lima', timestamp: '2024-01-12 14:30', actor: 'LogiMed Perú' },
        { event: 'Recibido', location: 'Centro Distribución Lima', timestamp: '2024-01-13 10:15', actor: 'LogiMed Perú' },
        { event: 'En tránsito', location: 'Ruta Lima - Miraflores', timestamp: '2024-01-14 12:00', actor: 'Transporte Seguro SAC' },
        { event: 'Recibido', location: 'Farmacia San Juan, Miraflores', timestamp: '2024-01-15 16:20', actor: 'Farmacia San Juan' },
        { event: 'Dispensado', location: 'Farmacia San Juan, Miraflores', timestamp: '2024-01-16 09:30', actor: 'Dra. María González' },
      ]
    },
    {
      id: '2',
      name: 'Ibuprofeno 400mg',
      batch: 'IBU2024002',
      manufacturer: 'FarmaPeru S.A.C.',
      expiryDate: '2025-08-15',
      status: 'alert',
      lastLocation: 'En tránsito',
      trackingEvents: [
        { event: 'Fabricado', location: 'Planta Arequipa', timestamp: '2024-02-01 10:00', actor: 'FarmaPeru' },
        { event: 'Alerta de Recall', location: 'Sistema Central', timestamp: '2024-02-10 16:45', actor: 'DIGEMID' },
      ]
    },
    {
      id: '3',
      name: 'Amoxicilina 250mg',
      batch: 'AMX2024003',
      manufacturer: 'Antibióticos del Perú',
      expiryDate: '2025-06-30',
      status: 'pending',
      lastLocation: 'Hospital Nacional',
      trackingEvents: [
        { event: 'Fabricado', location: 'Planta Callao', timestamp: '2024-01-20 11:30', actor: 'Antibióticos del Perú' },
        { event: 'En verificación', location: 'Lab Control', timestamp: '2024-01-25 15:20', actor: 'Control de Calidad' },
      ]
    }
  ];

  const filteredRecords = medicationRecords.filter(record => {
    const matchesSearch = record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.batch.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         record.manufacturer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || record.status === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return '#22c55e';
      case 'alert': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return themeColors.text;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle size={20} color="#22c55e" />;
      case 'alert': return <AlertTriangle size={20} color="#ef4444" />;
      case 'pending': return <Package size={20} color="#f59e0b" />;
      default: return <Package size={20} color={themeColors.text} />;
    }
  };

  const renderMedicationCard = ({ item }: { item: MedicationRecord }) => (
    <TouchableOpacity
      style={[styles.medicationCard, { backgroundColor: themeColors.background }]}
      activeOpacity={item.status === 'verified' ? 0.7 : 1}
      onPress={() => {
        if (item.status === 'verified') {
          setSelectedMed(item);
          setModalVisible(true);
        }
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          {getStatusIcon(item.status)}
          <ThemedText type="defaultSemiBold" style={styles.medicationName}>
            {item.name}
          </ThemedText>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <ThemedText style={styles.statusText}>
            {item.status.toUpperCase()}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.infoRow}>
          <Package size={16} color={themeColors.icon} />
          <ThemedText style={styles.infoText}>Lote: {item.batch}</ThemedText>
        </View>
        
        <View style={styles.infoRow}>
          <Building size={16} color={themeColors.icon} />
          <ThemedText style={styles.infoText}>{item.manufacturer}</ThemedText>
        </View>
        
        <View style={styles.infoRow}>
          <Calendar size={16} color={themeColors.icon} />
          <ThemedText style={styles.infoText}>Vence: {item.expiryDate}</ThemedText>
        </View>
        
        <View style={styles.infoRow}>
          <MapPin size={16} color={themeColors.icon} />
          <ThemedText style={styles.infoText}>{item.lastLocation}</ThemedText>
        </View>
      </View>
      
      <View style={styles.trackingSection}>
        <ThemedText type="defaultSemiBold" style={styles.trackingTitle}>
          Últimos eventos de trazabilidad:
        </ThemedText>
        {item.trackingEvents.slice(-2).map((event, index) => (
          <View key={index} style={styles.trackingEvent}>
            <Truck size={14} color={themeColors.icon} />
            <View style={styles.eventDetails}>
              <ThemedText style={styles.eventText}>
                {event.event} - {event.location}
              </ThemedText>
              <ThemedText style={styles.eventTime}>
                {event.timestamp} | {event.actor}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}> 
      <ThemedView style={styles.header}>
        <ThemedText type="title">Explorar Medicamentos</ThemedText>
        <ThemedText style={styles.subtitle}>
          Busca y verifica la trazabilidad de medicamentos registrados
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.searchSection}>
        <View style={[styles.searchContainer, { backgroundColor: themeColors.background }]}>
          <Search size={20} color={themeColors.icon} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.text }]}
            placeholder="Buscar por nombre, lote o fabricante..."
            placeholderTextColor={themeColors.tabIconDefault}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {[
            { key: 'all', label: 'Todos' },
            { key: 'verified', label: 'Verificados' },
            { key: 'pending', label: 'Pendientes' },
            { key: 'alert', label: 'Alertas' }
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                {
                  backgroundColor: selectedFilter === filter.key ? themeColors.tint : 'transparent',
                  borderColor: themeColors.tint,
                }
              ]}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <ThemedText style={[
                styles.filterText,
                { color: selectedFilter === filter.key ? 'white' : themeColors.tint }
              ]}>
                {filter.label}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ThemedView>

      <ThemedView style={styles.resultsSection}>
        <ThemedText style={styles.resultsCount}>
          {filteredRecords.length} medicamento(s) encontrado(s)
        </ThemedText>
        <FlatList
          data={filteredRecords}
          renderItem={renderMedicationCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      </ThemedView>

      {/* Modal for supply chain */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: themeColors.background, borderRadius: 16, padding: 24, width: '90%', maxHeight: '80%' }}>
            <ThemedText type="title" style={{ marginBottom: 8 }}>Cadena de Suministro</ThemedText>
            {selectedMed && (
              <>
                <ThemedText style={{ fontWeight: 'bold', marginBottom: 4 }}>{selectedMed.name}</ThemedText>
                <ThemedText style={{ marginBottom: 8 }}>Lote: {selectedMed.batch} | Fabricante: {selectedMed.manufacturer}</ThemedText>
                <ThemedText style={{ marginBottom: 8 }}>Vence: {selectedMed.expiryDate}</ThemedText>
                <ThemedText style={{ fontWeight: 'bold', marginBottom: 8 }}>Eventos de Trazabilidad:</ThemedText>
                <ScrollView style={{ maxHeight: 200 }}>
                  {selectedMed.trackingEvents.map((event, idx) => (
                    <View key={idx} style={{ marginBottom: 10 }}>
                      <ThemedText style={{ fontWeight: 'bold' }}>{event.event}</ThemedText>
                      <ThemedText>📍 {event.location}</ThemedText>
                      <ThemedText>👤 {event.actor}</ThemedText>
                      <ThemedText>⏰ {event.timestamp}</ThemedText>
                    </View>
                  ))}
                </ScrollView>
              </>
            )}
            <Pressable
              style={{ marginTop: 16, alignSelf: 'center', backgroundColor: themeColors.tint, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10 }}
              onPress={() => setModalVisible(false)}
            >
              <ThemedText style={{ color: 'white', fontWeight: 'bold' }}>Cerrar</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 8,
  },
  searchSection: {
    padding: 20,
    paddingTop: 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultsSection: {
    padding: 20,
    paddingTop: 0,
  },
  resultsCount: {
    marginBottom: 16,
    opacity: 0.7,
  },
  medicationCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  medicationName: {
    marginLeft: 8,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardContent: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
  },
  trackingSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12,
  },
  trackingTitle: {
    marginBottom: 8,
    fontSize: 14,
  },
  trackingEvent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  eventDetails: {
    marginLeft: 8,
    flex: 1,
  },
  eventText: {
    fontSize: 12,
    lineHeight: 16,
  },
  eventTime: {
    fontSize: 10,
    opacity: 0.6,
    lineHeight: 12,
  },
});
