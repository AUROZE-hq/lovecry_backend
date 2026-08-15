import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

/**
 * Persist signed-consent artifacts locally when Google Drive is not wired.
 * Status remains explicit: LOCAL_STORED vs DRIVE_PENDING.
 */
export async function storeConsentArtifactLocally(input: {
  reference: string;
  fileName: string;
  certificateText: string;
  signatureDataUrl?: string;
}): Promise<{ storageKey: string; artifactStatus: 'LOCAL_STORED' }> {
  const dir = path.join(process.cwd(), '.data', 'consents');
  await mkdir(dir, { recursive: true });
  const base = input.reference.replace(/[^a-zA-Z0-9_-]/g, '_');
  const certPath = path.join(dir, `${base}-certificate.txt`);
  await writeFile(certPath, input.certificateText, 'utf8');
  if (input.signatureDataUrl) {
    const sigPath = path.join(dir, `${base}-signature.txt`);
    await writeFile(sigPath, input.signatureDataUrl, 'utf8');
  }
  return { storageKey: `local:${base}`, artifactStatus: 'LOCAL_STORED' };
}
