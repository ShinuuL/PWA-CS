import { useState, useMemo } from 'react'
import { format, setHours, setMinutes, isBefore, startOfMinute } from 'date-fns'
import toast from 'react-hot-toast'
import CalendarGrid from './CalendarGrid'
import TimePicker from './TimePicker'
import './DateTimePicker.css'

export default function DateTimePicker({
  value = null,
  onChange,
  onCancel,
  minDate = null
}) {
  const initialDate = value ? new Date(value) : new Date()

  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [selectedTime, setSelectedTime] = useState(() => ({
    hour: format(initialDate, 'HH'),
    minute: format(initialDate, 'mm')
  }))

  const displayMonth = useMemo(() => {
    return selectedDate
  }, [selectedDate])

  const handleDayClick = (day) => {
    setSelectedDate(day)
  }

  const handleMonthChange = (newMonth) => {
    setSelectedDate(newMonth)
  }

  const handleTimeChange = (newTime) => {
    setSelectedTime(newTime)
  }

  const handleConfirm = () => {
    let combined = new Date(selectedDate)
    combined = setHours(combined, parseInt(selectedTime.hour, 10))
    combined = setMinutes(combined, parseInt(selectedTime.minute, 10))
    combined = startOfMinute(combined)

    if (minDate && isBefore(combined, startOfMinute(minDate))) {
      toast.error('Selecione uma data no futuro')
      return
    }

    onChange(combined)
  }

  return (
    <div className="datetime-picker">
      <div className="datetime-picker__section">
        <span className="datetime-picker__section-label">Data</span>
        <CalendarGrid
          currentMonth={displayMonth}
          onMonthChange={handleMonthChange}
          onDayClick={handleDayClick}
        />
      </div>

      <div className="datetime-picker__section">
        <span className="datetime-picker__section-label">Horário</span>
        <TimePicker
          value={selectedTime}
          onChange={handleTimeChange}
        />
      </div>

      <div className="datetime-picker__actions">
        <button
          type="button"
          className="datetime-picker__btn datetime-picker__btn--cancel"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="datetime-picker__btn datetime-picker__btn--submit"
          onClick={handleConfirm}
        >
          Confirmar
        </button>
      </div>
    </div>
  )
}
