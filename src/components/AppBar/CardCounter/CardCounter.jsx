import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Popover from '@mui/material/Popover'
import Badge from '@mui/material/Badge'
import Tooltip from '@mui/material/Tooltip'
import AssignmentIcon from '@mui/icons-material/Assignment'
import FolderIcon from '@mui/icons-material/Folder'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import authorizedAxiosInstance from '~/utils/authorizeAxios'
import { API_ROOT } from '~/utils/constants'
import { selectCurrentActiveBoard } from '~/redux/activeBoard/activeBoardSlice'

function CardCounter() {
  const [anchorEl, setAnchorEl] = useState(null)
  const [allBoardsData, setAllBoardsData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totalCardsAllBoards, setTotalCardsAllBoards] = useState(0)
  const open = Boolean(anchorEl)

  // Get current active board from Redux store
  const currentActiveBoard = useSelector(selectCurrentActiveBoard)

  const handleClick = async (event) => {
    setAnchorEl(event.currentTarget)
    if (allBoardsData.length === 0) {
      await fetchAllBoardsData()
    }
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  // Function để tính toán stats cho một board từ dữ liệu có sẵn
  const calculateBoardStats = (boardData) => {
    if (!boardData || !boardData.columns) {
      return {
        totalCards: 0,
        columnStats: []
      }
    }

    const columnStats = boardData.columns.map(column => {
      // Lọc bỏ placeholder cards
      const realCards = column.cards?.filter(card => !card.FE_PlaceholderCard) || []
      const cardCount = realCards.length

      return {
        columnId: column._id,
        columnTitle: column.title,
        cardCount: cardCount,
        cards: realCards
      }
    })

    const totalCards = columnStats.reduce((sum, col) => sum + col.cardCount, 0)

    return {
      totalCards,
      columnStats
    }
  }

  // Function để fetch tất cả boards của user
  const fetchAllBoardsData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch danh sách tất cả boards của user
      const boardsResponse = await authorizedAxiosInstance.get(`${API_ROOT}/v1/boards`)
      
      // Kiểm tra và xử lý response data
      let boards = []
      if (boardsResponse.data) {
        // Nếu data là array thì sử dụng trực tiếp
        if (Array.isArray(boardsResponse.data)) {
          boards = boardsResponse.data
        }
        // Nếu data có property boards thì lấy từ đó
        else if (boardsResponse.data.boards && Array.isArray(boardsResponse.data.boards)) {
          boards = boardsResponse.data.boards
        }
        // Nếu data có property data thì lấy từ đó
        else if (boardsResponse.data.data && Array.isArray(boardsResponse.data.data)) {
          boards = boardsResponse.data.data
        }
      }

      console.log('Boards data:', boards) // Debug log

      const boardsWithStats = []
      let totalCards = 0

      // Fetch chi tiết từng board
      for (const board of boards) {
        try {
          let boardDetail = null
          
          // Nếu board hiện tại là active board, sử dụng dữ liệu từ Redux
          if (currentActiveBoard && currentActiveBoard._id === board._id) {
            boardDetail = currentActiveBoard
          } else {
            // Fetch từ API nếu không phải active board
            const boardDetailResponse = await authorizedAxiosInstance.get(`${API_ROOT}/v1/boards/${board._id}`)
            boardDetail = boardDetailResponse.data
          }

          if (boardDetail && boardDetail.columns) {
            const { totalCards: boardTotalCards, columnStats } = calculateBoardStats(boardDetail)
            totalCards += boardTotalCards

            boardsWithStats.push({
              boardId: boardDetail._id,
              boardTitle: boardDetail.title || 'Board không có tên',
              boardDescription: boardDetail.description || '',
              totalCards: boardTotalCards,
              columnStats: columnStats,
              createdAt: boardDetail.createdAt,
              updatedAt: boardDetail.updatedAt,
              isActiveBoard: currentActiveBoard && currentActiveBoard._id === boardDetail._id
            })
          }
        } catch (boardError) {
          console.warn(`Failed to fetch board ${board._id}:`, boardError)
          // Vẫn thêm board nhưng với thông tin cơ bản
          boardsWithStats.push({
            boardId: board._id,
            boardTitle: board.title || 'Board không có tên',
            boardDescription: board.description || '',
            totalCards: 0,
            columnStats: [],
            error: 'Không thể tải dữ liệu',
            isActiveBoard: false
          })
        }
      }

      // Sắp xếp boards theo thời gian cập nhật mới nhất
      boardsWithStats.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))

      setAllBoardsData(boardsWithStats)
      setTotalCardsAllBoards(totalCards)

    } catch (error) {
      console.error('Error fetching boards:', error)
      console.error('Response data:', error.response?.data) // Debug log
      setError(`Không thể tải danh sách board: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Effect để cập nhật tổng số cards khi active board thay đổi
  useEffect(() => {
    if (currentActiveBoard && allBoardsData.length > 0) {
      // Cập nhật lại stats cho active board
      const updatedBoardsData = allBoardsData.map(board => {
        if (board.boardId === currentActiveBoard._id) {
          const { totalCards, columnStats } = calculateBoardStats(currentActiveBoard)
          return {
            ...board,
            totalCards,
            columnStats,
            updatedAt: currentActiveBoard.updatedAt,
            isActiveBoard: true
          }
        }
        return {
          ...board,
          isActiveBoard: false
        }
      })

      // Tính lại tổng số cards
      const newTotalCards = updatedBoardsData.reduce((sum, board) => sum + board.totalCards, 0)
      
      setAllBoardsData(updatedBoardsData)
      setTotalCardsAllBoards(newTotalCards)
    }
  }, [currentActiveBoard])

  // Function để format ngày tháng
  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  return (
    <>
      <Tooltip title="Thống kê tất cả Board">
        <Button
          onClick={handleClick}
          variant="outlined"
          sx={{
            color: 'white',
            border: 'none',
            minWidth: 'auto',
            padding: '6px 12px',
            '&:hover': {
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          <Badge 
            badgeContent={totalCardsAllBoards} 
            color="error"
            max={999}
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: '#ff4444',
                color: 'white'
              }
            }}
          >
            <AssignmentIcon />
          </Badge>
        </Button>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 400,
            maxWidth: 500,
            maxHeight: 600,
            borderRadius: 2,
            boxShadow: 3
          }
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography 
            variant="h6" 
            component="h3" 
            sx={{ 
              mb: 2, 
              fontWeight: 'bold',
              color: 'text.primary',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <FolderIcon color="primary" />
            Thống kê tất cả Board
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: 'medium', mb: 1 }}>
              Tổng số board: <strong>{allBoardsData.length}</strong>
            </Typography>
            <Typography variant="body1" color="primary" sx={{ fontWeight: 'bold' }}>
              Tổng số card: <strong>{totalCardsAllBoards}</strong>
            </Typography>
          </Box>

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={40} />
              <Typography variant="body2" sx={{ ml: 2, alignSelf: 'center' }}>
                Đang tải dữ liệu...
              </Typography>
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && allBoardsData.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              Không có board nào
            </Typography>
          )}

          {!loading && allBoardsData.length > 0 && (
            <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
              {allBoardsData.map((board, boardIndex) => (
                <Accordion 
                  key={board.boardId}
                  sx={{ 
                    mb: 1,
                    '&:before': { display: 'none' },
                    boxShadow: 1,
                    // Highlight active board
                    ...(board.isActiveBoard && {
                      border: '2px solid',
                      borderColor: 'primary.main',
                      backgroundColor: 'primary.50'
                    })
                  }}
                  defaultExpanded={boardIndex === 0} // Mở board đầu tiên
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      backgroundColor: board.isActiveBoard ? 'primary.100' : 'action.hover',
                      '&:hover': {
                        backgroundColor: board.isActiveBoard ? 'primary.200' : 'action.selected'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mr: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                          {board.boardTitle}
                          {board.isActiveBoard && (
                            <Typography 
                              component="span" 
                              variant="caption" 
                              sx={{ 
                                ml: 1, 
                                px: 1, 
                                py: 0.25, 
                                backgroundColor: 'primary.main', 
                                color: 'white', 
                                borderRadius: 1,
                                fontSize: '0.65rem'
                              }}
                            >
                              ĐANG HOẠT ĐỘNG
                            </Typography>
                          )}
                        </Typography>
                        {board.boardDescription && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {board.boardDescription.substring(0, 50)}{board.boardDescription.length > 50 ? '...' : ''}
                          </Typography>
                        )}
                        {board.updatedAt && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            Cập nhật: {formatDate(board.updatedAt)}
                          </Typography>
                        )}
                      </Box>
                      <Badge 
                        badgeContent={board.totalCards} 
                        color={board.totalCards > 0 ? 'primary' : 'default'}
                        sx={{
                          '& .MuiBadge-badge': {
                            position: 'static',
                            transform: 'none',
                            minWidth: '24px',
                            height: '24px',
                            fontSize: '0.75rem'
                          }
                        }}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {board.error ? (
                      <Alert severity="warning" size="small">
                        {board.error}
                      </Alert>
                    ) : board.columnStats.length > 0 ? (
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }}>
                          Chi tiết theo cột:
                        </Typography>
                        {board.columnStats.map((column) => (
                          <Box 
                            key={column.columnId}
                            sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              py: 0.5,
                              px: 1,
                              mb: 0.5,
                              backgroundColor: 'background.default',
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider'
                            }}
                          >
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                flex: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                mr: 1
                              }}
                            >
                              {column.columnTitle}
                            </Typography>
                            <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold' }}>
                              {column.cardCount}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Board này chưa có column nào
                      </Typography>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}

          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={fetchAllBoardsData}
              disabled={loading}
              sx={{ width: '100%' }}
            >
              {loading ? 'Đang tải...' : 'Làm mới dữ liệu'}
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  )
}

export default CardCounter