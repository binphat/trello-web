// components/CardDatesPopover.jsx
import { Box, Button, Typography, Popover } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import dayjs from 'dayjs'
import { useState } from 'react'

function CardDatesPopover({ anchorEl, onClose, dueDate, onSave }) {
  const open = Boolean(anchorEl)
  const [selectedDate, setSelectedDate] = useState(dueDate ? dayjs(dueDate) : dayjs())

  const handleSave = () => {
    onSave(selectedDate.toISOString())
    onClose()
  }

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    >
      <Box sx={{ p: 2, width: 250 }}>
        <Typography fontWeight="bold" mb={1}>Due Date</Typography>
        <DateTimePicker
          value={selectedDate}
          onChange={newValue => setSelectedDate(newValue)}
          slotProps={{ textField: { fullWidth: true, size: 'small' } }}
        />
        <Button
          onClick={handleSave}
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
        >
          Save
        </Button>
      </Box>
    </Popover>
  )
}

export default CardDatesPopover
