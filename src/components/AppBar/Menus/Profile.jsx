import React from 'react'
import Box from '@mui/material/Box'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Fade from '@mui/material/Fade'
import Divider from '@mui/material/Divider'
import ListItemIcon from '@mui/material/ListItemIcon'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import PersonAdd from '@mui/icons-material/PersonAdd';
import Settings from '@mui/icons-material/Settings';
import Logout from '@mui/icons-material/Logout';

function Profile() {
  const [anchorEl, setAnchorEl] = React.useState(null)
  const open = Boolean(anchorEl)
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }
  return (
    <Box>
      <Tooltip title="Account settings">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ padding: '0' }}
          aria-controls={open ? 'basic-button-Profile' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
        >
          <Avatar
            sx={{ width: 30, height: 30 }}
            alt='binphat'
            src="https://scontent.fhan3-3.fna.fbcdn.net/v/t39.30808-6/481899753_1388374892524921_8380757945675032362_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeGMTu8bOiFf-OQ0uc8Z26PmEnmcvQ_uQ0QSeZy9D-5DRHWDD4v2qgIpS1NtVFMgV4VfDtOqR9o0DIJ72S8zCzlC&_nc_ohc=f7uLbOfK2c0Q7kNvgGGWwnB&_nc_oc=Adien_OITyPJ0IBWab77PS9nhNEvXzsbykyMjUN8-1oAFrmDLMESO7AF1TZoOQXeWTo&_nc_zt=23&_nc_ht=scontent.fhan3-3.fna&_nc_gid=5HOCy0hTR6VTyRjOvMvn7w&oh=00_AYH3dYFFHF9TVUHfXbMhwAgbLeZP0oIkpbVcxfjyZpDEwA&oe=67DF164E"        
          />
        </IconButton>
      </Tooltip>
      <Menu
        id="basic-menu-profile"
        MenuListProps={{
          'aria-labelledby': 'basic-button-profile'
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        TransitionComponent={Fade}
      >
        <MenuItem onClick={handleClose}>
          <Avatar sx={{ width: 28, height: 28, mr: 2 }} /> Profile
        </MenuItem>
        <MenuItem onClick={handleClose}>
          <Avatar sx={{ width: 28, height: 28, mr: 2 }} /> My account
        </MenuItem>
        <Divider />
        <MenuItem >
          <ListItemIcon>
            <PersonAdd fontSize="small" />
          </ListItemIcon>
          Add another account
        </MenuItem>
        <MenuItem >
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem >
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default Profile
