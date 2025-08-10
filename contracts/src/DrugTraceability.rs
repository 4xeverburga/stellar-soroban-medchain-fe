#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Map, Symbol, Vec, log, Error};
use soroban_sdk::xdr::{ScErrorType, ScErrorCode};

#[contract]
pub struct DrugTraceability;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Drug {
    pub id: Symbol,
    pub name: Symbol,
    pub batch: Symbol,
    pub manufacturer: Address,
    pub manufacture_date: Symbol,
    pub expiry_date: Symbol,
    pub current_owner: Address,
    pub status: Symbol,
    pub created_at: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Transaction {
    pub id: Symbol,
    pub drug_id: Symbol,
    pub from: Address,
    pub to: Address,
    pub transaction_type: Symbol,
    pub timestamp: u64,
    pub metadata: Map<Symbol, Symbol>,
}

#[contractimpl]
impl DrugTraceability {
    // Register a new drug
    pub fn register_drug(
        env: &Env,
        id: Symbol,
        name: Symbol,
        batch: Symbol,
        manufacture_date: Symbol,
        expiry_date: Symbol,
        manufacturer: Address,
    ) -> Result<(), Error> {
        // Check if drug already exists
        let drugs_key = symbol_short!("drugs");
        let mut drugs: Map<Symbol, Drug> = env.storage().instance().get(&drugs_key).unwrap_or(Map::new(env));
        
        if drugs.contains_key(id.clone()) {
            return Err(Error::from_type_and_code(ScErrorType::Context, ScErrorCode::InvalidInput));
        }

        // Create new drug
        let drug = Drug {
            id: id.clone(),
            name,
            batch,
            manufacturer: manufacturer.clone(),
            manufacture_date,
            expiry_date,
            current_owner: manufacturer.clone(),
            status: symbol_short!("active"),
            created_at: env.ledger().timestamp(),
        };
        
        let id_for_log = id.clone();
        log!(&env, "Registering drug: {}", id_for_log);

        // Store drug
        drugs.set(id.clone(), drug);
        env.storage().instance().set(&drugs_key, &drugs);
        env.storage().instance().extend_ttl(50, 100);

        // Create initial transaction
        let transactions_key = Symbol::new(&env, "transactions");
        let mut transactions: Map<Symbol, Vec<Transaction>> = env.storage().instance().get(&transactions_key).unwrap_or(Map::new(env));
        
        let id_for_tx = id.clone();
        let mut drug_transactions = transactions.get(id_for_tx.clone()).unwrap_or(Vec::new(env));
        let initial_tx = Transaction {
            id: symbol_short!("init"),
            drug_id: id_for_tx.clone(),
            from: manufacturer.clone(),
            to: manufacturer,
            transaction_type: symbol_short!("creation"),
            timestamp: env.ledger().timestamp(),
            metadata: Map::new(env),
        };
        
        drug_transactions.push_back(initial_tx);
        transactions.set(id_for_tx, drug_transactions);
        env.storage().instance().set(&transactions_key, &transactions);
        env.storage().instance().extend_ttl(50, 100);

        Ok(())
    }

    // Transfer drug ownership
    pub fn transfer_drug(
        env: &Env,
        drug_id: Symbol,
        from: Address,
        to: Address,
        metadata: Map<Symbol, Symbol>,
    ) -> Result<(), Error> {
        let drugs_key = symbol_short!("drugs");
        let mut drugs: Map<Symbol, Drug> = env.storage().instance().get(&drugs_key).unwrap_or(Map::new(env));
        
        let drug = drugs.get(drug_id.clone()).ok_or(Error::from_type_and_code(ScErrorType::Context, ScErrorCode::InvalidInput))?;
        
        // Verify current owner
        if drug.current_owner != from {
            return Err(Error::from_type_and_code(ScErrorType::Context, ScErrorCode::InvalidInput));
        }

        // Update drug ownership
        let updated_drug = Drug {
            current_owner: to.clone(),
            ..drug
        };
        drugs.set(drug_id.clone(), updated_drug);
        env.storage().instance().set(&drugs_key, &drugs);
        env.storage().instance().extend_ttl(50, 100);

        // Record transaction
        let transactions_key = Symbol::new(&env, "transactions");
        let mut transactions: Map<Symbol, Vec<Transaction>> = env.storage().instance().get(&transactions_key).unwrap_or(Map::new(env));
        
        let mut drug_transactions = transactions.get(drug_id.clone()).unwrap_or(Vec::new(env));
        let transfer_tx = Transaction {
            id: symbol_short!("transfer"),
            drug_id: drug_id.clone(),
            from,
            to,
            transaction_type: symbol_short!("transfer"),
            timestamp: env.ledger().timestamp(),
            metadata,
        };
        
        drug_transactions.push_back(transfer_tx);
        transactions.set(drug_id.clone(), drug_transactions);
        env.storage().instance().set(&transactions_key, &transactions);
        env.storage().instance().extend_ttl(50, 100);

        Ok(())
    }

    // Get drug information
    pub fn get_drug(env: &Env, drug_id: Symbol) -> Result<Drug, Error> {
        let drugs_key = symbol_short!("drugs");
        let drugs: Map<Symbol, Drug> = env.storage().instance().get(&drugs_key).unwrap_or(Map::new(env));
        
        drugs.get(drug_id).ok_or(Error::from_type_and_code(ScErrorType::Context, ScErrorCode::InvalidInput))
    }

    // Get current drug count (similar to increment example)
    pub fn get_drug_count(env: &Env) -> u32 {
        let drugs_key = symbol_short!("drugs");
        let drugs: Map<Symbol, Drug> = env.storage().instance().get(&drugs_key).unwrap_or(Map::new(env));
        
        let count = drugs.len() as u32;
        log!(&env, "Total drugs registered: {}", count);
        count
    }

    // Get drug transaction history
    pub fn get_drug_history(env: &Env, drug_id: Symbol) -> Result<Vec<Transaction>, Error> {
        let transactions_key = Symbol::new(&env, "transactions");
        let transactions: Map<Symbol, Vec<Transaction>> = env.storage().instance().get(&transactions_key).unwrap_or(Map::new(env));
        
        Ok(transactions.get(drug_id).unwrap_or(Vec::new(env)))
    }

    // Update drug status (for recalls, investigations, etc.)
    pub fn update_drug_status(
        env: &Env,
        drug_id: Symbol,
        new_status: Symbol,
        authorized_address: Address,
    ) -> Result<(), Error> {
        let drugs_key = symbol_short!("drugs");
        let mut drugs: Map<Symbol, Drug> = env.storage().instance().get(&drugs_key).unwrap_or(Map::new(env));
        
        let drug = drugs.get(drug_id.clone()).ok_or(Error::from_type_and_code(ScErrorType::Context, ScErrorCode::InvalidInput))?;
        
        // Only manufacturer or authorized addresses can update status
        if drug.manufacturer != authorized_address {
            return Err(Error::from_type_and_code(ScErrorType::Context, ScErrorCode::InvalidInput));
        }

        // Update drug status
        let updated_drug = Drug {
            status: new_status,
            ..drug
        };
        drugs.set(drug_id.clone(), updated_drug);
        env.storage().instance().set(&drugs_key, &drugs);

        // Record status change transaction
        let transactions_key = Symbol::new(&env, "transactions");
        let mut transactions: Map<Symbol, Vec<Transaction>> = env.storage().instance().get(&transactions_key).unwrap_or(Map::new(env));
        
        let mut drug_transactions = transactions.get(drug_id.clone()).unwrap_or(Vec::new(env));
        let status_tx = Transaction {
            id: Symbol::new(&env, "status_change"),
            drug_id: drug_id.clone(),
            from: authorized_address.clone(),
            to: authorized_address,
            transaction_type: Symbol::new(&env, "status_update"),
            timestamp: env.ledger().timestamp(),
            metadata: Map::new(env),
        };
        
        drug_transactions.push_back(status_tx);
        transactions.set(drug_id, drug_transactions);
        env.storage().instance().set(&transactions_key, &transactions);

        Ok(())
    }

    // Get all drugs by manufacturer
    pub fn get_drugs_by_manufacturer(env: &Env, manufacturer: Address) -> Result<Vec<Drug>, Error> {
        let drugs_key = symbol_short!("drugs");
        let drugs: Map<Symbol, Drug> = env.storage().instance().get(&drugs_key).unwrap_or(Map::new(env));
        
        let mut manufacturer_drugs = Vec::new(env);
        for (_, drug) in drugs.iter() {
            if drug.manufacturer == manufacturer {
                manufacturer_drugs.push_back(drug);
            }
        }
        
        Ok(manufacturer_drugs)
    }

    // Verify drug authenticity
    pub fn verify_drug(env: &Env, drug_id: Symbol) -> Result<bool, Error> {
        let drug = Self::get_drug(env, drug_id)?;
        
        // Check if drug exists and has valid status
        let is_valid = drug.status == symbol_short!("active") || drug.status == Symbol::new(&env, "investigation");
        
        Ok(is_valid)
    }
}
