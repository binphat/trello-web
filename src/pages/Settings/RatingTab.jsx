import React, { useEffect, useState } from 'react'
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
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  FileDownload as FileDownloadIcon,
  TableChart as TableChartIcon
} from '@mui/icons-material'
import * as XLSX from 'xlsx'
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
  
  // State for export menu
  const [exportAnchorEl, setExportAnchorEl] = useState(null)
  const [isExporting, setIsExporting] = useState(false)

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchDetailedEvaluationResultsThunk())
  }, [dispatch])

  const handleRefresh = () => {
    dispatch(refreshDetailedResultsThunk())
  }

  const handleExportMenuOpen = (event) => {
    setExportAnchorEl(event.currentTarget)
  }

  const handleExportMenuClose = () => {
    setExportAnchorEl(null)
  }

  // Client-side Excel export function
  const handleExportToExcel = async (format = 'detailed') => {
    setIsExporting(true)
    setExportAnchorEl(null)
    
    try {
      // Prepare data for export
      const exportData = []
      
      if (format === 'detailed') {
        // Detailed export with all ratings
        boardResults.forEach(boardResult => {
          boardResult.evaluations?.forEach(evaluation => {
            evaluation.ratings?.forEach(rating => {
              // Find criterion information
              let criterion = null
              if (boardResult.criteria) {
                criterion = boardResult.criteria.find(c =>
                  c._id?.toString() === rating.criterion?.toString() ||
                  c._id?.toString() === rating.criterionId?.toString()
                )
              }
              
              if (!criterion && rating.criterion && typeof rating.criterion === 'object') {
                criterion = rating.criterion
              }
              
              if (!criterion && rating.criterionName) {
                criterion = { name: rating.criterionName, title: rating.criterionTitle }
              }

              exportData.push({
                'Tên Bảng': boardResult.board?.title || 'Bảng không tên',
                'ID Bảng': boardResult.board?._id || '',
                'Tiêu Chí': criterion?.title || criterion?.name || rating.criterionName || `Tiêu chí #${exportData.length + 1}`,
                'Điểm Số': rating.score || 0,
                'Người Đánh Giá': evaluation.evaluator?.displayName || evaluation.evaluator?.username || evaluation.evaluatorName || 'Ẩn danh',
                'Email Người Đánh Giá': evaluation.evaluator?.email || '',
                'Ngày Đánh Giá': evaluation.createdAt ? new Date(evaluation.createdAt).toLocaleDateString('vi-VN') : '',
                'Giờ Đánh Giá': evaluation.createdAt ? new Date(evaluation.createdAt).toLocaleTimeString('vi-VN') : '',
                'Trạng Thái': evaluation.status || 'Hoàn thành'
              })
            })
          })
        })
      } else if (format === 'summary') {
        // Summary export with board averages
        boardResults.forEach(boardResult => {
          const boardEvaluations = boardResult.evaluations || []
          const totalRatings = boardEvaluations.reduce((acc, eva) => acc + (eva.ratings?.length || 0), 0)
          const totalScore = boardEvaluations.reduce((acc, eva) => {
            return acc + (eva.ratings?.reduce((sum, rating) => sum + (rating.score || 0), 0) || 0)
          }, 0)
          const averageScore = totalRatings > 0 ? (totalScore / totalRatings).toFixed(2) : 0

          exportData.push({
            'Tên Bảng': boardResult.board?.title || 'Bảng không tên',
            'ID Bảng': boardResult.board?._id || '',
            'Số Lượng Đánh Giá': boardEvaluations.length,
            'Tổng Số Tiêu Chí Được Đánh Giá': totalRatings,
            'Điểm Trung Bình': averageScore,
            'Ngày Tạo Bảng': boardResult.board?.createdAt ? new Date(boardResult.board.createdAt).toLocaleDateString('vi-VN') : '',
            'Người Tạo Bảng': boardResult.board?.creator?.displayName || boardResult.board?.creator?.username || '',
            'Trạng Thái Bảng': boardResult.board?.status || 'Hoạt động'
          })
        })
      }

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(exportData)

      // Set column widths
      const columnWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }))
      worksheet['!cols'] = columnWidths

      // Add worksheet to workbook
      const sheetName = format === 'detailed' ? 'Chi Tiết Đánh Giá' : 'Tổng Hợp Đánh Giá'
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

      // Add summary sheet if detailed export
      if (format === 'detailed' && summary) {
        const summaryData = [
          { 'Thông Tin': 'Tổng số bảng', 'Giá Trị': summary.totalBoards || 0 },
          { 'Thông Tin': 'Tổng số đánh giá', 'Giá Trị': summary.totalEvaluations || 0 },
          { 'Thông Tin': 'Điểm trung bình tổng thể', 'Giá Trị': summary.overallAverage ? summary.overallAverage.toFixed(2) : 'N/A' },
          { 'Thông Tin': 'Ngày xuất báo cáo', 'Giá Trị': new Date().toLocaleString('vi-VN') }
        ]
        const summarySheet = XLSX.utils.json_to_sheet(summaryData)
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tổng Quan')
      }

      // Generate filename
      const timestamp = new Date().toISOString().slice(0, 10)
      const filename = `DanhGia_${format === 'detailed' ? 'ChiTiet' : 'TongHop'}_${timestamp}.xlsx`

      // Save file
      XLSX.writeFile(workbook, filename)

      // Show success message (you might want to use a toast notification instead)
      console.log(`Đã xuất file Excel: ${filename}`)
      
    } catch (error) {
      console.error('Lỗi khi xuất Excel:', error)
      // You might want to show an error notification here
    } finally {
      setIsExporting(false)
    }
  }

  // Server-side export (using existing Redux action)
  const handleServerExport = () => {
    dispatch(exportEvaluationResultsThunk({ format: 'excel' }))
    setExportAnchorEl(null)
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
          <Tooltip title="Xuất dữ liệu">
            <IconButton 
              onClick={handleExportMenuOpen}
              disabled={isExporting}
            >
              {isExporting ? <CircularProgress size={24} /> : <DownloadIcon />}
            </IconButton>
          </Tooltip>
          
          {/* Export Menu */}
          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={handleExportMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={() => handleExportToExcel('detailed')}>
              <ListItemIcon>
                <TableChartIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Excel" secondary="Tất cả đánh giá và tiêu chí" />
            </MenuItem>
          </Menu>
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