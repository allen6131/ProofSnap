import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { Card } from '@/components/Card';
import { localBackupProvider } from '@/backup/localBackupProvider';
import type { BackupStatus } from '@/backup/backupTypes';

export function BackupSettingsSection() {
  const [status, setStatus] = useState<BackupStatus | null>(null);

  useEffect(() => {
    localBackupProvider.getStatus().then(setStatus).catch(() => {
      setStatus({
        provider: 'local-placeholder',
        status: 'error',
        message: 'Backup status is unavailable, but no report data has been uploaded.',
        lastBackupAt: null,
      });
    });
  }, []);

  return (
    <Card>
      <Text style={{ color: '#0f172a', fontSize: 18, fontWeight: '800', marginBottom: 6 }}>
        Encrypted backup
      </Text>
      <Text style={{ color: '#64748b', fontSize: 14, lineHeight: 20 }}>
        {status?.message ??
          'ProofSnap works offline by default. Optional encrypted cloud backup is planned behind an opt-in provider.'}
      </Text>
    </Card>
  );
}
