import { auth } from './firebase.ts';

let memoryToken: string | null = null;

export function setAuthTokenInMemory(token: string | null) {
  memoryToken = token;
}

async function getValidToken(): Promise<string> {
  if (auth.currentUser) {
    const freshToken = await auth.currentUser.getIdToken();
    memoryToken = freshToken;
    return freshToken;
  }
  if (memoryToken) {
    return memoryToken;
  }
  throw new Error('Authentication required');
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getValidToken();
  const response = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;
    try {
      const errBody = await response.json();
      if (errBody.error) {
        errorMessage = errBody.error;
      }
    } catch {
      // Fallback to status text
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}
