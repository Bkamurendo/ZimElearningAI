/**
 * Minimal type declarations for the `paynow` npm package.
 * The package ships no .d.ts files, so we declare what we use.
 */
declare module 'paynow' {
  export interface PaynowPayment {
    add(description: string, amount: number): void
  }

  export interface InitResponse {
    success: boolean
    redirectUrl?: string
    pollUrl?: string
    error?: string
    [key: string]: unknown
  }

  export interface StatusResponse {
    /** paid() is a method, not a property — call as status.paid() */
    paid(): boolean
    status: string
    amount?: number
    reference?: string
    paynowreference?: string
    instructions?: string
    [key: string]: unknown
  }

  export class Paynow {
    resultUrl: string
    returnUrl: string

    constructor(integrationId: string, integrationKey: string)

    createPayment(reference: string, authEmail?: string): PaynowPayment

    /** Web checkout */
    send(payment: PaynowPayment): Promise<InitResponse>

    /** Mobile money (EcoCash, OneMoney, InnBucks) */
    sendMobile(
      payment: PaynowPayment,
      phone: string,
      method: 'ecocash' | 'onemoney' | 'innbucks'
    ): Promise<InitResponse>

    /** Poll a transaction for status updates */
    pollTransaction(pollUrl: string): Promise<StatusResponse>

    /** Parse URL-encoded status update from Paynow */
    parseStatusUpdate(urlEncodedBody: string): Record<string, string>

    /** Verify the hash in a parsed status update */
    verifyHash(parsed: Record<string, string>): boolean
  }
}
