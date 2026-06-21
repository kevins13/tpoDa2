export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ? `${process.env.EXPO_PUBLIC_API_URL}/api` : 'http://192.168.1.48:4000/api';

let manejadorSesionExpirada: (() => void) | null = null;

export function registrarManejadorSesionExpirada(handler: () => void) {
  manejadorSesionExpirada = handler;
}

async function request(path: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...init, signal: controller.signal });
  } catch (err: any) {
    clearTimeout(timeout);
    throw new Error(err?.name === 'AbortError' ? 'Tiempo de espera agotado' : 'No se pudo conectar al servidor');
  }
  clearTimeout(timeout);
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    // ignoramos errores de parseo json
  }
  if (!res.ok) {
    const tieneToken = !!(init.headers && (init.headers as Record<string, string>)['Authorization']);
    if (res.status === 401 && tieneToken && manejadorSesionExpirada) {
      manejadorSesionExpirada();
    }
    let message = json?.message ?? `HTTP ${res.status}`;
    if (json?.errors && Array.isArray(json.errors)) {
      message += ' - ' + json.errors.map((e: any) => e.message).join(', ');
    }
    const err: any = new Error(message);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

export async function apiGet(path: string, token?: string) {
  return request(path, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

export async function apiPost(path: string, body: any, token?: string) {
  return request(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

export async function apiPut(path: string, body: any, token?: string) {
  return request(path, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

export async function apiPostFormData(path: string, formData: FormData, token?: string) {
  // Sin Content-Type para que el runtime lo ponga automáticamente con el boundary correcto
  return request(path, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });
}

export default { API_BASE_URL, apiGet, apiPost, apiPut, apiPostFormData };
