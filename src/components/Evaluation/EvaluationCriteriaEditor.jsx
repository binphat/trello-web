import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import CheckIcon from '@mui/icons-material/Check'
import CancelIcon from '@mui/icons-material/Cancel'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import {
  selectEvaluationCriteria,
  addSingleEvaluationCriteria,
  deleteSingleEvaluationCriteria,
  updateSingleEvaluationCriteria,
  fetchEvaluationCriteriaThunk
} from '~/redux/activeEvaluation/activeEvaluationSlice'

// Danh sách tiêu chí mẫu theo từng danh mục
const SAMPLE_CRITERIA = {
  'Kỹ năng mềm': [
    'Kỹ năng giao tiếp',
    'Khả năng làm việc nhóm',
    'Khả năng lãnh đạo',
    'Tư duy sáng tạo',
    'Khả năng giải quyết vấn đề',
    'Khả năng thích ứng',
    'Quản lý thời gian',
    'Kỹ năng thuyết trình'
  ],
  'Kỹ năng nghề nghiệp': [
    'Kiến thức chuyên môn',
    'Kỹ năng phân tích',
    'Độ chính xác trong công việc',
    'Khả năng học hỏi',
    'Tính chủ động',
    'Tinh thần trách nhiệm',
    'Khả năng đổi mới',
    'Hiệu quả công việc'
  ],
  'Thái độ làm việc': [
    'Tinh thần trách nhiệm',
    'Sự tận tâm',
    'Tính kỷ luật',
    'Khả năng chịu áp lực',
    'Tinh thần hợp tác',
    'Sự nhiệt tình',
    'Tính kiên trì',
    'Thái độ tích cực'
  ],
  'Kỹ năng kỹ thuật': [
    'Kỹ năng lập trình',
    'Khả năng thiết kế',
    'Sử dụng công cụ',
    'Tư duy logic',
    'Khả năng debug',
    'Hiểu biết công nghệ',
    'Kỹ năng testing',
    'Quản lý dự án'
  ]
}

function EvaluationCriteriaEditor({ open, onClose, board }) {
  const dispatch = useDispatch()
  const existingCriteria = useSelector(selectEvaluationCriteria)

  const [newCriterion, setNewCriterion] = useState('')
  const [localCriteria, setLocalCriteria] = useState([])
  const [editIndex, setEditIndex] = useState(null)
  const [hasFetched, setHasFetched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasSynced, setHasSynced] = useState(false)
  const [deletingIndex, setDeletingIndex] = useState(null)
  const [addingCriteria, setAddingCriteria] = useState(new Set()) // Track các tiêu chí đang được thêm

  const inputRef = useRef()
  const mountedRef = useRef(true)

  // Reset mounted ref khi component unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // ✅ FIXED - Khi mở modal, fetch data từ server
  useEffect(() => {
    if (open && board?._id && !hasFetched) {
      const fetchCriteriaData = async () => {
        setIsLoading(true)
        try {
          console.log('🔄 Fetching evaluation criteria for board:', board._id)
          await dispatch(fetchEvaluationCriteriaThunk(board._id)).unwrap()
          setHasFetched(true)
        } catch (error) {
          console.error('❌ Error fetching criteria:', error)
          toast.error('Có lỗi khi tải tiêu chí đánh giá', { theme: 'colored' })
        } finally {
          if (mountedRef.current) {
            setIsLoading(false)
          }
        }
      }

      fetchCriteriaData()
    }
  }, [open, board?._id, hasFetched, dispatch])

  // Cập nhật localCriteria từ existingCriteria - chỉ sync 1 lần duy nhất
  useEffect(() => {
    console.log('🔍 Sync effect triggered:', {
      hasFetched,
      hasSynced,
      existingCriteriaLength: existingCriteria?.length,
      localCriteriaLength: localCriteria.length
    })

    if (hasFetched && Array.isArray(existingCriteria) && !hasSynced) {
      console.log('🔄 Syncing from Redux to local state')
      setLocalCriteria(existingCriteria.map(c => ({
        _id: c._id,
        title: c.title
      })))
      setHasSynced(true)
    }
  }, [existingCriteria, hasFetched, hasSynced])

  // Reset form khi đóng dialog
  useEffect(() => {
    if (!open) {
      setNewCriterion('')
      setLocalCriteria([])
      setEditIndex(null)
      setHasFetched(false)
      setIsLoading(false)
      setHasSynced(false)
      setDeletingIndex(null)
      setAddingCriteria(new Set())
    }
  }, [open])

  // Focus input khi edit
  useEffect(() => {
    if (editIndex !== null && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editIndex])

  // Hàm thêm tiêu chí mẫu
  const handleAddSampleCriterion = useCallback(async (criterionTitle) => {
    if (!board?._id) {
      toast.error('Không tìm thấy board ID', { theme: 'colored' })
      return
    }

    // Kiểm tra trùng lặp
    const isDuplicate = localCriteria.some(
      item => item.title.toLowerCase() === criterionTitle.toLowerCase()
    )
    if (isDuplicate) {
      toast.warn('Tiêu chí này đã tồn tại', { theme: 'colored' })
      return
    }

    // Đánh dấu đang thêm
    setAddingCriteria(prev => new Set([...prev, criterionTitle]))

    try {
      console.log('🚀 Adding sample criterion:', criterionTitle)
      const actionResult = await dispatch(
        addSingleEvaluationCriteria({ boardId: board._id, title: criterionTitle })
      ).unwrap()

      console.log('✅ Sample criterion added:', actionResult)

      if (mountedRef.current) {
        setLocalCriteria(prev => [...prev, actionResult])
        toast.success(`Đã thêm tiêu chí "${criterionTitle}"`, { theme: 'colored' })
      }
    } catch (error) {
      console.error('❌ Error adding sample criterion:', error)
      if (mountedRef.current) {
        toast.error(`Có lỗi khi thêm tiêu chí "${criterionTitle}"`, { theme: 'colored' })
      }
    } finally {
      if (mountedRef.current) {
        setAddingCriteria(prev => {
          const newSet = new Set(prev)
          newSet.delete(criterionTitle)
          return newSet
        })
      }
    }
  }, [localCriteria, board?._id, dispatch])

  const handleAddOrUpdateCriterion = useCallback(async () => {
    const trimmed = newCriterion.trim()

    // Validation
    if (!trimmed) {
      toast.warn('Vui lòng nhập tên tiêu chí', { theme: 'colored' })
      return
    }

    if (trimmed.length > 100) {
      toast.warn('Tên tiêu chí không được vượt quá 100 ký tự', { theme: 'colored' })
      return
    }

    const isDuplicate = localCriteria.some(
      (item, idx) => item.title.toLowerCase() === trimmed.toLowerCase() && idx !== editIndex
    )
    if (isDuplicate) {
      toast.warn('Tiêu chí này đã tồn tại', { theme: 'colored' })
      return
    }

    if (editIndex !== null) {
      // Edit mode - cần thêm API call để update
      const updated = [...localCriteria]
      updated[editIndex].title = trimmed
      setLocalCriteria(updated)
      setEditIndex(null)
      setNewCriterion('')
      toast.success('Cập nhật tiêu chí thành công', { theme: 'colored' })
      
      // TODO: Thêm API call để update criterion
      // try {
      //   await dispatch(updateSingleEvaluationCriteria({
      //     criterionId: updated[editIndex]._id,
      //     title: trimmed
      //   })).unwrap()
      // } catch (error) {
      //   console.error('Error updating criterion:', error)
      // }
    } else {
      // Add mode
      if (!board?._id) {
        toast.error('Không tìm thấy board ID', { theme: 'colored' })
        return
      }

      try {
        console.log('🚀 Adding new criterion:', trimmed)
        const actionResult = await dispatch(
          addSingleEvaluationCriteria({ boardId: board._id, title: trimmed })
        ).unwrap()

        console.log('✅ Action result:', actionResult)

        if (mountedRef.current) {
          console.log('📝 Updating local state')
          setLocalCriteria(prev => {
            console.log('Previous local criteria:', prev)
            const newState = [...prev, actionResult]
            console.log('New local criteria:', newState)
            return newState
          })
          setNewCriterion('')
        }
      } catch (error) {
        console.error(error)
        if (mountedRef.current) {
          toast.error('Có lỗi khi thêm tiêu chí', { theme: 'colored' })
        }
      }
    }
  }, [newCriterion, localCriteria, editIndex, board?._id, dispatch])

  const handleDeleteCriterion = useCallback(async (index) => {
    if (index < 0 || index >= localCriteria.length) return

    const criterionToDelete = localCriteria[index]
    const deletedTitle = criterionToDelete.title

    // Nếu có _id, gọi API để xóa từ database
    if (criterionToDelete._id) {
      setDeletingIndex(index)
      try {
        await dispatch(deleteSingleEvaluationCriteria(criterionToDelete._id)).unwrap()
        console.log('✅ Successfully deleted from API')
      } catch (error) {
        console.error('❌ Failed to delete criterion from API:', error)
        setDeletingIndex(null)
        return // Dừng lại nếu xóa API thất bại
      } finally {
        setDeletingIndex(null)
      }
    }

    // Xóa khỏi local state
    const updated = [...localCriteria]
    updated.splice(index, 1)
    setLocalCriteria(updated)

    if (editIndex === index) {
      setEditIndex(null)
      setNewCriterion('')
    } else if (editIndex !== null && editIndex > index) {
      setEditIndex(editIndex - 1)
    }

    toast.success(`Đã xóa tiêu chí "${deletedTitle}"`, { theme: 'colored' })
  }, [localCriteria, editIndex, dispatch])

  const handleEditCriterion = useCallback((index) => {
    if (index < 0 || index >= localCriteria.length) return

    setNewCriterion(localCriteria[index].title)
    setEditIndex(index)
  }, [localCriteria])

  const handleCancelEdit = useCallback(() => {
    setEditIndex(null)
    setNewCriterion('')
  }, [])

  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleAddOrUpdateCriterion()
    } else if (event.key === 'Escape' && editIndex !== null) {
      event.preventDefault()
      handleCancelEdit()
    }
  }, [handleAddOrUpdateCriterion, editIndex, handleCancelEdit])

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        🎯 Thiết lập tiêu chí đánh giá
        {board?.title && (
          <Typography variant="subtitle2" color="text.secondary">
            Board: {board.title}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {/* Form thêm tiêu chí tùy chỉnh */}
        <Box display="flex" gap={1} alignItems="center" mb={2}>
          <TextField
            label={editIndex !== null ? 'Chỉnh sửa tiêu chí' : 'Tiêu chí mới'}
            placeholder="Ví dụ: Kỹ năng giao tiếp, Khả năng làm việc nhóm..."
            variant="outlined"
            size="small"
            fullWidth
            value={newCriterion}
            onChange={(e) => setNewCriterion(e.target.value)}
            onKeyDown={handleKeyPress}
            inputRef={inputRef}
            disabled={isLoading}
            inputProps={{ maxLength: 100 }}
          />
          <IconButton
            onClick={handleAddOrUpdateCriterion}
            color="primary"
            disabled={!newCriterion.trim() || isLoading}
            size="large"
          >
            {editIndex !== null ? <CheckIcon /> : <AddIcon />}
          </IconButton>
          {editIndex !== null && (
            <IconButton
              onClick={handleCancelEdit}
              color="secondary"
              size="large"
              disabled={isLoading}
            >
              <CancelIcon />
            </IconButton>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Tiêu chí mẫu */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1}>
              <PlaylistAddIcon color="primary" />
              <Typography variant="h6" color="primary">
                Tiêu chí gợi ý
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Chọn các tiêu chí phù hợp với yêu cầu đánh giá của bạn. Nhấp vào tiêu chí để thêm ngay.
            </Typography>
            
            {Object.entries(SAMPLE_CRITERIA).map(([category, criteria]) => (
              <Box key={category} mb={3}>
                <Typography variant="subtitle1" fontWeight="bold" mb={1} color="primary">
                  {category}
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {criteria.map((criterion) => {
                    const isExisting = localCriteria.some(
                      item => item.title.toLowerCase() === criterion.toLowerCase()
                    )
                    const isAdding = addingCriteria.has(criterion)
                    
                    return (
                      <Chip
                        key={criterion}
                        label={criterion}
                        onClick={() => !isExisting && !isAdding && handleAddSampleCriterion(criterion)}
                        color={isExisting ? 'default' : 'primary'}
                        variant={isExisting ? 'filled' : 'outlined'}
                        disabled={isExisting || isAdding || isLoading}
                        clickable={!isExisting && !isAdding}
                        size="small"
                        sx={{
                          opacity: isExisting ? 0.5 : 1,
                          cursor: isExisting ? 'default' : 'pointer'
                        }}
                      />
                    )
                  })}
                </Box>
              </Box>
            ))}
          </AccordionDetails>
        </Accordion>

        <Divider sx={{ my: 2 }} />

        {/* Danh sách tiêu chí hiện tại */}
        <Typography variant="h6" mb={1}>
          Tiêu chí hiện tại ({localCriteria.length})
        </Typography>

        {isLoading ? (
          <Box textAlign="center" py={4}>
            <Typography color="text.secondary">
              Đang tải tiêu chí đánh giá...
            </Typography>
          </Box>
        ) : localCriteria.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography color="text.secondary">
              Chưa có tiêu chí nào. Hãy thêm tiêu chí đầu tiên!
            </Typography>
          </Box>
        ) : (
          <List>
            {localCriteria.map((item, index) => (
              <ListItem
                key={item._id ? `id-${item._id}` : `temp-${index}`}
                sx={{
                  bgcolor: editIndex === index ? 'action.selected' : 'transparent',
                  borderRadius: 1,
                  mb: 1,
                  opacity: deletingIndex === index ? 0.5 : 1
                }}
                secondaryAction={
                  <Box display="flex" gap={1}>
                    <IconButton
                      edge="end"
                      onClick={() => handleEditCriterion(index)}
                      disabled={editIndex !== null && editIndex !== index || isLoading || deletingIndex === index}
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteCriterion(index)}
                      disabled={editIndex !== null || isLoading || deletingIndex === index}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText
                  primary={`${index + 1}. ${item.title}`}
                  secondary={deletingIndex === index ? 'Đang xóa...' : null}
                />
              </ListItem>
            ))}
          </List>
        )}

        {localCriteria.length > 0 && !isLoading && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            💡 Mẹo: Bấm Enter để thêm nhanh, Escape để hủy chỉnh sửa. Nhấp vào tiêu chí gợi ý để thêm ngay.
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EvaluationCriteriaEditor