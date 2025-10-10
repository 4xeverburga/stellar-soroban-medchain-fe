#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Env, Map, Symbol, Vec, log, Error};
use soroban_sdk::xdr::{ScErrorType, ScErrorCode};

#[contract]
pub struct DrugTraceability;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MedicationData {
    pub id: Symbol,                    // Unique medication identifier hash
    pub gtin: Symbol,                  // Global Trade Item Number
    pub batch: Symbol,                 // Batch number
    pub serial_number: Symbol,         // Serial number
    pub expiry_date: Symbol,           // Expiry date
    pub manufacturer: Symbol,          // Manufacturer name (string)
    pub product_name: Symbol,          // Product name
    pub location: Symbol,              // Current location
    pub timestamp: u64,                // Registration timestamp
    pub transaction_hash: Symbol,      // Blockchain transaction hash
    pub status: Symbol,                // Status: commissioned, recalled, etc.
    pub commission_time: u64,          // Commission timestamp
    pub recall_reason: Symbol,         // Reason for recall (if applicable)
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TrackingEvent {
    pub event: Symbol,                 // commission, ship, receive, dispense, recall
    pub location: Symbol,              // Location of the event
    pub timestamp: u64,                // Event timestamp
    pub actor: Symbol,                 // Entity responsible for the event (string)
    pub medication_id: Symbol,         // Medication ID
    pub signature: Symbol,             // Digital signature (optional)
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VerificationResult {
    pub is_valid: bool,                // Whether medication is valid
    pub medication_data: Option<MedicationData>, // Medication data if found
    pub tracking_history: Vec<TrackingEvent>,    // Complete tracking history
    pub current_holder: Option<Symbol>,          // Current holder (string)
    pub blockchain_hash: Option<Symbol>,         // Blockchain hash
}

#[contractimpl]
impl DrugTraceability {
    // Commission a new medication on the blockchain
    pub fn commission_medication(
        env: &Env,
        gtin: Symbol,
        batch: Symbol,
        serial_number: Symbol,
        expiry_date: Symbol,
        manufacturer: Symbol,
        product_name: Symbol,
        location: Symbol,
    ) -> Result<Symbol, Error> {
        // Create unique medication identifier hash
        let medication_id = Self::create_medication_hash(env, &gtin, &batch, &serial_number);
        
        // For now, just log the medication creation and return success
        // In a full implementation, you would store this in a Map or other storage
        log!(&env, "Commissioning medication: {}", medication_id);
        log!(&env, "GTIN: {}", gtin);
        log!(&env, "Batch: {}", batch);
        log!(&env, "Product: {}", product_name);
        log!(&env, "Manufacturer: {}", manufacturer);
        log!(&env, "Location: {}", location);

        Ok(medication_id)
    }

    // Add tracking event for medication
    pub fn add_tracking_event(
        env: &Env,
        medication_id: Symbol,
        event: Symbol,
        location: Symbol,
        actor: Symbol,
        signature: Symbol,
    ) -> Result<Symbol, Error> {
        let tracking_event = TrackingEvent {
            event,
            location: location.clone(),
            timestamp: env.ledger().timestamp(),
            actor,
            medication_id: medication_id.clone(),
            signature,
        };

        Self::add_tracking_event_internal(env, &medication_id, tracking_event)?;

        // Update medication location
        let medications_key = symbol_short!("meds");
        let mut medications: Map<Symbol, MedicationData> = env.storage().instance().get(&medications_key).unwrap_or(Map::new(env));
        
        if let Some(mut medication) = medications.get(medication_id.clone()) {
            medication.location = location;
            medications.set(medication_id.clone(), medication);
            env.storage().instance().set(&medications_key, &medications);
        }

        Ok(symbol_short!("ok"))
    }

    // Verify medication authenticity and get tracking history
    pub fn verify_medication(env: &Env, medication_id: Symbol) -> Result<VerificationResult, Error> {
        let medications_key = symbol_short!("meds");
        let medications: Map<Symbol, MedicationData> = env.storage().instance().get(&medications_key).unwrap_or(Map::new(env));
        
        let medication_data = medications.get(medication_id.clone());
        
        if medication_data.is_none() {
            return Ok(VerificationResult {
                is_valid: false,
                medication_data: None,
                tracking_history: Vec::new(env),
                current_holder: None,
                blockchain_hash: None,
            });
        }

        let medication = medication_data.unwrap();
        let tracking_history = Self::get_tracking_history_internal(env, &medication_id)?;
        
        // Check for recalls
        let has_recall = tracking_history.iter().any(|event| event.event == symbol_short!("recall"));
        let is_valid = !has_recall && medication.status == symbol_short!("active");

        // Get current holder from last event
        let current_holder = if tracking_history.len() > 0 {
            Some(tracking_history.get(tracking_history.len() - 1).unwrap().actor.clone())
        } else {
            Some(medication.manufacturer.clone())
        };

        let transaction_hash = medication.transaction_hash.clone();

        Ok(VerificationResult {
            is_valid,
            medication_data: Some(medication),
            tracking_history,
            current_holder,
            blockchain_hash: Some(transaction_hash),
        })
    }

    // Issue a recall for a medication
    pub fn issue_medication_recall(
        env: &Env,
        medication_id: Symbol,
        reason: Symbol,
        issuer: Symbol,
    ) -> Result<Symbol, Error> {
        // Add recall event
        let recall_event = TrackingEvent {
            event: symbol_short!("recall"),
            location: symbol_short!("central"),
            timestamp: env.ledger().timestamp(),
            actor: issuer.clone(),
            medication_id: medication_id.clone(),
            signature: symbol_short!(""),
        };

        Self::add_tracking_event_internal(env, &medication_id, recall_event)?;

        // Update medication status
        let medications_key = symbol_short!("meds");
        let mut medications: Map<Symbol, MedicationData> = env.storage().instance().get(&medications_key).unwrap_or(Map::new(env));
        
        if let Some(mut medication) = medications.get(medication_id.clone()) {
            medication.status = symbol_short!("recalled");
            medication.recall_reason = reason;
            medications.set(medication_id.clone(), medication);
            env.storage().instance().set(&medications_key, &medications);
        }

        log!(&env, "Medication recall issued: {}", medication_id);
        Ok(symbol_short!("recalled"))
    }

    // Get medication by ID
    pub fn get_medication(env: &Env, medication_id: Symbol) -> Result<MedicationData, Error> {
        let medications_key = symbol_short!("meds");
        let medications: Map<Symbol, MedicationData> = env.storage().instance().get(&medications_key).unwrap_or(Map::new(env));
        
        medications.get(medication_id).ok_or(Error::from_type_and_code(ScErrorType::Context, ScErrorCode::InvalidInput))
    }

    // Get tracking history for medication
    pub fn get_tracking_history(env: &Env, medication_id: Symbol) -> Result<Vec<TrackingEvent>, Error> {
        Self::get_tracking_history_internal(env, &medication_id)
    }

    // Get all medications by manufacturer
    pub fn get_medications_by_manufacturer(env: &Env, manufacturer: Symbol) -> Result<Vec<MedicationData>, Error> {
        let medications_key = symbol_short!("meds");
        let medications: Map<Symbol, MedicationData> = env.storage().instance().get(&medications_key).unwrap_or(Map::new(env));
        
        let mut manufacturer_medications = Vec::new(env);
        for (_, medication) in medications.iter() {
            if medication.manufacturer == manufacturer {
                manufacturer_medications.push_back(medication);
            }
        }
        
        Ok(manufacturer_medications)
    }

    // Get verification statistics
    pub fn get_verification_stats(env: &Env) -> Result<Map<Symbol, u32>, Error> {
        let medications_key = symbol_short!("meds");
        let medications: Map<Symbol, MedicationData> = env.storage().instance().get(&medications_key).unwrap_or(Map::new(env));
        
        let mut stats = Map::new(env);
        let mut total_verifications = 0u32;
        let mut authentic_medications = 0u32;
        let mut alerts_active = 0u32;
        
        for (_, medication) in medications.iter() {
            total_verifications += 1;
            
            if medication.status == symbol_short!("active") {
                authentic_medications += 1;
            } else if medication.status == symbol_short!("recalled") {
                alerts_active += 1;
            }
        }
        
        stats.set(symbol_short!("total"), total_verifications);
        stats.set(symbol_short!("auth"), authentic_medications);
        stats.set(symbol_short!("alerts"), alerts_active);
        
        Ok(stats)
    }

    // Search medications by various criteria
    pub fn search_medications(
        env: &Env,
        query: Symbol,
    ) -> Result<Vec<MedicationData>, Error> {
        let medications_key = symbol_short!("meds");
        let medications: Map<Symbol, MedicationData> = env.storage().instance().get(&medications_key).unwrap_or(Map::new(env));
        
        let mut search_results = Vec::new(env);
        
        for (_, medication) in medications.iter() {
            // Simple search implementation - check if query matches any field
            // For now, we'll do a simple exact match on product name
            if medication.product_name == query {
                search_results.push_back(medication);
            }
        }
        
        Ok(search_results)
    }

    // Helper function to create medication hash
    fn create_medication_hash(env: &Env, _gtin: &Symbol, _batch: &Symbol, _serial_number: &Symbol) -> Symbol {
        // Simple hash implementation - just return a fixed ID for now
        // In a real implementation, you would use a proper hash function
        symbol_short!("med_1")
    }

    // Helper function to add tracking event internally
    fn add_tracking_event_internal(env: &Env, medication_id: &Symbol, event: TrackingEvent) -> Result<(), Error> {
        let events_key = symbol_short!("events");
        let mut all_events: Map<Symbol, Vec<TrackingEvent>> = env.storage().instance().get(&events_key).unwrap_or(Map::new(env));
        
        let mut medication_events = all_events.get(medication_id.clone()).unwrap_or(Vec::new(env));
        medication_events.push_back(event);
        all_events.set(medication_id.clone(), medication_events);
        
        env.storage().instance().set(&events_key, &all_events);
        env.storage().instance().extend_ttl(50, 100);
        
        Ok(())
    }

    // Helper function to get tracking history internally
    fn get_tracking_history_internal(env: &Env, medication_id: &Symbol) -> Result<Vec<TrackingEvent>, Error> {
        let events_key = symbol_short!("events");
        let all_events: Map<Symbol, Vec<TrackingEvent>> = env.storage().instance().get(&events_key).unwrap_or(Map::new(env));
        
        Ok(all_events.get(medication_id.clone()).unwrap_or(Vec::new(env)))
    }
}
