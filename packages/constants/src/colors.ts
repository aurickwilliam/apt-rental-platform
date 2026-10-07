export const COLORS = {
  light: {
    // Base
    white: '#FFFFFF',
    surface: '#F8F9FA',

    // Brand
    primary: '#376BF5',
    primaryLight: '#EFF6FF',
    secondary: '#FFA500',
    secondaryForeground: '#FFFFFF',
    secondaryLight: '#FFF3E0',

    // Text & Neutral
    textPrimary: '#333333',
    textSecondary: '#6C757D', 
    gray500: '#6C757D',       
    gray400: '#9CA3AF',
    gray300: '#BDBDBD',
    gray200: '#D1D5DB',
    gray100: '#E5E7EB',

    // Semantic
    success: '#22C55E',
    successLight: '#E6F4EA',
    warning: '#FACC15',
    warningLight: '#FFF8E1',
    danger: '#E50914',
    dangerMid: '#FF4B4B',
    dangerLight: '#FDA4AF',
  },

  dark: {
    // Base
    white: '#121212',
    surface: '#1E1E1E',
    surfaceRaised: '#2A2A2A',

    // Brand
    primary: '#5B8BF7',
    primaryLight: '#1A2340',
    secondary: '#FFA500',
    secondaryForeground: '#FFFFFF',
    secondaryLight: '#2E2212',

    // Text & Neutral
    textPrimary: '#F0F0F0',
    textSecondary: '#9CA3AF',  
    gray500: '#6B7280',       
    gray400: '#6B7280',
    gray300: '#3D3D3D',
    gray200: '#2A2A2A',
    gray100: '#1E1E1E',

    // Semantic
    success: '#4ADE80',
    successLight: '#14291E',
    warning: '#FDE047',
    warningLight: '#2A2410',
    danger: '#F87171',
    dangerMid: '#FCA5A5',
    dangerLight: '#2D1515',
  },
}

// Status surfaces are separate so the base COLORS palette stays string-only.
export const STATUS_COLORS = {
  light: {
    success: { backgroundColor: '#DCFCE7', textColor: '#166534', borderColor: '#86EFAC' },
    warning: { backgroundColor: '#FEF3C7', textColor: '#92400E', borderColor: '#FCD34D' },
    danger: { backgroundColor: '#FEE2E2', textColor: '#991B1B', borderColor: '#FCA5A5' },
    neutral: { backgroundColor: '#F1F5F9', textColor: '#334155', borderColor: '#CBD5E1' },
  },
  dark: {
    success: { backgroundColor: '#14532D', textColor: '#BBF7D0', borderColor: '#22C55E' },
    warning: { backgroundColor: '#78350F', textColor: '#FDE68A', borderColor: '#F59E0B' },
    danger: { backgroundColor: '#7F1D1D', textColor: '#FECACA', borderColor: '#EF4444' },
    neutral: { backgroundColor: '#1E293B', textColor: '#E2E8F0', borderColor: '#475569' },
  },
};
