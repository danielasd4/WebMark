import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Users, MoreHorizontal, Trash2, Edit, Loader2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { formatDate } from '../../lib/utils'
import { useLists, useCreateList, useDeleteList } from '../../hooks/useLists'

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function ListsPage() {
  const [showForm, setShowForm] = useState(false)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const { data: lists = [], isLoading, error } = useLists()
  const createList = useCreateList()
  const deleteList = useDeleteList()

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      setFormError(null)
      await createList.mutateAsync(data)
      reset()
      setShowForm(false)
    } catch (err: any) {
      setFormError(err?.message ?? 'Erro ao criar lista. Tente novamente.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta lista? Os contatos não serão removidos.')) return
    await deleteList.mutateAsync(id)
    setActiveMenu(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Listas</h1>
          <p className="text-zinc-500 mt-1">
            {isLoading ? 'Carregando...' : `${lists.length} lista${lists.length !== 1 ? 's' : ''} criada${lists.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowForm(true)}>
          Nova lista
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-zinc-400" />
        </div>
      )}

      {error && (
        <div className="py-10 text-center text-sm text-red-500">Erro ao carregar listas.</div>
      )}

      {!isLoading && !error && lists.length === 0 && (
        <div className="py-20 text-center bg-white border border-zinc-100 rounded-xl">
          <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={20} className="text-zinc-400" />
          </div>
          <p className="text-sm font-medium text-zinc-900">Nenhuma lista ainda</p>
          <p className="text-xs text-zinc-400 mt-1 mb-4">Crie listas para segmentar seus contatos.</p>
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowForm(true)}>
            Nova lista
          </Button>
        </div>
      )}

      {!isLoading && lists.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {lists.map((list) => (
            <div key={list.id} className="bg-white border border-zinc-100 rounded-xl p-5 shadow-xs hover:border-zinc-200 transition-all group">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0">
                    <Users size={18} className="text-zinc-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-zinc-900">{list.name}</h3>
                    {list.description && <p className="text-xs text-zinc-400 mt-0.5">{list.description}</p>}
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setActiveMenu(activeMenu === list.id ? null : list.id)}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-all"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {activeMenu === list.id && (
                    <div className="absolute right-0 top-8 w-40 bg-white border border-zinc-200 rounded-xl shadow-xl z-10 py-1">
                      <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                        <Edit size={13} /> Editar
                      </button>
                      <div className="border-t border-zinc-100 my-1" />
                      <button
                        onClick={() => handleDelete(list.id)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={13} /> Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-zinc-50">
                <div className="flex items-center gap-1.5 text-sm">
                  <Users size={14} className="text-zinc-400" />
                  <span className="font-semibold text-zinc-900">{(list.contact_count ?? 0).toLocaleString('pt-BR')}</span>
                  <span className="text-zinc-400">contatos</span>
                </div>
                <span className="text-xs text-zinc-400">Criada em {formatDate(list.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showForm} onClose={() => { setShowForm(false); reset(); setFormError(null) }} title="Nova lista" size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nome da lista *"
            placeholder="Ex: Newsletter Geral"
            error={errors.name?.message}
            {...register('name')}
          />
          <Textarea
            label="Descrição"
            placeholder="Descreva quem faz parte desta lista..."
            rows={3}
            {...register('description')}
          />
          {formError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => { setShowForm(false); reset() }} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting || createList.isPending} className="flex-1">
              Criar lista
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
