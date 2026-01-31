import { env } from '../config/env.js';

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const SCORE_THRESHOLD = 0.5;

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

export async function verifyRecaptcha(
  token: string,
  expectedAction: string
): Promise<{ valid: boolean; score?: number; error?: string }> {
  // Skip verification if no secret key configured (development)
  if (!env.RECAPTCHA_SECRET_KEY) {
    return { valid: true };
  }

  try {
    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: env.RECAPTCHA_SECRET_KEY,
        response: token,
      }),
    });

    const data = (await response.json()) as RecaptchaResponse;

    if (!data.success) {
      return {
        valid: false,
        error: data['error-codes']?.join(', ') || 'Verification failed',
      };
    }

    // Check action matches expected
    if (data.action && data.action !== expectedAction) {
      return {
        valid: false,
        error: 'Invalid action',
      };
    }

    // Check score threshold
    if (data.score !== undefined && data.score < SCORE_THRESHOLD) {
      return {
        valid: false,
        score: data.score,
        error: 'Score too low',
      };
    }

    return {
      valid: true,
      score: data.score,
    };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return {
      valid: false,
      error: 'Verification request failed',
    };
  }
}
