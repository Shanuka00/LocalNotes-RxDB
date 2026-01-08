import Alert from '@mui/material/Alert';

type Props = {
  online: boolean; // Browser network connectivity status
  allSynced: boolean; // Whether all changes are synced with server
};

/**
 * Display sync status banner at top of app
 * Shows green when fully synced, red when there are pending changes
 */
export function StatusBanner({ online, allSynced }: Props) {
  // Best case: online and everything synced
  if (online && allSynced) {
    return (
      <Alert
        severity="success"
        variant="standard"
        sx={{
          borderColor: 'rgba(52, 211, 153, 0.30)',
        }}
      >
        Online - All changes synced
      </Alert>
    );
  }

  // Show warning when changes are not synced (offline or pending operations)
  const label = online ? 'Online - Changes not synced' : 'Offline - Changes not synced';
  return (
    <Alert
      severity="error"
      variant="standard"
      sx={{
        borderColor: 'rgba(251, 113, 133, 0.30)',
      }}
    >
      {label}
    </Alert>
  );
}
