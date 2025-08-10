/**
 * ChainMed Color Palette
 * Sistema de colores uniforme con tonalidades azules que representan la identidad de ChainMed
 * La paleta incluye diferentes tonos para crear jerarquía visual y mantener legibilidad
 */

// Colores principales de ChainMed
const primaryBlue = '#1E40AF'; // Azul principal - confianza y profesionalismo
const secondaryBlue = '#3B82F6'; // Azul secundario - tecnología e innovación
const accentBlue = '#60A5FA'; // Azul de acento - interacciones y highlights
const lightBlue = '#DBEAFE'; // Azul claro - fondos y elementos sutiles
const darkBlue = '#1E3A8A'; // Azul oscuro - elementos importantes
const navyBlue = '#0F172A'; // Azul marino - fondos oscuros

// Colores de estado
const successBlue = '#0EA5E9'; // Azul éxito - confirmaciones
const warningBlue = '#0284C7'; // Azul advertencia - alertas
const errorBlue = '#0369A1'; // Azul error - errores

// Colores neutros con toque azulado
const neutralBlue = '#F1F5F9'; // Gris azulado muy claro
const neutralBlueDark = '#64748B'; // Gris azulado medio

export const Colors = {
  light: {
    // Colores principales
    primary: primaryBlue,
    secondary: secondaryBlue,
    accent: accentBlue,
    
    // Colores de fondo
    background: '#FFFFFF',
    backgroundSecondary: lightBlue,
    backgroundTertiary: neutralBlue,
    
    // Colores de texto
    text: '#0F172A',
    textSecondary: '#334155',
    textTertiary: '#64748B',
    textInverse: '#FFFFFF',
    
    // Colores de navegación
    tint: primaryBlue,
    tabIconDefault: neutralBlueDark,
    tabIconSelected: primaryBlue,
    
    // Colores de elementos UI
    border: lightBlue,
    borderSecondary: accentBlue,
    shadow: 'rgba(30, 64, 175, 0.1)',
    
    // Colores de estado
    success: successBlue,
    warning: warningBlue,
    error: errorBlue,
    
    // Colores de iconos
    icon: neutralBlueDark,
    iconSelected: primaryBlue,
  },
  dark: {
    // Colores principales
    primary: accentBlue,
    secondary: secondaryBlue,
    accent: lightBlue,
    
    // Colores de fondo
    background: navyBlue,
    backgroundSecondary: '#1E293B',
    backgroundTertiary: '#334155',
    
    // Colores de texto
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
    textInverse: '#0F172A',
    
    // Colores de navegación
    tint: accentBlue,
    tabIconDefault: '#64748B',
    tabIconSelected: accentBlue,
    
    // Colores de elementos UI
    border: '#334155',
    borderSecondary: secondaryBlue,
    shadow: 'rgba(0, 0, 0, 0.3)',
    
    // Colores de estado
    success: successBlue,
    warning: warningBlue,
    error: errorBlue,
    
    // Colores de iconos
    icon: '#94A3B8',
    iconSelected: accentBlue,
  },
};

// Paleta extendida para uso específico
export const ChainMedColors = {
  // Azules principales
  blue: {
    50: '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },
  
  // Gradientes
  gradients: {
    primary: [primaryBlue, secondaryBlue],
    secondary: [secondaryBlue, accentBlue],
    background: [lightBlue, neutralBlue],
  },
  
  // Estados específicos
  states: {
    hover: accentBlue,
    active: darkBlue,
    disabled: neutralBlueDark,
    loading: accentBlue,
  },

  // Colores específicos para alertas y verificaciones médicas
  medical: {
    // Verificaciones - Azul confianza
    verification: {
      primary: '#1E40AF', // Azul principal para verificaciones exitosas
      secondary: '#DBEAFE', // Fondo sutil para verificaciones
      border: '#3B82F6', // Borde para destacar verificaciones
      text: '#1E3A8A', // Texto oscuro para verificaciones
      icon: '#2563EB', // Icono de verificación
    },

    // Auténticos - Azul premium
    authentic: {
      primary: '#0F172A', // Azul marino para elementos auténticos
      secondary: '#1E293B', // Fondo para elementos auténticos
      border: '#3B82F6', // Borde dorado-azulado
      text: '#F8FAFC', // Texto claro para auténticos
      icon: '#60A5FA', // Icono de autenticidad
      badge: '#1E40AF', // Badge de autenticidad
    },

    // Alertas - Azul informativo
    alert: {
      primary: '#0284C7', // Azul alerta principal
      secondary: '#E0F2FE', // Fondo de alerta suave
      border: '#0EA5E9', // Borde de alerta
      text: '#0C4A6E', // Texto de alerta
      icon: '#0369A1', // Icono de alerta
      urgent: '#1E40AF', // Alerta urgente
    },

    // Creación de medicamentos - Azul innovación
    creation: {
      primary: '#3B82F6', // Azul innovación
      secondary: '#EFF6FF', // Fondo de creación
      border: '#60A5FA', // Borde de creación
      text: '#1E40AF', // Texto de creación
      icon: '#2563EB', // Icono de creación
      success: '#0EA5E9', // Éxito en creación
    },

    // Pruebas médicas - Azul análisis
    testing: {
      primary: '#1D4ED8', // Azul análisis
      secondary: '#F0F9FF', // Fondo de pruebas
      border: '#3B82F6', // Borde de pruebas
      text: '#1E3A8A', // Texto de pruebas
      icon: '#2563EB', // Icono de pruebas
      pending: '#64748B', // Estado pendiente
      completed: '#0EA5E9', // Estado completado
    },

    // Estados de medicamentos
    medication: {
      active: '#0EA5E9', // Medicamento activo
      inactive: '#64748B', // Medicamento inactivo
      expired: '#0369A1', // Medicamento expirado
      recalled: '#DC2626', // Medicamento retirado (rojo para emergencia)
      generic: '#3B82F6', // Medicamento genérico
      brand: '#1E40AF', // Medicamento de marca
    },

    // Tipos de usuario
    user: {
      doctor: '#1E40AF', // Doctor
      pharmacist: '#3B82F6', // Farmacéutico
      patient: '#60A5FA', // Paciente
      admin: '#0F172A', // Administrador
    }
  }
};
