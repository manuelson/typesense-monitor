import { Client } from "typesense"

function parseHostUrl(hostUrl: string): { host: string; port: number; protocol: string } {
  const url = new URL(hostUrl)
  const protocol = url.protocol.replace(":", "") // "https" or "http"
  const host = url.hostname
  const port = url.port ? parseInt(url.port) : protocol === "https" ? 443 : 80
  return { host, port, protocol }
}

function createClient(): Client {
  const hostUrl = process.env.TYPESENSE_HOST
  const apiKey  = process.env.TYPESENSE_API_KEY

  if (!hostUrl || !apiKey) {
    throw new Error("TYPESENSE_HOST and TYPESENSE_API_KEY must be set")
  }

  const { host, port, protocol } = parseHostUrl(hostUrl)

  return new Client({
    nodes: [{ host, port, protocol }],
    apiKey,
    connectionTimeoutSeconds: 10,
  })
}

export function isTypesenseConfigured(): boolean {
  const hostUrl = process.env.TYPESENSE_HOST
  const apiKey  = process.env.TYPESENSE_API_KEY
  if (!hostUrl || !apiKey) return false
  try { new URL(hostUrl); return true } catch { return false }
}

// Singleton — one client per server process
let _client: Client | null = null

export function getTypesenseClient(): Client {
  if (!_client) _client = createClient()
  return _client
}
