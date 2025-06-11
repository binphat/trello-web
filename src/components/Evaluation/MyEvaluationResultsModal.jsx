// MemberEvaluationForm.js - Component xem điểm đánh giá thành viên trong board
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
  Avatar,
  Divider,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  Star,
  StarBorder,
  Person,
  Assessment,
  ExpandMore,
  TrendingUp,
  Group,
  EmojiEvents,
  Visibility,
  FilterList
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'

import {
  fetchEvaluationCriteriaThunk,
  selectEvaluationCriteria,
  selectEvaluationLoading
} from '~/redux/activeEvaluation/activeEvaluationSlice'
import {
  fetchMyEvaluationsThunk,
  selectMySubmissions,
  selectFetchLoading
} from '~/redux/activeEvaluationSubmission/evaluationSubmissionSlice'
import {
  fetchMyEvaluationResultsThunk,
  selectMyEvaluationResults,
  selectResultsLoading
} from '~/redux/activeEvaluationSubmission/myEvaluationResultsSlice'
import { selectCurrentUser } from '~/redux/User/userSlice'

const MemberEvaluationForm = ({ open, onClose, board }) => {
  const dispatch = useDispatch()
  
  // Redux selectors
  const currentUser = useSelector(selectCurrentUser)
  const criteria = useSelector(selectEvaluationCriteria)
  const criteriaLoading = useSelector(selectEvaluationLoading)
  const mySubmissions = useSelector(selectMySubmissions)
  const submissionsLoading = useSelector(selectFetchLoading)
  const myResults = useSelector(selectMyEvaluationResults)
  const resultsLoading = useSelector(selectResultsLoading)

  // Local state
  const [activeTab, setActiveTab] = useState('overview') // 'overview', 'detailed', 'myScores'
  const [selectedMember, setSelectedMember] = useState('')
  const [filterBy, setFilterBy] = useState('all') // 'all', 'completed', 'pending'

  // Effect để fetch dữ liệu khi modal mở
  useEffect(() => {
    if (open && board?._id && currentUser?._id) {
      console.log('🔄 Fetching evaluation data for board:', board._id)
      
      // Fetch criteria
      dispatch(fetchEvaluationCriteriaThunk(board._id))
      
      // Fetch my submissions (đánh giá tôi đã thực hiện)
      dispatch(fetchMyEvaluationsThunk(board._id))
      
      // Fetch my evaluation results (điểm tôi nhận được)
      dispatch(fetchMyEvaluationResultsThunk({
        boardId: board._id,
        userId: currentUser._id
      }))
    }
  }, [open, board?._id, currentUser?._id, dispatch])

  // Xử lý tiêu chí an toàn
  const safeCriteria = useMemo(() => {
    return Array.isArray(criteria) ? criteria : []
  }, [criteria])

  // Xử lý danh sách thành viên và trạng thái đánh giá
  const membersEvaluationStatus = useMemo(() => {
    if (!board?.FE_allUsers || !mySubmissions || !currentUser) return []

    return board.FE_allUsers
      .filter(user => user._id !== currentUser._id) // Loại bỏ bản thân
      .map(user => {
        // Tìm đánh giá của user này
        const userEvaluations = mySubmissions.filter(submission => {
          const evaluatedId = submission.evaluatedUser || submission.evaluatedUserId
          return evaluatedId?.toString() === user._id.toString()
        })

        // Tính điểm trung bình
        let averageScore = 0
        let totalRatings = 0
        
        if (userEvaluations.length > 0) {
          const allScores = []
          userEvaluations.forEach(evaluation => {
            if (evaluation.ratings && Array.isArray(evaluation.ratings)) {
              evaluation.ratings.forEach(rating => {
                if (rating && typeof rating.score === 'number') {
                  allScores.push(rating.score)
                }
              })
            }
          })
          
          if (allScores.length > 0) {
            averageScore = allScores.reduce((sum, score) => sum + score, 0) / allScores.length
            totalRatings = allScores.length
          }
        }

        return {
          ...user,
          isEvaluated: userEvaluations.length > 0,
          evaluationCount: userEvaluations.length,
          averageScore: Math.round(averageScore * 10) / 10,
          totalRatings,
          evaluations: userEvaluations
        }
      })
  }, [board?.FE_allUsers, mySubmissions, currentUser])

  // Lọc thành viên theo filter
  const filteredMembers = useMemo(() => {
    if (filterBy === 'completed') {
      return membersEvaluationStatus.filter(member => member.isEvaluated)
    } else if (filterBy === 'pending') {
      return membersEvaluationStatus.filter(member => !member.isEvaluated)
    }
    return membersEvaluationStatus
  }, [membersEvaluationStatus, filterBy])

  // Thống kê tổng quan
  const overviewStats = useMemo(() => {
    const totalMembers = membersEvaluationStatus.length
    const evaluatedMembers = membersEvaluationStatus.filter(m => m.isEvaluated).length
    const pendingMembers = totalMembers - evaluatedMembers
    const completionRate = totalMembers > 0 ? Math.round((evaluatedMembers / totalMembers) * 100) : 0

    const allScores = []
    membersEvaluationStatus.forEach(member => {
      member.evaluations.forEach(evaluation => {
        if (evaluation.ratings && Array.isArray(evaluation.ratings)) {
          evaluation.ratings.forEach(rating => {
            if (rating && typeof rating.score === 'number') {
              allScores.push(rating.score)
            }
          })
        }
      })
    })

    const overallAverage = allScores.length > 0 
      ? Math.round((allScores.reduce((sum, score) => sum + score, 0) / allScores.length) * 10) / 10 
      : 0

    return {
      totalMembers,
      evaluatedMembers,
      pendingMembers,
      completionRate,
      overallAverage,
      totalEvaluations: allScores.length
    }
  }, [membersEvaluationStatus])

  // Điểm của bản thân
  const myScoreStats = useMemo(() => {
    if (!myResults || !Array.isArray(myResults)) return null

    const allMyScores = []
    const criteriaScores = new Map()

    myResults.forEach(result => {
      if (result.ratings && Array.isArray(result.ratings)) {
        result.ratings.forEach(rating => {
          if (rating && typeof rating.score === 'number') {
            allMyScores.push(rating.score)
            
            // Group by criteria
            const criterionId = rating.criterion?.toString()
            const criterion = safeCriteria.find(c => c._id?.toString() === criterionId)
            const criterionName = criterion?.title || criterion?.name || 'Unknown'
            
            if (!criteriaScores.has(criterionName)) {
              criteriaScores.set(criterionName, [])
            }
            criteriaScores.get(criterionName).push(rating.score)
          }
        })
      }
    })

    const myAverage = allMyScores.length > 0 
      ? Math.round((allMyScores.reduce((sum, score) => sum + score, 0) / allMyScores.length) * 10) / 10 
      : 0

    const criteriaAverages = Array.from(criteriaScores.entries()).map(([name, scores]) => ({
      name,
      average: Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10,
      count: scores.length
    })).sort((a, b) => b.average - a.average)

    return {
      totalEvaluators: myResults.length,
      myAverage,
      totalRatings: allMyScores.length,
      criteriaAverages,
      allScores: allMyScores
    }
  }, [myResults, safeCriteria])

  const handleClose = () => {
    setActiveTab('overview')
    setSelectedMember('')
    setFilterBy('all')
    onClose()
  }

  // Render member detail
  const renderMemberDetail = (member) => {
    if (!member.evaluations || member.evaluations.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          Chưa có đánh giá cho thành viên này
        </Alert>
      )
    }

    return (
      <Box sx={{ mt: 2 }}>
        {member.evaluations.map((evaluation, index) => (
          <Accordion key={evaluation._id || index} sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle2">
                Đánh giá #{index + 1} - {new Date(evaluation.createdAt).toLocaleDateString('vi-VN')}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {evaluation.ratings && Array.isArray(evaluation.ratings) && 
                 evaluation.ratings.map((rating, rIndex) => {
                   const criterion = safeCriteria.find(c => 
                     c._id?.toString() === rating.criterion?.toString()
                   )
                   
                   return (
                     <Grid item xs={12} sm={6} key={rIndex}>
                       <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                         <Typography variant="body2" color="textSecondary" gutterBottom>
                           {criterion?.title || criterion?.name || 'Unknown Criterion'}
                         </Typography>
                         <Box display="flex" alignItems="center" gap={1}>
                           <Rating
                             value={rating.score || 0}
                             readOnly
                             size="small"
                             emptyIcon={<StarBorder fontSize="small" />}
                             icon={<Star fontSize="small" />}
                           />
                           <Typography variant="body2" fontWeight="bold">
                             {rating.score || 0}/5
                           </Typography>
                         </Box>
                       </Box>
                     </Grid>
                   )
                 })}
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    )
  }

  if (criteriaLoading || submissionsLoading || resultsLoading) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Đang tải dữ liệu đánh giá...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '600px', maxHeight: '90vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            📊 Kết quả đánh giá - {board?.title}
          </Typography>
          <Box display="flex" gap={1}>
            {['overview', 'detailed', 'myScores'].map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'overview' ? 'Tổng quan' : 
                 tab === 'detailed' ? 'Chi tiết' : 'Điểm của tôi'}
              </Button>
            ))}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Tab Tổng quan */}
        {activeTab === 'overview' && (
          <Grid container spacing={3}>
            {/* Thống kê */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom startIcon={<Assessment />}>
                    📈 Thống kê tổng quan
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="primary">
                          {overviewStats.totalMembers}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Tổng thành viên
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="success.main">
                          {overviewStats.evaluatedMembers}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Đã đánh giá
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="warning.main">
                          {overviewStats.pendingMembers}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Chưa đánh giá
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="info.main">
                          {overviewStats.overallAverage}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Điểm TB
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  {/* Progress bar */}
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" gutterBottom>
                      Tiến độ đánh giá: {overviewStats.completionRate}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={overviewStats.completionRate}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Danh sách thành viên */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6">
                      👥 Danh sách thành viên
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Lọc theo</InputLabel>
                      <Select
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value)}
                        label="Lọc theo"
                      >
                        <MenuItem value="all">Tất cả</MenuItem>
                        <MenuItem value="completed">Đã đánh giá</MenuItem>
                        <MenuItem value="pending">Chưa đánh giá</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Thành viên</TableCell>
                          <TableCell align="center">Trạng thái</TableCell>
                          <TableCell align="center">Điểm TB</TableCell>
                          <TableCell align="center">Số đánh giá</TableCell>
                          <TableCell align="center">Thao tác</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredMembers.map((member) => (
                          <TableRow key={member._id}>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{ width: 32, height: 32 }}>
                                  {(member.displayName || member.username || '?')[0].toUpperCase()}
                                </Avatar>
                                <Typography variant="body2">
                                  {member.displayName || member.username}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={member.isEvaluated ? 'Đã đánh giá' : 'Chưa đánh giá'}
                                color={member.isEvaluated ? 'success' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              {member.isEvaluated ? (
                                <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                  <Rating
                                    value={member.averageScore}
                                    readOnly
                                    precision={0.1}
                                    size="small"
                                  />
                                  <Typography variant="body2">
                                    {member.averageScore}
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography variant="body2" color="textSecondary">
                                  --
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2">
                                {member.evaluationCount}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Button
                                size="small"
                                startIcon={<Visibility />}
                                onClick={() => {
                                  setSelectedMember(member._id)
                                  setActiveTab('detailed')
                                }}
                                disabled={!member.isEvaluated}
                              >
                                Xem chi tiết
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {filteredMembers.length === 0 && (
                    <Alert severity="info" sx={{ mt: 2 }}>
                      Không có thành viên nào phù hợp với bộ lọc đã chọn
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab Chi tiết */}
        {activeTab === 'detailed' && (
          <Box>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Chọn thành viên để xem chi tiết</InputLabel>
              <Select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                label="Chọn thành viên để xem chi tiết"
              >
                {membersEvaluationStatus
                  .filter(member => member.isEvaluated)
                  .map(member => (
                    <MenuItem key={member._id} value={member._id}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar sx={{ width: 24, height: 24 }}>
                          {(member.displayName || member.username || '?')[0].toUpperCase()}
                        </Avatar>
                        {member.displayName || member.username}
                        <Chip 
                          label={`${member.averageScore}/5`} 
                          size="small" 
                          color="primary" 
                        />
                      </Box>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            {selectedMember && (
              <Card variant="outlined">
                <CardContent>
                  {(() => {
                    const member = membersEvaluationStatus.find(m => m._id === selectedMember)
                    return member ? (
                      <>
                        <Box display="flex" alignItems="center" gap={2} mb={3}>
                          <Avatar sx={{ width: 48, height: 48 }}>
                            {(member.displayName || member.username || '?')[0].toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="h6">
                              {member.displayName || member.username}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={2}>
                              <Rating value={member.averageScore} readOnly precision={0.1} />
                              <Typography variant="body2">
                                {member.averageScore}/5 ({member.evaluationCount} đánh giá)
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        {renderMemberDetail(member)}
                      </>
                    ) : null
                  })()}
                </CardContent>
              </Card>
            )}
          </Box>
        )}

        {/* Tab Điểm của tôi */}
        {activeTab === 'myScores' && myScoreStats && (
          <Grid container spacing={3}>
            {/* Thống kê điểm của tôi */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🏆 Điểm đánh giá của tôi
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="primary">
                          {myScoreStats.myAverage}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Điểm TB
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="success.main">
                          {myScoreStats.totalEvaluators}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Người đánh giá
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="info.main">
                          {myScoreStats.totalRatings}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Tổng đánh giá
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="warning.main">
                          {Math.max(...myScoreStats.allScores) || 0}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Điểm cao nhất
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Chi tiết điểm theo tiêu chí */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📋 Điểm theo tiêu chí
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Tiêu chí</TableCell>
                          <TableCell align="center">Điểm trung bình</TableCell>
                          <TableCell align="center">Số lượt đánh giá</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {myScoreStats.criteriaAverages.map((criteria, index) => (
                          <TableRow key={criteria.name}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {criteria.name}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                <Rating
                                  value={criteria.average}
                                  readOnly
                                  precision={0.1}
                                  size="small"
                                />
                                <Typography variant="body2" fontWeight="bold">
                                  {criteria.average}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2">
                                {criteria.count}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Thông báo khi không có dữ liệu */}
        {activeTab === 'myScores' && !myScoreStats && (
          <Alert severity="info">
            Bạn chưa nhận được đánh giá nào trong board này
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Đóng</Button>
      </DialogActions>
    </Dialog>
  )
}

export default MemberEvaluationForm