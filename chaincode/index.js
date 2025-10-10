'use strict';

const { Contract } = require('fabric-contract-api');

/**
 * Drug Traceability Chaincode
 * Migrated from Stellar Smart Contract to Hyperledger Fabric
 * Compatible with Huawei BCS (Blockchain Service)
 */
class DrugTraceabilityContract extends Contract {

    constructor() {
        super('DrugTraceabilityContract');
    }

    /**
     * Initialize the chaincode
     */
    async Init(ctx) {
        console.log('Drug Traceability Chaincode initialized');
        return JSON.stringify({ success: true, message: 'Chaincode initialized successfully' });
    }

    /**
     * Commission a new medication on the blockchain
     * Equivalent to commission_medication in Stellar contract
     */
    async CommissionMedication(ctx, gtin, batch, serialNumber, expiryDate, manufacturer, productName, location) {
        try {
            // Validate input parameters
            if (!gtin || !batch || !serialNumber || !expiryDate || !manufacturer || !productName || !location) {
                throw new Error('All parameters are required');
            }

            // Create unique medication identifier hash
            const medicationId = this.createMedicationHash(gtin, batch, serialNumber);
            
            // Check if medication already exists
            const existingMedication = await ctx.stub.getState(medicationId);
            if (existingMedication && existingMedication.length > 0) {
                throw new Error(`Medication with ID ${medicationId} already exists`);
            }

            // Create medication data object
            const medicationData = {
                id: medicationId,
                gtin: gtin,
                batch: batch,
                serialNumber: serialNumber,
                expiryDate: expiryDate,
                manufacturer: manufacturer,
                productName: productName,
                location: location,
                timestamp: new Date().toISOString(),
                transactionHash: ctx.stub.getTxID(),
                status: 'commissioned',
                commissionTime: new Date().toISOString(),
                recallReason: ''
            };

            // Store medication data
            await ctx.stub.putState(medicationId, Buffer.from(JSON.stringify(medicationData)));

            // Create initial tracking event
            const initialEvent = {
                event: 'commission',
                location: location,
                timestamp: new Date().toISOString(),
                actor: manufacturer,
                medicationId: medicationId,
                signature: '',
                transactionHash: ctx.stub.getTxID()
            };

            // Store tracking event
            await this.addTrackingEventInternal(ctx, medicationId, initialEvent);

            // Emit event
            ctx.stub.setEvent('MedicationCommissioned', Buffer.from(JSON.stringify({
                medicationId: medicationId,
                productName: productName,
                manufacturer: manufacturer,
                timestamp: new Date().toISOString()
            })));

            console.log(`Medication commissioned: ${medicationId}`);
            return JSON.stringify({ success: true, medicationId: medicationId });

        } catch (error) {
            console.error('Error commissioning medication:', error);
            throw new Error(`Failed to commission medication: ${error.message}`);
        }
    }

    /**
     * Add tracking event for medication
     * Equivalent to add_tracking_event in Stellar contract
     */
    async AddTrackingEvent(ctx, medicationId, event, location, actor, signature) {
        try {
            // Validate input parameters
            if (!medicationId || !event || !location || !actor) {
                throw new Error('medicationId, event, location, and actor are required');
            }

            // Check if medication exists
            const medicationBytes = await ctx.stub.getState(medicationId);
            if (!medicationBytes || medicationBytes.length === 0) {
                throw new Error(`Medication with ID ${medicationId} not found`);
            }

            // Create tracking event
            const trackingEvent = {
                event: event,
                location: location,
                timestamp: new Date().toISOString(),
                actor: actor,
                medicationId: medicationId,
                signature: signature || '',
                transactionHash: ctx.stub.getTxID()
            };

            // Add tracking event
            await this.addTrackingEventInternal(ctx, medicationId, trackingEvent);

            // Update medication location
            const medication = JSON.parse(medicationBytes.toString());
            medication.location = location;
            await ctx.stub.putState(medicationId, Buffer.from(JSON.stringify(medication)));

            // Emit event
            ctx.stub.setEvent('TrackingEventAdded', Buffer.from(JSON.stringify({
                medicationId: medicationId,
                event: event,
                location: location,
                actor: actor,
                timestamp: new Date().toISOString()
            })));

            console.log(`Tracking event added for medication: ${medicationId}`);
            return JSON.stringify({ success: true, message: 'Tracking event added successfully' });

        } catch (error) {
            console.error('Error adding tracking event:', error);
            throw new Error(`Failed to add tracking event: ${error.message}`);
        }
    }

    /**
     * Verify medication authenticity and get tracking history
     * Equivalent to verify_medication in Stellar contract
     */
    async VerifyMedication(ctx, medicationId) {
        try {
            // Get medication data
            const medicationBytes = await ctx.stub.getState(medicationId);
            if (!medicationBytes || medicationBytes.length === 0) {
                return JSON.stringify({
                    isValid: false,
                    medicationData: null,
                    trackingHistory: [],
                    currentHolder: null,
                    blockchainHash: null
                });
            }

            const medicationData = JSON.parse(medicationBytes.toString());
            
            // Get tracking history
            const trackingHistory = await this.getTrackingHistoryInternal(ctx, medicationId);
            
            // Check for recalls
            const hasRecall = trackingHistory.some(event => event.event === 'recall');
            const isValid = !hasRecall && medicationData.status === 'commissioned';

            // Get current holder from last event
            let currentHolder = medicationData.manufacturer;
            if (trackingHistory.length > 0) {
                currentHolder = trackingHistory[trackingHistory.length - 1].actor;
            }

            const verificationResult = {
                isValid: isValid,
                medicationData: medicationData,
                trackingHistory: trackingHistory,
                currentHolder: currentHolder,
                blockchainHash: medicationData.transactionHash
            };

            console.log(`Medication verification completed: ${medicationId}, Valid: ${isValid}`);
            return JSON.stringify(verificationResult);

        } catch (error) {
            console.error('Error verifying medication:', error);
            throw new Error(`Failed to verify medication: ${error.message}`);
        }
    }

    /**
     * Issue a recall for a medication
     * Equivalent to issue_medication_recall in Stellar contract
     */
    async IssueMedicationRecall(ctx, medicationId, reason, issuer) {
        try {
            // Validate input parameters
            if (!medicationId || !reason) {
                throw new Error('medicationId and reason are required');
            }

            const issuerName = issuer || 'DIGEMID';

            // Check if medication exists
            const medicationBytes = await ctx.stub.getState(medicationId);
            if (!medicationBytes || medicationBytes.length === 0) {
                throw new Error(`Medication with ID ${medicationId} not found`);
            }

            // Create recall event
            const recallEvent = {
                event: 'recall',
                location: 'Sistema Central',
                timestamp: new Date().toISOString(),
                actor: issuerName,
                medicationId: medicationId,
                signature: '',
                transactionHash: ctx.stub.getTxID()
            };

            // Add recall event
            await this.addTrackingEventInternal(ctx, medicationId, recallEvent);

            // Update medication status
            const medication = JSON.parse(medicationBytes.toString());
            medication.status = 'recalled';
            medication.recallReason = reason;
            await ctx.stub.putState(medicationId, Buffer.from(JSON.stringify(medication)));

            // Emit event
            ctx.stub.setEvent('MedicationRecalled', Buffer.from(JSON.stringify({
                medicationId: medicationId,
                reason: reason,
                issuer: issuerName,
                timestamp: new Date().toISOString()
            })));

            console.log(`Medication recall issued: ${medicationId}`);
            return JSON.stringify({ success: true, message: 'Medication recall issued successfully' });

        } catch (error) {
            console.error('Error issuing medication recall:', error);
            throw new Error(`Failed to issue medication recall: ${error.message}`);
        }
    }

    /**
     * Get medication by ID
     * Equivalent to get_medication in Stellar contract
     */
    async GetMedication(ctx, medicationId) {
        try {
            const medicationBytes = await ctx.stub.getState(medicationId);
            if (!medicationBytes || medicationBytes.length === 0) {
                throw new Error(`Medication with ID ${medicationId} not found`);
            }

            const medication = JSON.parse(medicationBytes.toString());
            return JSON.stringify(medication);

        } catch (error) {
            console.error('Error getting medication:', error);
            throw new Error(`Failed to get medication: ${error.message}`);
        }
    }

    /**
     * Get tracking history for medication
     * Equivalent to get_tracking_history in Stellar contract
     */
    async GetTrackingHistory(ctx, medicationId) {
        try {
            const trackingHistory = await this.getTrackingHistoryInternal(ctx, medicationId);
            return JSON.stringify(trackingHistory);

        } catch (error) {
            console.error('Error getting tracking history:', error);
            throw new Error(`Failed to get tracking history: ${error.message}`);
        }
    }

    /**
     * Get all medications by manufacturer
     * Equivalent to get_medications_by_manufacturer in Stellar contract
     */
    async GetMedicationsByManufacturer(ctx, manufacturer) {
        try {
            const queryString = {
                selector: {
                    manufacturer: manufacturer
                }
            };

            const queryResults = await ctx.stub.getQueryResult(JSON.stringify(queryString));
            const medications = [];

            while (true) {
                const res = await queryResults.next();
                if (res.value && res.value.value.toString()) {
                    const medication = JSON.parse(res.value.value.toString());
                    medications.push(medication);
                }
                if (res.done) {
                    await queryResults.close();
                    break;
                }
            }

            return JSON.stringify(medications);

        } catch (error) {
            console.error('Error getting medications by manufacturer:', error);
            throw new Error(`Failed to get medications by manufacturer: ${error.message}`);
        }
    }

    /**
     * Get verification statistics
     * Equivalent to get_verification_stats in Stellar contract
     */
    async GetVerificationStats(ctx) {
        try {
            const queryString = {
                selector: {
                    id: { $exists: true }
                }
            };

            const queryResults = await ctx.stub.getQueryResult(JSON.stringify(queryString));
            let totalVerifications = 0;
            let authenticMedications = 0;
            let alertsActive = 0;

            while (true) {
                const res = await queryResults.next();
                if (res.value && res.value.value.toString()) {
                    const medication = JSON.parse(res.value.value.toString());
                    totalVerifications++;
                    
                    if (medication.status === 'commissioned') {
                        authenticMedications++;
                    } else if (medication.status === 'recalled') {
                        alertsActive++;
                    }
                }
                if (res.done) {
                    await queryResults.close();
                    break;
                }
            }

            const stats = {
                total: totalVerifications,
                auth: authenticMedications,
                alerts: alertsActive
            };

            return JSON.stringify(stats);

        } catch (error) {
            console.error('Error getting verification stats:', error);
            throw new Error(`Failed to get verification stats: ${error.message}`);
        }
    }

    /**
     * Search medications by various criteria
     * Equivalent to search_medications in Stellar contract
     */
    async SearchMedications(ctx, query) {
        try {
            const queryString = {
                selector: {
                    $or: [
                        { productName: { $regex: query, $options: 'i' } },
                        { manufacturer: { $regex: query, $options: 'i' } },
                        { batch: { $regex: query, $options: 'i' } },
                        { gtin: { $regex: query, $options: 'i' } }
                    ]
                }
            };

            const queryResults = await ctx.stub.getQueryResult(JSON.stringify(queryString));
            const medications = [];

            while (true) {
                const res = await queryResults.next();
                if (res.value && res.value.value.toString()) {
                    const medication = JSON.parse(res.value.value.toString());
                    medications.push(medication);
                }
                if (res.done) {
                    await queryResults.close();
                    break;
                }
            }

            return JSON.stringify(medications);

        } catch (error) {
            console.error('Error searching medications:', error);
            throw new Error(`Failed to search medications: ${error.message}`);
        }
    }

    // Helper functions

    /**
     * Create medication hash
     * Equivalent to create_medication_hash in Stellar contract
     */
    createMedicationHash(gtin, batch, serialNumber) {
        const hashInput = `${gtin}-${batch}-${serialNumber}`;
        // Simple hash implementation - in production, use crypto.createHash('sha256')
        let hash = 0;
        for (let i = 0; i < hashInput.length; i++) {
            const char = hashInput.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16).substring(0, 12);
    }

    /**
     * Add tracking event internally
     * Equivalent to add_tracking_event_internal in Stellar contract
     */
    async addTrackingEventInternal(ctx, medicationId, event) {
        const eventsKey = `events_${medicationId}`;
        const existingEventsBytes = await ctx.stub.getState(eventsKey);
        
        let events = [];
        if (existingEventsBytes && existingEventsBytes.length > 0) {
            events = JSON.parse(existingEventsBytes.toString());
        }
        
        events.push(event);
        await ctx.stub.putState(eventsKey, Buffer.from(JSON.stringify(events)));
    }

    /**
     * Get tracking history internally
     * Equivalent to get_tracking_history_internal in Stellar contract
     */
    async getTrackingHistoryInternal(ctx, medicationId) {
        const eventsKey = `events_${medicationId}`;
        const eventsBytes = await ctx.stub.getState(eventsKey);
        
        if (!eventsBytes || eventsBytes.length === 0) {
            return [];
        }
        
        return JSON.parse(eventsBytes.toString());
    }
}

module.exports = DrugTraceabilityContract;
