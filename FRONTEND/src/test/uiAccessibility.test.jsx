import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AlbumGrid from '../features/album/AlbumGrid'
import ListCard from '../features/agenda/ListCard'
import TimePicker from '../features/agenda/TimePicker'

vi.mock('../shared/components/PrivateImage', () => ({
  default: ({ alt }) => <img src="/placeholder.png" alt={alt} />
}))

describe('interações acessíveis', () => {
  it('abre uma foto do álbum ao pressionar Enter ou Espaço', () => {
    const onPhotoTap = vi.fn()
    render(<AlbumGrid
      photos={[{ id: 'photo-1', user_id: 'user-1', url: 'photo.jpg', storage_path: 'pair/photo.jpg', caption: 'Pôr do sol', created_at: '2026-01-01T12:00:00Z' }]}
      currentUserId="user-1"
      onPhotoTap={onPhotoTap}
      onDeletePhoto={vi.fn()}
    />)

    const cell = screen.getByRole('button', { name: 'Pôr do sol' })
    fireEvent.keyDown(cell, { key: 'Enter' })
    fireEvent.keyDown(cell, { key: ' ' })
    expect(onPhotoTap).toHaveBeenCalledTimes(2)
  })

  it('abre uma lista com Espaço sem disparar duas vezes', () => {
    const onClick = vi.fn()
    render(<ListCard list={{ id: 'list-1', name: 'Compras', color: '#B87CFF' }} itemCount={2} completedCount={1} onClick={onClick} onRename={vi.fn()} onDelete={vi.fn()} />)
    fireEvent.keyDown(screen.getByRole('button', { name: /Compras/ }), { key: ' ' })
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('expõe cada valor do seletor de horário como botão nomeado', () => {
    render(<TimePicker value={{ hour: '09', minute: '00' }} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Hora 09' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Minutos 00' })).toBeInTheDocument()
  })
})
