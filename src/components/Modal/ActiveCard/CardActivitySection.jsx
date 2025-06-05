import { useState } from 'react'
import moment from 'moment'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import SpellcheckIcon from '@mui/icons-material/Spellcheck'
import CheckIcon from '@mui/icons-material/Check'
import CloseIcon from '@mui/icons-material/Close'
import TranslateIcon from '@mui/icons-material/Translate'
import { styled, keyframes } from '@mui/material/styles'
import { useDispatch, useSelector } from 'react-redux'

// Import spell check actions và selectors
import {
  checkSpelling,
  clearSpellCheck,
  dismissSuggestion,
  selectSpellCheckLoading,
  selectSpellCheckError,
  selectSpellCheckSuggestion,
  selectHasSpellCheckSuggestion,
  selectDetectedLanguage
} from '~/redux/spellCheck/spellCheckSlice'

import { selectCurrentUser } from '~/redux/User/userSlice'

// Define keyframe animation
const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const SpellCheckContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f8f9fa',
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.mode === 'dark' ? '#404040' : '#e0e0e0'}`,
  animation: `${slideIn} 0.3s ease-out`
}))

const SuggestionText = styled(Typography)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#fff',
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  fontSize: '14px',
  lineHeight: 1.5,
  wordBreak: 'break-word',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: '12px',
    top: '-6px',
    width: 0,
    height: 0,
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
    borderBottom: `6px solid ${theme.palette.mode === 'dark' ? '#1a1a1a' : '#fff'}`
  }
}))

const LanguageChip = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: '2px 8px',
  borderRadius: '12px',
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase'
}))

function CardActivitySection({ cardComments = [], onAddCardComment }) {
  const dispatch = useDispatch()
  const currentUser = useSelector(selectCurrentUser)

  // Spell check states từ Redux
  const isCheckingSpelling = useSelector(selectSpellCheckLoading)
  const spellCheckError = useSelector(selectSpellCheckError)
  const spellCheckSuggestion = useSelector(selectSpellCheckSuggestion)
  const hasSpellCheckSuggestion = useSelector(selectHasSpellCheckSuggestion)
  const detectedLanguage = useSelector(selectDetectedLanguage)

  // Local states
  const [commentText, setCommentText] = useState('')

  const handleAddCardComment = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (!event.target?.value) return

      const commentToAdd = {
        userAvatar: currentUser?.avatar,
        userDisplayName: currentUser?.displayName,
        content: event.target.value.trim()
      }

      onAddCardComment(commentToAdd).then(() => {
        event.target.value = ''
        setCommentText('')
        dispatch(clearSpellCheck())
      })
    }
  }

  const handleCommentChange = (event) => {
    setCommentText(event.target.value)
    // Clear previous spell check khi user typing
    if (hasSpellCheckSuggestion) {
      dispatch(clearSpellCheck())
    }
  }

  const handleSpellCheck = () => {
    if (!commentText.trim()) return
    dispatch(checkSpelling(commentText))
  }

  const applySuggestion = () => {
    setCommentText(spellCheckSuggestion)
    dispatch(dismissSuggestion())

    // Focus lại vào text field
    setTimeout(() => {
      const textField = document.querySelector('textarea[placeholder="Write a comment..."]')
      if (textField) {
        textField.focus()
        textField.setSelectionRange(textField.value.length, textField.value.length)
      }
    }, 100)
  }

  const dismissSuggestionHandler = () => {
    dispatch(dismissSuggestion())
  }

  const getLanguageName = (lang) => {
    return lang === 'vi' ? 'Tiếng Việt' : 'English'
  }

  return (
    <Box sx={{ mt: 2 }}>
      {/* Add comment section */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
        <Avatar
          sx={{ width: 36, height: 36, cursor: 'pointer' }}
          alt={currentUser?.displayName}
          src={currentUser?.avatar}
        />
        <Box sx={{ width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <TextField
              fullWidth
              placeholder="Write a comment..."
              type="text"
              variant="outlined"
              multiline
              value={commentText}
              onChange={handleCommentChange}
              onKeyDown={handleAddCardComment}
              minRows={2}
              maxRows={6}
            />
            <Tooltip title="Kiểm tra chính tả (Hỗ trợ Tiếng Việt & English)">
              <span>
                <IconButton
                  onClick={handleSpellCheck}
                  disabled={isCheckingSpelling || !commentText.trim()}
                  color="primary"
                  sx={{
                    mt: 1,
                    '&:hover': {
                      backgroundColor: 'primary.light',
                      color: 'white'
                    }
                  }}
                >
                  {isCheckingSpelling ? (
                    <CircularProgress size={20} />
                  ) : (
                    <SpellcheckIcon />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          {/* Error message */}
          {spellCheckError && (
            <Typography
              variant="caption"
              color="error"
              sx={{ mt: 1, display: 'block' }}
            >
              Lỗi kiểm tra chính tả: {spellCheckError}
            </Typography>
          )}

          {/* Spell check suggestions */}
          {hasSpellCheckSuggestion && spellCheckSuggestion && (
            <SpellCheckContainer>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    📝 Gemini gợi ý sửa chính tả:
                  </Typography>
                  {detectedLanguage && (
                    <LanguageChip>
                      <TranslateIcon sx={{ fontSize: '12px' }} />
                      {getLanguageName(detectedLanguage)}
                    </LanguageChip>
                  )}
                </Box>
                <SuggestionText>
                  {spellCheckSuggestion}
                </SuggestionText>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Tooltip title="Áp dụng gợi ý">
                  <span>
                    <IconButton
                      size="small"
                      onClick={applySuggestion}
                      color="success"
                      sx={{
                        '&:hover': {
                          backgroundColor: 'success.light',
                          color: 'white'
                        }
                      }}
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Bỏ qua">
                  <span>
                    <IconButton
                      size="small"
                      onClick={dismissSuggestionHandler}
                      color="error"
                      sx={{
                        '&:hover': {
                          backgroundColor: 'error.light',
                          color: 'white'
                        }
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </SpellCheckContainer>
          )}

          {/* No corrections message */}
          {!isCheckingSpelling && !spellCheckError && !hasSpellCheckSuggestion && commentText && (
            // Hiển thị message khi đã check xong nhưng không có gợi ý
            commentText.length > 0 && (
              <Typography
                variant="caption"
                color="success.main"
                sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}
              >
                ✓ Văn bản đã được kiểm tra - Không tìm thấy lỗi chính tả
              </Typography>
            )
          )}
        </Box>
      </Box>

      {/* Display comments */}
      {cardComments.length === 0 && (
        <Typography sx={{ pl: '45px', fontSize: '14px', fontWeight: '500', color: '#b1b1b1' }}>
          No activity found!
        </Typography>
      )}
      {cardComments.map((comment, index) => (
        <Box sx={{ display: 'flex', gap: 1, width: '100%', mb: 1.5 }} key={index}>
          <Tooltip title={comment.userDisplayName}>
            <Avatar
              sx={{ width: 36, height: 36, cursor: 'pointer' }}
              alt={comment.userDisplayName}
              src={comment.userAvatar}
            />
          </Tooltip>
          <Box sx={{ width: 'inherit' }}>
            <Typography variant="span" sx={{ fontWeight: 'bold', mr: 1 }}>
              {comment.userDisplayName}
            </Typography>

            <Typography variant="span" sx={{ fontSize: '12px' }}>
              {moment(comment.commentedAt).format('llll')}
            </Typography>

            <Box sx={{
              display: 'block',
              bgcolor: (theme) => theme.palette.mode === 'dark' ? '#33485D' : 'white',
              p: '8px 12px',
              mt: '4px',
              border: '0.5px solid rgba(0, 0, 0, 0.2)',
              borderRadius: '4px',
              wordBreak: 'break-word',
              boxShadow: '0 0 1px rgba(0, 0, 0, 0.2)'
            }}>
              {comment.content}
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

export default CardActivitySection