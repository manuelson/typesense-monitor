import { createClientFromConfig, getTypesenseClient, isTypesenseConfigured } from "@/lib/typesense"
import { parseMetricsJson } from "@/lib/parseMetrics"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const host   = request.headers.get("x-typesense-host")
  const apiKey = request.headers.get("x-typesense-api-key")

  if (host && apiKey) {
    try {
      const raw  = await createClientFromConfig(host, apiKey).metrics.retrieve()
      return Response.json(parseMetricsJson(raw))
    } catch {
      return Response.json({ error: "unreachable" }, { status: 503 })
    }
  }

  if (!isTypesenseConfigured()) return Response.json({ configured: false }, { status: 503 })
  try {
    const raw = await getTypesenseClient().metrics.retrieve()
    return Response.json(parseMetricsJson(raw))
  } catch {
    return Response.json({ error: "unreachable" }, { status: 503 })
  }
}
