import React from 'react'
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'
import { useDispatch } from 'react-redux'
import { callApiUpdateCard } from '~/redux/activeBoard/activeBoardSlice'
import { updateCardInBoard } from '~/redux/activeBoard/activeBoardSlice'

const LabelColorBox = styled(Box)(({ color, selected }) => ({
  width: 24,
  height: 24,
  borderRadius: 4,
  backgroundColor: color,
  cursor: 'pointer',
  border: selected ? '3px solid #000' : '2px solid transparent',
  transition: 'border-color 0.3s',
}))

const LABEL_COLORS = [
  '#61bd4f', // green
  '#f2d600', // yellow
  '#ff9f1a', // orange
  '#eb5a46', // red
  '#c377e0', // purple
  '#0079bf', // blue
  '#00c2e0', // sky blue
  '#51e898', // lime
  '#ff78cb', // pink
  '#344563', // dark gray
]

function LabelColorPicker({ currentCard, currentLabel, onChange }) {
  const dispatch = useDispatch()

  const handleColorChange = async (color) => {
    // Gọi callback onChange nếu có
    if (onChange) {
      onChange(color)
    }

    // Gọi API để cập nhật card
    if (currentCard?._id) {
      try {
        // Dispatch action để call API
        const resultAction = await dispatch(callApiUpdateCard({
          cardId: currentCard._id,
          labelColor: color
        }))

        // Nếu API thành công, cập nhật Redux store
        if (callApiUpdateCard.fulfilled.match(resultAction)) {
          dispatch(updateCardInBoard(resultAction.payload))
        }
      } catch (error) {
        console.error('Error updating card color:', error)
      }
    }
  }

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {LABEL_COLORS.map(color => (
        <LabelColorBox
          key={color}
          color={color}
          selected={currentLabel === color}
          onClick={() => handleColorChange(color)}
          title={color}
        />
      ))}
    </Box>
  )
}

export default LabelColorPicker