import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MedicationData {
  gtin: string;
  batch: string;
  serialNumber: string;
  expiryDate: string;
  manufacturer: string;
  productName: string;
  location?: string;
  timestamp?: string;
  id?: string;
  transactionHash?: string;
  status?: string;
  commissionTime?: string;
  recallReason?: string;
}

export interface TrackingEvent {
  event: 'commission' | 'ship' | 'receive' | 'dispense' | 'recall';
  location: string;
  timestamp: string;
  actor: string;
  medicationId: string;
  signature?: string;
}

export interface VerificationResult {
  isValid: boolean;
  medicationData?: MedicationData;
  trackingHistory: TrackingEvent[];
  currentHolder?: string;
  blockchainHash?: string;
}

class StellarMediTrackService {
  private networkEndpoint: string;
  private isInitialized: boolean = false;

  constructor() {
    // Use Stellar testnet for development
    this.networkEndpoint = 'https://horizon-testnet.stellar.org';
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    try {
      // In a real implementation, this would set up Stellar SDK connection
      // For now, we'll simulate the initialization
      this.isInitialized = true;
      console.log('Stellar MediTrack service initialized');
    } catch (error) {
      console.error('Failed to initialize Stellar service:', error);
      throw error;
    }
  }

  /**
   * Create a unique medication identifier hash
   */
  private createMedicationHash(data: MedicationData): string {
    const hashInput = `${data.gtin}-${data.batch}-${data.serialNumber}`;
    // Simple hash implementation for demo
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 12);
  }

  /**
   * Simulate blockchain transaction
   */
  private async submitToBlockchain(data: any): Promise<string> {
    // Simulate network delay (removed for instant demo)
    // await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Generate a fake transaction hash
    const hash = Math.random().toString(36).substring(2, 15) + 
                 Math.random().toString(36).substring(2, 15);
    
    // Store in local storage for demo purposes
    const storageKey = `blockchain_${hash}`;
    await AsyncStorage.setItem(storageKey, JSON.stringify({
      ...data,
      hash,
      timestamp: new Date().toISOString()
    }));
    
    return hash;
  }

  /**
   * Commission a new medication on the blockchain
   */
  async commissionMedication(medicationData: MedicationData): Promise<string> {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      const medicationId = this.createMedicationHash(medicationData);
      
      const blockchainData = {
        type: 'commission',
        medicationId,
        medicationData: {
          ...medicationData,
          commissionTime: new Date().toISOString(),
          status: 'commissioned'
        }
      };
      
      const transactionHash = await this.submitToBlockchain(blockchainData);
      console.log('Medication commissioned successfully:', transactionHash);
      
      // Store medication data
      await AsyncStorage.setItem(`med_${medicationId}`, JSON.stringify({
        ...medicationData,
        id: medicationId,
        transactionHash,
        status: 'commissioned',
        commissionTime: new Date().toISOString()
      }));
      
      return medicationId;
    } catch (error) {
      console.error('Failed to commission medication:', error);
      throw error;
    }
  }

  /**
   * Add tracking event for medication
   */
  async addTrackingEvent(
    medicationId: string, 
    event: TrackingEvent
  ): Promise<string> {
    try {
      if (!this.isInitialized) {
        throw new Error('Service not initialized');
      }

      const blockchainData = {
        type: 'tracking_event',
        medicationId,
        event: {
          ...event,
          timestamp: new Date().toISOString()
        }
      };
      
      const transactionHash = await this.submitToBlockchain(blockchainData);
      
      // Store tracking event
      const eventsKey = `events_${medicationId}`;
      const existingEvents = await AsyncStorage.getItem(eventsKey);
      const events = existingEvents ? JSON.parse(existingEvents) : [];
      
      events.push({
        ...event,
        timestamp: new Date().toISOString(),
        transactionHash
      });
      
      await AsyncStorage.setItem(eventsKey, JSON.stringify(events));
      
      console.log(`Tracking event ${event.event} added successfully:`, transactionHash);
      return transactionHash;
    } catch (error) {
      console.error('Failed to add tracking event:', error);
      throw error;
    }
  }

  /**
   * Verify medication authenticity and get tracking history
   */
  async verifyMedication(medicationId: string): Promise<VerificationResult> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Get medication data
      const medicationDataStr = await AsyncStorage.getItem(`med_${medicationId}`);
      if (!medicationDataStr) {
        return {
          isValid: false,
          trackingHistory: [],
        };
      }

      const medicationData = JSON.parse(medicationDataStr);
      
      // Get tracking events
      const eventsKey = `events_${medicationId}`;
      const eventsStr = await AsyncStorage.getItem(eventsKey);
      const trackingHistory: TrackingEvent[] = eventsStr ? JSON.parse(eventsStr) : [];

      // Check for recalls
      const hasRecall = trackingHistory.some(event => event.event === 'recall');
      
      return {
        isValid: !hasRecall && medicationData.status !== 'recalled',
        medicationData,
        trackingHistory: trackingHistory.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ),
        currentHolder: trackingHistory.length > 0 ? 
          trackingHistory[trackingHistory.length - 1].actor : 
          medicationData.manufacturer,
        blockchainHash: medicationData.transactionHash,
      };
    } catch (error) {
      console.error('Failed to verify medication:', error);
      return {
        isValid: false,
        trackingHistory: [],
      };
    }
  }

  /**
   * Issue a recall for a medication
   */
  async issueMedicationRecall(
    medicationId: string, 
    reason: string,
    issuer: string = 'DIGEMID'
  ): Promise<string> {
    try {
      const recallEvent: TrackingEvent = {
        event: 'recall',
        location: 'Sistema Central',
        timestamp: new Date().toISOString(),
        actor: issuer,
        medicationId,
      };

      const transactionHash = await this.addTrackingEvent(medicationId, recallEvent);
      
      // Update medication status
      const medicationDataStr = await AsyncStorage.getItem(`med_${medicationId}`);
      if (medicationDataStr) {
        const medicationData = JSON.parse(medicationDataStr);
        medicationData.status = 'recalled';
        medicationData.recallReason = reason;
        await AsyncStorage.setItem(`med_${medicationId}`, JSON.stringify(medicationData));
      }
      
      console.log('Medication recall issued:', transactionHash);
      return transactionHash;
    } catch (error) {
      console.error('Failed to issue recall:', error);
      throw error;
    }
  }

  /**
   * Search medications by various criteria
   */
  async searchMedications(query: string): Promise<MedicationData[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const medicationKeys = keys.filter(key => key.startsWith('med_'));
      
      const medications: MedicationData[] = [];
      
      for (const key of medicationKeys) {
        const dataStr = await AsyncStorage.getItem(key);
        if (dataStr) {
          const medication = JSON.parse(dataStr);
          
          // Simple search implementation
          const searchTerms = query.toLowerCase().split(' ');
          const searchableText = `${medication.productName} ${medication.manufacturer} ${medication.batch} ${medication.gtin}`.toLowerCase();
          
          const matches = searchTerms.every(term => searchableText.includes(term));
          
          if (matches) {
            medications.push(medication);
          }
        }
      }
      
      return medications.sort((a, b) => 
        new Date(b.commissionTime || 0).getTime() - new Date(a.commissionTime || 0).getTime()
      );
    } catch (error) {
      console.error('Failed to search medications:', error);
      return [];
    }
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats(): Promise<{
    totalVerifications: number;
    authenticMedications: number;
    alertsActive: number;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const medicationKeys = keys.filter(key => key.startsWith('med_'));
      
      let totalVerifications = 0;
      let authenticMedications = 0;
      let alertsActive = 0;
      
      for (const key of medicationKeys) {
        const dataStr = await AsyncStorage.getItem(key);
        if (dataStr) {
          const medication = JSON.parse(dataStr);
          totalVerifications++;
          
          if (medication.status === 'commissioned') {
            authenticMedications++;
          } else if (medication.status === 'recalled') {
            alertsActive++;
          }
        }
      }
      
      return {
        totalVerifications,
        authenticMedications,
        alertsActive
      };
    } catch (error) {
      console.error('Failed to get verification stats:', error);
      return {
        totalVerifications: 0,
        authenticMedications: 0,
        alertsActive: 0
      };
    }
  }
}

export const stellarMediTrack = new StellarMediTrackService();
