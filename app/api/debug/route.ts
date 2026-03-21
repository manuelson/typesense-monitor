import { getTypesenseClient, isTypesenseConfigured } from "@/lib/typesense"

export const dynamic = "force-dynamic"

export async function GET() {
  if (!isTypesenseConfigured()) return Response.json({ configured: false }, { status: 503 })
  try {
    const data = await getTypesenseClient().debug.retrieve()
    return Response.json(data)
  } catch {
    return Response.json({ error: "unreachable" }, { status: 503 })
  }
}
