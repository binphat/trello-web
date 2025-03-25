import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import DashboardIcon from '@mui/icons-material/Dashboard'
import VpnLockIcon from '@mui/icons-material/VpnLock'
import AddToDriveIcon from '@mui/icons-material/AddToDrive'
import BoltIcon from '@mui/icons-material/Bolt'
import FilterListIcon from '@mui/icons-material/FilterList'
import Avatar from '@mui/material/Avatar'
import AvatarGroup from '@mui/material/AvatarGroup'
import Tooltip from '@mui/material/Tooltip'
import Button from '@mui/material/Button'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import { capitalizeFirstLetter } from '~/utils/formatters'

const MENU_STYLES = {
  color: 'white',
  backgroundColor: 'transparent',
  border: 'none',
  paddingX: '5px',
  borderRadius: '4px',
  '.MuiSvgIcon-root': {
    color: 'white'
  },
  '&:hover': {
    bgcolor: 'primary.50'
  }
}

function BoardBar({ board }) {
  return (
    <Box sx={{
      width: '100%',
      height: (theme) => theme.trello.boardBarHeight,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 2,
      paddingX: 2,
      overflowX: 'auto',
      bgcolor: (theme) => (
        theme.palette.mode === 'dark' ? '#34495e' : '#1976d2'
      ),
      '&::-webkit-scrollbar-track': {
        m: 2
      }
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2
      }}>
        <Chip
          sx={MENU_STYLES}
          icon={<DashboardIcon />}
          label={board?.title}
          clickable
        />
        <Chip
          sx={MENU_STYLES}
          icon={<VpnLockIcon />}
          label={capitalizeFirstLetter(board?.type)}
          clickable
        />
        <Chip
          sx={MENU_STYLES}
          icon={<AddToDriveIcon />}
          label="Add to Google Drive"
          clickable
        />
        <Chip
          sx={MENU_STYLES}
          icon={<BoltIcon />}
          label="Automation"
          clickable
        />
        <Chip
          sx={MENU_STYLES}
          icon={<FilterListIcon />}
          label="Filters"
          clickable
        />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={<PersonAddIcon />}
          sx={{ color: 'white',
            borderColor:'white',
            '&:hover': {
              borderColor: 'white'
            }
          }}
        >Invite</Button>
        <AvatarGroup
          max={7}
          sx={{
            gap: '10px',
            '& .MuiAvatar-root': {
              width: 34,
              height: 34,
              fontSize: 16,
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              '&:first-of-type': { bgcolor: '#a4b0be' }
            }
          }}
        >
          <Tooltip title='BinPhat'>
            <Avatar alt="BinPhat"
              src="https://cdn-media.sforum.vn/storage/app/media/anh-dep-116.jpg"
            />
          </Tooltip>
          <Tooltip title='BinPhat'>
            <Avatar alt="BinPhat"
              src="https://scontent.fsgn2-6.fna.fbcdn.net/v/t39.30808-6/480161561_1372905754071835_8329086935068073035_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeEOf-xud8sKdlancdWtGd4SZ4A2AAOsY_9ngDYAA6xj__Jjv1ExYp6r_yCGRp0PcsrR_qS8NJ-o8lhBGc8kw8ki&_nc_ohc=_xJEIyJBFs8Q7kNvgGHqHHn&_nc_oc=AdmX_a6Y57700-awl3qw-ufm9CuO6fmyoBXYjeAJkPa4BnSHpJhVP0-DqOwpDPVg8uc&_nc_zt=23&_nc_ht=scontent.fsgn2-6.fna&_nc_gid=VXx9iR8Dfca_KvvdDaYJyw&oh=00_AYE-2pKOGoSB3NYCJEDhEEFdaLPOlvLncYQarruUYvN6eg&oe=67E0438E"
            />
          </Tooltip>
          <Tooltip title='BinPhat'>
            <Avatar alt="BinPhat"
              src="https://scontent.fsgn2-6.fna.fbcdn.net/v/t39.30808-6/480978683_1384125482949862_3741451128766694831_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeERmvAjzmq5L7Zen7lKFn9sLpF-yG3wMk4ukX7IbfAyTs3Cc4rfaedpsaC8l_3K_MZgRRl1pyu5v3E5nQuNEE0C&_nc_ohc=WycMPIn3V0cQ7kNvgG7ucvT&_nc_oc=Adn5UuApLIbTQ1Ag1nS2MXCHwaVKjHSW4THjjXDAymbQklJ7D1O67C_sUn1DOu_RHIo&_nc_zt=23&_nc_ht=scontent.fsgn2-6.fna&_nc_gid=M-XkICrSSto1jxmbSD92wA&oh=00_AYEbczTrnUrd4grbYHasUWj2QhV4uKQzJiQ2dLtU4ZuZRg&oe=67E05D72"
            />
          </Tooltip>
          <Tooltip title='BinPhat'>
            <Avatar alt="BinPhat"
              src="https://scontent.fsgn2-9.fna.fbcdn.net/v/t39.30808-6/481897078_1380279373334473_9142375740600772501_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeEXSfDsfUPyZsgKAcQdmn14JUtAFHB6CsklS0AUcHoKyZ0nQYeqqU7bmpCXt7ziPmIjkUJJuRRQqBWKIuUWcKz4&_nc_ohc=KXhH8noJGcIQ7kNvgGvqr2T&_nc_oc=AdnTLxw_SmDHfiyDX5lc_DKQpHJYQftCFjaghcmUyEN9f8jQ4pFmrwWIlqOnVX7eCmQ&_nc_zt=23&_nc_ht=scontent.fsgn2-9.fna&_nc_gid=_kW69ke9DQz_AJjRKUMckw&oh=00_AYH-6xp7GWgpixORXJji8V9WMuHd6YVyv6KIBbqj6EAITA&oe=67E04BB1"
            />
          </Tooltip>
          <Tooltip title='BinPhat'>
            <Avatar alt="BinPhat"
              src="https://scontent.fsgn2-4.fna.fbcdn.net/v/t39.30808-6/481263999_1379138136781930_2007608827713049632_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeF80Okb2ybg2bU-0uPyV6ZaD3Vx_cH7I8cPdXH9wfsjx2yC4UYbm-EgbFknQKDWywjBlgNfTQr-u8xku519dl0Y&_nc_ohc=zruyHg1FxTAQ7kNvgEjyx83&_nc_oc=AdnEDGXYXfMkEa2vBegwH0I8YhQZqOWiD2SYFvb1PxD66zR4BQWIumEpUV0Q1hgEFng&_nc_zt=23&_nc_ht=scontent.fsgn2-4.fna&_nc_gid=tx39cBgAyQSVb1mOHZa7aQ&oh=00_AYEZAASRE0hCWf_mTiayoMBQV9H_-dd0Owk0UHVwojPJWQ&oe=67E03D3A"
            />
          </Tooltip>
          <Tooltip title='BinPhat'>
            <Avatar alt="BinPhat"
              src="https://scontent.fsgn2-3.fna.fbcdn.net/v/t39.30808-6/481182309_1379136000115477_5089581106712637386_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeGJfyZstvCk7OCQGVjDkoENLjareQO2MF0uNqt5A7YwXXgXBwEAITmB6oWQHupDgbiFZ2LcjpUUoPIzznnDWvEh&_nc_ohc=lmahlSExUxsQ7kNvgEg773l&_nc_oc=AdlVAJgkE_behavZ7CF11QxvIjqNv3PuYFrjlsvTKb-50oEDfDAhJe9NryAhreE-jpY&_nc_zt=23&_nc_ht=scontent.fsgn2-3.fna&_nc_gid=WNEg66QAJGLhFee-4ti-8w&oh=00_AYHnaC11dmjJwEkU3_cIQDZ506Cx2UdWodQz7bI5jXdMuw&oe=67E03BFA"
            />
          </Tooltip>
          <Tooltip title='BinPhat'>
            <Avatar alt="BinPhat"
              src="https://scontent.fsgn2-10.fna.fbcdn.net/v/t39.30808-6/480303578_1371932317502512_8211313717009026502_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeGW48rc_hdMNjdR21AugV5cqrib2rm9fV6quJvaub19XktdUoye8HhT4qpYE-sTWSHwRkY0XcIyP4l4ZU93xZzP&_nc_ohc=eOsiL_vtaOkQ7kNvgHEifKx&_nc_oc=AdnwG1SbH71hyTF0l2kVRdFReUFRARPdbJJVDq-JKZRm15cDM0tiUFgOBvT5J1sc2SA&_nc_zt=23&_nc_ht=scontent.fsgn2-10.fna&_nc_gid=yG044BqHs1hUo5c7Im8l2A&oh=00_AYFcPMmwv9qp3CnLn6XwQlLo-B4rRvlb31fkhGF3iz4HnQ&oe=67E03E44"
            />
          </Tooltip>
          <Tooltip title='BinPhat'>
            <Avatar alt="BinPhat"
              src="https://scontent.fsgn2-4.fna.fbcdn.net/v/t39.30808-6/481899753_1388374892524921_8380757945675032362_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeGMTu8bOiFf-OQ0uc8Z26PmEnmcvQ_uQ0QSeZy9D-5DRHWDD4v2qgIpS1NtVFMgV4VfDtOqR9o0DIJ72S8zCzlC&_nc_ohc=f7uLbOfK2c0Q7kNvgG2cfhV&_nc_oc=Adnu2nrYPcnlvLTbvUIqa81iq-odj30DOnR0OBbzXP3xEK9SVXqoDVbdSjUzB9RgW6c&_nc_zt=23&_nc_ht=scontent.fsgn2-4.fna&_nc_gid=R4Iw0WkNl6NQYhydUJrtow&oh=00_AYH_w5lyyK3z7GAkbPuqNlx008N7kdBMZNiYXAqCB4mMMQ&oe=67E02F8E"
            />
          </Tooltip>
          <Tooltip title='BinPhat'>
            <Avatar alt="BinPhat"
              src="https://scontent.fsgn2-6.fna.fbcdn.net/v/t39.30808-6/480161561_1372905754071835_8329086935068073035_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeEOf-xud8sKdlancdWtGd4SZ4A2AAOsY_9ngDYAA6xj__Jjv1ExYp6r_yCGRp0PcsrR_qS8NJ-o8lhBGc8kw8ki&_nc_ohc=_xJEIyJBFs8Q7kNvgGHqHHn&_nc_oc=AdmX_a6Y57700-awl3qw-ufm9CuO6fmyoBXYjeAJkPa4BnSHpJhVP0-DqOwpDPVg8uc&_nc_zt=23&_nc_ht=scontent.fsgn2-6.fna&_nc_gid=VXx9iR8Dfca_KvvdDaYJyw&oh=00_AYE-2pKOGoSB3NYCJEDhEEFdaLPOlvLncYQarruUYvN6eg&oe=67E0438E"
            />
          </Tooltip>
          <Tooltip title='BinPhat'>
            <Avatar alt="BinPhat"
              src="https://scontent.fsgn2-6.fna.fbcdn.net/v/t39.30808-6/480978683_1384125482949862_3741451128766694831_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeERmvAjzmq5L7Zen7lKFn9sLpF-yG3wMk4ukX7IbfAyTs3Cc4rfaedpsaC8l_3K_MZgRRl1pyu5v3E5nQuNEE0C&_nc_ohc=WycMPIn3V0cQ7kNvgG7ucvT&_nc_oc=Adn5UuApLIbTQ1Ag1nS2MXCHwaVKjHSW4THjjXDAymbQklJ7D1O67C_sUn1DOu_RHIo&_nc_zt=23&_nc_ht=scontent.fsgn2-6.fna&_nc_gid=M-XkICrSSto1jxmbSD92wA&oh=00_AYEbczTrnUrd4grbYHasUWj2QhV4uKQzJiQ2dLtU4ZuZRg&oe=67E05D72"
            />
          </Tooltip>
          <Tooltip title='BinPhat'>
            <Avatar alt="BinPhat"
              src="https://scontent.fsgn2-9.fna.fbcdn.net/v/t39.30808-6/481897078_1380279373334473_9142375740600772501_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeEXSfDsfUPyZsgKAcQdmn14JUtAFHB6CsklS0AUcHoKyZ0nQYeqqU7bmpCXt7ziPmIjkUJJuRRQqBWKIuUWcKz4&_nc_ohc=KXhH8noJGcIQ7kNvgGvqr2T&_nc_oc=AdnTLxw_SmDHfiyDX5lc_DKQpHJYQftCFjaghcmUyEN9f8jQ4pFmrwWIlqOnVX7eCmQ&_nc_zt=23&_nc_ht=scontent.fsgn2-9.fna&_nc_gid=_kW69ke9DQz_AJjRKUMckw&oh=00_AYH-6xp7GWgpixORXJji8V9WMuHd6YVyv6KIBbqj6EAITA&oe=67E04BB1"
            />
          </Tooltip>
          <Tooltip title='BinPhat'>
            <Avatar alt="BinPhat"
              src="https://scontent.fsgn2-4.fna.fbcdn.net/v/t39.30808-6/481263999_1379138136781930_2007608827713049632_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeF80Okb2ybg2bU-0uPyV6ZaD3Vx_cH7I8cPdXH9wfsjx2yC4UYbm-EgbFknQKDWywjBlgNfTQr-u8xku519dl0Y&_nc_ohc=zruyHg1FxTAQ7kNvgEjyx83&_nc_oc=AdnEDGXYXfMkEa2vBegwH0I8YhQZqOWiD2SYFvb1PxD66zR4BQWIumEpUV0Q1hgEFng&_nc_zt=23&_nc_ht=scontent.fsgn2-4.fna&_nc_gid=tx39cBgAyQSVb1mOHZa7aQ&oh=00_AYEZAASRE0hCWf_mTiayoMBQV9H_-dd0Owk0UHVwojPJWQ&oe=67E03D3A"
            />
          </Tooltip>
          <Tooltip title='BinPhat'>
            <Avatar alt="BinPhat"
              src="https://scontent.fsgn2-3.fna.fbcdn.net/v/t39.30808-6/481182309_1379136000115477_5089581106712637386_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeGJfyZstvCk7OCQGVjDkoENLjareQO2MF0uNqt5A7YwXXgXBwEAITmB6oWQHupDgbiFZ2LcjpUUoPIzznnDWvEh&_nc_ohc=lmahlSExUxsQ7kNvgEg773l&_nc_oc=AdlVAJgkE_behavZ7CF11QxvIjqNv3PuYFrjlsvTKb-50oEDfDAhJe9NryAhreE-jpY&_nc_zt=23&_nc_ht=scontent.fsgn2-3.fna&_nc_gid=WNEg66QAJGLhFee-4ti-8w&oh=00_AYHnaC11dmjJwEkU3_cIQDZ506Cx2UdWodQz7bI5jXdMuw&oe=67E03BFA"
            />
          </Tooltip>
          <Tooltip title='BinPhat'>
            <Avatar alt="BinPhat"
              src="https://scontent.fsgn2-10.fna.fbcdn.net/v/t39.30808-6/480303578_1371932317502512_8211313717009026502_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeGW48rc_hdMNjdR21AugV5cqrib2rm9fV6quJvaub19XktdUoye8HhT4qpYE-sTWSHwRkY0XcIyP4l4ZU93xZzP&_nc_ohc=eOsiL_vtaOkQ7kNvgHEifKx&_nc_oc=AdnwG1SbH71hyTF0l2kVRdFReUFRARPdbJJVDq-JKZRm15cDM0tiUFgOBvT5J1sc2SA&_nc_zt=23&_nc_ht=scontent.fsgn2-10.fna&_nc_gid=yG044BqHs1hUo5c7Im8l2A&oh=00_AYFcPMmwv9qp3CnLn6XwQlLo-B4rRvlb31fkhGF3iz4HnQ&oe=67E03E44"
            />
          </Tooltip>
        </AvatarGroup>
      </Box>
    </Box>
  )
}

export default BoardBar
