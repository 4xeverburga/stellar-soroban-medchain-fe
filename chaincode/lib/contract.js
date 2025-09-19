'use strict';

/**
 * Contract Interface for Drug Traceability
 * This file defines the contract interface that matches the Stellar contract functions
 */

class DrugTraceabilityInterface {
    
    /**
     * Commission a new medication on the blockchain
     * @param {Context} ctx - Transaction context
     * @param {string} gtin - Global Trade Item Number
     * @param {string} batch - Batch number
     * @param {string} serialNumber - Serial number
     * @param {string} expiryDate - Expiry date
     * @param {string} manufacturer - Manufacturer name
     * @param {string} productName - Product name
     * @param {string} location - Current location
     * @returns {Promise<string>} Medication ID
     */
    async commissionMedication(ctx, gtin, batch, serialNumber, expiryDate, manufacturer, productName, location) {
        throw new Error('Method must be implemented by contract');
    }

    /**
     * Add tracking event for medication
     * @param {Context} ctx - Transaction context
     * @param {string} medicationId - Medication ID
     * @param {string} event - Event type (commission, ship, receive, dispense, recall)
     * @param {string} location - Location of the event
     * @param {string} actor - Entity responsible for the event
     * @param {string} signature - Digital signature (optional)
     * @returns {Promise<string>} Success message
     */
    async addTrackingEvent(ctx, medicationId, event, location, actor, signature) {
        throw new Error('Method must be implemented by contract');
    }

    /**
     * Verify medication authenticity and get tracking history
     * @param {Context} ctx - Transaction context
     * @param {string} medicationId - Medication ID
     * @returns {Promise<Object>} Verification result with medication data and tracking history
     */
    async verifyMedication(ctx, medicationId) {
        throw new Error('Method must be implemented by contract');
    }

    /**
     * Issue a recall for a medication
     * @param {Context} ctx - Transaction context
     * @param {string} medicationId - Medication ID
     * @param {string} reason - Reason for recall
     * @param {string} issuer - Issuer of the recall (default: DIGEMID)
     * @returns {Promise<string>} Success message
     */
    async issueMedicationRecall(ctx, medicationId, reason, issuer) {
        throw new Error('Method must be implemented by contract');
    }

    /**
     * Get medication by ID
     * @param {Context} ctx - Transaction context
     * @param {string} medicationId - Medication ID
     * @returns {Promise<Object>} Medication data
     */
    async getMedication(ctx, medicationId) {
        throw new Error('Method must be implemented by contract');
    }

    /**
     * Get tracking history for medication
     * @param {Context} ctx - Transaction context
     * @param {string} medicationId - Medication ID
     * @returns {Promise<Array>} Array of tracking events
     */
    async getTrackingHistory(ctx, medicationId) {
        throw new Error('Method must be implemented by contract');
    }

    /**
     * Get all medications by manufacturer
     * @param {Context} ctx - Transaction context
     * @param {string} manufacturer - Manufacturer name
     * @returns {Promise<Array>} Array of medications
     */
    async getMedicationsByManufacturer(ctx, manufacturer) {
        throw new Error('Method must be implemented by contract');
    }

    /**
     * Get verification statistics
     * @param {Context} ctx - Transaction context
     * @returns {Promise<Object>} Statistics object
     */
    async getVerificationStats(ctx) {
        throw new Error('Method must be implemented by contract');
    }

    /**
     * Search medications by various criteria
     * @param {Context} ctx - Transaction context
     * @param {string} query - Search query
     * @returns {Promise<Array>} Array of matching medications
     */
    async searchMedications(ctx, query) {
        throw new Error('Method must be implemented by contract');
    }
}

module.exports = DrugTraceabilityInterface;
