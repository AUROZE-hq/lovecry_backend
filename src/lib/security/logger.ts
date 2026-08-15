type LogFields = {
  requestId?: string;
  bookingId?: string;
  integration?: string;
  action?: string;
  status?: string | number;
  errorCode?: string;
  message?: string;
  [key: string]: unknown;
};

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'refreshToken',
  'accessToken',
  'authorization',
  'cookie',
  'privateKey',
  'clientSecret',
  'apiKey',
  'signatureDataUrl',
  'intakeAnswers',
  'encryptedRefreshToken',
]);

function sanitize(fields: LogFields): LogFields {
  const out: LogFields = {};
  for (const [k, v] of Object.entries(fields)) {
    if (SENSITIVE_KEYS.has(k) || /token|secret|password|key/i.test(k)) {
      out[k] = '[redacted]';
    } else if (typeof v === 'string' && v.length > 500) {
      out[k] = `${v.slice(0, 120)}…`;
    } else {
      out[k] = v;
    }
  }
  return out;
}

export function logInfo(event: string, fields: LogFields = {}) {
  console.info(JSON.stringify({ level: 'info', event, ts: new Date().toISOString(), ...sanitize(fields) }));
}

export function logWarn(event: string, fields: LogFields = {}) {
  console.warn(JSON.stringify({ level: 'warn', event, ts: new Date().toISOString(), ...sanitize(fields) }));
}

export function logError(event: string, fields: LogFields = {}) {
  console.error(JSON.stringify({ level: 'error', event, ts: new Date().toISOString(), ...sanitize(fields) }));
}
