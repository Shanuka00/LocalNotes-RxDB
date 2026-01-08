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
        sx={{
          backgroundColor: 'rgba(52, 211, 153, 0.06)',
          borderColor: 'rgba(52, 211, 153, 0.30)',
        }}
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
        sx={{
          backgroundColor: 'rgba(251, 113, 133, 0.06)',
          borderColor: 'rgba(251, 113, 133, 0.30)',
        }}
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
      sx={{
        backgroundColor: 'rgba(251, 191, 36, 0.06)',
        borderColor: 'rgba(251, 191, 36, 0.30)',
      }}
    />
  );
}
