import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  Rating,
  Divider,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material'
import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { selectEvaluationCriteria } from '~/redux/activeEvaluation/activeEvaluationSlice'
import CloseIcon from '@mui/icons-material/Close'
import InfoIcon from '@mui/icons-material/Info'
import HistoryIcon from '@mui/icons-material/History'
import LockIcon from '@mui/icons-material/Lock'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningIcon from '@mui/icons-material/Warning'
import { useAuth } from '~/hooks/useAuth'

function MemberEvaluationForm({
  open,
  onClose,
  members,
  currentUserId,
  previousEvaluations = [],
  requiredRoles = ['member']
}) {
  // Lấy thông tin người dùng và tiêu chí đánh giá
  const { user: currentUser } = useAuth()
  const evaluationCriteria = useSelector(selectEvaluationCriteria)

  // State management
  const [ratings, setRatings] = useState({})
  const [comments, setComments] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' })

  // Lọc thành viên và kiểm tra quyền
  const membersToEvaluate = members.filter(member => member._id !== currentUserId)
  const hasPermission = requiredRoles.some(role => currentUser.roles.includes(role))

  // Khởi tạo dữ liệu đánh giá
  useEffect(() => {
    if (open && hasPermission) {
      const initialRatings = {}
      const initialComments = {}

      membersToEvaluate.forEach(member => {
        // Kiểm tra xem có đánh giá trước đó không
        const previousEvaluation = previousEvaluations.find(e => e.memberId === member._id)

        initialRatings[member._id] = {}
        initialComments[member._id] = previousEvaluation?.comment || ''

        evaluationCriteria.forEach(criterion => {
          const previousRating = previousEvaluation?.ratings.find(r => r.criterionId === criterion._id)
          initialRatings[member._id][criterion._id] = previousRating?.score || 0
        })
      })

      setRatings(initialRatings)
      setComments(initialComments)
      setValidationError('')
    }
  }, [open, evaluationCriteria, members, currentUserId, previousEvaluations, hasPermission])

  // Xử lý thay đổi đánh giá
  const handleRatingChange = (memberId, criterionId, value) => {
    setRatings(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [criterionId]: value
      }
    }))
  }

  // Xử lý thay đổi nhận xét
  const handleCommentChange = (memberId, value) => {
    if (value.length <= 500) { // Giới hạn 500 ký tự
      setComments(prev => ({
        ...prev,
        [memberId]: value
      }))
    }
  }

  // Tính điểm trung bình cho một thành viên
  const calculateAverage = (memberId) => {
    const memberRatings = Object.values(ratings[memberId] || {})
    if (memberRatings.length === 0) return 0

    const sum = memberRatings.reduce((total, score) => total + (score || 0), 0)
    return Math.round((sum / memberRatings.length) * 10) / 10
  }

  // Kiểm tra xem đã đánh giá đầy đủ chưa
  const validateEvaluations = () => {
    for (const member of membersToEvaluate) {
      for (const criterion of evaluationCriteria) {
        if (!ratings[member._id]?.[criterion._id]) {
          return `Vui lòng đánh giá đầy đủ tất cả tiêu chí cho thành viên ${member.name}`
        }
      }
    }
    return ''
  }

  // Xử lý gửi đánh giá
  const handleSubmit = async () => {
    const error = validateEvaluations()
    if (error) {
      setValidationError(error)
      setSnackbar({ open: true, message: error, severity: 'error' })
      return
    }

    setIsSubmitting(true)
    setValidationError('')

    try {
      const evaluations = membersToEvaluate.map(member => ({
        memberId: member._id,
        memberName: member.name,
        ratings: Object.entries(ratings[member._id] || {}).map(([criterionId, value]) => ({
          criterionId,
          criterionTitle: evaluationCriteria.find(c => c._id === criterionId)?.title || '',
          score: value
        })),
        comment: comments[member._id] || '',
        averageScore: calculateAverage(member._id),
        evaluatedBy: currentUserId,
        evaluatedAt: new Date().toISOString()
      }))

      // TODO: Gọi API để lưu đánh giá
      // await saveEvaluationsAPI(evaluations)

      console.log('Evaluations data:', evaluations)
      setSnackbar({
        open: true,
        message: 'Đã gửi đánh giá thành công!',
        severity: 'success'
      })
      onClose()
    } catch (error) {
      console.error('Evaluation error:', error)
      setSnackbar({
        open: true,
        message: 'Có lỗi xảy ra khi gửi đánh giá',
        severity: 'error'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Hiển thị lịch sử đánh giá
  const renderHistory = () => {
    if (!previousEvaluations.length) return (
      <Typography color="text.secondary" sx={{ mt: 2 }}>
          Chưa có đánh giá nào trước đây
      </Typography>
    )

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
            Lịch sử đánh giá trước đó:
        </Typography>
        {previousEvaluations.map((evaluation, index) => (
          <Box key={index} sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography fontWeight="bold">
                {members.find(m => m._id === evaluation.memberId)?.name || 'Unknown member'}
              </Typography>
              <Chip
                label={`Điểm TB: ${evaluation.averageScore.toFixed(1)}`}
                color="primary"
                size="small"
              />
            </Box>

            <Table size="small" sx={{ mb: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Tiêu chí</TableCell>
                  <TableCell align="center">Điểm</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {evaluation.ratings.map((rating, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{rating.criterionTitle}</TableCell>
                    <TableCell align="center">
                      <Rating value={rating.score} readOnly size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {evaluation.comment && (
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                <strong>Nhận xét:</strong> {evaluation.comment}
              </Typography>
            )}

            <Typography variant="caption" color="text.secondary">
                Đánh giá ngày: {new Date(evaluation.evaluatedAt).toLocaleDateString()}
            </Typography>
          </Box>
        ))}
      </Box>
    )
  }

  if (!hasPermission) {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <LockIcon color="error" />
            <span>Không có quyền truy cập</span>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
              Bạn không có quyền thực hiện đánh giá. Vui lòng liên hệ quản trị viên.
          </Alert>
          <Typography>
              Yêu cầu vai trò: {requiredRoles.join(', ')}
          </Typography>
          <Typography mt={1}>
              Vai trò hiện tại của bạn: {currentUser.roles.join(', ')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Đóng</Button>
        </DialogActions>
      </Dialog>
    )
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6">Đánh giá thành viên nhóm</Typography>
              {previousEvaluations.length > 0 && (
                <Tooltip title="Xem lịch sử đánh giá">
                  <IconButton
                    size="small"
                    onClick={() => setShowHistory(!showHistory)}
                    color={showHistory ? 'primary' : 'default'}
                  >
                    <HistoryIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <IconButton onClick={onClose} disabled={isSubmitting}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Typography variant="subtitle2" color="text.secondary">
              Đánh giá các thành viên dựa trên tiêu chí đã thiết lập
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          {showHistory ? (
            renderHistory()
          ) : evaluationCriteria.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Alert severity="warning">
                  Chưa có tiêu chí đánh giá nào được thiết lập. Vui lòng thiết lập tiêu chí trước.
              </Alert>
            </Box>
          ) : membersToEvaluate.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Alert severity="info">
                  Không có thành viên nào để đánh giá.
              </Alert>
            </Box>
          ) : (
            <Box>
              <Box mb={3} p={2} bgcolor="background.paper" borderRadius={1}>
                <Typography variant="subtitle1" gutterBottom>
                  <InfoIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Hướng dẫn đánh giá:
                </Typography>
                <Typography variant="body2" paragraph>
                    - Đánh giá từng tiêu chí theo thang điểm 1-5 sao (1: Rất kém, 5: Xuất sắc)
                </Typography>
                <Typography variant="body2" paragraph>
                    - Nhận xét tối đa 500 ký tự (đã sử dụng: {
                    Object.values(comments).reduce((total, cmt) => total + cmt.length, 0)
                  }/500)
                </Typography>
                <Typography variant="body2">
                    - Bạn sẽ không thể đánh giá chính mình
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {membersToEvaluate.map(member => {
                const averageScore = calculateAverage(member._id)
                return (
                  <Box key={member._id} mb={4} id={`member-${member._id}`}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="subtitle1">
                          Thành viên: <strong>{member.name || member.email}</strong>
                      </Typography>
                      {averageScore > 0 && (
                        <Chip
                          label={`Điểm TB hiện tại: ${averageScore}`}
                          color="primary"
                          variant="outlined"
                        />
                      )}
                    </Box>

                    <Table size="small" sx={{ mb: 3 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell width="40%">Tiêu chí</TableCell>
                          <TableCell align="center" width="60%">Điểm đánh giá</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {evaluationCriteria.map(criterion => (
                          <TableRow key={criterion._id}>
                            <TableCell>
                              {criterion.title}
                              {!ratings[member._id]?.[criterion._id] && (
                                <Typography
                                  variant="caption"
                                  color="error"
                                  display="block"
                                >
                                    (Chưa đánh giá)
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Rating
                                value={ratings[member._id]?.[criterion._id] || 0}
                                onChange={(event, newValue) => {
                                  handleRatingChange(member._id, criterion._id, newValue)
                                }}
                                size="large"
                                precision={1}
                              />
                              <Typography variant="caption" display="block">
                                {ratings[member._id]?.[criterion._id] || 0}/5
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <TextField
                      label={`Nhận xét về ${member.name}`}
                      multiline
                      rows={3}
                      fullWidth
                      variant="outlined"
                      value={comments[member._id] || ''}
                      onChange={(e) => handleCommentChange(member._id, e.target.value)}
                      placeholder="Nhận xét về điểm mạnh, điểm cần cải thiện..."
                      helperText={`${comments[member._id]?.length || 0}/500 ký tự`}
                    />

                    <Divider sx={{ my: 3 }} />
                  </Box>
                )
              })}

              {validationError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {validationError}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={onClose}
            disabled={isSubmitting}
            startIcon={<CloseIcon />}
          >
              Đóng
          </Button>
          {!showHistory && evaluationCriteria.length > 0 && membersToEvaluate.length > 0 && (
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : <CheckCircleIcon />}
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default MemberEvaluationForm