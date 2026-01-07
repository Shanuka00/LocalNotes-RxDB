import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Fab from '@mui/material/Fab';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useMemo, useState } from 'react';

import { ConfirmDialog } from '../components/ConfirmDialog';
import { NoteDialog } from '../components/NoteDialog';
import { NotesList } from '../components/NotesList';
import { StatusBanner } from '../components/StatusBanner';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useNotes } from '../hooks/useNotes';
import { useSyncProcessor } from '../hooks/useSyncProcessor';
import { useSyncSummary } from '../hooks/useSyncSummary';
import { NotesService } from '../services/NotesService';
import type { NoteDocType } from '../types/notes';

/**
 * Main page component for the notes app
 * 
 * Features:
 * - Displays list of notes from RxDB (reactive)
 * - Search notes by title, content, or tags
 * - Create, edit, and delete notes
 * - Shows online/offline status and sync state
 * - Automatically syncs with server when online
 */
export function NotesPage() {
  // Track online status and sync state
  const online = useOnlineStatus();
  const syncSummary = useSyncSummary();

  // Automatically process sync queue when online
  useSyncProcessor();

  // Search and notes list
  const [search, setSearch] = useState('');
  const notes = useNotes(search); // Reactive query from RxDB

  // Dialog state for creating/editing notes
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<NoteDocType | undefined>(undefined);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<NoteDocType | undefined>(undefined);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            LocalNotes
          </Typography>

          <TextField
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes"
            sx={{ width: { xs: 170, sm: 280 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Toolbar>
      </AppBar>

      <StatusBanner online={online} allSynced={syncSummary.allSynced} />

      <Container maxWidth="md" sx={{ py: 2, flex: 1 }}>
        <Stack spacing={2}>
          <NotesList
            notes={notes}
            onEdit={(n) => {
              setEditing(n);
              setDialogMode('edit');
              setDialogOpen(true);
            }}
            onDelete={(n) => setDeleteTarget(n)}
          />
        </Stack>
      </Container>

      <Fab
        color="primary"
        aria-label="Add note"
        sx={{ position: 'fixed', right: 24, bottom: 24 }}
        onClick={() => {
          setEditing(undefined);
          setDialogMode('create');
          setDialogOpen(true);
        }}
      >
        <AddIcon />
      </Fab>

      <NoteDialog
        open={dialogOpen}
        mode={dialogMode}
        note={editing}
        onCancel={() => setDialogOpen(false)}
        onSave={async (draft) => {
          if (dialogMode === 'create') {
            await NotesService.createNote(draft);
          } else if (editing) {
            await NotesService.updateNote(editing.id, draft);
          }
          setDialogOpen(false);
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete note?"
        message="This will remove the note locally and sync the delete when online."
        onCancel={() => setDeleteTarget(undefined)}
        onConfirm={async () => {
          if (deleteTarget) {
            await NotesService.deleteNote(deleteTarget.id);
          }
          setDeleteTarget(undefined);
        }}
      />
    </Box>
  );
}
