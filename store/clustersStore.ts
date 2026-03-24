import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Cluster {
  id: string
  name: string
  host: string   // e.g. https://xxx.a1.typesense.net
  apiKey: string
}

/** Special sentinel: use TYPESENSE_HOST + TYPESENSE_API_KEY from server env vars */
export const ENV_CLUSTER_ID = "env"

interface ClustersState {
  clusters: Cluster[]    // user-defined clusters (env cluster is implicit)
  activeId: string       // ENV_CLUSTER_ID or a user cluster UUID

  addCluster:    (c: Omit<Cluster, "id">) => void
  removeCluster: (id: string) => void
  updateCluster: (id: string, changes: Partial<Omit<Cluster, "id">>) => void
  setActiveId:   (id: string) => void
}

export const useClustersStore = create<ClustersState>()(
  persist(
    (set) => ({
      clusters: [],
      activeId: ENV_CLUSTER_ID,

      addCluster: (c) =>
        set((s) => ({
          clusters: [...s.clusters, { ...c, id: crypto.randomUUID() }],
        })),

      removeCluster: (id) =>
        set((s) => ({
          clusters: s.clusters.filter((c) => c.id !== id),
          activeId: s.activeId === id ? ENV_CLUSTER_ID : s.activeId,
        })),

      updateCluster: (id, changes) =>
        set((s) => ({
          clusters: s.clusters.map((c) => (c.id === id ? { ...c, ...changes } : c)),
        })),

      setActiveId: (id) => set({ activeId: id }),
    }),
    { name: "typesense-clusters" },
  ),
)
