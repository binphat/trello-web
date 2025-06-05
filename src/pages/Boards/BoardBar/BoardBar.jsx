import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import DashboardIcon from '@mui/icons-material/Dashboard'
import VpnLockIcon from '@mui/icons-material/VpnLock'
import StarIcon from '@mui/icons-material/Star'
import Tooltip from '@mui/material/Tooltip'
import { capitalizeFirstLetter } from '~/utils/formatters'
import BoardUserGroup from './BoardUserGroup'
import InviteBoardUser from './InviteBoardUser'
import CardFilter from '~/components/BoardEdit/CardFilter' // Import component mới
import { useSelector } from 'react-redux'
import { selectCurrentUser } from '~/redux/User/userSlice'
import { selectEvaluationCriteria } from '~/redux/activeEvaluation/activeEvaluationSlice'
import EvaluationCriteriaEditor from '~/components/Evaluation/EvaluationCriteriaEditor'
import EvaluationOverviewModal from '~/components/Evaluation/EvaluationOverviewModal'
import MyEvaluationResultsModal from '~/components/Evaluation/MyEvaluationResultsModal'
import { toast } from 'react-toastify'

const MENU_STYLES = {
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

function BoardBar({ board, onCardFilterChange }) {
  const currentUser = useSelector(selectCurrentUser)
  const isOwner = board?.ownerIds?.includes(currentUser?._id)
  const navigate = useNavigate()
  const evaluationCriteria = useSelector(selectEvaluationCriteria)
  
  const [openEvaluationModal, setOpenEvaluationModal] = useState(false)
  const [openOverviewModal, setOpenOverviewModal] = useState(false)
  const [openMyResultsModal, setOpenMyResultsModal] = useState(false)
  const [hasEvaluationCriteria, setHasEvaluationCriteria] = useState(false)

  // Kiểm tra xem board đã có tiêu chí đánh giá chưa
  useEffect(() => {
    if (evaluationCriteria && evaluationCriteria.length > 0) {
      setHasEvaluationCriteria(true)
    } else {
      setHasEvaluationCriteria(false)
    }
  }, [evaluationCriteria])

  const handleNavigateToEvaluation = () => {
    if (hasEvaluationCriteria) {
      toast.info('Board này đã có tiêu chí đánh giá rồi', { theme: 'colored' })
      return
    }
    setOpenEvaluationModal(true)
  }

  const handleNavigateToTotal = () => {
    setOpenMyResultsModal(true)
  }

  const handleCloseEvaluationModal = () => {
    setOpenEvaluationModal(false)
  }

  const handleCloseMyResultsModal = () => {
    setOpenMyResultsModal(false)
  }

  // Xử lý thay đổi filter
  const handleCardFilterChange = (filterConfig) => {
    if (onCardFilterChange) {
      onCardFilterChange(filterConfig)
    }
  }

  if (!board) return null

  return (
    <Box
      sx={{
        width: '100%',
        height: (theme) => theme.trello.boardBarHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        px: 2,
        overflowX: 'auto',
        bgcolor: (theme) =>
          theme.palette.mode === 'dark' ? '#34495e' : '#1976d2',
        '&::-webkit-scrollbar-track': {
          m: 2
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Tooltip title={board.description || ''}>
          <Chip
            sx={MENU_STYLES}
            icon={<DashboardIcon />}
            label={board.title || 'Untitled'}
            clickable
          />
        </Tooltip>
        {isOwner && (
          <Tooltip title={hasEvaluationCriteria ? 'Board đã có tiêu chí đánh giá' : 'Tạo đánh giá'}>
            <Chip
              sx={{
                ...MENU_STYLES,
                ...(hasEvaluationCriteria && {
                  opacity: 0.7,
                  cursor: 'not-allowed'
                })
              }}
              icon={<StarIcon />}
              label="Tạo Đánh Giá"
              clickable={!hasEvaluationCriteria}
              onClick={handleNavigateToEvaluation}
            />
          </Tooltip>
        )}
        <Tooltip title="Đánh giá">
          <Chip
            sx={MENU_STYLES}
            icon={<StarIcon />}
            label="Đánh giá"
            clickable
            onClick={() => setOpenOverviewModal(true)}
          />
        </Tooltip>
        <Tooltip title="Xem điểm">
          <Chip
            sx={MENU_STYLES}
            icon={<StarIcon />}
            label="Xem Điểm"
            clickable
            onClick={handleNavigateToTotal}
          />
        </Tooltip>
        
        {/* Thêm Card Filter component */}
        <CardFilter onFilterChange={handleCardFilterChange} />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <InviteBoardUser boardId={board._id} />
        <BoardUserGroup boardUsers={board.FE_allUsers || []} />
      </Box>

      <EvaluationCriteriaEditor
        open={openEvaluationModal}
        onClose={handleCloseEvaluationModal}
        board={board}
      />

      <EvaluationOverviewModal
        open={openOverviewModal}
        onClose={() => setOpenOverviewModal(false)}
        board={board}
      />

      <MyEvaluationResultsModal
        open={openMyResultsModal}
        onClose={handleCloseMyResultsModal}
        board={board}
      />
    </Box>
  )
}

export default BoardBar