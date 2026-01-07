import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ScheduleIcon from '@mui/icons-material/Schedule';
import Chip from '@mui/material/Chip';

import type { SyncStatus } from '../types/notes';

type Props = {
  status: SyncStatus;
};

/**
 * Display sync status of a single note
 * Shows green checkmark for synced, yellow clock for pending, red error for failed
 */
export function SyncStatusChip({ status }: Props) {
  if (status === 'synced') {
    return (
      <Chip
        size="small"
        color="success"
        icon={<CheckCircleOutlineIcon />}
        label="Synced"
        variant="outlined"
      />
    );
  }

  if (status === 'failed') {
    return (
      <Chip
        size="small"
        color="error"
        icon={<ErrorOutlineIcon />}
        label="Not Synced"
        variant="outlined"
      />
    );
  }

  return (
    <Chip
      size="small"
      color="warning"
      icon={<ScheduleIcon />}
      label="Not Synced"
      variant="outlined"
    />
  );
}
