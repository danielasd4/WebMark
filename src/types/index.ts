export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ─── Auth ───────────────────────────────────────────────
export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  company_name?: string
  plan?: Plan
  created_at: string
}

// ─── Plans ──────────────────────────────────────────────
export type Plan = 'start' | 'essencial' | 'pro' | 'business' | 'enterprise'

export interface PlanConfig {
  id: Plan
  name: string
  price: number
  sends: number
  contacts: number
  features: string[]
}

// ─── Contacts ───────────────────────────────────────────
export type ContactStatus = 'active' | 'inactive' | 'lead' | 'customer' | 'unsubscribed'

export interface Contact {
  id: string
  organization_id: string
  first_name: string
  last_name?: string
  email: string
  phone?: string
  whatsapp?: string
  company?: string
  job_title?: string
  city?: string
  state?: string
  country?: string
  website?: string
  instagram?: string
  linkedin?: string
  tags: string[]
  notes?: string
  source?: string
  status: ContactStatus
  assigned_to?: string
  created_at: string
  updated_at: string
}

export type CreateContactInput = Omit<Contact, 'id' | 'organization_id' | 'created_at' | 'updated_at'>

// ─── Lists ──────────────────────────────────────────────
export interface ContactList {
  id: string
  organization_id: string
  name: string
  description?: string
  contact_count: number
  created_at: string
  updated_at: string
}

// ─── Campaigns ──────────────────────────────────────────
export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled'

export interface Campaign {
  id: string
  organization_id: string
  name: string
  subject: string
  preview_text?: string
  from_name: string
  from_email: string
  reply_to?: string
  content_html: string
  content_json?: Json
  status: CampaignStatus
  list_ids: string[]
  scheduled_at?: string
  sent_at?: string
  stats?: CampaignStats
  created_at: string
  updated_at: string
}

export interface CampaignStats {
  total_sent: number
  delivered: number
  opens: number
  unique_opens: number
  clicks: number
  unique_clicks: number
  bounces: number
  unsubscribes: number
  spam_complaints: number
  open_rate: number
  click_rate: number
  bounce_rate: number
}

// ─── Templates ──────────────────────────────────────────
export interface EmailTemplate {
  id: string
  organization_id: string
  name: string
  thumbnail?: string
  content_html: string
  content_json?: Json
  category?: string
  created_at: string
  updated_at: string
}

// ─── Automations ────────────────────────────────────────
export type AutomationTrigger = 'contact_added' | 'tag_added' | 'list_added' | 'date' | 'link_clicked' | 'email_opened'
export type AutomationStatus = 'active' | 'inactive' | 'draft'

export interface Automation {
  id: string
  organization_id: string
  name: string
  trigger: AutomationTrigger
  trigger_config?: Json
  steps: AutomationStep[]
  status: AutomationStatus
  enrolled_count: number
  created_at: string
  updated_at: string
}

export interface AutomationStep {
  id: string
  type: 'email' | 'wait' | 'condition' | 'tag' | 'list'
  config: Json
  next_step_id?: string
  next_step_id_false?: string
}

// ─── Organizations ──────────────────────────────────────
export interface Organization {
  id: string
  name: string
  slug: string
  owner_id: string
  plan: Plan
  sends_used: number
  sends_limit: number
  logo_url?: string
  website?: string
  created_at: string
}

// ─── API ────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  count?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  per_page: number
  total_pages: number
}

// ─── AI Import ──────────────────────────────────────────
export interface ImportPreview {
  contacts: Partial<Contact>[]
  duplicates: number
  new_contacts: number
  updated_contacts: number
  issues: string[]
  summary: string
}
