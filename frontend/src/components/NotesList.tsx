import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { NoteDocType } from '../types/notes';
import { SyncStatusChip } from './SyncStatusChip';

type Props = {
  notes: NoteDocType[];
  onEdit: (note: NoteDocType) => void;
  onDelete: (note: NoteDocType) => void;
};

export function NotesList({ notes, onEdit, onDelete }: Props) {
  if (notes.length === 0) {
    return (
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        No notes yet.
      </Typography>
    );
  }

  return (
    <List>
      {notes.map((note) => (
        <ListItem key={note.id} divider alignItems="flex-start">
          <ListItemText
            primary={
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle1" sx={{ flex: 1 }}>
                  {note.title}
                </Typography>
                <SyncStatusChip status={note.syncStatus} />
              </Stack>
            }
            secondary={
              <Stack spacing={1} sx={{ mt: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {note.content.length > 160 ? `${note.content.slice(0, 160)}…` : note.content}
                </Typography>
                {note.tags.length > 0 ? (
                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                    {note.tags.map((t) => (
                      <Chip key={`${note.id}:${t}`} label={t} size="small" variant="outlined" />
                    ))}
                  </Stack>
                ) : null}
              </Stack>
            }
          />

          <ListItemSecondaryAction>
            <IconButton aria-label="Edit" onClick={() => onEdit(note)}>
              <EditOutlinedIcon />
            </IconButton>
            <IconButton aria-label="Delete" onClick={() => onDelete(note)} color="error">
              <DeleteOutlineIcon />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );
}
