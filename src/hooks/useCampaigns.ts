import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useOrganization } from './useOrganization'
import type { Campaign } from '../types'

interface CampaignWithStats extends Campaign {
  campaign_stats?: {
    total_sent: number
    delivered: number
    opens: number
    unique_opens: number
    clicks: number
    unique_clicks: number
    bounces: number
    unsubscribes: number
    spam_complaints: number
  } | null
}

export function useCampaigns(filter = 'all', search = '') {
  const { data: org } = useOrganization()

  return useQuery<CampaignWithStats[]>({
    queryKey: ['campaigns', org?.id, filter, search],
    queryFn: async () => {
      if (!org) return []
      let q = supabase
        .from('campaigns')
        .select('*, campaign_stats(*)')
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false })

      if (filter !== 'all') q = q.eq('status', filter)
      if (search) q = q.or(`name.ilike.%${search}%,subject.ilike.%${search}%`)

      const { data, error } = await q
      if (error) throw error
      return data as CampaignWithStats[]
    },
    enabled: !!org,
    staleTime: 30 * 1000,
  })
}

export function useCreateCampaign() {
  const qc = useQueryClient()
  const { data: org } = useOrganization()

  return useMutation({
    mutationFn: async (values: Partial<Campaign>) => {
      if (!org) throw new Error('Organização não encontrada')
      const { data, error } = await supabase
        .from('campaigns')
        .insert({ ...values, organization_id: org.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  })
}

export function useUpdateCampaign() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<Campaign> }) => {
      const { data, error } = await supabase
        .from('campaigns')
        .update(values)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  })
}

export function useDeleteCampaign() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('campaigns').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  })
}
