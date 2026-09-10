import useChatStore from '../../stores/chatStore'
import useAlbumStore from '../../stores/albumStore'
import useDashboardStore from '../../stores/dashboardStore'
import useAgendaStore from '../../stores/agendaStore'
import useNotesStore from '../../stores/notesStore'
import useReminderStore from '../../stores/reminderStore'
import useTodoStore from '../../stores/todoStore'

export function clearPrivateState() {
  for (const store of [useChatStore, useAlbumStore, useDashboardStore, useAgendaStore, useNotesStore, useReminderStore, useTodoStore]) store.getState().cleanup()
  // Remove media cached by older service workers, including after an upgrade.
  if (typeof caches !== 'undefined') void caches.delete('supabase-storage').catch(() => {})
}
