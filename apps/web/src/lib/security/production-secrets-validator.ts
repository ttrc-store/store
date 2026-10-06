/**
 * Production Secrets Validation Module
 * 
 * Enforces cryptographic entropy, minimum length (>= 32 bytes),
 * and prevents the use of default, placeholder, example, well-known,
 * or reused secrets in production environments.
 */

export interface SecretValidationRule {
  name: string;
  value: string | undefined;
  requiredInProduction: boolean;
  requiredIf?: () => boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const KNOWN_PLACEHOLDERS_AND_DEFAULTS = [
  'your_jwt_secret_key_here',
  'ttrc_store_jwt_secret_2026_key_secure_auth',
  'your_razorpay_secret',
  'your_webhook_secret',
  'your_key_secret_here',
  'changeme',
  'secret',
  'password',
  'default',
  'placeholder',
  'example',
  'test',
  'development',
  'replace_me',
  'todo',
];

/**
 * Calculates Shannon entropy of a string (bits per character).
 */
export function calculateShannonEntropy(str: string): number {
  if (!str || str.length === 0) return 0;
  const frequencies = new Map<string, number>();
  for (const char of str) {
    frequencies.set(char, (frequencies.get(char) || 0) + 1);
  }

  let entropy = 0;
  const len = str.length;
  for (const count of frequencies.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

/**
 * Checks if a secret is weak, default, placeholder, or low-entropy.
 */
export function evaluateSecretStrength(name: string, secret: string | undefined): string[] {
  const issues: string[] = [];

  if (!secret || secret.trim().length === 0) {
    issues.push(`${name} is missing or empty`);
    return issues;
  }

  const trimmed = secret.trim();

  // 1. Length check: at least 32 bytes/characters
  const byteLength = Buffer.byteLength(trimmed, 'utf8');
  if (byteLength < 32) {
    issues.push(`${name} is too short (${byteLength} bytes). Minimum required is 32 bytes.`);
  }

  // 2. Known default / placeholder patterns
  const lower = trimmed.toLowerCase();
  for (const known of KNOWN_PLACEHOLDERS_AND_DEFAULTS) {
    if (lower === known || lower.includes(known)) {
      issues.push(`${name} uses a known default or placeholder pattern ('${known}').`);
      break;
    }
  }

  // 3. Placeholder template delimiters
  if (trimmed.includes('{{') && trimmed.includes('}}')) {
    issues.push(`${name} contains unresolved placeholder template syntax '{{...}}'.`);
  }

  // 4. Low character diversity / repeated patterns
  const uniqueChars = new Set(trimmed).size;
  if (uniqueChars < 10) {
    issues.push(`${name} has dangerously low character diversity (${uniqueChars} unique characters).`);
  }

  // 5. Low Shannon Entropy (a random 32-byte hex/base64 string is >= 3.5 bits/char)
  const entropy = calculateShannonEntropy(trimmed);
  if (entropy < 3.0) {
    issues.push(`${name} has low Shannon entropy (${entropy.toFixed(2)} bits/char). Use a cryptographically secure random key.`);
  }

  return issues;
}

/**
 * Validates all production secrets against operational policies.
 */
export function validateProductionSecrets(customEnv?: Record<string, string | undefined>): ValidationResult {
  const env = customEnv || process.env;
  const isProd = env.NODE_ENV === 'production';
  const errors: string[] = [];
  const warnings: string[] = [];

  const jwtSecret = env.JWT_SECRET;
  const razorpayKeySecret = env.RAZORPAY_KEY_SECRET;
  const razorpayWebhookSecret = env.RAZORPAY_WEBHOOK_SECRET;

  // 1. Evaluate JWT_SECRET
  if (!jwtSecret) {
    if (isProd) {
      errors.push('JWT_SECRET is missing in production.');
    } else {
      warnings.push('JWT_SECRET is missing; development fallback is active.');
    }
  } else {
    const jwtIssues = evaluateSecretStrength('JWT_SECRET', jwtSecret);
    if (jwtIssues.length > 0) {
      if (isProd) {
        errors.push(...jwtIssues);
      } else {
        warnings.push(...jwtIssues.map((i) => `[Dev Warning] ${i}`));
      }
    }
  }

  // 2. Evaluate RAZORPAY_KEY_SECRET
  if (razorpayKeySecret) {
    const rkIssues = evaluateSecretStrength('RAZORPAY_KEY_SECRET', razorpayKeySecret);
    if (rkIssues.length > 0) {
      if (isProd) {
        errors.push(...rkIssues);
      } else {
        warnings.push(...rkIssues.map((i) => `[Dev Warning] ${i}`));
      }
    }
  }

  // 3. Evaluate RAZORPAY_WEBHOOK_SECRET
  if (razorpayWebhookSecret) {
    const rwIssues = evaluateSecretStrength('RAZORPAY_WEBHOOK_SECRET', razorpayWebhookSecret);
    if (rwIssues.length > 0) {
      if (isProd) {
        errors.push(...rwIssues);
      } else {
        warnings.push(...rwIssues.map((i) => `[Dev Warning] ${i}`));
      }
    }
  }

  // 4. Cross-Secret Reuse Detection
  const secretMap: Record<string, string | undefined> = {
    JWT_SECRET: jwtSecret,
    RAZORPAY_KEY_SECRET: razorpayKeySecret,
    RAZORPAY_WEBHOOK_SECRET: razorpayWebhookSecret,
  };

  const entries = Object.entries(secretMap).filter(([_, val]) => Boolean(val && val.trim().length > 0));
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const [nameA, valA] = entries[i];
      const [nameB, valB] = entries[j];
      if (valA === valB) {
        const msg = `Secret reuse detected: ${nameA} and ${nameB} share the exact same value. Each boundary must have distinct secrets.`;
        if (isProd) {
          errors.push(msg);
        } else {
          warnings.push(`[Dev Warning] ${msg}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Asserts production secrets on startup. Throws an error in production if validation fails.
 */
export function assertProductionSecrets(customEnv?: Record<string, string | undefined>): void {
  const result = validateProductionSecrets(customEnv);

  for (const warning of result.warnings) {
    console.warn(`[Security Warning] ${warning}`);
  }

  if (!result.valid) {
    const formatted = result.errors.map((e) => `  - ${e}`).join('\n');
    const msg = `[CRITICAL SECURITY REJECTION] Insecure production secrets detected:\n${formatted}\nApplication startup halted. Configure high-entropy 32+ byte secrets before launch.`;
    console.error(msg);
    throw new Error(msg);
  }
}
