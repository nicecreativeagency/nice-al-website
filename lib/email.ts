import 'server-only'

type EmailInput = {
  to: string | string[]
  subject: string
  text: string
  html: string
  idempotencyKey?: string
}

export type EmailDeliveryResult =
  | { status: 'sent'; id: string }
  | { status: 'skipped'; reason: 'not_configured' }
  | { status: 'failed'; error: string }

export function getPublicAppUrl() {
  return (
    process.env.BETTER_AUTH_URL?.replace(/\/$/, '') ??
    'http://localhost:3002'
  )
}

export function escapeEmailHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export async function sendTransactionalEmail(
  input: EmailInput,
): Promise<EmailDeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from) {
    return { status: 'skipped', reason: 'not_configured' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(input.idempotencyKey
          ? { 'Idempotency-Key': input.idempotencyKey.slice(0, 256) }
          : {}),
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    })

    const result = (await response.json().catch(() => ({}))) as {
      id?: string
      message?: string
    }
    if (!response.ok || !result.id) {
      return {
        status: 'failed',
        error: result.message ?? `Resend returned HTTP ${response.status}.`,
      }
    }

    return { status: 'sent', id: result.id }
  } catch (error) {
    return {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Email delivery failed.',
    }
  }
}

export async function sendAccountReadyEmail(input: {
  name: string
  email: string
  organizationName: string
}) {
  const loginUrl = `${getPublicAppUrl()}/hub/login`
  const name = escapeEmailHtml(input.name)
  const organizationName = escapeEmailHtml(input.organizationName)

  return sendTransactionalEmail({
    to: input.email,
    subject: `Your ${input.organizationName} Social Hub account is ready`,
    text: `Hi ${input.name}, your ${input.organizationName} Social Hub account is ready. Sign in at ${loginUrl}. Contact NICE for your temporary password.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#000">
        <p style="font-size:12px;text-transform:uppercase;letter-spacing:.12em">NICE Social Hub</p>
        <h1 style="font-size:32px;line-height:1.1">Your account is ready.</h1>
        <p>Hi ${name}, you now have access to ${organizationName} Social Hub.</p>
        <p>Contact NICE for your temporary password, then use the button below to sign in.</p>
        <p style="margin:30px 0">
          <a href="${loginUrl}" style="display:inline-block;background:#000;color:#fff;padding:14px 22px;text-decoration:none;border-radius:8px">Sign in to Social Hub</a>
        </p>
        <p style="font-size:12px;color:#666">${loginUrl}</p>
      </div>
    `,
    idempotencyKey: `account-ready-${input.email}`,
  })
}
