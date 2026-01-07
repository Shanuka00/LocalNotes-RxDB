import { useMemo } from 'react';
import { from } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';

import { getDb } from '../db';
import { NOTE_COLLECTION } from '../db/schemas';
import type { NoteDocType } from '../types/notes';
import { useRxObservable } from './useRxObservable';

function normalizeSearch(s: string): string {
  return s.trim().toLowerCase();
}

export function useNotes(searchText: string): NoteDocType[] {
  const observable$ = useMemo(() => {
    // WHY: UI reads from RxDB only. We subscribe to the reactive query stream.
    // Any local changes (online or offline) immediately update the UI.
    return from(getDb()).pipe(
      switchMap((db) =>
        db.collections[NOTE_COLLECTION]
          .find({ selector: { isDeleted: false }, sort: [{ updatedAt: 'desc' }] })
          .$,
      ),
      map((docs) => docs.map((d) => d.toJSON() as NoteDocType)),
      startWith([] as NoteDocType[]),
    );
  }, []);

  const notes = useRxObservable<NoteDocType[]>(observable$, []);

  const q = normalizeSearch(searchText);
  if (!q) return notes;

  return notes.filter((n) => {
    const inTitle = n.title.toLowerCase().includes(q);
    const inContent = n.content.toLowerCase().includes(q);
    const inTags = n.tags.some((t) => t.toLowerCase().includes(q));
    return inTitle || inContent || inTags;
  });
}
