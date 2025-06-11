import React from 'react'
import Box from '@mui/material/Box'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Fade from '@mui/material/Fade'
import Divider from '@mui/material/Divider'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import PersonAdd from '@mui/icons-material/PersonAdd'
import Settings from '@mui/icons-material/Settings'
import Logout from '@mui/icons-material/Logout'
import AccountCircle from '@mui/icons-material/AccountCircle'
import { useSelector, useDispatch } from 'react-redux'
import { selectCurrentUser, logoutUserAPI } from '~/redux/User/userSlice'
import { useConfirm } from 'material-ui-confirm'
import { Link } from 'react-router-dom'

function Profile() {
  const [anchorEl, setAnchorEl] = React.useState(null)
  const open = Boolean(anchorEl)
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }
  
  const handleClose = () => {
    setAnchorEl(null)
  }

  const dispatch = useDispatch()
  const currentUser = useSelector(selectCurrentUser)

  const confirmLogout = useConfirm()
  const handleLogout = () => {
    confirmLogout({
      title: 'Bạn có muốn đăng xuất không?',
      confirmationText: 'Xác nhận',
      cancellationText: 'Hủy'
    })
      .then(() => {
        dispatch(logoutUserAPI())
      })
      .catch(() => {})
  }

  return (
    <Box>
      <Tooltip title="Tài khoản của tôi" placement="bottom">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ 
            padding: '2px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }
          }}
          aria-controls={open ? 'profile-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <Avatar
            sx={{ 
              width: 36, 
              height: 36,
              border: '2px solid',
              borderColor: open ? 'primary.main' : 'transparent',
              transition: 'border-color 0.2s ease-in-out'
            }}
            alt={currentUser?.displayName || 'User'}
            src={currentUser?.avatar}
          >
            {!currentUser?.avatar && (
              <AccountCircle sx={{ fontSize: 24 }} />
            )}
          </Avatar>
        </IconButton>
      </Tooltip>

      <Menu
        id="profile-menu"
        MenuListProps={{
          'aria-labelledby': 'profile-button',
          sx: { py: 1 }
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        TransitionComponent={Fade}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        sx={{
          '& .MuiPaper-root': {
            minWidth: 200,
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'visible',
            mt: 1.5,
            '&::before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
              border: '1px solid',
              borderColor: 'divider',
              borderBottom: 'none',
              borderRight: 'none'
            }
          }
        }}
      >
        {/* User Info Header */}
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'inherit' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{ width: 40, height: 40 }}
              alt={currentUser?.displayName || 'User'}
              src={currentUser?.avatar}
            >
              {!currentUser?.avatar && (
                <AccountCircle sx={{ fontSize: 28 }} />
              )}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                {currentUser?.displayName || 'Người dùng'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {currentUser?.email || 'user@example.com'}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider />

        {/* Profile Link */}
        <Link to='/settings/account' style={{ color: 'inherit', textDecoration: 'none' }}>
          <MenuItem 
            sx={{
              mx: 1,
              my: 0.5,
              borderRadius: '8px',
              transition: 'all 0.2s ease-in-out',
              '&:hover': { 
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText'
                }
              }
            }}
          >
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText 
              primary="Hồ Sơ" 
              primaryTypographyProps={{ fontSize: '0.9rem' }}
            />
          </MenuItem>
        </Link>


        {/* Logout */}
        <MenuItem
          onClick={handleLogout}
          sx={{
            mx: 1,
            mb: 0.5,
            borderRadius: '8px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': { 
              bgcolor: 'error.main',
              color: 'error.contrastText',
              '& .MuiListItemIcon-root': {
                color: 'error.contrastText'
              }
            }
          }}
        >
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText 
            primary="Đăng Xuất" 
            primaryTypographyProps={{ fontSize: '0.9rem' }}
          />
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default Profile