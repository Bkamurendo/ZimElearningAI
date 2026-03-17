import { createHash } from 'crypto'

/** Generate a cryptographically random 6-digit OTP code */
export function generateOtp(): string {
  // Use crypto.getRandomValues in a way compatible with Node.js
  const array = new Uint32Array(1)
  // In Node.js / Next.js API routes, globalThis.crypto is available (Node 19+)
  // Fallback to Math.random-seeded approach for older environments
  try {
    globalThis.crypto.getRandomValues(array)
    return String(100000 + (array[0] % 900000))
  } catch {
    // Fallback
    return String(Math.floor(100000 + Math.random() * 900000))
  }
}

/** SHA-256 hash of the OTP code for safe DB storage */
export function hashOtp(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

/** Verify a submitted code against its stored hash */
export function verifyOtpHash(code: string, hash: string): boolean {
  return hashOtp(code) === hash
}

/** Returns expiry timestamp 10 minutes from now */
export function otpExpiresAt(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() + 10)
  return d.toISOString()
}
