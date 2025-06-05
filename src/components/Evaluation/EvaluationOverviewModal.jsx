// 7. EvaluationOverviewModal.js - Component hoàn chỉnh
import React, { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Rating,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Chip,
  Alert
} from '@mui/material'
import { Star, StarBorder, CheckCircle, Refresh, Person } from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'

import {
  fetchEvaluationCriteriaThunk,
  selectEvaluationCriteria,
  selectEvaluationLoading
} from '~/redux/activeEvaluation/activeEvaluationSlice'
import {
  submitSingleEvaluationThunk,
  fetchMyEvaluationsThunk,
  selectSubmissionLoading,
  selectMySubmissions,
  selectFetchLoading,
  resetSubmissionState,
  addLocalSubmission,
  removeTempSubmissions // 👈 Thêm import này
} from '~/redux/activeEvaluationSubmission/evaluationSubmissionSlice'
import { selectCurrentUser } from '~/redux/User/userSlice'
import { useCallback } from 'react'

const EvaluationOverviewModal = ({ open, onClose, board }) => {
  const dispatch = useDispatch()
  const criteria = useSelector(selectEvaluationCriteria)
  const loading = useSelector(selectEvaluationLoading)
  const currentUser = useSelector(selectCurrentUser)
  const submissionLoading = useSelector(selectSubmissionLoading)
  const fetchLoading = useSelector(selectFetchLoading)
  const mySubmissions = useSelector(selectMySubmissions)

  const [isEvaluating, setIsEvaluating] = useState(false)
  const [selectedUser, setSelectedUser] = useState('')
  const [ratings, setRatings] = useState({})
  const [hasFetched, setHasFetched] = useState(false)

  // Effect để fetch evaluations khi modal mở
  useEffect(() => {
    if (open && board?._id && currentUser?._id) {
      console.log('🔄 Fetching my evaluations for board:', board._id)

      dispatch(fetchMyEvaluationsThunk(board._id))
        .then(() => {
          console.log('✅ Successfully fetched my evaluations')
        })
        .catch((error) => {
          console.error('❌ Error fetching my evaluations:', error)
        })
    }
  }, [open, board?._id, currentUser?._id, dispatch])

  useEffect(() => {
    if (open && board?._id) {
      console.log('🔍 Membership check:', {
        userId: currentUser?._id,
        memberIds: board?.memberIds,
        isMember: board?.memberIds?.includes(currentUser?._id)
      })

      if (!board?.memberIds?.includes(currentUser?._id)) {
        console.error('Membership error - User not in board:', {
          userId: currentUser?._id,
          boardMembers: board?.memberIds
        })
        toast.error('Bạn chưa được thêm vào danh sách thành viên', { theme: 'colored' })
        onClose()
        return
      }

      if (!hasFetched) {
        dispatch(fetchEvaluationCriteriaThunk(board._id))
          .then(() => {
            setHasFetched(true)
            console.log('✅ Successfully fetched criteria for evaluation')
          })
          .catch((error) => {
            console.error('❌ Error fetching criteria:', error)
            toast.error('Có lỗi khi tải tiêu chí đánh giá', { theme: 'colored' })
          })
      }
    }
  }, [open, board, currentUser, dispatch, hasFetched])

  // Reset state khi đóng modal
  useEffect(() => {
    if (!open) {
      setIsEvaluating(false)
      setSelectedUser('')
      setRatings({})
      setHasFetched(false)
      dispatch(resetSubmissionState())
    }
  }, [open, dispatch])

  const safeCriteria = useMemo(() => {
    console.log('📊 Current criteria:', criteria)
    return Array.isArray(criteria) ? criteria : []
  }, [criteria])

  // Lấy danh sách user đã đánh giá từ Redux
  const evaluatedUserIds = useMemo(() => {
    if (!mySubmissions || !board?._id || !currentUser?._id) return []

    const currentBoardSubmissions = mySubmissions.filter(submission => {
      const submissionBoardId = submission.board || submission.boardId
      const submissionEvaluatorId = submission.evaluator || submission.evaluatorId

      return submissionBoardId?.toString() === board._id.toString() &&
             submissionEvaluatorId?.toString() === currentUser._id.toString()
    })

    const evaluatedIds = currentBoardSubmissions.map(s =>
      (s.evaluatedUser || s.evaluatedUserId)?.toString()
    ).filter(Boolean)

    console.log('🎯 Evaluated user IDs from Redux:', {
      boardId: board._id,
      evaluatorId: currentUser._id,
      totalSubmissions: mySubmissions.length,
      currentBoardSubmissions: currentBoardSubmissions.length,
      evaluatedIds,
      submissions: currentBoardSubmissions
    })

    return evaluatedIds
  }, [mySubmissions, board?._id, currentUser?._id])

  // Danh sách user có thể đánh giá
  const availableUsers = useMemo(() => {
    if (!board?.FE_allUsers || !currentUser) return []

    return board.FE_allUsers.filter(user => {
      const isNotSelf = user._id !== currentUser._id
      const notEvaluated = !evaluatedUserIds.includes(user._id.toString())
      return isNotSelf && notEvaluated
    })
  }, [board?.FE_allUsers, currentUser, evaluatedUserIds])

  // Kiểm tra hoàn thành đánh giá
  useEffect(() => {
    if (isEvaluating && availableUsers.length === 0) {
      setTimeout(() => {
        setIsEvaluating(false)
        toast.success('🎉 Đã hoàn thành đánh giá tất cả thành viên!', { theme: 'colored' })
      }, 500)
    }
  }, [availableUsers.length, isEvaluating])

  // Thông tin user đã đánh giá
  const evaluatedUsersInfo = useMemo(() => {
    if (!board?.FE_allUsers || evaluatedUserIds.length === 0) return []

    const evaluatedInfo = board.FE_allUsers.filter(user =>
      evaluatedUserIds.includes(user._id.toString())
    )

    console.log('✅ Evaluated users info from Redux:', {
      evaluatedIds: evaluatedUserIds,
      evaluatedInfo: evaluatedInfo.map(u => ({ id: u._id, name: u.displayName || u.username }))
    })

    return evaluatedInfo
  }, [board?.FE_allUsers, evaluatedUserIds])

  const initializeRatings = () => {
    const initialRatings = {}
    safeCriteria.forEach(criterion => {
      if (criterion._id) initialRatings[criterion._id] = 1
    })
    console.log('🎯 Initialized ratings:', initialRatings)
    return initialRatings
  }

  const handleStartEvaluation = () => {
    const invalid = safeCriteria.some(c => !c._id)
    if (invalid) {
      toast.error('Lỗi: Một số tiêu chí đánh giá không có ID hợp lệ', { theme: 'colored' })
      return
    }

    if (safeCriteria.length === 0) {
      toast.warn('Chưa có tiêu chí đánh giá nào. Vui lòng thêm tiêu chí trước khi đánh giá.', { theme: 'colored' })
      return
    }

    if (availableUsers.length === 0) {
      toast.info('Đã hoàn thành đánh giá tất cả thành viên!', { theme: 'colored' })
      return
    }

    setIsEvaluating(true)
    setRatings(initializeRatings())
  }

  const handleRatingChange = (criterionId, newValue) => {
    setRatings(prev => {
      const updated = { ...prev, [criterionId]: newValue || 0 }
      console.log('⭐ Rating updated:', { criterionId, newValue, allRatings: updated })
      return updated
    })
  }

  const handleUserChange = (userId) => {
    console.log('👤 User selected for evaluation:', userId)
    setSelectedUser(userId)
    setRatings(initializeRatings())
  }

  const handleRefreshEvaluations = () => {
    if (board?._id) {
      console.log('🔄 Manually refreshing evaluations')
      dispatch(fetchMyEvaluationsThunk(board._id))
        .then(() => {
          toast.success('Đã cập nhật danh sách đánh giá', { theme: 'colored' })
        })
        .catch(() => {
          toast.error('Lỗi khi cập nhật danh sách đánh giá', { theme: 'colored' })
        })
    }
  }

  const checkMembership = useCallback(() => {
    if (!board?.memberIds || !currentUser?._id) return false

    return board.memberIds.some(id =>
      id.toString() === currentUser._id.toString()
    )
  }, [board, currentUser])

  // Chỉ cần thay thế handleSubmitEvaluation function trong EvaluationOverviewModal.js

  const handleSubmitEvaluation = async () => {
  // 1. Kiểm tra người được đánh giá có trong board không
    const isUserInBoard = board?.FE_allUsers?.some(user =>
      user._id === selectedUser
    )

    if (!isUserInBoard) {
      toast.error('Người được chọn không thuộc board này', {
        theme: 'colored',
        autoClose: 5000
      })
      return
    }

    // 2. Kiểm tra thành viên
    const isMember = board?.memberIds?.some(id =>
      id.toString() === currentUser._id.toString()
    )
    if (!isMember) {
      console.error('Xác thực thành viên thất bại:', {
        userId: currentUser._id,
        memberIds: board?.memberIds?.map(id => id.toString())
      })
      toast.error('Xác thực thành viên thất bại. Vui lòng tải lại trang.', { theme: 'colored' })
      return
    }

    // 3. Kiểm tra đã chọn người đánh giá
    if (!selectedUser) {
      toast.warn('Vui lòng chọn người để đánh giá', { theme: 'colored' })
      return
    }

    // 4. Kiểm tra đã đánh giá tất cả tiêu chí
    const unrated = safeCriteria.filter(c => !c._id || !ratings[c._id] || ratings[c._id] === 0)
    if (unrated.length > 0) {
      toast.warn('Vui lòng đánh giá tất cả các tiêu chí (tối thiểu 1 sao)', { theme: 'colored' })
      return
    }

    try {
      const evaluationData = {
        boardId: board._id,
        evaluatedUserId: selectedUser,
        evaluatorId: currentUser._id,
        ratings
      }

      console.log('📤 Dữ liệu gửi đánh giá:', JSON.stringify(evaluationData, null, 2))

      // 🔧 Optimistic update với structure đầy đủ và an toàn
      const tempSubmission = {
        _id: `temp-${Date.now()}`,
        board: board._id,
        boardId: board._id, // Backup field
        evaluatedUser: selectedUser,
        evaluatedUserId: selectedUser, // Backup field
        evaluator: currentUser._id,
        evaluatorId: currentUser._id, // Backup field
        ratings: Object.entries(ratings).map(([criterionId, score]) => ({
          criterion: criterionId,
          score
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Dispatch optimistic update
      dispatch(addLocalSubmission(tempSubmission))

      // Gửi request
      const response = await dispatch(submitSingleEvaluationThunk(evaluationData)).unwrap()
      console.log('📥 Phản hồi từ server:', JSON.stringify(response, null, 2))

      const evaluatedUserInfo = board.FE_allUsers.find(u => u._id === selectedUser)
      const userName = evaluatedUserInfo?.displayName || evaluatedUserInfo?.username

      // Reset form
      setSelectedUser('')
      setRatings(initializeRatings())

      toast.success(`✅ Đã đánh giá thành công ${userName}`, {
        theme: 'colored',
        autoClose: 2000
      })

      // Refresh evaluations để đảm bảo data consistency
      setTimeout(() => {
        dispatch(fetchMyEvaluationsThunk(board._id))
      }, 500)

      // Kiểm tra hoàn thành
      const remainingUsers = availableUsers.filter(u => u._id !== selectedUser)
      if (remainingUsers.length === 0) {
        setTimeout(() => {
          setIsEvaluating(false)
          toast.success('🎉 Hoàn thành đánh giá tất cả thành viên!', {
            theme: 'colored',
            autoClose: 3000
          })
        }, 1000)
      }

    } catch (error) {
      console.error('❌ Lỗi gửi đánh giá:', error)

      // 🔧 Clean up temporary submissions on error
      dispatch(removeTempSubmissions())

      const errorMessage = typeof error === 'string' ? error :
        error?.message || 'Có lỗi xảy ra khi gửi đánh giá'

      toast.error(errorMessage, { theme: 'colored' })
    }
  }

  const handleClose = () => {
    setIsEvaluating(false)
    setSelectedUser('')
    setRatings({})
    onClose()
  }

  if (loading || fetchLoading) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Đang tải dữ liệu...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            📊 Tổng quan đánh giá - {board?.title}
          </Typography>
          <Button
            startIcon={<Refresh />}
            onClick={handleRefreshEvaluations}
            size="small"
            disabled={fetchLoading}
          >
            Làm mới
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Thống kê tổng quan */}
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📈 Thống kê đánh giá
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="primary">
                        {evaluatedUsersInfo.length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Đã đánh giá
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="secondary">
                        {availableUsers.length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Còn lại
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="success.main">
                        {safeCriteria.length}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Tiêu chí
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="h4" color="info.main">
                        {Math.round((evaluatedUsersInfo.length / Math.max(1, evaluatedUsersInfo.length + availableUsers.length)) * 100)}%
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Hoàn thành
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Danh sách đã đánh giá */}
          {evaluatedUsersInfo.length > 0 && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    ✅ Đã đánh giá ({evaluatedUsersInfo.length})
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {evaluatedUsersInfo.map(user => (
                      <Chip
                        key={user._id}
                        icon={<CheckCircle />}
                        label={user.displayName || user.username}
                        color="success"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Form đánh giá */}
          {!isEvaluating ? (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🎯 Bắt đầu đánh giá
                  </Typography>
                  {availableUsers.length > 0 ? (
                    <>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        Còn {availableUsers.length} thành viên chưa được đánh giá
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleStartEvaluation}
                        fullWidth
                        size="large"
                        sx={{ mt: 2 }}
                      >
                        Bắt đầu đánh giá
                      </Button>
                    </>
                  ) : (
                    <Alert severity="success">
                      🎉 Bạn đã hoàn thành đánh giá tất cả thành viên!
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ) : (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📝 Đánh giá thành viên
                  </Typography>

                  {/* Chọn người đánh giá */}
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Chọn người đánh giá</InputLabel>
                    <Select
                      value={selectedUser}
                      onChange={(e) => handleUserChange(e.target.value)}
                      label="Chọn người đánh giá"
                    >
                      {availableUsers.map(user => (
                        <MenuItem key={user._id} value={user._id}>
                          <Box display="flex" alignItems="center">
                            <Person sx={{ mr: 1 }} />
                            {user.displayName || user.username}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Form đánh giá */}
                  {selectedUser && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle1" gutterBottom>
                        Đánh giá theo từng tiêu chí:
                      </Typography>

                      {safeCriteria.map((criterion) => (
                        <Box key={criterion._id} sx={{ mb: 3 }}>
                          <Typography variant="body1" gutterBottom>
                            {criterion.title} {/* Thay criterion.name bằng criterion.title */}
                          </Typography>
                          {criterion.description && (
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              {criterion.description}
                            </Typography>
                          )}
                          <Rating
                            value={ratings[criterion._id] || 0}
                            onChange={(_, newValue) => handleRatingChange(criterion._id, newValue)}
                            size="large"
                            emptyIcon={<StarBorder fontSize="large" />}
                            icon={<Star fontSize="large" />}
                          />
                          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            {ratings[criterion._id] || 0}/5 sao
                          </Typography>
                        </Box>
                      ))}

                      <Box display="flex" gap={2} sx={{ mt: 3 }}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleSubmitEvaluation}
                          disabled={submissionLoading || !selectedUser}
                          fullWidth
                        >
                          {submissionLoading ? 'Đang gửi...' : 'Gửi đánh giá'}
                        </Button>
                        <Button
                          variant="outlined"
                          onClick={() => setIsEvaluating(false)}
                          fullWidth
                        >
                          Quay lại
                        </Button>
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  )
}

export default EvaluationOverviewModal