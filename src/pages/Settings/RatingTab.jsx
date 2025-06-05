// AllBoardsEvaluationHistory.js - Xem kết quả đánh giá của tất cả board đã tham gia
import React, { useEffect, useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Rating,
  Divider,
  Avatar,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText
} from '@mui/material'
import {
  Work as ProjectIcon,
  Groups as TeamIcon,
  ExpandMore,
  Assessment,
  TrendingUp,
  EmojiEvents,
  Star,
  StarBorder,
  Person,
  Timeline
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'

import {
  fetchAllMyEvaluationResultsThunk,
  selectAllMyEvaluationResults,
  selectAllResultsLoading
} from '~/redux/activeEvaluationSubmission/myEvaluationResultsSlice'
import { selectCurrentUser } from '~/redux/User/userSlice'

const AllBoardsEvaluationHistory = () => {
  const dispatch = useDispatch()
  const currentUser = useSelector(selectCurrentUser)
  const allBoardsResults = useSelector(selectAllMyEvaluationResults)
  const loading = useSelector(selectAllResultsLoading)

  const [expandedBoard, setExpandedBoard] = useState(false)

  // Fetch dữ liệu khi component mount
  useEffect(() => {
    if (currentUser?._id) {
      console.log('🔄 Fetching all evaluation results for user:', currentUser._id)
      dispatch(fetchAllMyEvaluationResultsThunk(currentUser._id))
        .then(() => {
          console.log('✅ Successfully fetched all evaluation results')
        })
        .catch((error) => {
          console.error('❌ Error fetching all evaluation results:', error)
          toast.error('Có lỗi khi tải dữ liệu đánh giá', { theme: 'colored' })
        })
    }
  }, [currentUser?._id, dispatch])

  // Xử lý dữ liệu đánh giá tổng hợp
  const processedAllResults = useMemo(() => {
    if (!allBoardsResults || !Array.isArray(allBoardsResults) || allBoardsResults.length === 0) {
      return {
        boardsData: [],
        totalBoards: 0,
        totalEvaluations: 0,
        overallAverage: 0,
        skillsAcrossBoards: {},
        timelineData: []
      }
    }

    const boardsData = []
    let totalEvaluations = 0
    let allScores = []
    const skillsAcrossBoards = {}
    const timelineData = []

    allBoardsResults.forEach(boardResult => {
      const { board, evaluations, criteria } = boardResult

      if (!evaluations || !Array.isArray(evaluations) || evaluations.length === 0) {
        return
      }

      const validEvaluations = evaluations.filter(e =>
        e && e.ratings && Array.isArray(e.ratings)
      )

      // Xử lý điểm theo tiêu chí cho board này
      const criteriaScores = {}
      const criteriaStats = {}

      validEvaluations.forEach(evaluation => {
        evaluation.ratings
          .filter(rating => rating && rating.criterion && rating.score !== undefined)
          .forEach(rating => {
            // Xử lý ID tiêu chí một cách linh hoạt hơn
            const criterionId = rating.criterion?._id?.toString() || 
                              rating.criterion?.toString() || 
                              rating.criterionId?.toString()
            
            if (!criterionId) return

            if (!criteriaScores[criterionId]) {
              criteriaScores[criterionId] = []
            }
            criteriaScores[criterionId].push(rating.score)
          })
      })

      // Tính trung bình cho từng tiêu chí
      const averageScores = {}
      Object.keys(criteriaScores).forEach(criterionId => {
        const scores = criteriaScores[criterionId]
        const average = scores.reduce((sum, score) => sum + score, 0) / scores.length

        // Tìm tên tiêu chí một cách tốt hơn
        let criterionName = 'Không xác định'
        
        if (criteria && Array.isArray(criteria)) {
          // Tìm theo _id
          const criterion = criteria.find(c => 
            c._id?.toString() === criterionId ||
            c.id?.toString() === criterionId
          )
          
          if (criterion) {
            criterionName = criterion.title || criterion.name || criterion.criterionName || 'Không xác định'
          }
        }
        
        // Nếu không tìm thấy trong criteria, thử tìm trong rating object
        if (criterionName === 'Không xác định') {
          for (const evaluation of validEvaluations) {
            const rating = evaluation.ratings.find(r => 
              (r.criterion?._id?.toString() === criterionId || 
               r.criterion?.toString() === criterionId)
            )
            if (rating && rating.criterion && typeof rating.criterion === 'object') {
              criterionName = rating.criterion.title || rating.criterion.name || 'Không xác định'
              break
            }
          }
        }

        averageScores[criterionId] = average
        criteriaStats[criterionId] = {
          name: criterionName,
          average: Math.round(average * 10) / 10,
          count: scores.length,
          min: Math.min(...scores),
          max: Math.max(...scores)
        }

        // Tích lũy kỹ năng qua các board
        if (!skillsAcrossBoards[criterionName]) {
          skillsAcrossBoards[criterionName] = []
        }
        skillsAcrossBoards[criterionName].push({
          boardName: board?.title || 'Không xác định',
          score: Math.round(average * 10) / 10,
          period: board?.createdAt
        })
      })

      // Tính điểm trung bình của board
      const boardScores = Object.values(criteriaScores).flat()
      const boardAverage = boardScores.length > 0
        ? boardScores.reduce((sum, score) => sum + score, 0) / boardScores.length
        : 0

      allScores = allScores.concat(boardScores)
      totalEvaluations += validEvaluations.length

      // Thêm vào timeline
      timelineData.push({
        boardId: board?._id,
        boardName: board?.title || 'Không xác định',
        period: new Date(board?.createdAt).toLocaleDateString('vi-VN'),
        average: Math.round(boardAverage * 10) / 10,
        evaluatorCount: validEvaluations.length
      })

      boardsData.push({
        board,
        evaluations: validEvaluations,
        criteriaStats,
        boardAverage: Math.round(boardAverage * 10) / 10,
        totalEvaluators: validEvaluations.length
      })
    })

    // Tính điểm trung bình tổng thể
    const overallAverage = allScores.length > 0
      ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length
      : 0

    // Tính trung bình kỹ năng qua tất cả board
    Object.keys(skillsAcrossBoards).forEach(skillName => {
      const skillData = skillsAcrossBoards[skillName]
      const average = skillData.reduce((sum, item) => sum + item.score, 0) / skillData.length
      skillsAcrossBoards[skillName] = {
        scores: skillData,
        average: Math.round(average * 10) / 10,
        trend: skillData.length > 1 ? 
          (skillData[skillData.length - 1].score - skillData[0].score > 0 ? 'up' : 'down') : 'stable'
      }
    })

    // Sắp xếp timeline theo thời gian
    timelineData.sort((a, b) => new Date(a.period) - new Date(b.period))

    return {
      boardsData,
      totalBoards: boardsData.length,
      totalEvaluations,
      overallAverage: Math.round(overallAverage * 10) / 10,
      skillsAcrossBoards,
      timelineData
    }
  }, [allBoardsResults])

  // Render chip điểm số
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

  // Render trend icon
  const renderTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp color="success" />
    if (trend === 'down') return <TrendingUp color="error" sx={{ transform: 'rotate(180deg)' }} />
    return <TrendingUp color="disabled" sx={{ transform: 'rotate(90deg)' }} />
  }

  // Lấy thông tin người đánh giá - Cải thiện logic
  const getEvaluatorInfo = (evaluation, boardData) => {
    // Lấy evaluator ID từ nhiều nguồn khác nhau
    const evaluatorId = evaluation.evaluator?._id || 
                       evaluation.evaluator || 
                       evaluation.evaluatorId || 
                       evaluation.userId
  
    if (!evaluatorId) {
      return { name: 'Không xác định', avatar: null }
    }
  
    // Tìm kiếm evaluator trong nhiều nguồn dữ liệu
    let evaluator = null
    
    // 1. Kiểm tra nếu evaluator đã có sẵn thông tin
    if (evaluation.evaluator && typeof evaluation.evaluator === 'object') {
      evaluator = evaluation.evaluator
    }
    
    // 2. Tìm trong board users (FE_allUsers)
    if (!evaluator && boardData?.board?.FE_allUsers) {
      evaluator = boardData.board.FE_allUsers.find(user => 
        user?._id?.toString() === evaluatorId?.toString()
      )
    }
    
    // 3. Tìm trong board members
    if (!evaluator && boardData?.board?.members) {
      evaluator = boardData.board.members.find(member => 
        member?._id?.toString() === evaluatorId?.toString() ||
        member?.userId?.toString() === evaluatorId?.toString()
      )
      
      // Nếu member có nested user object
      if (!evaluator?.displayName && evaluator?.user) {
        evaluator = evaluator.user
      }
    }
    
    // 4. Tìm trong board owners
    if (!evaluator && boardData?.board?.ownerIds) {
      const isOwner = boardData.board.ownerIds.some(id => 
        id?.toString() === evaluatorId?.toString()
      )
      if (isOwner) {
        evaluator = { 
          _id: evaluatorId, 
          displayName: 'Quản trị viên', 
          username: 'admin',
          isOwner: true
        }
      }
    }
  
    // 5. Kiểm tra evaluation.user nếu có
    if (!evaluator && evaluation.user) {
      evaluator = evaluation.user
    }
  
    return {
      name: evaluator?.displayName || 
            evaluator?.username || 
            evaluator?.name || 
            evaluator?.email?.split('@')[0] || 
            'Thành viên ẩn danh',
      avatar: evaluator?.avatar || null,
      isOwner: evaluator?.isOwner || false
    }
  }


  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Đang tải lịch sử đánh giá...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        📊 Lịch Sử Đánh Giá Của Tôi
      </Typography>

      {processedAllResults.totalBoards === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography>
            Bạn chưa có kết quả đánh giá nào. Hãy tham gia các board và chờ đánh giá từ các thành viên khác!
          </Typography>
        </Alert>
      ) : (
        <>
          {/* Tổng quan chung */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ bgcolor: 'primary.50' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🏆 Tổng quan chung
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h3" color="primary.main">
                          {processedAllResults.totalBoards}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Board tham gia
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h3" color="info.main">
                          {processedAllResults.totalEvaluations}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Lượt đánh giá
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Typography variant="h3" color="success.main">
                          {processedAllResults.overallAverage}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Điểm trung bình
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Box textAlign="center">
                        <Rating
                          value={processedAllResults.overallAverage}
                          readOnly
                          precision={0.1}
                          emptyIcon={<StarBorder />}
                          icon={<Star />}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Timeline phát triển */}
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              📈 Timeline Phát Triển
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {processedAllResults.timelineData.map((item, index) => (
                <Card key={index} variant="outlined" sx={{ minWidth: 200 }}>
                  <CardContent sx={{ pb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, mr: 1 }}>
                        <Timeline fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" noWrap>
                          {item.boardName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {item.period}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {renderScoreChip(item.average)}
                      <Typography variant="caption">
                        {item.evaluatorCount} đánh giá
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>

          {/* Tổng quan kỹ năng qua các board */}
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              🎯 Tổng quan kỹ năng qua các board
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(processedAllResults.skillsAcrossBoards).map(([skillName, skillData]) => (
                <Grid item xs={12} sm={6} md={4} key={skillName}>
                  <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {skillName}
                      </Typography>
                      {renderTrendIcon(skillData.trend)}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Rating
                        value={skillData.average}
                        precision={0.1}
                        readOnly
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="body2">
                        ({skillData.average}/5)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(skillData.average / 5) * 100}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: skillData.average >= 4 ? 'success.main' :
                            skillData.average >= 3 ? 'primary.main' :
                              skillData.average >= 2 ? 'warning.main' : 'error.main'
                        }
                      }}
                    />
                    <Typography variant="caption" color="textSecondary">
                      Qua {skillData.scores.length} board
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Chi tiết từng board */}
          <Typography variant="h5" gutterBottom>
            📋 Chi tiết theo từng board
          </Typography>

          {processedAllResults.boardsData.map((boardData, index) => (
            <Accordion 
              key={boardData.board?._id || index}
              expanded={expandedBoard === index}
              onChange={() => setExpandedBoard(expandedBoard === index ? false : index)}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                    <ProjectIcon />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">
                      {boardData.board?.title || 'Không xác định'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(boardData.board?.createdAt).toLocaleDateString('vi-VN')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {boardData.totalEvaluators} người đánh giá
                      </Typography>
                      {renderScoreChip(boardData.boardAverage)}
                    </Box>
                  </Box>
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                <Grid container spacing={3}>
                  {/* Điểm theo tiêu chí */}
                  <Grid item xs={12} md={8}>
                    <Typography variant="h6" gutterBottom>
                      📈 Điểm theo từng tiêu chí
                    </Typography>
                    {Object.entries(boardData.criteriaStats).length === 0 ? (
                      <Alert severity="warning">
                        Không có dữ liệu tiêu chí đánh giá
                      </Alert>
                    ) : (
                      Object.entries(boardData.criteriaStats).map(([criterionId, stats]) => (
                        <Box key={criterionId} sx={{ mb: 3 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {stats.name}
                            </Typography>
                            {renderScoreChip(stats.average)}
                          </Box>

                          <Box sx={{ mb: 1 }}>
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
                          </Box>

                          <Box display="flex" gap={2} sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                            <span>Trung bình: <strong>{stats.average}/5</strong></span>
                            <span>Cao nhất: <strong>{stats.max}/5</strong></span>
                            <span>Thấp nhất: <strong>{stats.min}/5</strong></span>
                            <span>Số đánh giá: <strong>{stats.count}</strong></span>
                          </Box>
                        </Box>
                      ))
                    )}
                  </Grid>

                  {/* Danh sách người đánh giá */}
                  <Grid item xs={12} md={4}>
                    <Typography variant="h6" gutterBottom>
                      👥 Người đánh giá
                    </Typography>
                    
                    <List>
                      {boardData.evaluations.length === 0 ? (
                        <ListItem>
                          <ListItemText primary="Chưa có đánh giá nào" />
                        </ListItem>
                      ) : (
                        boardData.evaluations.map((evaluation, evalIndex) => {
                          const evaluatorInfo = getEvaluatorInfo(evaluation, boardData)
                          return (
                            <ListItem key={evalIndex} sx={{ px: 0 }}>
                              <ListItemAvatar>
                                <Avatar src={evaluatorInfo.avatar} sx={{ width: 32, height: 32 }}>
                                  <Person />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={evaluatorInfo.name}
                                secondary={evaluation.createdAt ? 
                                  new Date(evaluation.createdAt).toLocaleDateString('vi-VN') : 
                                  'Không xác định'}
                              />
                            </ListItem>
                          )
                        })
                      )}
                    </List>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}

          {/* Bảng tổng hợp kỹ năng */}
          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            📊 Bảng Tổng Hợp Kỹ Năng
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Board</TableCell>
                  {Object.keys(processedAllResults.skillsAcrossBoards).map((skill, index) => (
                    <TableCell key={index} align="center">{skill}</TableCell>
                  ))}
                  <TableCell align="center">Trung bình</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {processedAllResults.boardsData.map((boardData, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {boardData.board?.title}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {boardData.board?.createdAt ? 
                            new Date(boardData.board.createdAt).toLocaleDateString('vi-VN') : 
                            'Không xác định'}
                        </Typography>
                      </Box>
                    </TableCell>
                    {Object.keys(processedAllResults.skillsAcrossBoards).map((skill, skillIndex) => {
                      const criteriaEntry = Object.entries(boardData.criteriaStats)
                        .find(([id, stats]) => stats.name === skill)
                      const score = criteriaEntry ? criteriaEntry[1].average : '-'
                      return (
                        <TableCell key={skillIndex} align="center">
                          {score !== '-' ? score : '-'}
                        </TableCell>
                      )
                    })}
                    <TableCell align="center">
                      <strong>{boardData.boardAverage}</strong>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>Trung bình tổng</strong></TableCell>
                  {Object.values(processedAllResults.skillsAcrossBoards).map((skillData, index) => (
                    <TableCell key={index} align="center">
                      <strong>{skillData.average}</strong>
                    </TableCell>
                  ))}
                  <TableCell align="center">
                    <strong>{processedAllResults.overallAverage}</strong>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  )
}

export default AllBoardsEvaluationHistory