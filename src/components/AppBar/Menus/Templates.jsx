import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Fade from '@mui/material/Fade'
import ListItemText from '@mui/material/ListItemText'
import ListItemIcon from '@mui/material/ListItemIcon'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import TopicIcon from '@mui/icons-material/Topic'
import ViewKanbanIcon from '@mui/icons-material/ViewKanban'
import Typography from '@mui/material/Typography'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import { 
  createBoardFromTemplate, 
  selectIsCreatingBoard, 
  selectCreateBoardError,
  clearCreateBoardError,
  BOARD_TEMPLATES 
} from '~/redux/activeBoard/activeBoardSlice'

function Templates() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isCreatingBoard = useSelector(selectIsCreatingBoard)
  const createBoardError = useSelector(selectCreateBoardError)
  
  const [anchorEl, setAnchorEl] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [customTitle, setCustomTitle] = useState('')
  
  const open = Boolean(anchorEl)

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleSelectTemplate = (templateType) => {
    const template = BOARD_TEMPLATES[templateType]
    setSelectedTemplate(templateType)
    setCustomTitle(template.title)
    setDialogOpen(true)
    handleClose()
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setSelectedTemplate(null)
    setCustomTitle('')
    if (createBoardError) {
      dispatch(clearCreateBoardError())
    }
  }

  const handleCreateBoard = async () => {
    if (!selectedTemplate || !customTitle.trim()) return

    try {
      const resultAction = await dispatch(createBoardFromTemplate({
        templateType: selectedTemplate,
        customTitle: customTitle.trim()
      }))

      if (createBoardFromTemplate.fulfilled.match(resultAction)) {
        const newBoard = resultAction.payload
        handleDialogClose()
        // Điều hướng đến board mới được tạo
        navigate(`/boards/${newBoard._id}`)
      }
    } catch (error) {
      console.error('Error creating board:', error)
    }
  }

  const getTemplateIcon = (templateType) => {
    switch (templateType) {
      case 'kanban':
        return <ViewKanbanIcon fontSize="medium" />
      case 'big-topic':
        return <TopicIcon fontSize="medium" />
      default:
        return <ViewKanbanIcon fontSize="medium" />
    }
  }

  const renderTemplatePreview = (templateType) => {
    const template = BOARD_TEMPLATES[templateType]
    if (!template) return null

    return (
      <Box sx={{ mt: 2, mb: 1 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Columns và Cards mẫu sẽ được tạo:
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {template.columns.map((column, index) => (
            <Box key={index} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Chip
                label={column.title}
                size="small"
                sx={{
                  backgroundColor: column.color,
                  color: 'white',
                  fontWeight: 'medium',
                  alignSelf: 'flex-start'
                }}
              />
              {column.sampleCards && column.sampleCards.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 2 }}>
                  {column.sampleCards.map((cardTitle, cardIndex) => (
                    <Chip
                      key={cardIndex}
                      label={cardTitle}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: '0.7rem',
                        height: '20px',
                        '& .MuiChip-label': { px: 1 }
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Box>
    )
  }

  return (
    <Box>
      <Button
        sx={{
          color: 'white',
          textTransform: 'none',
          fontWeight: 'bold',
          px: 2,
          borderRadius: 2,
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }
        }}
        id="basic-button-templates"
        aria-controls={open ? 'basic-menu-templates' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        endIcon={<ExpandMoreIcon />}
      >
        Biểu Mẫu
      </Button>

      <Menu
        id="basic-menu-templates"
        MenuListProps={{ 'aria-labelledby': 'basic-button-templates' }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            mt: 1.5,
            borderRadius: 2,
            minWidth: 220,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }
        }}
      >
        {Object.entries(BOARD_TEMPLATES).map(([templateType, template]) => (
          <MenuItem
            key={templateType}
            onClick={() => handleSelectTemplate(templateType)}
            sx={{
              px: 2,
              py: 1.5,
              '&:hover': { backgroundColor: 'primary.light', color: 'white' }
            }}
          >
            <ListItemIcon>
              {getTemplateIcon(templateType)}
            </ListItemIcon>
            <ListItemText
              primary={<Typography fontWeight="medium">{template.title}</Typography>}
              secondary={template.description}
            />
          </MenuItem>
        ))}
      </Menu>

      {/* Dialog xác nhận tạo board */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Tạo Board Mới từ Template
        </DialogTitle>
        <DialogContent>
          {createBoardError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {typeof createBoardError === 'string' 
                ? createBoardError 
                : createBoardError.message || 'Có lỗi xảy ra khi tạo board'}
            </Alert>
          )}
          
          <DialogContentText>
            Nhập tên cho board mới của bạn. Board sẽ được tạo với các columns và sample cards theo template đã chọn.
          </DialogContentText>
          
          <TextField
            autoFocus
            margin="dense"
            label="Tên Board"
            fullWidth
            variant="outlined"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            sx={{ mt: 2 }}
            disabled={isCreatingBoard}
          />

          {selectedTemplate && renderTemplatePreview(selectedTemplate)}
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleDialogClose}
            disabled={isCreatingBoard}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleCreateBoard}
            variant="contained"
            disabled={isCreatingBoard || !customTitle.trim()}
            startIcon={isCreatingBoard && <CircularProgress size={16} />}
          >
            {isCreatingBoard ? 'Đang tạo...' : 'Tạo Board'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Templates