// MyEvaluationResultsModal.js - Xem điểm đánh giá của bản thân
import React, { useEffect, useState, useMemo } from 'react'
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
  Divider,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  LinearProgress,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead
} from '@mui/material'
import {
  Star,
  StarBorder,
  Person,
  TrendingUp,
  Assessment,
  EmojiEvents
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'

import {
  fetchMyEvaluationResultsThunk,
  selectMyEvaluationResults,
  selectResultsLoading
} from '~/redux/activeEvaluationSubmission/myEvaluationResultsSlice'
import {
  fetchEvaluationCriteriaThunk,
  selectEvaluationCriteria
} from '~/redux/activeEvaluation/activeEvaluationSlice'
import { selectCurrentUser } from '~/redux/User/userSlice'

const MyEvaluationResultsModal = ({ open, onClose, board }) => {
  const dispatch = useDispatch()
  const currentUser = useSelector(selectCurrentUser)
  const myResults = useSelector(selectMyEvaluationResults)
  const loading = useSelector(selectResultsLoading)
  const criteria = useSelector(selectEvaluationCriteria)

  const [hasFetched, setHasFetched] = useState(false)

  // Fetch dữ liệu khi modal mở
  useEffect(() => {
    if (open && board?._id && currentUser?._id) {
      console.log('🔄 Fetching my evaluation results for board:', board._id)

      // Fetch criteria và results song song
      Promise.all([
        dispatch(fetchEvaluationCriteriaThunk(board._id)),
        dispatch(fetchMyEvaluationResultsThunk({
          boardId: board._id,
          userId: currentUser._id
        }))
      ])
        .then(() => {
          setHasFetched(true)
          console.log('✅ Successfully fetched evaluation data')
        })
        .catch((error) => {
          console.error('❌ Error fetching evaluation data:', error)
          toast.error('Có lỗi khi tải dữ liệu đánh giá', { theme: 'colored' })
        })
    }
  }, [open, board?._id, currentUser?._id, dispatch])

  // Reset state khi đóng modal
  useEffect(() => {
    if (!open) {
      setHasFetched(false)
    }
  }, [open])

  // Xử lý dữ liệu đánh giá - Cập nhật theo cách của MemberEvaluationForm
  // Xử lý dữ liệu đánh giá - Cập nhật để fix lỗi hiển thị tên tiêu chí
  // Xử lý dữ liệu đánh giá - FIX: Sử dụng criteria từ Redux để lấy tên tiêu chí
  const processedResults = useMemo(() => {
    if (!myResults || !Array.isArray(myResults) || myResults.length === 0) {
      return {
        evaluations: [],
        totalEvaluators: 0,
        averageScores: {},
        overallAverage: 0,
        criteriaStats: {}
      }
    }

    const validEvaluations = myResults.filter(e =>
      e && e.ratings && Array.isArray(e.ratings) && e.ratings.length > 0
    )

    const criteriaScores = {}
    const criteriaStats = {}

    // Helper function để lấy thông tin tiêu chí
    const getCriterionInfo = (criterionId) => {
    // Tìm trong criteria từ Redux trước
      if (criteria && Array.isArray(criteria)) {
        const foundCriterion = criteria.find(c =>
          c._id?.toString() === criterionId?.toString()
        )
        if (foundCriterion) {
          return {
            name: foundCriterion.title || foundCriterion.name || `Tiêu chí ${criterionId.slice(0, 4)}`,
            description: foundCriterion.description || ''
          }
        }
      }

      // Fallback về tên mặc định
      return {
        name: `Tiêu chí ${criterionId.slice(0, 4)}`,
        description: ''
      }
    }

    validEvaluations.forEach(evaluation => {
      evaluation.ratings.forEach(rating => {
      // Lấy thông tin tiêu chí từ rating trước
        const criterionId = rating.criterion?._id?.toString() ||
                      rating.criterion?.toString() ||
                      rating.criterionId?.toString()

        if (!criterionId) return

        if (!criteriaScores[criterionId]) {
          criteriaScores[criterionId] = []
        }
        criteriaScores[criterionId].push(rating.score)

        // Lấy thông tin tiêu chí - ưu tiên từ rating.criterion, sau đó từ Redux criteria
        let criterionInfo = null

        // Thử lấy từ rating.criterion trước
        if (rating.criterion && typeof rating.criterion === 'object') {
          criterionInfo = {
            name: rating.criterion.title || rating.criterion.name || null,
            description: rating.criterion.description || ''
          }
        }

        // Nếu không có tên từ rating.criterion, lấy từ Redux criteria
        if (!criterionInfo?.name) {
          criterionInfo = getCriterionInfo(criterionId)
        }

        // Chỉ cập nhật nếu chưa có hoặc thông tin mới tốt hơn
        if (!criteriaStats[criterionId] || !criteriaStats[criterionId].name || criteriaStats[criterionId].name.startsWith('Tiêu chí ')) {
          criteriaStats[criterionId] = {
            ...criteriaStats[criterionId],
            name: criterionInfo.name,
            description: criterionInfo.description
          }
        }
      })
    })

    // Tính toán thống kê
    Object.keys(criteriaScores).forEach(criterionId => {
      const scores = criteriaScores[criterionId]
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length

      // Đảm bảo có thông tin tiêu chí
      if (!criteriaStats[criterionId]) {
        criteriaStats[criterionId] = getCriterionInfo(criterionId)
      }

      // Cập nhật thống kê
      criteriaStats[criterionId] = {
        ...criteriaStats[criterionId],
        average: Math.round(average * 10) / 10,
        count: scores.length,
        min: Math.min(...scores),
        max: Math.max(...scores),
        scores: scores
      }
    })

    // Tính điểm trung bình tổng thể
    const allScores = Object.values(criteriaScores).flat()
    const overallAverage = allScores.length > 0
      ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length
      : 0

    return {
      evaluations: validEvaluations,
      totalEvaluators: validEvaluations.length,
      averageScores: criteriaScores,
      overallAverage: Math.round(overallAverage * 10) / 10,
      criteriaStats
    }
  }, [myResults, criteria]) // Thêm criteria vào dependency array

  // Lấy thông tin người đánh giá
  const getEvaluatorInfo = (evaluatorId) => {
    if (!board?.FE_allUsers) return { name: 'Thành viên', avatar: null }

    const evaluator = board.FE_allUsers.find(user =>
      user._id?.toString() === evaluatorId?.toString()
    )

    return {
      name: evaluator?.displayName || evaluator?.username || 'Thành viên',
      avatar: evaluator?.avatar || null
    }
  }

  // Render điểm số với màu sắc
  const renderScoreChip = (score) => {
    let color = 'default'
    if (score >= 4.5) color = 'success'
    else if (score >= 3.5) color = 'primary'
    else if (score >= 2.5) color = 'warning'
    else color = 'error'

    return (
      <Chip
        label={`${score}/5`}
        color={color}
        size="small"
        icon={<Star />}
      />
    )
  }

  if (loading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Đang tải kết quả đánh giá...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Assessment color="primary" />
          <Typography variant="h6">
            📊 Kết quả đánh giá của tôi - {board?.title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {processedResults.totalEvaluators === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography>
              Bạn chưa được ai đánh giá trong board này.
              Hãy đợi các thành viên khác hoàn thành đánh giá!
            </Typography>
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {/* Tổng quan */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ bgcolor: 'primary.50' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🏆 Tổng quan kết quả
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h3" color="primary.main">
                          {processedResults.totalEvaluators}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Người đánh giá
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h3" color="success.main">
                          {processedResults.overallAverage}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Điểm trung bình
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Rating
                          value={processedResults.overallAverage}
                          readOnly
                          precision={0.1}
                          emptyIcon={<StarBorder />}
                          icon={<Star />}
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <EmojiEvents
                          sx={{
                            fontSize: 40,
                            color: processedResults.overallAverage >= 4 ? 'gold' :
                              processedResults.overallAverage >= 3 ? 'silver' : 'bronze'
                          }}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Điểm theo từng tiêu chí - Cập nhật theo cách hiển thị mới */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📈 Điểm theo từng tiêu chí
                  </Typography>

                  {Object.keys(processedResults.criteriaStats).length === 0 ? (
                    <Alert severity="info">
                      <Typography>Chưa có dữ liệu đánh giá theo tiêu chí</Typography>
                    </Alert>
                  ) : (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Tiêu chí</TableCell>
                          <TableCell align="center">Điểm trung bình</TableCell>
                          <TableCell align="center">Số đánh giá</TableCell>
                          <TableCell align="center">Phạm vi điểm</TableCell>
                          <TableCell align="center">Biểu đồ</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(processedResults.criteriaStats).map(([criterionId, stats]) => {
                          // Đảm bảo luôn có tên tiêu chí, nếu không có thì dùng ID làm fallback
                          const criterionName = stats.name || `Tiêu chí ${criterionId.slice(0, 4)}`

                          console.log('🚀 ~ {Object.entries ~ stats:', stats)
                          console.log('🚀 ~ {Object.entries ~ criterionName:', criterionName)
                          return (
                            <TableRow key={criterionId}>
                              <TableCell>
                                <Typography fontWeight="bold">{criterionName}</Typography>
                                {stats.description && (
                                  <Typography variant="caption" color="textSecondary">
                                    {stats.description}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="center">
                                {renderScoreChip(stats.average)}
                              </TableCell>
                              <TableCell align="center">
                                {stats.count}
                              </TableCell>
                              <TableCell align="center">
                                {stats.min} - {stats.max}
                              </TableCell>
                              <TableCell>
                                <LinearProgress
                                  variant="determinate"
                                  value={(stats.average / 5) * 100}
                                  sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    bgcolor: 'grey.200',
                                    '& .MuiLinearProgress-bar': {
                                      bgcolor: stats.average >= 4 ? 'success.main' :
                                        stats.average >= 3 ? 'primary.main' :
                                          stats.average >= 2 ? 'warning.main' : 'error.main'
                                    }
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Chi tiết từng đánh giá */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📝 Chi tiết đánh giá từ từng thành viên
                  </Typography>
                  <List>
                    {processedResults.evaluations.map((evaluation, index) => {
                      const evaluatorInfo = getEvaluatorInfo(evaluation.evaluator || evaluation.evaluatorId)
                      return (
                        <React.Fragment key={evaluation._id || index}>
                          <ListItem alignItems="flex-start">
                            <ListItemAvatar>
                              <Avatar src={evaluatorInfo.avatar}>
                                <Person />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {evaluatorInfo.name}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {new Date(evaluation.createdAt).toLocaleDateString('vi-VN')}
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 1 }}>
                                  {evaluation.ratings?.map((rating, ratingIndex) => {
                                    const criterionId = rating.criterion?._id?.toString() || rating.criterion?.toString()
                                    const criterionInfo = processedResults.criteriaStats[criterionId] || {}
                                    return (
                                      <Box key={ratingIndex} sx={{ mb: 1 }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                          <Typography variant="body2">
                                            {criterionInfo.name || `Tiêu chí ${criterionId?.slice(0, 4) || ''}`}
                                          </Typography>
                                          <Box display="flex" alignItems="center" gap={1}>
                                            <Rating
                                              value={rating.score}
                                              readOnly
                                              size="small"
                                              emptyIcon={<StarBorder fontSize="small" />}
                                              icon={<Star fontSize="small" />}
                                            />
                                            <Typography variant="caption">
                                              ({rating.score}/5)
                                            </Typography>
                                          </Box>
                                        </Box>
                                      </Box>
                                    )
                                  })}
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < processedResults.evaluations.length - 1 && <Divider variant="inset" component="li" />}
                        </React.Fragment>
                      )
                    })}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
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

export default MyEvaluationResultsModal