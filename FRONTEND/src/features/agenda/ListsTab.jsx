import { useState, useMemo, useEffect } from 'react'
import { Plus, List, ChevronDown, ChevronRight, Trash2, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import useTodoStore from '../../stores/todoStore'
import useAuthStore from '../../stores/authStore'
import { supabase } from '../../shared/lib/supabase'
import ListCard from './ListCard'
import ListForm from './ListForm'
import ItemForm from './ItemForm'
import ItemRow from './ItemRow'
import './ListsTab.css'

export default function ListsTab() {
  const { lists, items, loading, error, createList, updateList, deleteList, createItem, updateItem, toggleItem, deleteItem, getItemsForList } = useTodoStore()
  const user = useAuthStore((s) => s.user)

  const [activeListId, setActiveListId] = useState(null)
  const [showListForm, setShowListForm] = useState(false)
  const [editList, setEditList] = useState(null)
  const [showItemForm, setShowItemForm] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [completedExpanded, setCompletedExpanded] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState(new Set())
  const [profiles, setProfiles] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleteItemConfirm, setDeleteItemConfirm] = useState(null)

  // Resolve partner ID from items
  const partnerId = useMemo(() => {
    if (!user) return null
    const otherCreator = items.find(i => i.created_by && i.created_by !== user.id)
    return otherCreator?.created_by || null
  }, [items, user])

  // Fetch profiles for assignee badges
  useEffect(() => {
    const resolveUserId = (val) => {
      if (val === 'me') return user?.id
      if (val === 'partner') return partnerId
      // Already a UUID
      if (val && val.includes('-')) return val
      return null
    }

    const userIds = [...new Set([
      ...items.map(i => i.created_by).filter(Boolean),
      ...items.map(i => resolveUserId(i.assigned_to)).filter(Boolean)
    ])]
    const missing = userIds.filter(id => !profiles[id])
    if (missing.length === 0) return

    const fetchProfiles = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', missing)
      if (data) {
        const map = {}
        data.forEach(p => { map[p.id] = p })
        setProfiles(prev => ({ ...prev, ...map }))
      }
    }
    fetchProfiles()
  }, [items, profiles, user, partnerId])

  const activeList = useMemo(() => lists.find(l => l.id === activeListId), [lists, activeListId])

  const activeItems = useMemo(() => {
    if (!activeListId) return []
    return getItemsForList(activeListId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeListId, items, getItemsForList])

  const { pendingItems, completedItems } = useMemo(() => {
    return {
      pendingItems: activeItems.filter(i => !i.completed),
      completedItems: activeItems.filter(i => i.completed)
    }
  }, [activeItems])

  const handleCreateList = async (formData) => {
    const result = await createList(formData)
    if (result.error) {
      toast.error('Erro ao criar lista')
    } else {
      toast.success('Lista criada!')
      setShowListForm(false)
    }
  }

  const handleRenameList = async (formData) => {
    if (!editList) return
    const result = await updateList(editList.id, formData)
    if (result.error) {
      toast.error('Erro ao renomear lista')
    } else {
      toast.success('Lista renomeada!')
      setEditList(null)
      setShowListForm(false)
    }
  }

  const handleDeleteList = async () => {
    if (!deleteConfirm) return
    const result = await deleteList(deleteConfirm.id)
    if (result.error) {
      toast.error('Erro ao excluir lista')
    } else {
      toast.success('Lista excluida!')
      if (activeListId === deleteConfirm.id) setActiveListId(null)
      setDeleteConfirm(null)
    }
  }

  const handleCreateItem = async (formData) => {
    const result = await createItem({ ...formData, list_id: activeListId })
    if (result.error) {
      toast.error('Erro ao criar item')
    } else {
      toast.success('Item criado!')
      setShowItemForm(false)
    }
  }

  const handleEditItem = async (formData) => {
    if (!editItem) return
    const result = await updateItem(editItem.id, formData)
    if (result.error) {
      toast.error('Erro ao atualizar item')
    } else {
      toast.success('Item atualizado!')
      setEditItem(null)
      setShowItemForm(false)
    }
  }

  const handleDeleteItem = async () => {
    if (!deleteItemConfirm) return
    const result = await deleteItem(deleteItemConfirm.id)
    if (result.error) {
      toast.error('Erro ao excluir item')
    } else {
      toast.success('Item excluido!')
      setDeleteItemConfirm(null)
    }
  }

  const handleBulkDelete = async () => {
    for (const itemId of selectedItems) {
      await deleteItem(itemId)
    }
    setSelectedItems(new Set())
    setEditMode(false)
    toast.success(`${selectedItems.size} item(s) excluido(s)`)
  }

  const openEditList = (list) => {
    setEditList(list)
    setShowListForm(true)
  }

  const openEditItem = (item) => {
    if (editMode) return
    setEditItem(item)
    setShowItemForm(true)
  }

  const closeListForm = () => {
    setShowListForm(false)
    setEditList(null)
  }

  const closeItemForm = () => {
    setShowItemForm(false)
    setEditItem(null)
  }

  if (loading) {
    return (
      <div className="lists-tab">
        <div className="lists-tab__skeleton">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="list-card-skeleton" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="lists-tab lists-tab--error">
        <p>Algo deu errado — Tente novamente</p>
        <button className="lists-tab__retry" onClick={() => window.location.reload()} type="button">
          Tentar novamente
        </button>
      </div>
    )
  }

  // Grid view (no active list selected)
  if (!activeListId) {
    return (
      <div className="lists-tab">
        {lists.length === 0 ? (
          <div className="lists-tab__empty">
            <List size={40} strokeWidth={1.5} color="var(--color-text-secondary)" />
            <p className="lists-tab__empty-title">Nenhuma lista</p>
            <span className="lists-tab__empty-text">Crie sua primeira lista compartilhada</span>
            <button className="lists-tab__empty-cta" onClick={() => setShowListForm(true)} type="button">
              Criar lista
            </button>
          </div>
        ) : (
          <div className="lists-tab__grid">
            {lists.map(list => {
              const listItems = items.filter(i => i.list_id === list.id)
              const completedCount = listItems.filter(i => i.completed).length
              return (
                <ListCard
                  key={list.id}
                  list={list}
                  itemCount={listItems.length}
                  completedCount={completedCount}
                  onClick={(l) => setActiveListId(l.id)}
                  onRename={openEditList}
                  onDelete={(l) => setDeleteConfirm(l)}
                />
              )
            })}
          </div>
        )}

        <button className="lists-tab__fab" onClick={() => setShowListForm(true)} type="button">
          <Plus size={24} />
        </button>

        {showListForm && (
          <div className="lists-tab__modal-overlay" onClick={closeListForm}>
            <div className="lists-tab__modal" onClick={(e) => e.stopPropagation()}>
              <h3 className="lists-tab__modal-title">
                {editList ? 'Renomear lista' : 'Criar lista'}
              </h3>
              <ListForm
                onSubmit={editList ? handleRenameList : handleCreateList}
                onCancel={closeListForm}
                initialList={editList}
              />
            </div>
          </div>
        )}

        {deleteConfirm && (
          <div className="lists-tab__modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="lists-tab__modal lists-tab__modal--confirm" onClick={(e) => e.stopPropagation()}>
              <p>Excluir <strong>{deleteConfirm.name}</strong>? Todos os itens serao removidos.</p>
              <div className="lists-tab__confirm-actions">
                <button className="lists-tab__confirm-cancel" onClick={() => setDeleteConfirm(null)} type="button">
                  Cancelar
                </button>
                <button className="lists-tab__confirm-delete" onClick={handleDeleteList} type="button">
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Item view (list selected)
  return (
    <div className="lists-tab lists-tab--item-view">
      <div className="lists-tab__chips">
        <button className="lists-tab__back" onClick={() => { setActiveListId(null); setEditMode(false) }} type="button">
          <ArrowLeft size={20} />
        </button>
        <div className="lists-tab__chips-scroll">
          {lists.map(list => (
            <button
              key={list.id}
              className={`lists-tab__chip ${list.id === activeListId ? 'lists-tab__chip--active' : ''}`}
              onClick={() => setActiveListId(list.id)}
              type="button"
            >
              <span className="lists-tab__chip-dot" style={{ backgroundColor: list.color || 'var(--color-primary)' }} />
              {list.name}
            </button>
          ))}
          <button className="lists-tab__chip lists-tab__chip--add" onClick={() => setShowListForm(true)} type="button">
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className="lists-tab__items-header">
        <span className="lists-tab__items-title">{activeList?.name}</span>
        <button
          className={`lists-tab__edit-toggle ${editMode ? 'lists-tab__edit-toggle--active' : ''}`}
          onClick={() => { setEditMode(!editMode); setSelectedItems(new Set()) }}
          type="button"
        >
          {editMode ? 'Cancelar' : 'Editar'}
        </button>
      </div>

      {editMode && selectedItems.size > 0 && (
        <div className="lists-tab__bulk-actions">
          <span>{selectedItems.size} selecionado(s)</span>
          <button className="lists-tab__bulk-delete" onClick={handleBulkDelete} type="button">
            <Trash2 size={16} /> Excluir
          </button>
        </div>
      )}

      <div className="lists-tab__items">
        {pendingItems.length === 0 && completedItems.length === 0 ? (
          <div className="lists-tab__empty-items">
            <p className="lists-tab__empty-items-title">Nenhum item</p>
            <span className="lists-tab__empty-items-text">Adicione o primeiro item a esta lista</span>
          </div>
        ) : (
          <>
            {pendingItems.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                profiles={profiles}
                currentUser={user}
                partnerId={partnerId}
                onToggle={toggleItem}
                onEdit={openEditItem}
                onDelete={(item) => setDeleteItemConfirm(item)}
                editMode={editMode}
                selected={selectedItems.has(item.id)}
                onSelect={(id) => {
                  const next = new Set(selectedItems)
                  if (next.has(id)) next.delete(id)
                  else next.add(id)
                  setSelectedItems(next)
                }}
              />
            ))}

            {completedItems.length > 0 && (
              <div className="lists-tab__completed-section">
                <button
                  className="lists-tab__completed-header"
                  onClick={() => setCompletedExpanded(!completedExpanded)}
                  type="button"
                >
                  <span className="lists-tab__completed-label">Concluidos</span>
                  <span className="lists-tab__completed-badge">{completedItems.length}</span>
                  {completedExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
                {completedExpanded && (
                  <div className="lists-tab__completed-list">
                    {completedItems.map(item => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        profiles={profiles}
                        currentUser={user}
                        partnerId={partnerId}
                        onToggle={toggleItem}
                        onEdit={openEditItem}
                        onDelete={(item) => setDeleteItemConfirm(item)}
                        editMode={editMode}
                        selected={selectedItems.has(item.id)}
                        onSelect={(id) => {
                          const next = new Set(selectedItems)
                          if (next.has(id)) next.delete(id)
                          else next.add(id)
                          setSelectedItems(next)
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <button className="lists-tab__fab" onClick={() => setShowItemForm(true)} type="button">
        <Plus size={24} />
      </button>

      {showListForm && (
        <div className="lists-tab__modal-overlay" onClick={closeListForm}>
          <div className="lists-tab__modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="lists-tab__modal-title">
              {editList ? 'Renomear lista' : 'Criar lista'}
            </h3>
            <ListForm
              onSubmit={editList ? handleRenameList : handleCreateList}
              onCancel={closeListForm}
              initialList={editList}
            />
          </div>
        </div>
      )}

      {showItemForm && (
        <div className="lists-tab__modal-overlay" onClick={closeItemForm}>
          <div className="lists-tab__modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="lists-tab__modal-title">
              {editItem ? 'Editar item' : 'Criar item'}
            </h3>
            <ItemForm
              onSubmit={editItem ? handleEditItem : handleCreateItem}
              onCancel={closeItemForm}
              initialItem={editItem}
            />
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="lists-tab__modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="lists-tab__modal lists-tab__modal--confirm" onClick={(e) => e.stopPropagation()}>
            <p>Excluir <strong>{deleteConfirm.name}</strong>? Todos os itens serao removidos.</p>
            <div className="lists-tab__confirm-actions">
              <button className="lists-tab__confirm-cancel" onClick={() => setDeleteConfirm(null)} type="button">
                Cancelar
              </button>
              <button className="lists-tab__confirm-delete" onClick={handleDeleteList} type="button">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteItemConfirm && (
        <div className="lists-tab__modal-overlay" onClick={() => setDeleteItemConfirm(null)}>
          <div className="lists-tab__modal lists-tab__modal--confirm" onClick={(e) => e.stopPropagation()}>
            <p>Excluir este item?</p>
            <div className="lists-tab__confirm-actions">
              <button className="lists-tab__confirm-cancel" onClick={() => setDeleteItemConfirm(null)} type="button">
                Cancelar
              </button>
              <button className="lists-tab__confirm-delete" onClick={handleDeleteItem} type="button">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
