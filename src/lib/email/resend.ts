import type { EmailProvider, SendEmailOptions, SendEmailResult } from './types'

// Resend provider — swap this file for Amazon SES, Mailgun, SendGrid, or SMTP without touching call sites
export class ResendProvider implements EmailProvider {
  readonly name = 'resend'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const fromStr = `${options.from.name} <${options.from.email}>`
    const toArray = options.to.map(r => r.name ? `${r.name} <${r.email}>` : r.email)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromStr,
        to: toArray,
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.reply_to,
        tags: options.tags ? Object.entries(options.tags).map(([n, v]) => ({ name: n, value: v })) : undefined,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      return { id: '', success: false, error: err.message || 'Failed to send email' }
    }

    const data = await res.json()
    return { id: data.id, success: true }
  }
}

// Singleton — uses VITE_RESEND_API_KEY env variable
// NOTE: Never expose API keys in client-side code in production.
// These calls should go through a Supabase Edge Function.
export const resendProvider = new ResendProvider(
  import.meta.env.VITE_RESEND_API_KEY || ''
)
