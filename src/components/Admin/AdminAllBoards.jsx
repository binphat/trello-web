import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  AppBar,
  Toolbar,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Container,
  Paper,
  Tooltip,
  Badge,
  Pagination,
  PaginationItem,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import {
  Dashboard as DashboardIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  AdminPanelSettings as AdminIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
  Update as UpdateIcon
} from '@mui/icons-material'
import { useSelector, useDispatch } from 'react-redux'
import { selectCurrentUser, logoutUserAPI } from '~/redux/User/userSlice'
import { useConfirm } from 'material-ui-confirm'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { fetchAllBoards, fetchAllUsers } from '~/apis/index'
import { formatDistance } from 'date-fns'
import { vi } from 'date-fns/locale'
import { DEFAULT_PAGE, DEFAULT_ITEMS_PER_PAGE } from '~/utils/constants'

// Custom Tab Panel Component
function CustomTabPanel(props) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

function a11yProps(index) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`
  }
}

const AdminAllBoards = () => {
  // States cho boards
  const [allBoards, setAllBoards] = useState([])
  const [totalBoards, setTotalBoards] = useState(0)
  const [boardsLoading, setBoardsLoading] = useState(true)
  const [boardsError, setBoardsError] = useState(null)

  // States cho users
  const [allUsers, setAllUsers] = useState([])
  const [totalUsers, setTotalUsers] = useState(0)
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState(null)

  // States chung
  const [anchorEl, setAnchorEl] = useState(null)
  const [currentTab, setCurrentTab] = useState(0)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const currentUser = useSelector(selectCurrentUser)
  const confirmLogout = useConfirm()

  const open = Boolean(anchorEl)

  // Xử lý phân trang từ URL
  const query = new URLSearchParams(location.search)
  const page = parseInt(query.get('page') || '1', 10)
  const tab = parseInt(query.get('tab') || '0', 10)

  // Set tab từ URL
  useEffect(() => {
    setCurrentTab(tab)
  }, [tab])

  // ✅ HÀM SẮP XẾP THEO THỜI GIAN MỚI NHẤT (createdAt hoặc updatedAt)
  const sortByLatest = (items) => {
    if (!Array.isArray(items)) return []

    return [...items].sort((a, b) => {
      // Lấy thời gian mới nhất giữa createdAt và updatedAt
      const getLatestTime = (item) => {
        const created = new Date(item.createdAt || 0)
        const updated = new Date(item.updatedAt || 0)
        return Math.max(created.getTime(), updated.getTime())
      }

      const timeA = getLatestTime(a)
      const timeB = getLatestTime(b)

      // Sắp xếp từ mới nhất đến cũ nhất
      return timeB - timeA
    })
  }

  // ✅ HÀM KIỂM TRA XEM ITEM CÓ MỚI KHÔNG (trong vòng 7 ngày)
  const isNewItem = (item) => {
    const now = new Date()
    const itemDate = new Date(item.createdAt)
    const diffInDays = (now - itemDate) / (1000 * 60 * 60 * 24)
    return diffInDays <= 7 // Mới trong vòng 7 ngày
  }

  // ✅ HÀM KIỂM TRA XEM ITEM CÓ ĐƯỢC CẬP NHẬT GẦN ĐÂY KHÔNG
  const isRecentlyUpdated = (item) => {
    if (!item.updatedAt || !item.createdAt) return false

    const created = new Date(item.createdAt)
    const updated = new Date(item.updatedAt)
    const now = new Date()

    // Cập nhật gần đây nếu:
    // 1. updatedAt khác createdAt (đã được cập nhật)
    // 2. Cập nhật trong vòng 3 ngày
    const wasUpdated = updated.getTime() !== created.getTime()
    const diffInDays = (now - updated) / (1000 * 60 * 60 * 24)

    return wasUpdated && diffInDays <= 3
  }

  // Hàm cập nhật state data cho boards
  const updateBoardsStateData = (response) => {
    console.log('🔍 Boards API Response:', response)

    let boards = []
    let total = 0

    if (Array.isArray(response)) {
      boards = response
      total = response.length
    } else if (response && Array.isArray(response.boards)) {
      boards = response.boards
      total = response.totalBoards || response.boards.length
    } else if (response && Array.isArray(response.data)) {
      boards = response.data
      total = response.total || response.data.length
    } else {
      console.warn('⚠️ Unexpected boards response format:', response)
      boards = []
      total = 0
    }

    // ✅ SẮP XẾP BOARDS THEO THỜI GIAN MỚI NHẤT
    const sortedBoards = sortByLatest(boards)
    console.log('📊 Sorted boards by latest:', sortedBoards)

    setAllBoards(sortedBoards)
    setTotalBoards(total)
  }

  // Hàm cập nhật state data cho users
  const updateUsersStateData = (response) => {
    console.log('🔍 Users API Response:', response)

    let users = []
    let total = 0

    if (Array.isArray(response)) {
      users = response
      total = response.length
    } else if (response && Array.isArray(response.users)) {
      users = response.users
      total = response.totalUsers || response.users.length
    } else if (response && response.data && Array.isArray(response.data.users)) {
      users = response.data.users
      total = response.data.pagination?.totalUsers || response.data.users.length
    } else if (response && Array.isArray(response.data)) {
      users = response.data
      total = response.total || response.data.length
    } else {
      console.warn('⚠️ Unexpected users response format:', response)
      users = []
      total = 0
    }

    // ✅ SẮP XẾP USERS THEO THỜI GIAN MỚI NHẤT
    const sortedUsers = sortByLatest(users)
    console.log('👥 Sorted users by latest:', sortedUsers)

    setAllUsers(sortedUsers)
    setTotalUsers(total)
  }

  // Load boards
  useEffect(() => {
    const loadAllBoards = async () => {
      try {
        setBoardsLoading(true)

        const queryParams = {
          page: page,
          itemsPerPage: DEFAULT_ITEMS_PER_PAGE
        }

        const searchQuery = query.get('q')
        if (searchQuery) {
          queryParams.q = searchQuery
        }

        const response = await fetchAllBoards(queryParams)
        updateBoardsStateData(response)
        setBoardsError(null)
      } catch (error) {
        console.error('❌ Error fetching all boards:', error)
        setBoardsError('Không thể tải danh sách boards. Vui lòng thử lại.')
        setAllBoards([])
        setTotalBoards(0)
      } finally {
        setBoardsLoading(false)
      }
    }

    loadAllBoards()
  }, [page, location.search])

  // Load users
  useEffect(() => {
    const loadAllUsers = async () => {
      try {
        setUsersLoading(true)

        const queryParams = {
          page: page,
          limit: DEFAULT_ITEMS_PER_PAGE
        }

        const searchQuery = query.get('q')
        if (searchQuery) {
          queryParams.search = searchQuery
        }

        const response = await fetchAllUsers(queryParams)
        updateUsersStateData(response)
        setUsersError(null)
      } catch (error) {
        console.error('❌ Error fetching all users:', error)
        setUsersError('Không thể tải danh sách users. Vui lòng thử lại.')
        setAllUsers([])
        setTotalUsers(0)
      } finally {
        setUsersLoading(false)
      }
    }

    loadAllUsers()
  }, [page, location.search])

  // Xử lý menu profile
  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  // Xử lý đăng xuất
  const handleLogout = () => {
    handleMenuClose()
    confirmLogout({
      title: 'Bạn có muốn đăng xuất không?',
      confirmationText: 'Xác nhận',
      cancellationText: 'Hủy'
    })
      .then(() => {
        dispatch(logoutUserAPI())
        navigate('/login')
      })
      .catch(() => {})
  }

  // Xử lý thay đổi tab
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue)
    // Cập nhật URL với tab mới
    const newQuery = new URLSearchParams(location.search)
    if (newValue === 0) {
      newQuery.delete('tab')
    } else {
      newQuery.set('tab', newValue.toString())
    }
    navigate(`${location.pathname}?${newQuery.toString()}`, { replace: true })
  }

  // Xử lý click vào board
  const handleBoardClick = (boardId) => {
    navigate(`/boards/${boardId}`)
  }

  // Format ngày tháng
  const formatDate = (date) => {
    if (!date) return 'Không rõ'
    try {
      return formatDistance(new Date(date), new Date(), {
        addSuffix: true,
        locale: vi
      })
    } catch {
      return 'Không rõ'
    }
  }

  // Format role
  const formatRole = (role) => {
    const roleMap = {
      'admin': { label: 'Admin', color: 'error' },
      'user': { label: 'User', color: 'primary' },
      'moderator': { label: 'Moderator', color: 'warning' }
    }
    return roleMap[role] || { label: role, color: 'default' }
  }

  // Loading state
  if (boardsLoading && usersLoading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Đang tải dữ liệu...
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header/AppBar cho Admin */}
      <AppBar position="static" sx={{ bgcolor: 'primary.dark' }}>
        <Toolbar>
          <AdminIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Quản Trị Viên - Hệ Thống
          </Typography>

          {/* Thông tin tổng quan */}
          <Box sx={{ display: 'flex', gap: 2, mr: 3 }}>
            <Badge badgeContent={totalBoards} color="secondary">
              <Tooltip title="Tổng số Boards">
                <DashboardIcon />
              </Tooltip>
            </Badge>
            <Badge badgeContent={totalUsers} color="info">
              <Tooltip title="Tổng số Users">
                <PeopleIcon />
              </Tooltip>
            </Badge>
          </Box>

          {/* Profile Menu */}
          <Tooltip title="Tài khoản">
            <IconButton
              onClick={handleMenuClick}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={open ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
            >
              <Avatar
                sx={{ width: 32, height: 32 }}
                alt={currentUser?.displayName}
                src={currentUser?.avatar}
              >
                {!currentUser?.avatar && <AccountCircleIcon />}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 200,
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            mt: 1.5
          }
        }}
      >
        {/* User Info */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{ width: 40, height: 40 }}
              alt={currentUser?.displayName}
              src={currentUser?.avatar}
            />
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                {currentUser?.displayName || 'Admin'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {currentUser?.email}
              </Typography>
              <Chip
                label="Admin"
                size="small"
                color="error"
                sx={{ mt: 0.5, fontSize: '0.7rem' }}
              />
            </Box>
          </Box>
        </Box>

        <Divider />

        {/* Menu Items */}
        <Link to="/settings/account" style={{ textDecoration: 'none', color: 'inherit' }}>
          <MenuItem>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Cài đặt" />
          </MenuItem>
        </Link>

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Đăng xuất" />
        </MenuItem>
      </Menu>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Stats Summary */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AdminIcon color="primary" />
            Tổng quan hệ thống
            <Chip
              label="Sắp xếp theo mới nhất"
              color="success"
              size="small"
              variant="outlined"
              sx={{ ml: 2 }}
            />
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main" fontWeight="bold">
                  {totalBoards}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng số boards
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary.main" fontWeight="bold">
                  {totalUsers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tổng số users
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            aria-label="admin tabs"
            variant="fullWidth"
          >
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DashboardIcon />
                  <span>Quản lý Boards ({totalBoards})</span>
                </Box>
              }
              {...a11yProps(0)}
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PeopleIcon />
                  <span>Quản lý Users ({totalUsers})</span>
                </Box>
              }
              {...a11yProps(1)}
            />
          </Tabs>
        </Box>

        {/* Tab Panel 1: Boards */}
        <CustomTabPanel value={currentTab} index={0}>
          {/* Error Alert cho Boards */}
          {boardsError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {boardsError}
            </Alert>
          )}

          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            Danh sách tất cả Boards (Trang {page})
          </Typography>

          {boardsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : !Array.isArray(allBoards) || allBoards.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <DashboardIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {!Array.isArray(allBoards) ? 'Lỗi tải dữ liệu' : 'Chưa có board nào trong trang này'}
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {allBoards.map((board) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={board._id}>
                  <Card
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      border: isNewItem(board) ? '2px solid #4caf50' :
                        isRecentlyUpdated(board) ? '2px solid #ff9800' : 'none',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                      }
                    }}
                    onClick={() => handleBoardClick(board._id)}
                  >
                    {/* ✅ THÊM INDICATOR CHO ITEM MỚI/CẬP NHẬT GẦN ĐÂY */}
                    {(isNewItem(board) || isRecentlyUpdated(board)) && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          zIndex: 1
                        }}
                      >
                        {isNewItem(board) ? (
                          <Chip
                            icon={<AddIcon />}
                            label="Mới"
                            color="success"
                            size="small"
                            sx={{
                              fontWeight: 'bold',
                              fontSize: '0.7rem',
                              height: 24
                            }}
                          />
                        ) : (
                          <Chip
                            icon={<UpdateIcon />}
                            label="Cập nhật"
                            color="warning"
                            size="small"
                            sx={{
                              fontWeight: 'bold',
                              fontSize: '0.7rem',
                              height: 24
                            }}
                          />
                        )}
                      </Box>
                    )}

                    <CardContent sx={{ pt: isNewItem(board) || isRecentlyUpdated(board) ? 5 : 2 }}>
                      {/* Board Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography
                          variant="h6"
                          component="div"
                          sx={{
                            fontWeight: 'bold',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            flex: 1,
                            pr: 1
                          }}
                        >
                          {board.title}
                        </Typography>
                      </Box>

                      {/* Board Description */}
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          minHeight: '3.6em'
                        }}
                      >
                        {board.description || 'Không có mô tả'}
                      </Typography>

                      {/* Board Stats */}
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PeopleIcon fontSize="small" color="action" />
                          <Typography variant="caption">
                            {(board.ownerIds?.length || 0) + (board.memberIds?.length || 0)} thành viên
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarIcon fontSize="small" color="action" />
                            <Typography variant="caption">
                             Đã Tạo: {formatDate(board.createdAt)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarIcon fontSize="small" color="action" />
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: isRecentlyUpdated(board) ? 'bold' : 'normal',
                                color: isRecentlyUpdated(board) ? 'warning.main' : 'text.secondary'
                              }}
                            >
                              Cập nhật: {formatDate(board.updatedAt)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      {/* Owner Info */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          sx={{ width: 24, height: 24 }}
                          src={board.owners?.[0]?.avatar}
                          alt={board.owners?.[0]?.displayName}
                        />
                        <Typography variant="caption" color="text.secondary">
                          Tạo bởi: {board.owners?.[0]?.displayName || 'Không rõ'}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </CustomTabPanel>

        {/* Tab Panel 2: Users */}
        <CustomTabPanel value={currentTab} index={1}>
          {/* Error Alert cho Users */}
          {usersError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {usersError}
            </Alert>
          )}

          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            Danh sách tất cả Users (Trang {page})
          </Typography>

          {usersLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : !Array.isArray(allUsers) || allUsers.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <PeopleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {!Array.isArray(allUsers) ? 'Lỗi tải dữ liệu' : 'Chưa có user nào trong trang này'}
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Avatar</TableCell>
                    <TableCell>Thông tin</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Ngày tạo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allUsers.map((user) => {
                    const roleInfo = formatRole(user.role)
                    const isNew = isNewItem(user)
                    const isUpdated = isRecentlyUpdated(user)

                    return (
                      <TableRow
                        key={user._id}
                        sx={{
                          '&:hover': { bgcolor: 'action.hover' },
                          bgcolor: isNew ? 'success.50' : isUpdated ? 'warning.50' : 'inherit',
                          borderLeft: isNew ? '4px solid #4caf50' :
                            isUpdated ? '4px solid #ff9800' : 'none'
                        }}
                      >
                        <TableCell>
                          <Box sx={{ position: 'relative' }}>
                            <Avatar
                              src={user.avatar}
                              alt={user.displayName}
                              sx={{ width: 40, height: 40 }}
                            >
                              {!user.avatar && user.displayName?.[0]?.toUpperCase()}
                            </Avatar>
                            {/* Badge cho user mới/cập nhật */}
                            {(isNew || isUpdated) && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: -4,
                                  right: -4,
                                  width: 16,
                                  height: 16,
                                  borderRadius: '50%',
                                  bgcolor: isNew ? 'success.main' : 'warning.main',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                {isNew ? (
                                  <AddIcon sx={{ fontSize: 10, color: 'white' }} />
                                ) : (
                                  <UpdateIcon sx={{ fontSize: 10, color: 'white' }} />
                                )}
                              </Box>
                            )}
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {user.displayName || 'Không có tên'}
                              {/* Badge cho user mới/cập nhật */}
                              {isNew && (
                                <Chip
                                  label="Mới"
                                  color="success"
                                  size="small"
                                  sx={{ ml: 1, fontSize: '0.7rem', height: 20 }}
                                />
                              )}
                              {!isNew && isUpdated && (
                                <Chip
                                  label="Cập nhật"
                                  color="warning"
                                  size="small"
                                  sx={{ ml: 1, fontSize: '0.7rem', height: 20 }}
                                />
                              )}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {user._id?.slice(-8) || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EmailIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {user.email || 'Chưa có email'}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={roleInfo.label}
                            color={roleInfo.color}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {user.isActive ? (
                              <>
                                <ActiveIcon fontSize="small" color="success" />
                                <Typography variant="body2" color="success.main">
                                  Hoạt động
                                </Typography>
                              </>
                            ) : (
                              <>
                                <BlockIcon fontSize="small" color="error" />
                                <Typography variant="body2" color="error.main">
                                  Bị khóa
                                </Typography>
                              </>
                            )}
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {formatDate(user.createdAt)}
                            </Typography>
                            {user.updatedAt && user.createdAt !== user.updatedAt && (
                              <Typography
                                variant="caption"
                                color={isUpdated ? 'warning.main' : 'text.secondary'}
                                sx={{ fontWeight: isUpdated ? 'bold' : 'normal' }}
                              >
                                Cập nhật: {formatDate(user.updatedAt)}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CustomTabPanel>

        {/* Pagination */}
        {(currentTab === 0 ? totalBoards : totalUsers) > DEFAULT_ITEMS_PER_PAGE && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={Math.ceil((currentTab === 0 ? totalBoards : totalUsers) / DEFAULT_ITEMS_PER_PAGE)}
              page={page}
              onChange={(event, value) => {
                const newQuery = new URLSearchParams(location.search)
                if (value === 1) {
                  newQuery.delete('page')
                } else {
                  newQuery.set('page', value.toString())
                }
                navigate(`${location.pathname}?${newQuery.toString()}`)
              }}
              color="primary"
              size="large"
              showFirstButton
              showLastButton
              renderItem={(item) => (
                <PaginationItem
                  {...item}
                  sx={{
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark'
                      }
                    }
                  }}
                />
              )}
            />
          </Box>
        )}
      </Container>
    </Box>
  )
}

export default AdminAllBoards