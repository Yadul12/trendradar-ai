import { initializeApp, getApps, cert, type AppOptions } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

function parseServiceAccount(raw: string) {
  const trimmed = raw.trim();
  const json = trimmed.startsWith('{')
    ? trimmed
    : Buffer.from(trimmed, 'base64').toString('utf8');
  const parsed = JSON.parse(json);
  if (typeof parsed.private_key === 'string') {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  }
  return parsed;
}

function buildAdminOptions(): AppOptions {
  const projectId =
    process.env.FIREBASE_PROJECT_ID?.trim() || firebaseConfig.projectId;

  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountRaw && serviceAccountRaw.trim()) {
    const serviceAccount = parseServiceAccount(serviceAccountRaw);
    return {
      projectId: serviceAccount.project_id || projectId,
      credential: cert(serviceAccount),
    };
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (clientEmail && privateKey) {
    return {
      projectId,
      credential: cert({ projectId, clientEmail, privateKey }),
    };
  }

  return { projectId };
}

if (!getApps().length) {
  initializeApp(buildAdminOptions());
}

export const adminAuth = getAuth();
