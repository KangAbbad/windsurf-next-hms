import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { Webhook } from 'svix'

// Initialize Supabase client with service role key for admin privileges
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your webhook secret
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error verifying webhook', {
      status: 400,
    })
  }

  // Get the event type
  const eventType = evt.type

  // Handle the event based on its type
  try {
    if (eventType === 'session.created') {
      // User logged in
      await logAuthEvent('login', evt.data)
    } else if (eventType === 'session.ended' || eventType === 'session.removed') {
      // User logged out
      await logAuthEvent('logout', evt.data)
    }

    return new Response('Webhook processed successfully', { status: 200 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response('Error processing webhook', { status: 500 })
  }
}

async function logAuthEvent(action: 'login' | 'logout', data: any) {
  const userId = data.user_id || 'unknown'

  // Get client IP if available
  const ipAddress = data.client_ip || data.ip_address || 'unknown'

  // Insert log entry into Supabase
  const { error } = await supabase.from('activity_logs').insert({
    user_id: userId,
    action_type: action,
    resource_type: 'user',
    resource_id: userId,
    ip_address: ipAddress,
    created_at: new Date().toISOString(),
    metadata: {
      session_id: data.id,
      user_agent: data.user_agent,
      device_details: data.device,
      location: data.location,
    },
  })

  if (error) {
    console.error('Error logging auth event:', error)
    throw error
  }
}
