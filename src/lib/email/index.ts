import type { EmailProvider, SendEmailOptions, SendEmailResult } from './types'
import { resendProvider } from './resend'

// Default provider — swap here to change globally
let activeProvider: EmailProvider = resendProvider

export function setEmailProvider(provider: EmailProvider) {
  activeProvider = provider
}

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  return activeProvider.send(options)
}

export type { EmailProvider, SendEmailOptions, SendEmailResult }
