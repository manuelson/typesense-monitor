export function fmtBytes(b: number): string {
  if (!b) return "0 B"
  if (b >= 1_073_741_824) return `${(b / 1_073_741_824).toFixed(1)}G`
  if (b >= 1_048_576) return `${(b / 1_048_576).toFixed(0)}M`
  return `${(b / 1024).toFixed(0)}K`
}
