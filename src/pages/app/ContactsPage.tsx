import { useState } from 'react'
import {
  Search, Plus, Upload, Download, Filter, MoreHorizontal,
  Mail, Building2, Tag, Trash2, Edit, Copy, ChevronDown,
  Users, Loader2
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { ContactForm } from '../../components/contacts/ContactForm'
import { ImportWizard } from '../../components/contacts/ImportWizard'
import { formatDate, initials } from '../../lib/utils'
import {
  useContacts, useCreateContact, useUpdateContact, useDeleteContact, useDeleteContacts
} from '../../hooks/useContacts'
import { useLists, useAddContactsToList } from '../../hooks/useLists'
import type { Contact, ContactStatus } from '../../types'

const statusConfig: Record<ContactStatus, { label: string; variant: 'success' | 'info' | 'default' | 'warning' | 'danger' }> = {
  active: { label: 'Ativo', variant: 'success' },
  customer: { label: 'Cliente', variant: 'info' },
  lead: { label: 'Lead', variant: 'warning' },
  inactive: { label: 'Inativo', variant: 'default' },
  unsubscribed: { label: 'Descadastrado', variant: 'danger' },
}

export function ContactsPage() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [showAddToList, setShowAddToList] = useState(false)
  const [addListError, setAddListError] = useState<string | null>(null)

  const { data: contacts = [], isLoading, error } = useContacts(search)
  const createContact = useCreateContact()
  const updateContact = useUpdateContact()
  const deleteContact = useDeleteContact()
  const deleteContacts = useDeleteContacts()
  const { data: lists = [] } = useLists()
  const addContactsToList = useAddContactsToList()

  const toggleSelect = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])

  const toggleAll = () =>
    setSelected(selected.length === contacts.length ? [] : contacts.map((c) => c.id))

  const handleSave = async (data: Partial<Contact>) => {
    try {
      setSaveError(null)
      if (editingContact) {
        await updateContact.mutateAsync({ id: editingContact.id, values: data })
      } else {
        await createContact.mutateAsync(data)
      }
      setShowForm(false)
      setEditingContact(null)
    } catch (err: any) {
      setSaveError(err?.message ?? 'Erro ao salvar contato. Tente novamente.')
    }
  }

  const handleAddToList = async (listId: string) => {
    try {
      setAddListError(null)
      await addContactsToList.mutateAsync({ listId, contactIds: selected })
      setShowAddToList(false)
      setSelected([])
    } catch (err: any) {
      setAddListError(err?.message ?? 'Erro ao adicionar à lista.')
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingContact(null)
    setSaveError(null)
  }

  const handleDelete = async (id: string) => {
    await deleteContact.mutateAsync(id)
    setActiveMenu(null)
  }

  const handleBulkDelete = async () => {
    await deleteContacts.mutateAsync(selected)
    setSelected([])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Contatos</h1>
          <p className="text-zinc-500 mt-1">
            {isLoading ? 'Carregando...' : `${contacts.length.toLocaleString('pt-BR')} contatos no total`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Download size={14} />}>
            Exportar
          </Button>
          <Button variant="secondary" size="sm" icon={<Upload size={14} />} onClick={() => setShowImport(true)}>
            Importar
          </Button>
          <Button size="sm" icon={<Plus size={14} />} onClick={() => { setSaveError(null); setShowForm(true) }}>
            Novo contato
          </Button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Buscar por nome, e-mail ou empresa..."
            icon={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" size="sm" icon={<Filter size={14} />}>
          Filtrar
          <ChevronDown size={12} />
        </Button>
        <Button variant="outline" size="sm" icon={<Tag size={14} />}>
          Tags
          <ChevronDown size={12} />
        </Button>
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 bg-zinc-900 text-white px-4 py-2.5 rounded-xl">
          <span className="text-sm font-medium">{selected.length} selecionado{selected.length > 1 ? 's' : ''}</span>
          <div className="flex-1" />
          <Button variant="ghost" size="xs" className="text-white hover:bg-zinc-800" onClick={() => { setAddListError(null); setShowAddToList(true) }}>
            <Users size={12} /> Adicionar à lista
          </Button>
          <Button
            variant="ghost" size="xs" className="text-red-400 hover:bg-zinc-800"
            loading={deleteContacts.isPending}
            onClick={handleBulkDelete}
          >
            <Trash2 size={12} /> Excluir
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-zinc-100 rounded-xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-zinc-400" />
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-sm text-red-500">Erro ao carregar contatos. Verifique sua conexão.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-left p-4 w-10">
                    <input
                      type="checkbox"
                      checked={selected.length === contacts.length && contacts.length > 0}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-zinc-300 text-zinc-900"
                    />
                  </th>
                  <th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase tracking-wide">Contato</th>
                  <th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden md:table-cell">Empresa</th>
                  <th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Tags</th>
                  <th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden md:table-cell">Status</th>
                  <th className="text-left p-4 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Cadastrado</th>
                  <th className="w-10 p-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-zinc-50 transition-colors group">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(contact.id)}
                        onChange={() => toggleSelect(contact.id)}
                        className="w-4 h-4 rounded border-zinc-300 text-zinc-900"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-zinc-600">
                            {initials(`${contact.first_name} ${contact.last_name || ''}`)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900">
                            {contact.first_name} {contact.last_name}
                          </p>
                          <p className="text-xs text-zinc-400 flex items-center gap-1">
                            <Mail size={10} />
                            {contact.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      {contact.company && (
                        <div className="flex items-center gap-1.5 text-sm text-zinc-600">
                          <Building2 size={12} className="text-zinc-400" />
                          <span className="truncate max-w-[160px]">{contact.company}</span>
                        </div>
                      )}
                      {contact.job_title && (
                        <p className="text-xs text-zinc-400 mt-0.5">{contact.job_title}</p>
                      )}
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(contact.tags ?? []).slice(0, 2).map((tag) => (
                          <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-zinc-100 text-zinc-600">
                            {tag}
                          </span>
                        ))}
                        {(contact.tags ?? []).length > 2 && (
                          <span className="text-xs text-zinc-400">+{contact.tags.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <Badge variant={statusConfig[contact.status].variant}>
                        {statusConfig[contact.status].label}
                      </Badge>
                    </td>
                    <td className="p-4 hidden lg:table-cell">
                      <span className="text-xs text-zinc-400">{formatDate(contact.created_at)}</span>
                    </td>
                    <td className="p-4">
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenu(activeMenu === contact.id ? null : contact.id)}
                          className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                        {activeMenu === contact.id && (
                          <div className="absolute right-0 top-8 w-40 bg-white border border-zinc-200 rounded-xl shadow-xl z-10 py-1 animate-in fade-in zoom-in-95 duration-100">
                            <button
                              onClick={() => { setEditingContact(contact); setShowForm(true); setActiveMenu(null) }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                            >
                              <Edit size={13} /> Editar
                            </button>
                            <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                              <Copy size={13} /> Duplicar
                            </button>
                            <button className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
                              <Mail size={13} /> Enviar e-mail
                            </button>
                            <div className="border-t border-zinc-100 my-1" />
                            <button
                              onClick={() => handleDelete(contact.id)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={13} /> Excluir
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && contacts.length === 0 && (
          <div className="py-16 text-center">
            <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={20} className="text-zinc-400" />
            </div>
            <p className="text-sm font-medium text-zinc-900">Nenhum contato ainda</p>
            <p className="text-xs text-zinc-400 mt-1 mb-4">Adicione seu primeiro contato ou importe uma lista.</p>
            <Button size="sm" icon={<Plus size={14} />} onClick={() => setShowForm(true)}>
              Novo contato
            </Button>
          </div>
        )}

        {contacts.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100">
            <p className="text-xs text-zinc-400">{contacts.length} contatos</p>
          </div>
        )}
      </div>

      {/* Contact Form Modal */}
      <Modal
        open={showForm}
        onClose={handleCloseForm}
        title={editingContact ? 'Editar contato' : 'Novo contato'}
        size="lg"
      >
        <ContactForm
          contact={editingContact}
          onSave={handleSave}
          onCancel={handleCloseForm}
          isSaving={createContact.isPending || updateContact.isPending}
          error={saveError}
        />
      </Modal>

      {/* Import Wizard */}
      <ImportWizard open={showImport} onClose={() => setShowImport(false)} />

      {/* Add to list modal */}
      <Modal open={showAddToList} onClose={() => setShowAddToList(false)} title={`Adicionar ${selected.length} contato${selected.length > 1 ? 's' : ''} à lista`} size="sm">
        <div className="space-y-3">
          {lists.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-zinc-500 mb-2">Nenhuma lista criada ainda.</p>
              <a href="/app/lists" className="text-sm font-medium text-zinc-900 hover:underline">Criar lista →</a>
            </div>
          ) : (
            lists.map(list => (
              <button
                key={list.id}
                onClick={() => handleAddToList(list.id)}
                disabled={addContactsToList.isPending}
                className="w-full flex items-center justify-between p-4 border border-zinc-200 rounded-xl hover:border-zinc-900 hover:bg-zinc-50 transition-all text-left disabled:opacity-50"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-900">{list.name}</p>
                  {list.description && <p className="text-xs text-zinc-400">{list.description}</p>}
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-sm font-semibold text-zinc-900">{(list.contact_count ?? 0).toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-zinc-400">contatos</p>
                </div>
              </button>
            ))
          )}
          {addListError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{addListError}</p>
          )}
        </div>
      </Modal>
    </div>
  )
}
