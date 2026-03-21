import { getTypesenseClient, isTypesenseConfigured } from "@/lib/typesense"
import { parseMetricsJson } from "@/lib/parseMetrics"

export const dynamic = "force-dynamic"

export async function GET() {
  if (!isTypesenseConfigured()) return Response.json({ configured: false }, { status: 503 })
  try {
    const raw = await getTypesenseClient().metrics.retrieve()
    return Response.json(parseMetricsJson(raw))
  } catch {
    return Response.json({ error: "unreachable" }, { status: 503 })
  }
}
