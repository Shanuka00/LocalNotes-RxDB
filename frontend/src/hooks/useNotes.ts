import { useMemo } from 'react';
import { from } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';

import { getDb } from '../db';
import { NOTE_COLLECTION } from '../db/schemas';
import type { NoteDocType } from '../types/notes';
import { useRxObservable } from './useRxObservable';

// Normalize search text for case-insensitive comparison
function normalizeSearch(s: string): string {
  return s.trim().toLowerCase();
}

/**
 * Hook to get all notes from RxDB and filter by search text
 * 
 * This hook uses RxDB's reactive queries:
 * - Automatically updates when notes change in the database
 * - Works across multiple browser tabs
 * - Filters locally by search text in title, content, or tags
 */
export function useNotes(searchText: string): NoteDocType[] {
  // Create RxDB observable query
  // This runs once and creates a reactive stream that emits whenever notes change
  const observable$ = useMemo(() => {
    return from(getDb()).pipe(
      // Once database is ready, create a query for non-deleted notes sorted by date
      switchMap((db) =>
        db.collections[NOTE_COLLECTION]
          .find({ selector: { isDeleted: false }, sort: [{ updatedAt: 'desc' }] })
          .$ // The $ property returns an observable that emits on every change
      ),
      // Convert RxDB documents to plain JavaScript objects
      map((docs) => docs.map((d) => d.toJSON() as NoteDocType)),
      // Start with empty array while loading
      startWith([] as NoteDocType[]),
    );
  }, []);

  // Subscribe to the observable and get current value
  const notes = useRxObservable<NoteDocType[]>(observable$, []);

  // Filter notes by search text (case-insensitive)
  const q = normalizeSearch(searchText);
  if (!q) return notes; // No search, return all notes

  // Search in title, content, and tags
  return notes.filter((n) => {
    const inTitle = n.title.toLowerCase().includes(q);
    const inContent = n.content.toLowerCase().includes(q);
    const inTags = n.tags.some((t) => t.toLowerCase().includes(q));
    return inTitle || inContent || inTags;
  });
}
