import { Card as MuiCard } from '@mui/material'
import CardActions from '@mui/material/CardActions'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import GroupIcon from '@mui/icons-material/Group'
import CommentIcon from '@mui/icons-material/Comment'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import AttachmentIcon from '@mui/icons-material/Attachment'
import DeleteIcon from '@mui/icons-material/Delete'
import IconButton from '@mui/material/IconButton'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDispatch } from 'react-redux'
import { updateCurrentActiveCard, showModalActiveCard } from '~/redux/activeCard/activeCardSlice'
import { deleteCardAPI } from '~/redux/activeBoard/activeBoardSlice'
import EventNoteIcon from '@mui/icons-material/EventNote' // Icon lịch nhỏ
import dayjs from 'dayjs'
import Box from '@mui/material/Box'

function Card({ card }) {
  const dispatch = useDispatch()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card._id,
    data: { ...card }
  })
  
  const dndKitCardStyle = {
    // touchAction: 'none', // Dành cho sensor default dạng PointerSensor
    // Nếu sử dụng CSS.Transform như docs sẽ lỗi kiểu strech
    // http://github.com/clauderic/dnd-kit/issues/117
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : undefined,
    border: isDragging ? '1px solid #2ecc71' : undefined
  }

  const shouldShowCardActions = () => {
    return !!card?.memberIds?.length || !!card?.comments?.length || !!card?.attachments?.length
  }

  const setActiveCard = (e) => {
    // Ngăn không cho click vào delete button trigger modal
    if (e.target.closest('.delete-card-btn')) {
      return
    }
    
    // Cập nhật data cho activeCard trong redux
    dispatch(updateCurrentActiveCard(card))
    // Hiện Modal ActiveCard lên
    dispatch(showModalActiveCard())
  }

  const handleDeleteCard = (e) => {
    e.stopPropagation() // Ngăn event bubbling
    
    if (window.confirm('Bạn có chắc chắn muốn xóa card này không?')) {
      dispatch(deleteCardAPI(card._id))
        .unwrap()
        .then(() => {
          console.log('Card deleted successfully!')
        })
        .catch((error) => {
          console.error('Error deleting card:', error)
          alert('Có lỗi xảy ra khi xóa card. Vui lòng thử lại!')
        })
    }
  }

  // Format ngày, ví dụ format dạng 'DD/MM/YYYY' hoặc 'MMM D'
  const formattedDueDate = card.dueDate ? dayjs(card.dueDate).format('DD/MM/YYYY') : null

  return (
    <div>
      <MuiCard
        onClick={setActiveCard}
        ref={setNodeRef} 
        style={dndKitCardStyle} 
        {...attributes} 
        {...listeners}
        sx={{
          cursor: 'pointer',
          boxShadow: '0 1px 1px rgba(0,0,0,0.2)',
          overflow: 'unset',
          opacity: card.FE_PlaceholderCard ? '0' : '1',
          minWidth: card.FE_PlaceholderCard ? '280px' : 'unset',
          pointerEvents: card.FE_PlaceholderCard ? 'none' : 'unset',
          position: card.FE_PlaceholderCard ? 'fixed' : 'unset',
          border: '1px solid transparent',
          '&:hover': { 
            borderColor: (theme) => theme.palette.primary.main,
            '& .delete-card-btn': {
              opacity: 1
            }
          }
        }}>
        
        {card?.cover && <CardMedia sx={{ height: 140 }} image={card?.cover} />}
        
        <CardContent sx={{ p: 1.5, '&:last-child': { p: 1.5 }, position: 'relative' }}>
          {/* Delete Button - Only show on hover */}
          {!card.FE_PlaceholderCard && (
            <IconButton
              className="delete-card-btn"
              size="small"
              onClick={handleDeleteCard}
              sx={{
                position: 'absolute',
                top: 4,
                right: 4,
                opacity: 0,
                transition: 'opacity 0.2s',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                  color: 'error.main'
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}

          {/* Label Color Indicator - Updated positioning and styling */}
          {card.labelColor && (
            <Box sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 32,
              height: 8,
              borderRadius: 4,
              bgcolor: card.labelColor,
              boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }} />
          )}
          
          <Typography>{card?.title}</Typography>
          
          {/* Hiển thị dueDate nếu có */}
          {formattedDueDate && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
            >
              <EventNoteIcon fontSize="small" />
              {formattedDueDate}
            </Typography>
          )}
        </CardContent>
        
        {shouldShowCardActions() &&
          <CardActions sx={{ p: '0 4px 8px 4px' }}>
            {!!card?.memberIds?.length && 
              <Button size="small" startIcon={<GroupIcon />}>
                {card?.memberIds?.length}
              </Button>
            }
            {!!card?.comments?.length && 
              <Button size="small" startIcon={<CommentIcon />}>
                {card?.comments?.length}
              </Button>
            }
            {!!card?.attachments?.length && 
              <Button size="small" startIcon={<AttachmentIcon />}>
                {card?.attachments?.length}
              </Button>
            }
          </CardActions>
        }
      </MuiCard>
    </div>
  )
}

export default Card