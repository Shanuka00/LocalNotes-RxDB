import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { NoteDocType } from '../types/notes';
import { SyncStatusChip } from './SyncStatusChip';

type Props = {
  notes: NoteDocType[]; // List of notes to display
  onEdit: (note: NoteDocType) => void; // Called when edit button clicked
  onDelete: (note: NoteDocType) => void; // Called when delete button clicked
};

/**
 * Display list of notes with edit and delete actions
 */
export function NotesList({ notes, onEdit, onDelete }: Props) {
  if (notes.length === 0) {
    return (
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        No notes yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {notes.map((note) => (
        <Paper
          key={note.id}
          variant="outlined"
          sx={{
            p: 1.5,
            borderColor: 'rgba(168, 85, 247, 0.18)',
            boxShadow: '0 0 0 1px rgba(168, 85, 247, 0.06), 0 18px 60px rgba(0, 0, 0, 0.35)',
          }}
        >
          <Stack spacing={0.6}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                variant="subtitle1"
                sx={{ flex: 1, fontWeight: 650, overflow: 'hidden', textOverflow: 'ellipsis' }}
              >
                {note.title}
              </Typography>
              <SyncStatusChip status={note.syncStatus} />
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
              {note.content.length > 220 ? `${note.content.slice(0, 220)}…` : note.content}
            </Typography>

            {note.tags.length > 0 ? (
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {note.tags.map((t) => (
                  <Chip key={`${note.id}:${t}`} label={t} size="small" variant="outlined" />
                ))}
              </Stack>
            ) : (
              <Box />
            )}

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <IconButton
                aria-label="Edit"
                onClick={() => onEdit(note)}
                sx={{
                  border: '1px solid rgba(168, 85, 247, 0.18)',
                  borderRadius: 2,
                }}
              >
                <EditOutlinedIcon />
              </IconButton>
              <IconButton
                aria-label="Delete"
                onClick={() => onDelete(note)}
                color="error"
                sx={{
                  border: '1px solid rgba(251, 113, 133, 0.22)',
                  borderRadius: 2,
                }}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
