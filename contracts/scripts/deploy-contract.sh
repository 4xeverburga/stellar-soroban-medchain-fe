#!/bin/bash

# Soroban Contract Deployment Script
# This script deploys the drug traceability contract to the Stellar network

set -e

echo "🚀 Deploying Drug Traceability Contract to Stellar..."

# Check if Soroban CLI is installed
if ! command -v soroban &> /dev/null; then
    echo "❌ Soroban CLI is not installed. Please install it first."
    echo "Visit: https://soroban.stellar.org/docs/getting-started/setup"
    exit 1
fi

# Set network
NETWORK=${1:-testnet}
echo "📡 Using network: $NETWORK"

# Resolve network passphrase if missing
case "$NETWORK" in
  testnet)
    NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
    ;;
  futurenet)
    NETWORK_PASSPHRASE="Test SDF Future Network ; October 2022"
    ;;
  public)
    NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
    ;;
  *)
    NETWORK_PASSPHRASE=${STELLAR_NETWORK_PASSPHRASE:-""}
    ;;
esac

# Build the contract
echo "🔨 Building contract..."
cd contracts
cargo build --target wasm32v1-none --release

# Deploy the contract
echo "📦 Deploying contract..."
CONTRACT_ID=$(soroban contract deploy \
    --network $NETWORK \
    --source-account alice \
    --network-passphrase "$NETWORK_PASSPHRASE" \
    --wasm target/wasm32v1-none/release/drug_traceability.wasm)

echo "✅ Contract deployed successfully!"
echo "📋 Contract ID: $CONTRACT_ID"

# Save contract ID to environment file
echo "💾 Saving contract ID to .env file..."
cd ..
echo "SOROBAN_CONTRACT_ID=$CONTRACT_ID" >> .env

echo "🎉 Deployment complete!"
echo "📝 Contract ID: $CONTRACT_ID"
echo "🔗 You can now use this contract ID in your application." 