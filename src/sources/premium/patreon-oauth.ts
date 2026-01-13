// src/sources/premium/patreon-oauth.ts

import fetch from "node-fetch"
import { URLSearchParams } from "url"

const PATREON_AUTHORIZE_URL = "https://www.patreon.com/oauth2/authorize"
const PATREON_TOKEN_URL = "https://www.patreon.com/api/oauth2/token"

export const PATREON_SCOPES = [
  "identity",            // REQUIRED: patron memberships live here
  "campaigns",           // creator-owned campaigns (optional)
  "campaigns.members"    // members of creator-owned campaigns (optional)
].join(" ")

export function getAuthorizeUrl({
  clientId,
  redirectUri,
  state
}: {
  clientId: string
  redirectUri: string
  state: string
}) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: PATREON_SCOPES,
    state
  })

  return `${PATREON_AUTHORIZE_URL}?${params.toString()}`
}

export async function exchangeCodeForToken({
  clientId,
  clientSecret,
  redirectUri,
  code
}: {
  clientId: string
  clientSecret: string
  redirectUri: string
  code: string
}) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri
  })

  const res = await fetch(PATREON_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  })

  if (!res.ok) {
    throw new Error(`Patreon token exchange failed: ${res.status}`)
  }

  return res.json()
}

export async function refreshAccessToken({
  clientId,
  clientSecret,
  refreshToken
}: {
  clientId: string
  clientSecret: string
  refreshToken: string
}) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret
  })

  const res = await fetch(PATREON_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  })

  if (!res.ok) {
    throw new Error(`Patreon token refresh failed: ${res.status}`)
  }

  return res.json()
}
