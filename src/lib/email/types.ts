export interface SendEmailOptions {
  from: { name: string; email: string }
  to: { name?: string; email: string }[]
  subject: string
  html: string
  text?: string
  reply_to?: string
  tags?: Record<string, string>
}

export interface SendEmailResult {
  id: string
  success: boolean
  error?: string
}

export interface EmailProvider {
  send(options: SendEmailOptions): Promise<SendEmailResult>
  name: string
}
