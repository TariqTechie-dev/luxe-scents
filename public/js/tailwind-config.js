window.tailwind = window.tailwind || {};

window.tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#f4c025',
        'primary-hover': '#dcb028',
        'background-light': '#f8f8f5',
        'background-dark': '#221e10',
        'luxury-dark': '#1a160a',
        'luxury-gold': '#cbbc90',
        'surface-dark': '#2c2616',
        'surface-highlight': '#493f22',
        'accent-dark': '#2a2a2a',
        'border-dark': '#493f22',
        'surface-border': '#493f22',
        'text-muted': '#cbbc90',
        'text-gold': '#cbbc90',
        'input-bg': '#342d18'
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        body: ['Noto Sans', 'sans-serif']
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px'
      }
    }
  }
};
