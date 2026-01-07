import Alert from '@mui/material/Alert';

type Props = {
  online: boolean;
  allSynced: boolean;
};

export function StatusBanner({ online, allSynced }: Props) {
  if (online && allSynced) {
    return <Alert severity="success">Online - All changes synced</Alert>;
  }

  // WHY: We show a prominent banner anytime local changes are not yet synced.
  // This includes being fully offline OR being online with pending/failed operations.
  const label = online ? 'Online - Changes not synced' : 'Offline - Changes not synced';
  return <Alert severity="error">{label}</Alert>;
}
