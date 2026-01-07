import { useEffect, useMemo, useState } from 'react';

import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import type { NoteDocType } from '../types/notes';

type NoteDraft = {
  title: string;
  content: string;
  tags: string[];
};

type Props = {
  open: boolean;
  mode: 'create' | 'edit';
  note?: NoteDocType;
  onCancel: () => void;
  onSave: (draft: NoteDraft) => void;
};

function parseTags(input: string): string[] {
  return input
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

export function NoteDialog({ open, mode, note, onCancel, onSave }: Props) {
  const initial = useMemo<NoteDraft>(() => {
    if (mode === 'edit' && note) {
      return { title: note.title, content: note.content, tags: note.tags };
    }
    return { title: '', content: '', tags: [] };
  }, [mode, note]);

  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [tagsInput, setTagsInput] = useState(initial.tags.join(', '));

  useEffect(() => {
    setTitle(initial.title);
    setContent(initial.content);
    setTagsInput(initial.tags.join(', '));
  }, [initial]);

  const tags = parseTags(tagsInput);
  const canSave = title.trim().length > 0;

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{mode === 'create' ? 'Create Note' : 'Edit Note'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            fullWidth
          />
          <TextField
            label="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            fullWidth
            multiline
            minRows={6}
          />
          <TextField
            label="Tags (comma separated)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            fullWidth
            placeholder="e.g. work, urgent"
          />
          {tags.length > 0 ? (
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {tags.map((t) => (
                <Chip key={t} label={t} size="small" />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No tags
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          onClick={() => onSave({ title: title.trim(), content, tags })}
          variant="contained"
          disabled={!canSave}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

