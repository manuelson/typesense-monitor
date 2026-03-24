import { createClientFromConfig, getTypesenseClient, isTypesenseConfigured } from "@/lib/typesense"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const host   = request.headers.get("x-typesense-host")
  const apiKey = request.headers.get("x-typesense-api-key")

  if (host && apiKey) {
    try {
      const data = await createClientFromConfig(host, apiKey).collections().retrieve()
      return Response.json(data)
    } catch {
      return Response.json({ error: "unreachable" }, { status: 503 })
    }
  }

  if (!isTypesenseConfigured()) return Response.json({ configured: false }, { status: 503 })
  try {
    const data = await getTypesenseClient().collections().retrieve()
    return Response.json(data)
  } catch {
    return Response.json({ error: "unreachable" }, { status: 503 })
  }
}
