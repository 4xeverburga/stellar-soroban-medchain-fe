/**
 * Configuración del Servicio Huawei BCS
 * Cambia entre modo local y producción fácilmente
 */

export interface BCSServiceConfig {
  mode: 'local' | 'production';
  localEndpoint?: string;
  productionEndpoint?: string;
  channelName?: string;
  chaincodeName?: string;
  userCredentials?: {
    certificate: string;
    privateKey: string;
  };
}

// Configuración por defecto - MODO LOCAL
export const defaultConfig: BCSServiceConfig = {
  mode: 'local', // Cambiar a 'production' cuando tengas Huawei BCS
  localEndpoint: 'http://localhost:3000',
  productionEndpoint: 'https://your-huawei-bcs-endpoint.com',
  channelName: 'medchain-channel',
  chaincodeName: 'drug-traceability'
};

// Configuración para producción (Huawei BCS)
export const productionConfig: BCSServiceConfig = {
  mode: 'production',
  productionEndpoint: 'https://your-huawei-bcs-endpoint.com',
  channelName: 'medchain-channel',
  chaincodeName: 'drug-traceability',
  userCredentials: {
    certificate: 'YOUR_CERTIFICATE_HERE',
    privateKey: 'YOUR_PRIVATE_KEY_HERE'
  }
};

// Función para obtener configuración actual
export function getCurrentConfig(): BCSServiceConfig {
  // Por ahora, siempre retorna configuración local
  // Cuando tengas Huawei BCS, puedes cambiar esto
  return defaultConfig;
}

// Función para cambiar a modo producción
export function switchToProduction(endpoint: string, credentials: { certificate: string; privateKey: string }): BCSServiceConfig {
  return {
    mode: 'production',
    productionEndpoint: endpoint,
    channelName: 'medchain-channel',
    chaincodeName: 'drug-traceability',
    userCredentials: credentials
  };
}

// Función para cambiar a modo local
export function switchToLocal(): BCSServiceConfig {
  return defaultConfig;
}