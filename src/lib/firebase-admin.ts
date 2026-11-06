import { initializeApp, getApps, cert, type AppOptions } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

function resolveDefaultProjectId(): string {
  if (process.env.FIREBASE_PROJECT_ID?.trim()) {
    return process.env.FIREBASE_PROJECT_ID.trim();
  }
  if (process.env.VITE_FIREBASE_PROJECT_ID?.trim()) {
    return process.env.VITE_FIREBASE_PROJECT_ID.trim();
  }
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (parsed.projectId) {
        return parsed.projectId;
      }
    }
  } catch {
    // ignore read errors in serverless environments
  }
  return 'stunning-casing-qpz3c';
}

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
  const projectId = resolveDefaultProjectId();

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

export function getAdminAuth(): Auth {
  if (!getApps().length) {
    initializeApp(buildAdminOptions());
  }
  return getAuth();
}
