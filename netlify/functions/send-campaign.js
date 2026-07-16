import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const { campaign_id } = JSON.parse(event.body || '{}')
    if (!campaign_id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'campaign_id is required' }) }
    }

    // Get campaign
    const { data: campaign, error: campaignErr } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaign_id)
      .single()

    if (campaignErr || !campaign) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Campaign not found' }) }
    }

    const sendToAll = campaign.content_json?.send_to_all === true
    const listIds = campaign.list_ids || []

    if (!sendToAll && listIds.length === 0) {
      await supabase.from('campaigns').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', campaign_id)
      return { statusCode: 200, headers, body: JSON.stringify({ sent: 0 }) }
    }

    let contacts = []

    if (sendToAll) {
      // Send to all non-unsubscribed contacts in the org
      const { data: allContacts, error: allErr } = await supabase
        .from('contacts')
        .select('id, email, first_name, last_name, status')
        .eq('organization_id', campaign.organization_id)
        .neq('status', 'unsubscribed')
      if (allErr) throw allErr
      contacts = allContacts || []
    } else {
      // Get all contacts from selected lists, deduplicated
      const { data: members, error: membersErr } = await supabase
        .from('contact_list_members')
        .select('contacts(id, email, first_name, last_name, status)')
        .in('list_id', listIds)
      if (membersErr) throw membersErr

      const seen = new Set()
      for (const m of members || []) {
        const c = Array.isArray(m.contacts) ? m.contacts[0] : m.contacts
        if (c?.email && !seen.has(c.email) && c.status !== 'unsubscribed') {
          seen.add(c.email)
          contacts.push(c)
        }
      }
    }

    if (contacts.length === 0) {
      await supabase.from('campaigns').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', campaign_id)
      return { statusCode: 200, headers, body: JSON.stringify({ sent: 0 }) }
    }

    const RESEND_KEY = process.env.RESEND_API_KEY
    let sent = 0
    let errors = 0
    const batchSize = 100

    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize)

      const emails = batch.map(c => ({
        from: `${campaign.from_name} <${campaign.from_email}>`,
        to: [c.first_name ? `${`${c.first_name} ${c.last_name || ''}`.trim()} <${c.email}>` : c.email],
        subject: campaign.subject,
        html: campaign.content_html || `<p>${campaign.subject}</p>`,
        ...(campaign.reply_to ? { reply_to: campaign.reply_to } : {}),
      }))

      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emails),
      })

      if (res.ok) {
        sent += batch.length
      } else {
        const errBody = await res.text()
        console.error('Resend batch error:', errBody)
        errors += batch.length
      }
    }

    await supabase
      .from('campaigns')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', campaign_id)

    // Try to upsert stats (table may not exist yet)
    await supabase.from('campaign_stats').upsert({
      campaign_id,
      total_sent: sent,
      delivered: sent,
      opens: 0,
      unique_opens: 0,
      clicks: 0,
      unique_clicks: 0,
      bounces: errors,
      unsubscribes: 0,
      spam_complaints: 0,
    }).throwOnError().catch(() => {})

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ sent, errors }),
    }
  } catch (err) {
    console.error('send-campaign error:', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    }
  }
}
