import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon
} from '@mui/icons-material'
import {
  selectBoardResults,
  selectDetailedLoading,
  selectDetailedError,
  selectSummary,
  selectFilteredBoardResults,
  fetchDetailedEvaluationResultsThunk,
  refreshDetailedResultsThunk,
  exportEvaluationResultsThunk,
  setSelectedBoard,
  setViewMode
} from '~/redux/activeEvaluationSubmission/detailedEvaluationResultsSlice'

const RatingTab = () => {
  const dispatch = useDispatch()
  const boardResults = useSelector(selectFilteredBoardResults)
  const summary = useSelector(selectSummary)
  const loading = useSelector(selectDetailedLoading)
  const error = useSelector(selectDetailedError)

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchDetailedEvaluationResultsThunk())
  }, [dispatch])

  const handleRefresh = () => {
    dispatch(refreshDetailedResultsThunk())
  }

  const handleExport = () => {
    dispatch(exportEvaluationResultsThunk({ format: 'excel' }))
  }

  const handleViewBoardDetails = (boardId) => {
    dispatch(setSelectedBoard(boardId))
    dispatch(setViewMode('detailed'))
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Đang tải dữ liệu đánh giá...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <Button color="inherit" size="small" onClick={handleRefresh}>
            Thử lại
          </Button>
        }
      >
        Có lỗi khi tải dữ liệu: {error}
      </Alert>
    )
  }

  if (!boardResults || boardResults.length === 0) {
    return (
      <Box textAlign="center" py={6}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Chưa có đánh giá nào được ghi nhận.
        </Typography>
        <Button variant="outlined" onClick={handleRefresh} startIcon={<RefreshIcon />}>
          Tải lại
        </Button>
      </Box>
    )
  }

  console.log('🚀 ~ RatingTab ~ boardResults:', boardResults)
  console.log('📊 ~ RatingTab ~ summary:', summary)

  return (
    <Box>
      {/* Header with summary */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            📝 Tất cả điểm đánh giá đã nhận
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tổng cộng {summary.totalEvaluations} đánh giá từ {summary.totalBoards} bảng
            {summary.overallAverage > 0 && (
              <Chip 
                label={`Điểm TB: ${summary.overallAverage.toFixed(1)}`}
                color="primary"
                size="small"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Box>
        
        <Box>
          <Tooltip title="Tải lại dữ liệu">
            <IconButton onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Xuất Excel">
            <IconButton onClick={handleExport}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Summary cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Tổng số bảng
              </Typography>
              <Typography variant="h4">
                {summary.totalBoards}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Tổng đánh giá
              </Typography>
              <Typography variant="h4">
                {summary.totalEvaluations}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Điểm trung bình
              </Typography>
              <Typography variant="h4">
                {summary.overallAverage > 0 ? summary.overallAverage.toFixed(1) : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
        </Grid>
      </Grid>

      {/* Main results table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Bảng</TableCell>
              <TableCell>Tiêu chí</TableCell>
              <TableCell align="center">Điểm</TableCell>
              <TableCell align="center">Ngày đánh giá</TableCell>
              <TableCell align="center">Người đánh giá</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {boardResults.flatMap(boardResult => {
              console.log('🔍 Board Result Structure:', boardResult)
              console.log('📋 Board Criteria:', boardResult.criteria)
              
              return boardResult.evaluations?.flatMap((evaluation, evalIdx) => {
                console.log('📝 Evaluation:', evaluation)
                
                return evaluation.ratings?.map((rating, ratingIdx) => {
                  console.log('⭐ Rating:', rating)
                  
                  // Try multiple ways to find the criterion
                  let criterion = null
                  
                  // Method 1: Find by _id match
                  if (boardResult.criteria) {
                    criterion = boardResult.criteria.find(c =>
                      c._id?.toString() === rating.criterion?.toString() ||
                      c._id?.toString() === rating.criterionId?.toString()
                    )
                  }
                  
                  // Method 2: If rating has criterion object directly
                  if (!criterion && rating.criterion && typeof rating.criterion === 'object') {
                    criterion = rating.criterion
                  }
                  
                  // Method 3: Check if criterion info is in rating itself
                  if (!criterion && rating.criterionName) {
                    criterion = { name: rating.criterionName, title: rating.criterionTitle }
                  }
                  
                  console.log('🎯 Found Criterion:', criterion)
                  
                  return (
                    <TableRow key={`${boardResult.board._id}-${evalIdx}-${ratingIdx}`}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {boardResult.board.title || 'Bảng không tên'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {criterion?.title || 
                           criterion?.name || 
                           rating.criterionName ||
                           rating.criterionTitle ||
                           `Tiêu chí #${ratingIdx + 1}`}
                        </Typography>
                        {criterion?.description && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {criterion.description}
                          </Typography>
                        )}
                        {/* Debug info - remove in production */}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={rating.score || 'N/A'}
                          color={rating.score >= 8 ? 'success' : rating.score >= 6 ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {evaluation.createdAt ? 
                            new Date(evaluation.createdAt).toLocaleDateString('vi-VN') :
                            'N/A'
                          }
                        </Typography>
                        {evaluation.createdAt && (
                          <Typography variant="caption" color="text.secondary">
                            {new Date(evaluation.createdAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">
                          {evaluation.evaluator?.displayName || 
                           evaluation.evaluator?.username ||
                           evaluation.evaluatorName ||
                           'Ẩn danh'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )
                }) || []
              }) || []
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default RatingTab  