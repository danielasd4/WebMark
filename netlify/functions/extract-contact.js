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

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
  if (!ANTHROPIC_KEY) {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({ error: 'Configure ANTHROPIC_API_KEY no ambiente.' }),
    }
  }

  try {
    const { type, data, media_type } = JSON.parse(event.body || '{}')

    const prompt =
      'Extraia as informações de contato. Retorne APENAS um JSON com os campos (omita os não encontrados): ' +
      'first_name, last_name, email, phone, whatsapp, company, job_title, city, state, country, website, instagram, linkedin, notes. ' +
      'Sem explicações, apenas o JSON.'

    let content
    if (type === 'image') {
      content = [
        { type: 'image', source: { type: 'base64', media_type: media_type || 'image/jpeg', data } },
        { type: 'text', text: prompt },
      ]
    } else {
      content = [{ type: 'text', text: `${prompt}\n\nTexto:\n${data}` }]
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content }],
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Claude API error: ${body}`)
    }

    const result = await res.json()
    const text = result.content?.[0]?.text || '{}'
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    const contact = JSON.parse(jsonMatch?.[0] || '{}')

    return { statusCode: 200, headers, body: JSON.stringify({ contact }) }
  } catch (err) {
    console.error('extract-contact error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) }
  }
}
