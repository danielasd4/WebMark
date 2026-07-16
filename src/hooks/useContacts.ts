import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useOrganization } from './useOrganization'
import type { Contact } from '../types'

export function useContacts(search = '') {
  const { data: org } = useOrganization()

  return useQuery<Contact[]>({
    queryKey: ['contacts', org?.id, search],
    queryFn: async () => {
      if (!org) return []
      let q = supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', org.id)
        .order('created_at', { ascending: false })

      if (search) {
        q = q.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`
        )
      }

      const { data, error } = await q
      if (error) throw error
      return data as Contact[]
    },
    enabled: !!org,
    staleTime: 30 * 1000,
  })
}

export function useCreateContact() {
  const qc = useQueryClient()
  const { data: org } = useOrganization()

  return useMutation({
    mutationFn: async (values: Partial<Contact>) => {
      if (!org) {
        const { data: freshOrg } = await supabase.from('organizations').select('*').maybeSingle()
        if (!freshOrg) throw new Error('Organização não encontrada. Recarregue a página e tente novamente.')
        return supabase.from('contacts').insert({ ...values, organization_id: freshOrg.id }).select().single().then(r => { if (r.error) throw r.error; return r.data })
      }
      const { data, error } = await supabase
        .from('contacts')
        .insert({ ...values, organization_id: org.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  })
}

export function useUpdateContact() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<Contact> }) => {
      const { data, error } = await supabase
        .from('contacts')
        .update(values)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  })
}

export function useDeleteContact() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  })
}

export function useDeleteContacts() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('contacts').delete().in('id', ids)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contacts'] }),
  })
}
