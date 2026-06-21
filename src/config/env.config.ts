import { z } from 'zod';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

const logger = new Logger('EnvValidation');

export const envSchema = z
  .object({
    // ── App ────────────────────────────────────────────────────────────────
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),

    PORT: z.coerce.number().int().positive().default(8000),

    FRONTEND_URL: z
      .url({
        error: 'FRONTEND_URL must be a valid URL (e.g. http://localhost:3000)',
      })
      .default('http://localhost:3000'),

    // ── Database ───────────────────────────────────────────────────────────
    DB_HOST: z
      .string({ error: 'DB_HOST is required' })
      .min(1, 'DB_HOST cannot be empty'),

    DB_PORT: z.coerce
      .number({
        error: 'DB_PORT is required',
      })
      .int()
      .positive('DB_PORT must be a positive integer'),

    DB_USERNAME: z
      .string({ error: 'DB_USERNAME is required' })
      .min(1, 'DB_USERNAME cannot be empty'),

    DB_PASSWORD: z
      .string({ error: 'DB_PASSWORD is required' })
      .min(1, 'DB_PASSWORD cannot be empty'),

    DB_NAME: z
      .string({ error: 'DB_NAME is required' })
      .min(1, 'DB_NAME cannot be empty'),

    // ── JWT ────────────────────────────────────────────────────────────────
    JWT_ACCESS_SECRET: z
      .string({ error: 'JWT_ACCESS_SECRET is required' })
      .min(16, 'JWT_ACCESS_SECRET must be at least 16 characters for security'),

    JWT_REFRESH_SECRET: z
      .string({ error: 'JWT_REFRESH_SECRET is required' })
      .min(
        16,
        'JWT_REFRESH_SECRET must be at least 16 characters for security',
      ),

    JWT_ACCESS_EXPIRES_IN: z
      .string({ error: 'JWT_ACCESS_EXPIRES_IN is required' })
      .regex(
        /^\d+[smbd]$/,
        'JWT_ACCESS_EXPIRES_IN must match pattern: 15m, 1h, 7d, etc.',
      ),

    JWT_REFRESH_EXPIRES_IN: z
      .string({ error: 'JWT_REFRESH_EXPIRES_IN is required' })
      .regex(
        /^\d+[smbd]$/,
        'JWT_REFRESH_EXPIRES_IN must match pattern: 15m, 1h, 7d, etc.',
      ),

    // ── Optional ───────────────────────────────────────────────────────────
    THROTTLE_TTL: z.coerce.number().int().positive().optional(),

    THROTTLE_LIMIT: z.coerce.number().int().positive().optional(),
  })
  .superRefine((env, ctx) => {
    // Warn: secrets should differ
    if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['JWT_REFRESH_SECRET'],
        error:
          'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET should not be identical',
      });
    }

    // Warn: throttle fields must come in pairs
    const hasTTL = env.THROTTLE_TTL !== undefined;
    const hasLimit = env.THROTTLE_LIMIT !== undefined;
    if (hasTTL !== hasLimit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [hasTTL ? 'THROTTLE_LIMIT' : 'THROTTLE_TTL'],
        error:
          'THROTTLE_TTL and THROTTLE_LIMIT must both be set or both be omitted',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

/**
 * Used in ConfigModule.forRoot({ validate }) — throws on missing required
 * vars and logs warnings for optional issues so startup is never silently broken.
 */
export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.flatten();

    // ── Field errors ──────────────────────────────────────────────────────
    const fieldErrors = Object.entries(errors.fieldErrors)
      .map(
        ([field, messages]) => `  ✘ ${field}: ${(messages ?? []).join(', ')}`,
      )
      .join('\n');

    // ── Form-level errors (superRefine) ───────────────────────────────────
    const formErrors = errors.formErrors.map((msg) => `  ⚠ ${msg}`).join('\n');

    const separator = '─'.repeat(60);
    const message = [
      '',
      separator,
      '  Environment validation failed — app cannot start.',
      separator,
      fieldErrors,
      formErrors,
      separator,
      '  Check your .env file and fix the issues above.',
      separator,
      '',
    ]
      .filter(Boolean)
      .join('\n');

    throw new Error(message);
  }

  // ── Non-fatal warnings (optional vars missing, etc.) ─────────────────
  const { data } = result;

  if (!data.THROTTLE_TTL || !data.THROTTLE_LIMIT) {
    logger.warn(
      'THROTTLE_TTL / THROTTLE_LIMIT are not set — rate limiting will be disabled.',
    );
  }

  if (data.NODE_ENV === 'production') {
    if (data.FRONTEND_URL.startsWith('http://')) {
      logger.warn(
        'FRONTEND_URL is using HTTP in production — consider switching to HTTPS.',
      );
    }
    if (data.JWT_ACCESS_SECRET.length < 32) {
      logger.warn(
        'JWT_ACCESS_SECRET is shorter than 32 chars — consider a longer secret in production.',
      );
    }
    if (data.JWT_REFRESH_SECRET.length < 32) {
      logger.warn(
        'JWT_REFRESH_SECRET is shorter than 32 chars — consider a longer secret in production.',
      );
    }
  }

  return data;
}

export class EnvConfigService extends ConfigService<Env, true> {
  get<K extends keyof Env>(key: K): Env[K] {
    return super.get(key, { infer: true });
  }
}