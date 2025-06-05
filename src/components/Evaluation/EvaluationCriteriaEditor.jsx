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
  Typography
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import CheckIcon from '@mui/icons-material/Check'
import CancelIcon from '@mui/icons-material/Cancel'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import {
  selectEvaluationCriteria,
  addSingleEvaluationCriteria,
  deleteSingleEvaluationCriteria,
  updateSingleEvaluationCriteria,
  fetchEvaluationCriteriaThunk // Sửa tên action cho đúng
} from '~/redux/activeEvaluation/activeEvaluationSlice'

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
      setHasSynced(false) // Reset flag sync
      setDeletingIndex(null)
    }
  }, [open])

  // Focus input khi edit
  useEffect(() => {
    if (editIndex !== null && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editIndex])

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

        // Chỉ cập nhật local state, không cần sync với Redux store nữa
        // vì Redux store sẽ được cập nhật bởi action trên
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        🎯 Thiết lập tiêu chí đánh giá
        {board?.title && (
          <Typography variant="subtitle2" color="text.secondary">
            Board: {board.title}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
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
            💡 Mẹo: Bấm Enter để thêm nhanh, Escape để hủy chỉnh sửa
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