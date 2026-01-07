import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { NotesPage } from './pages/NotesPage';

// Create Material-UI theme (using defaults)
const theme = createTheme();

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
