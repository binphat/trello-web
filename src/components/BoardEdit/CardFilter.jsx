import { useState } from 'react'
import { useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import FilterListIcon from '@mui/icons-material/FilterList'
import PersonIcon from '@mui/icons-material/Person'
import ClearIcon from '@mui/icons-material/Clear'
import Tooltip from '@mui/material/Tooltip'
import { selectCurrentUser } from '~/redux/User/userSlice'

const FILTER_STYLES = {
  color: 'white',
  backgroundColor: 'transparent',
  border: 'none',
  px: 1,
  borderRadius: 1,
  '.MuiSvgIcon-root': {
    color: 'white'
  },
  '&:hover': {
    bgcolor: 'primary.50'
  }
}

const ACTIVE_FILTER_STYLES = {
  ...FILTER_STYLES,
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  '&:hover': {
    bgcolor: 'rgba(255, 255, 255, 0.3)'
  }
}

function CardFilter({ onFilterChange }) {
  const currentUser = useSelector(selectCurrentUser)
  const [isFilterActive, setIsFilterActive] = useState(false)

  const handleToggleFilter = () => {
    const newFilterState = !isFilterActive
    setIsFilterActive(newFilterState)
    
    // Gọi callback để thông báo cho parent component về thay đổi filter
    onFilterChange({
      showMyCardsOnly: newFilterState,
      currentUserId: currentUser?._id
    })
  }

  const handleClearFilter = () => {
    setIsFilterActive(false)
    onFilterChange({
      showMyCardsOnly: false,
      currentUserId: null
    })
  }

  if (!currentUser) return null

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {isFilterActive ? (
        <Tooltip title="Bỏ lọc - Hiển thị tất cả card">
          <Chip
            sx={ACTIVE_FILTER_STYLES}
            icon={<ClearIcon />}
            label="Bỏ lọc"
            clickable
            onClick={handleClearFilter}
          />
        </Tooltip>
      ) : (
        <Tooltip title="Chỉ hiển thị card được giao cho tôi">
          <Chip
            sx={FILTER_STYLES}
            icon={<PersonIcon />}
            label="Card của tôi"
            clickable
            onClick={handleToggleFilter}
          />
        </Tooltip>
      )}
    </Box>
  )
}

export default CardFilter