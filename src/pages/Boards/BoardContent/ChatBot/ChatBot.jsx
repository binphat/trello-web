import { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  Paper,
  CircularProgress,
  Avatar,
  Fade,
  Slide
} from '@mui/material'
import {
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as SmartToyIcon,
  Person as PersonIcon,
  Chat as ChatIcon,
  AutoAwesome as SparklesIcon
} from '@mui/icons-material'
import { toggleChatbot, addUserMessage, sendMessageToGemini } from '~/redux/chatBot/ChatBotSlice'

const ChatBot = () => {
  const dispatch = useDispatch()
  const { isOpen, messages, isLoading } = useSelector(state => state.chatbot)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [messages, isOpen])

  const handleOpen = () => {
    dispatch(toggleChatbot())
  }

  const handleClose = () => {
    dispatch(toggleChatbot())
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
  }

  const handleSendMessage = () => {
    if (input.trim() === '' || isLoading) return

    dispatch(addUserMessage(input))
    dispatch(sendMessageToGemini({ message: input }))
    setInput('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <Fade in={!isOpen}>
        <Button
          variant="contained"
          onClick={handleOpen}
          sx={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            minWidth: 'unset',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)',
            zIndex: 1000,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.1)',
              boxShadow: '0 15px 40px rgba(102, 126, 234, 0.6)',
              background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '12px',
              height: '12px',
              backgroundColor: '#ff4757',
              borderRadius: '50%',
              animation: 'pulse 2s infinite'
            }
          }}
        >
          <ChatIcon sx={{ fontSize: '28px' }} />
        </Button>
      </Fade>

      {/* Chat Window */}
      {isOpen && (
        <Slide direction="up" in={isOpen} mountOnEnter unmountOnExit>
          <Paper
            elevation={24}
            sx={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              width: { xs: '90vw', sm: '400px' },
              height: '600px',
              borderRadius: '20px',
              overflow: 'hidden',
              zIndex: 1000,
              background: 'white',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                p: 3,
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                  animation: 'float 6s ease-in-out infinite'
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.3)'
                    }}
                  >
                    <SmartToyIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Gemini Assistant
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box 
                        sx={{ 
                          width: '8px', 
                          height: '8px', 
                          bgcolor: '#4ade80', 
                          borderRadius: '50%',
                          animation: 'pulse 2s infinite'
                        }} 
                      />
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        Đang hoạt động
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <IconButton 
                  onClick={handleClose}
                  sx={{ 
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.2)'
                    }
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Messages Container */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2,
                background: 'linear-gradient(to bottom, #f8fafc, #ffffff)',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              {messages.map((message) => (
                <Fade in={true} key={message.id} timeout={300}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1.5,
                      alignSelf: message.isBot ? 'flex-start' : 'flex-end',
                      flexDirection: message.isBot ? 'row' : 'row-reverse',
                      maxWidth: '85%'
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        background: message.isBot 
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        flexShrink: 0
                      }}
                    >
                      {message.isBot ? 
                        <SmartToyIcon sx={{ fontSize: 18 }} /> : 
                        <PersonIcon sx={{ fontSize: 18 }} />
                      }
                    </Avatar>
                    
                    <Box
                      sx={{
                        background: message.isBot 
                          ? 'white'
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: message.isBot ? '#1f2937' : 'white',
                        borderRadius: '18px',
                        px: 2.5,
                        py: 1.5,
                        boxShadow: message.isBot 
                          ? '0 2px 8px rgba(0,0,0,0.1)'
                          : '0 4px 12px rgba(102, 126, 234, 0.3)',
                        border: message.isBot ? '1px solid #f1f5f9' : 'none',
                        maxWidth: '100%',
                        wordWrap: 'break-word'
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.5,
                          fontSize: '14px'
                        }}
                      >
                        {message.text}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{
                          display: 'block',
                          mt: 1,
                          textAlign: message.isBot ? 'left' : 'right',
                          opacity: 0.7,
                          fontSize: '11px'
                        }}
                      >
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </Box>
                </Fade>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <Fade in={true}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, maxWidth: '85%' }}>
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      }}
                    >
                      <SmartToyIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Box
                      sx={{
                        background: 'white',
                        borderRadius: '18px',
                        px: 2.5,
                        py: 2,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '1px solid #f1f5f9'
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: '6px', 
                            height: '6px', 
                            bgcolor: '#94a3b8', 
                            borderRadius: '50%',
                            animation: 'bounce 1.4s ease-in-out infinite both'
                          }} 
                        />
                        <Box 
                          sx={{ 
                            width: '6px', 
                            height: '6px', 
                            bgcolor: '#94a3b8', 
                            borderRadius: '50%',
                            animation: 'bounce 1.4s ease-in-out 0.16s infinite both'
                          }} 
                        />
                        <Box 
                          sx={{ 
                            width: '6px', 
                            height: '6px', 
                            bgcolor: '#94a3b8', 
                            borderRadius: '50%',
                            animation: 'bounce 1.4s ease-in-out 0.32s infinite both'
                          }} 
                        />
                      </Box>
                    </Box>
                  </Box>
                </Fade>
              )}
              
              <div ref={messagesEndRef} />
            </Box>

            {/* Input Area */}
            <Box
              sx={{
                p: 2.5,
                borderTop: '1px solid #f1f5f9',
                background: 'white'
              }}
            >
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
                <Box sx={{ flex: 1, position: 'relative' }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    value={input}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập tin nhắn của bạn..."
                    disabled={isLoading}
                    inputRef={inputRef}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '16px',
                        bgcolor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        fontSize: '14px',
                        '&:hover': {
                          borderColor: '#cbd5e1'
                        },
                        '&.Mui-focused': {
                          borderColor: '#667eea',
                          boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
                        }
                      },
                      '& .MuiOutlinedInput-input': {
                        py: 1.5,
                        px: 2
                      }
                    }}
                  />
                  <SparklesIcon 
                    sx={{ 
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                      fontSize: 16
                    }} 
                  />
                </Box>
                
                <IconButton
                  onClick={handleSendMessage}
                  disabled={input.trim() === '' || isLoading}
                  sx={{
                    width: 48,
                    height: 48,
                    background: input.trim() !== '' && !isLoading 
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : '#e2e8f0',
                    color: input.trim() !== '' && !isLoading ? 'white' : '#94a3b8',
                    '&:hover': {
                      background: input.trim() !== '' && !isLoading 
                        ? 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                        : '#e2e8f0',
                      transform: input.trim() !== '' && !isLoading ? 'scale(1.05)' : 'none'
                    },
                    '&:disabled': {
                      background: '#e2e8f0',
                      color: '#94a3b8'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <SendIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>
              
              <Typography 
                variant="caption" 
                sx={{
                  display: 'block',
                  textAlign: 'center',
                  mt: 2,
                  color: '#94a3b8',
                  fontSize: '11px'
                }}
              >
                Được hỗ trợ bởi Gemini AI
              </Typography>
            </Box>
          </Paper>
        </Slide>
      )}

      {/* Global Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(180deg); }
          }
          
          @keyframes bounce {
            0%, 80%, 100% { 
              transform: scale(0);
            } 
            40% { 
              transform: scale(1);
            }
          }
        `
      }} />
    </>
  )
}

export default ChatBot