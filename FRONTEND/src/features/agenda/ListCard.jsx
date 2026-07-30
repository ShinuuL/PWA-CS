import { useState, useRef, useEffect } from 'react'
import './ListCard.css'

export default function ListCard({ list, itemCount, completedCount, onClick, onRename, onDelete }) {
  const [showMenu, setShowMenu] = useState(false)
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })
  const menuRef = useRef(null)
  const longPressTimer = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [showMenu])

  const handleContextMenu = (e) => {
    e.preventDefault()
    setMenuPos({ x: e.clientX, y: e.clientY })
    setShowMenu(true)
  }

  const handleTouchStart = (e) => {
    longPressTimer.current = setTimeout(() => {
      const touch = e.touches[0]
      setMenuPos({ x: touch.clientX, y: touch.clientY })
      setShowMenu(true)
    }, 500)
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
  }

  const handleRename = () => {
    setShowMenu(false)
    onRename(list)
  }

  const handleDelete = () => {
    setShowMenu(false)
    onDelete(list)
  }

  return (
    <div
      className="list-card"
      onClick={() => onClick(list)}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(list) }}
    >
      <div
        className="list-card__accent"
        style={{ backgroundColor: list.color || 'var(--color-primary)' }}
      />
      <div className="list-card__body">
        <span className="list-card__name">{list.name}</span>
        <span className="list-card__count">
          {completedCount}/{itemCount} concluidos
        </span>
        {itemCount > 0 && (
          <div className="list-card__progress">
            <div
              className="list-card__progress-fill"
              style={{
                width: `${(completedCount / itemCount) * 100}%`,
                backgroundColor: list.color || 'var(--color-primary)'
              }}
            />
          </div>
        )}
      </div>

      {showMenu && (
        <div
          ref={menuRef}
          className="list-card__menu"
          style={{ top: menuPos.y, left: menuPos.x }}
        >
          <button className="list-card__menu-item" onClick={handleRename} type="button">
            Renomear
          </button>
          <button className="list-card__menu-item list-card__menu-item--danger" onClick={handleDelete} type="button">
            Excluir
          </button>
        </div>
      )}
    </div>
  )
}
