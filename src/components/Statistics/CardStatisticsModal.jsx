import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress
} from '@mui/material'
import {
  BarChart,
  Assessment,
  ViewColumn,
  Assignment
} from '@mui/icons-material'

const CardStatisticsModal = ({ open, onClose, statistics, board }) => {
  if (!statistics || !board) {
    return null
  }

  // Tính toán phần trăm cho progress bar
  const getProgressPercentage = (cardCount) => {
    if (statistics.maxCards === 0) return 0
    return (cardCount / statistics.maxCards) * 100
  }

  // Màu sắc cho progress bar dựa trên số lượng cards
  const getProgressColor = (cardCount) => {
    const percentage = getProgressPercentage(cardCount)
    if (percentage >= 80) return 'success'
    if (percentage >= 50) return 'primary'
    if (percentage >= 20) return 'warning'
    return 'error'
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assessment color="primary" />
          <Typography variant="h6" component="span">
            Thống Kê Cards - {board.title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Tổng quan */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', bgcolor: 'primary.50' }}>
              <CardContent sx={{ py: 2 }}>
                <Assignment sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" color="primary.main" fontWeight="bold">
                  {statistics.totalCards}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng Cards
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', bgcolor: 'success.50' }}>
              <CardContent sx={{ py: 2 }}>
                <ViewColumn sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {statistics.totalColumns}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng Columns
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', bgcolor: 'warning.50' }}>
              <CardContent sx={{ py: 2 }}>
                <BarChart sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {statistics.averageCardsPerColumn}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  TB Cards/Column
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ textAlign: 'center', bgcolor: 'error.50' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h4" color="error.main" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
                  {statistics.emptyColumns}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Columns Trống
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Thông tin nổi bật */}
        {statistics.mostActiveColumn && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              🏆 Column Hoạt Động Nhất
            </Typography>
            <Typography variant="body1">
              <strong>{statistics.mostActiveColumn.columnTitle}</strong> với {statistics.mostActiveColumn.cardCount} cards
            </Typography>
          </Box>
        )}

        {/* Bảng chi tiết */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Chi Tiết Theo Column
        </Typography>

        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell><strong>Column</strong></TableCell>
                <TableCell align="center"><strong>Số Cards</strong></TableCell>
                <TableCell align="center"><strong>Tỷ Lệ</strong></TableCell>
                <TableCell align="center"><strong>Trạng Thái</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {statistics.columnStats
                .sort((a, b) => b.cardCount - a.cardCount) // Sắp xếp theo số lượng cards giảm dần
                .map((columnStat) => (
                  <TableRow key={columnStat.columnId} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {columnStat.columnTitle}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={columnStat.cardCount}
                        size="small"
                        color={columnStat.cardCount > 0 ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {statistics.totalCards > 0
                          ? `${((columnStat.cardCount / statistics.totalCards) * 100).toFixed(1)}%`
                          : '0%'
                        }
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {columnStat.cardCount === 0 ? (
                        <Chip label="Trống" size="small" color="error" variant="outlined" />
                      ) : columnStat.cardCount === statistics.maxCards ? (
                        <Chip label="Cao nhất" size="small" color="success" />
                      ) : columnStat.cardCount < statistics.averageCardsPerColumn ? (
                        <Chip label="Dưới TB" size="small" color="warning" variant="outlined" />
                      ) : (
                        <Chip label="Bình thường" size="small" color="info" variant="outlined" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Thống kê bổ sung */}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CardStatisticsModal