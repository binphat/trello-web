import { useState } from 'react'
import ModeSelect from '~/components/ModeSelect/ModeSelect'
import Box from '@mui/material/Box'
import AppsIcon from '@mui/icons-material/Apps'
import { ReactComponent as IconLogo } from '~/assets/icon-logo.svg'
import SvgIcon from '@mui/material/SvgIcon'
import Typography from '@mui/material/Typography'
import Workspaces from './Menus/Workspaces'
import Recent from './Menus/Recent'
import Starred from './Menus/Starred'
import Templates from './Menus/Templates'
import Profile from './Menus/Profile'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Badge from '@mui/material/Badge'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import Tooltip from '@mui/material/Tooltip'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import LibraryAddIcon from '@mui/icons-material/LibraryAdd'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import { Link, useNavigate } from 'react-router-dom'
import Notifications from './Notifications/Notifications'
import AutoCompleteSearchBoard from './SearchBoards/AutoCompleteSearchBoard'

// Import thêm các components cho Modal
import Modal from '@mui/material/Modal'
import CancelIcon from '@mui/icons-material/Cancel'
import { useForm, Controller } from 'react-hook-form'
import { FIELD_REQUIRED_MESSAGE } from '~/utils/validators'
import FieldErrorAlert from '~/components/Form/FieldErrorAlert'
import AbcIcon from '@mui/icons-material/Abc'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import { createNewBoardAPI } from '~/apis'

// BOARD_TYPES tương tự bên model phía Back-end
const BOARD_TYPES = {
  PUBLIC: 'public',
  PRIVATE: 'private'
}

function AppBar() {
  const [searchValue, setSearchValue] = useState('')
  const navigate = useNavigate()
  
  // State và form handling cho Modal
  const { control, register, handleSubmit, reset, formState: { errors } } = useForm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const handleOpenModal = () => setIsModalOpen(true)
  const handleCloseModal = () => {
    setIsModalOpen(false)
    // Reset lại toàn bộ form khi đóng Modal
    reset()
  }

  const submitCreateNewBoard = (data) => {
    createNewBoardAPI(data).then((createdBoard) => {
      // Đóng Modal
      handleCloseModal()
      // Chuyển hướng vào board vừa tạo (giả sử API trả về board object với _id)
      navigate(`/boards/${createdBoard._id}`)
    }).catch((error) => {
      console.error('Error creating board:', error)
      // Có thể thêm toast notification để báo lỗi
    })
  }

  return (
    <>
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
          theme.palette.mode === 'dark' ? '#2c3e50' : '#1565c0'
        ),
        '&::-webkit-scrollbar-track': {
          m: 2
        }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Link to='/boards'>
            <Tooltip title="Danh Sách Bảng">
              <AppsIcon sx={{ color: 'white', verticalAlign: 'middle' }} />
            </Tooltip>
          </Link>
          <Link to='/'>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <SvgIcon component={IconLogo} fontSize='small' inheritViewBox sx={{ color:'white' }} />
              <Typography variant='span' sx={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'white' }}>TeamUp</Typography>
            </Box>
          </Link>
          <Box sx={{ display: { xs : 'none', md: 'flex' }, gap: 1 }}>
            <Templates />
            <Button
              variant="outlined"
              startIcon={<LibraryAddIcon />}
              onClick={handleOpenModal}
              sx={{
                color: 'white',
                border: 'none',
                '&:hover': {
                  border:'none'
                }
              }}>
                Tạo bảng
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Tìm kiếm nhanh 1 hoặc nhiều board */}
          <AutoCompleteSearchBoard />
          {/* Xử lý dark/light mode */}
          <ModeSelect />
          {/* Xử lý thông báo */}
          <Notifications />
          <Tooltip title="Help">
            <HelpOutlineIcon sx={{ cursor: 'pointer', color: 'white' }} />
          </Tooltip>
          <Profile />
        </Box>
      </Box>

      {/* Modal Create Board */}
      <Modal
        open={isModalOpen}
        onClose={handleCloseModal}
        aria-labelledby="create-board-modal-title"
        aria-describedby="create-board-modal-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 600,
          bgcolor: 'white',
          boxShadow: 24,
          borderRadius: '8px',
          border: 'none',
          outline: 0,
          padding: '20px 30px',
          backgroundColor: (theme) => theme.palette.mode === 'dark' ? '#1A2027' : 'white'
        }}>
          <Box sx={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            cursor: 'pointer'
          }}>
            <CancelIcon
              color="error"
              sx={{ '&:hover': { color: 'error.light' } }}
              onClick={handleCloseModal} 
            />
          </Box>
          
          <Box id="create-board-modal-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LibraryAddIcon />
            <Typography variant="h6" component="h2">Tạo một bảng mới</Typography>
          </Box>
          
          <Box id="create-board-modal-description" sx={{ my: 2 }}>
            <form onSubmit={handleSubmit(submitCreateNewBoard)}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <TextField
                    fullWidth
                    label="Tiêu đề"
                    type="text"
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AbcIcon fontSize="small" />
                        </InputAdornment>
                      )
                    }}
                    {...register('title', {
                      required: FIELD_REQUIRED_MESSAGE,
                      minLength: { value: 3, message: 'Ít nhất là 3 ký tự' },
                      maxLength: { value: 50, message: 'Tối đa 50 ký tự' }
                    })}
                    error={!!errors['title']}
                  />
                  <FieldErrorAlert errors={errors} fieldName={'title'} />
                </Box>

                <Box>
                  <TextField
                    fullWidth
                    label="Mô tả"
                    type="text"
                    variant="outlined"
                    multiline
                    rows={1}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DescriptionOutlinedIcon fontSize="small" />
                        </InputAdornment>
                      )
                    }}
                    {...register('description', {
                      required: FIELD_REQUIRED_MESSAGE,
                      minLength: { value: 3, message: 'Ít nhất là 3 ký tự' },
                      maxLength: { value: 255, message: 'Tối đa 255 ký tự' }
                    })}
                    error={!!errors['description']}
                  />
                  <FieldErrorAlert errors={errors} fieldName={'description'} />
                </Box>
                <Box sx={{ alignSelf: 'flex-end' }}>
                  <Button
                    className="interceptor-loading"
                    type="submit"
                    variant="contained"
                    color="primary"
                  >
                    Tạo bảng
                  </Button>
                </Box>
              </Box>
            </form>
          </Box>
        </Box>
      </Modal>
    </>
  )
}

export default AppBar