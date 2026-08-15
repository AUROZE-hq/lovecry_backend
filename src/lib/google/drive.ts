/**
 * Google Drive consent uploads — kept separate from Calendar OAuth.
 * Production Drive upload remains incomplete until a dedicated Drive integration is authorized.
 */

import { counsellingEnv } from '@/lib/config/counselling-env';
import { logWarn } from '@/lib/security/logger';

export async function uploadSignedConsentToDrive(input: {
  fileName: string;
  content: Buffer | string;
  mimeType: string;
}): Promise<{ fileId: string; folderId: string; incomplete: true }> {
  logWarn('google_drive_upload_stub', {
    integration: 'google_drive',
    action: 'upload',
    status: 'INCOMPLETE',
    message: 'Drive upload not production-wired; Calendar OAuth deliberately excludes Drive scopes.',
  });
  void input;
  return {
    fileId: `local-drive-pending-${Date.now()}`,
    folderId: counsellingEnv.google.signedConsentFolderId || 'local',
    incomplete: true,
  };
}

export async function verifyDriveUpload(_fileId: string): Promise<boolean> {
  return false;
}
