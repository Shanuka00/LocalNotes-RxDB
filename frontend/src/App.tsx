import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { NotesPage } from './pages/NotesPage';

const theme = createTheme({
  // Keep defaults; MUI handles a clean professional baseline.
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotesPage />
    </ThemeProvider>
  );
}
