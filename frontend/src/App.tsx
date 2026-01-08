import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { NotesPage } from './pages/NotesPage';

// Dark neon theme (purple/black/dark purple accents)
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#a855f7',
      light: '#c084fc',
      dark: '#7c3aed',
    },
    secondary: {
      main: '#d946ef',
    },
    background: {
      default: '#07060a',
      paper: '#0f0b18',
    },
    divider: 'rgba(168, 85, 247, 0.18)',
    error: {
      main: '#fb7185',
    },
    warning: {
      main: '#fbbf24',
    },
    success: {
      main: '#34d399',
    },
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage:
            'radial-gradient(900px 500px at 10% 0%, rgba(168, 85, 247, 0.22), transparent 60%), radial-gradient(900px 500px at 90% 10%, rgba(217, 70, 239, 0.16), transparent 60%), radial-gradient(900px 700px at 50% 110%, rgba(124, 58, 237, 0.18), transparent 70%)',
          backgroundAttachment: 'fixed',
        },
        '::selection': {
          background: 'rgba(168, 85, 247, 0.35)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(7, 6, 10, 0.65)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(168, 85, 247, 0.18)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage:
            'linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.0))',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
        },
        containedPrimary: {
          backgroundImage:
            'linear-gradient(90deg, rgba(168, 85, 247, 1), rgba(217, 70, 239, 1))',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          backgroundImage:
            'linear-gradient(90deg, rgba(168, 85, 247, 1), rgba(217, 70, 239, 1))',
          boxShadow:
            '0 0 0 1px rgba(168, 85, 247, 0.25), 0 10px 35px rgba(168, 85, 247, 0.18)',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
        },
        notchedOutline: {
          borderColor: 'rgba(168, 85, 247, 0.22)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
        },
        outlined: {
          borderColor: 'rgba(168, 85, 247, 0.22)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: '1px solid rgba(168, 85, 247, 0.18)',
        },
        standardSuccess: {
          backgroundColor: 'rgba(52, 211, 153, 0.10)',
        },
        standardError: {
          backgroundColor: 'rgba(251, 113, 133, 0.10)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          border: '1px solid rgba(168, 85, 247, 0.18)',
          boxShadow:
            '0 0 0 1px rgba(168, 85, 247, 0.12), 0 24px 80px rgba(0, 0, 0, 0.55)',
        },
      },
    },
  },
});

/**
 * Root application component
 * Sets up Material-UI theme and renders main page
 */
export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotesPage />
    </ThemeProvider>
  );
}
