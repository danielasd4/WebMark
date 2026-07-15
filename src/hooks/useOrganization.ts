import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export interface Organization {
  id: string
  name: string
  slug: string
  plan: string
  sends_used: number
  sends_limit: number
  logo_url: string | null
  website: string | null
}

export function useOrganization() {
  const { user } = useAuth()

  return useQuery<Organization | null>({
    queryKey: ['organization', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  })
}
