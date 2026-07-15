import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useOrganization } from './useOrganization'

export interface ContactList {
  id: string
  organization_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  contact_count?: number
}

export function useLists() {
  const { data: org } = useOrganization()

  return useQuery<ContactList[]>({
    queryKey: ['lists', org?.id],
    queryFn: async () => {
      if (!org) return []
      const { data, error } = await supabase
        .from('contact_lists')
        .select('*, contact_list_members(count)')
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as any[]).map((l) => ({
        ...l,
        contact_count: l.contact_list_members?.[0]?.count ?? 0,
      })) as ContactList[]
    },
    enabled: !!org,
    staleTime: 30 * 1000,
  })
}

export function useCreateList() {
  const qc = useQueryClient()
  const { data: org } = useOrganization()

  return useMutation({
    mutationFn: async (values: { name: string; description?: string }) => {
      if (!org) throw new Error('Organização não encontrada')
      const { data, error } = await supabase
        .from('contact_lists')
        .insert({ ...values, organization_id: org.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lists'] }),
  })
}

export function useDeleteList() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contact_lists').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lists'] }),
  })
}
