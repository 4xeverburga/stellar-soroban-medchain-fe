/**
 * Simulador de Hyperledger Fabric para Pruebas Locales
 * Este simulador imita el comportamiento de Fabric sin necesidad de red real
 */

const crypto = require('crypto');

class FabricSimulator {
    constructor() {
        this.worldState = new Map();
        this.transactionHistory = [];
        this.currentTxId = null;
    }

    // Simular Context de Fabric
    createContext() {
        return {
            stub: {
                getState: async (key) => {
                    const value = this.worldState.get(key);
                    return value ? Buffer.from(JSON.stringify(value)) : Buffer.alloc(0);
                },
                
                putState: async (key, value) => {
                    const data = JSON.parse(value.toString());
                    this.worldState.set(key, data);
                },
                
                getTxID: () => {
                    return this.currentTxId || crypto.randomBytes(16).toString('hex');
                },
                
                setEvent: (eventName, payload) => {
                    console.log(`Event emitted: ${eventName}`, JSON.parse(payload.toString()));
                },
                
                getQueryResult: async (queryString) => {
                    const query = JSON.parse(queryString);
                    const results = [];
                    
                    for (const [key, value] of this.worldState.entries()) {
                        if (this.matchesQuery(value, query.selector)) {
                            results.push({
                                value: { value: Buffer.from(JSON.stringify(value)) },
                                done: false
                            });
                        }
                    }
                    
                    return {
                        next: async () => {
                            if (results.length > 0) {
                                return results.shift();
                            }
                            return { done: true };
                        },
                        close: async () => {}
                    };
                }
            }
        };
    }

    matchesQuery(data, selector) {
        for (const [field, condition] of Object.entries(selector)) {
            if (field === '$or') {
                return condition.some(cond => this.matchesQuery(data, cond));
            } else if (field === '$regex') {
                const regex = new RegExp(condition, 'i');
                return regex.test(data[field]);
            } else if (typeof condition === 'object' && condition.$exists !== undefined) {
                return condition.$exists ? data.hasOwnProperty(field) : !data.hasOwnProperty(field);
            } else if (data[field] !== condition) {
                return false;
            }
        }
        return true;
    }

    // Simular invocación de transacción
    async invokeTransaction(contract, functionName, ...args) {
        this.currentTxId = crypto.randomBytes(16).toString('hex');
        const context = this.createContext();
        
        console.log(`\n🔗 Invoking: ${functionName}`);
        console.log(`📝 Transaction ID: ${this.currentTxId}`);
        console.log(`📋 Arguments:`, args);
        
        try {
            const result = await contract[functionName](context, ...args);
            this.transactionHistory.push({
                txId: this.currentTxId,
                function: functionName,
                args: args,
                result: result,
                timestamp: new Date().toISOString()
            });
            
            // Intentar parsear como JSON, si falla mostrar como string
            try {
                console.log(`✅ Result:`, JSON.parse(result));
            } catch (parseError) {
                console.log(`✅ Result:`, result);
            }
            return result;
        } catch (error) {
            console.log(`❌ Error:`, error.message);
            throw error;
        }
    }

    // Simular consulta (query)
    async queryTransaction(contract, functionName, ...args) {
        this.currentTxId = crypto.randomBytes(16).toString('hex');
        const context = this.createContext();
        
        console.log(`\n🔍 Querying: ${functionName}`);
        console.log(`📝 Transaction ID: ${this.currentTxId}`);
        console.log(`📋 Arguments:`, args);
        
        try {
            const result = await contract[functionName](context, ...args);
            // Intentar parsear como JSON, si falla mostrar como string
            try {
                console.log(`✅ Result:`, JSON.parse(result));
            } catch (parseError) {
                console.log(`✅ Result:`, result);
            }
            return result;
        } catch (error) {
            console.log(`❌ Error:`, error.message);
            throw error;
        }
    }

    // Mostrar estado del mundo
    showWorldState() {
        console.log('\n🌍 World State:');
        console.log('================');
        for (const [key, value] of this.worldState.entries()) {
            console.log(`Key: ${key}`);
            console.log(`Value:`, JSON.stringify(value, null, 2));
            console.log('---');
        }
    }

    // Mostrar historial de transacciones
    showTransactionHistory() {
        console.log('\n📜 Transaction History:');
        console.log('=======================');
        this.transactionHistory.forEach((tx, index) => {
            console.log(`${index + 1}. ${tx.function}`);
            console.log(`   TX ID: ${tx.txId}`);
            console.log(`   Time: ${tx.timestamp}`);
            console.log(`   Args: ${JSON.stringify(tx.args)}`);
            console.log(`   Result: ${tx.result}`);
            console.log('---');
        });
    }

    // Limpiar estado
    clearState() {
        this.worldState.clear();
        this.transactionHistory = [];
        console.log('🧹 State cleared');
    }
}

module.exports = FabricSimulator;
