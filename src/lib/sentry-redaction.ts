export const redactPII = <T,>(data: T): T => {
  if (typeof data === 'string') {
    return data
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]')
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE_REDACTED]') as T;
  }
  if (data === null || typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(item => redactPII(item)) as T;
  }

  const piiFields = ['email', 'phone', 'password', 'creditCard', 'ssn', 'name', 'address'];

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (piiFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      redacted[key] = '[REDACTED]';
    } else {
      redacted[key] = redactPII(value);
    }
  }

  return redacted as T;
};
