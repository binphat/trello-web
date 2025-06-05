/* eslint-disable react/no-unknown-property */
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
  Slide,
  Chip,
  Grid
} from '@mui/material'
import {
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as SmartToyIcon,
  Person as PersonIcon,
  Chat as ChatIcon,
  AutoAwesome as SparklesIcon,
  School as SchoolIcon,
  Psychology as PsychologyIcon,
  Science as ScienceIcon,
  Calculate as CalculateIcon,
  Language as LanguageIcon,
  History as HistoryIcon
} from '@mui/icons-material'
import { toggleChatbot, addUserMessage, sendMessageToGemini } from '~/redux/chatBot/ChatBotSlice'

const ChatBot = () => {
  const dispatch = useDispatch()
  const { isOpen, messages, isLoading } = useSelector(state => state.chatbot)
  const [input, setInput] = useState('')
  const [showTopicInput, setShowTopicInput] = useState(false)
  const [userTopic, setUserTopic] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const topicInputRef = useRef(null)

  // Đề xuất câu hỏi học thuật theo chủ đề
  const academicSuggestions = [
    {
      category: 'Làm việc nhóm', 
      icon: <PsychologyIcon sx={{ fontSize: 16 }} />,
      questions: [
        'Làm sao phân chia công việc nhóm công bằng?',
        'Xử lý thành viên nhóm không hợp tác như thế nào?',
        'Cách thuyết trình nhóm tự tin và hiệu quả',
        'Tôi ngại nói chuyện trong nhóm, phải làm sao?'
      ]
    },
    {
      category: 'Chủ đề nhóm đã chọn',
      icon: <CalculateIcon sx={{ fontSize: 16 }} />,
      questions: [
        'Hướng dẫn làm chủ đề nhóm của tôi',
        'Phân tích chủ đề và đưa ra kế hoạch thực hiện',
        'Tìm tài liệu và nguồn tham khảo cho chủ đề',
        'Chia nhỏ chủ đề thành các công việc cụ thể'
      ],
      requiresTopic: true
    },
    {
      category: 'Kỹ năng viết',
      icon: <LanguageIcon sx={{ fontSize: 16 }} />,
      questions: [
        'Cách viết báo cáo không bị chấm điểm thấp',
        'Làm sao để bài luận có ý tưởng hay hơn?',
        'Tìm tài liệu tham khảo uy tín ở đâu?',
        'Cách trích dẫn nguồn cho đúng chuẩn'
      ]
    },
    {
      category: 'Vấn đề học tập',
      icon: <ScienceIcon sx={{ fontSize: 16 }} />,
      questions: [
        'Tôi học mãi không thuộc, có cách nào không?',
        'Làm sao để tập trung khi học ở nhà?',
        'Cách quản lý thời gian học nhiều môn cùng lúc',
        'Tôi hay lo lắng trước khi thi, phải làm gì?'
      ]
    }
  ]

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

  const handleSuggestionClick = (question, requiresTopic = false) => {
    if (requiresTopic) {
      setShowTopicInput(true)
      setInput(question)
      setTimeout(() => {
        topicInputRef.current?.focus()
      }, 100)
    } else {
      setInput(question)
      inputRef.current?.focus()
    }
  }

  const handleTopicSubmit = () => {
    if (userTopic.trim() === '') return
    
    const finalMessage = `${input} - Chủ đề của nhóm tôi là: '${userTopic.trim()}'`
    dispatch(addUserMessage(finalMessage))
    dispatch(sendMessageToGemini({ message: finalMessage }))
    
    // Reset states
    setInput('')
    setUserTopic('')
    setShowTopicInput(false)
  }

  const handleTopicKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleTopicSubmit()
    }
  }

  const handleCancelTopic = () => {
    setShowTopicInput(false)
    setUserTopic('')
    setInput('')
  }

  return (
    <>
      {/* Chat Toggle Button - Enhanced */}
      <Fade in={!isOpen}>
        <Button
          variant='contained'
          onClick={handleOpen}
          sx={{
            position: 'fixed',
            bottom: '28px',
            right: '28px',
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            minWidth: 'unset',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 12px 35px rgba(102, 126, 234, 0.4), 0 0 0 0 rgba(102, 126, 234, 0.7)',
            zIndex: 1000,
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            animation: 'glow 3s ease-in-out infinite alternate',
            '&:hover': {
              transform: 'scale(1.15) rotate(10deg)',
              boxShadow: '0 20px 50px rgba(102, 126, 234, 0.6), 0 0 30px rgba(118, 75, 162, 0.4)',
              background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              width: '16px',
              height: '16px',
              backgroundColor: '#ff6b6b',
              borderRadius: '50%',
              border: '3px solid white',
              animation: 'heartbeat 2s infinite',
              boxShadow: '0 2px 8px rgba(255, 107, 107, 0.4)'
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: '-4px',
              borderRadius: '50%',
              background: 'linear-gradient(45deg, transparent, rgba(102, 126, 234, 0.3), transparent)',
              animation: 'rotate 3s linear infinite',
              zIndex: -1
            }
          }}
        >
          <ChatIcon sx={{ fontSize: '32px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
        </Button>
      </Fade>

      {/* Chat Window - Enhanced */}
      {isOpen && (
        <Slide direction='up' in={isOpen} mountOnEnter unmountOnExit>
          <Paper
            elevation={24}
            sx={{
              position: 'fixed',
              bottom: '28px',
              right: '28px',
              width: { xs: '92vw', sm: '440px' },
              height: '680px',
              borderRadius: '24px',
              overflow: 'hidden',
              zIndex: 1000,
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              display: 'flex',
              flexDirection: 'column',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.5)'
            }}
          >
            {/* Header - Enhanced */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                p: 3.5,
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
                  background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                  animation: 'float 8s ease-in-out infinite'
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)'
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.25)',
                      backdropFilter: 'blur(15px)',
                      border: '2px solid rgba(255,255,255,0.4)',
                      width: 48,
                      height: 48,
                      boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                    }}
                  >
                    <SmartToyIcon sx={{ fontSize: 24 }} />
                  </Avatar>
                  <Box>
                    <Typography variant='h6' sx={{ fontWeight: 700, mb: 0.5, fontSize: '18px' }}>
                      Gemini Assistant
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box 
                        sx={{ 
                          width: '10px', 
                          height: '10px', 
                          bgcolor: '#4ade80', 
                          borderRadius: '50%',
                          animation: 'pulse 2s infinite',
                          boxShadow: '0 0 8px rgba(74, 222, 128, 0.6)'
                        }} 
                      />
                      <Typography variant='caption' sx={{ opacity: 0.95, fontWeight: 500 }}>
                        Sẵn sàng hỗ trợ bạn
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <IconButton 
                  onClick={handleClose}
                  sx={{ 
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    width: 44,
                    height: 44,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.25)',
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Messages Container - Enhanced */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2.5,
                background: 'linear-gradient(to bottom, #f8fafc, #ffffff)',
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5,
                '&::-webkit-scrollbar': {
                  width: '6px'
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(0,0,0,0.05)',
                  borderRadius: '10px'
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  borderRadius: '10px'
                }
              }}
            >
              {/* Suggestions - Enhanced */}
              {messages.length === 0 && (
                <Fade in={true} timeout={800}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      mb: 3,
                      p: 2,
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
                      borderRadius: '16px',
                      border: '1px solid rgba(102, 126, 234, 0.2)'
                    }}>
                      <Typography 
                        variant='h6' 
                        sx={{ 
                          color: '#374151',
                          fontWeight: 700,
                          fontSize: '18px',
                          mb: 1
                        }}
                      >
                        ✨ Gợi ý câu hỏi dành cho bạn
                      </Typography>
                      <Typography 
                        variant='body2' 
                        sx={{ 
                          color: '#6b7280',
                          fontSize: '13px'
                        }}
                      >
                        Chọn một câu hỏi để bắt đầu cuộc trò chuyện
                      </Typography>
                    </Box>
                    
                    {academicSuggestions.map((category, categoryIndex) => (
                      <Box key={categoryIndex} sx={{ mb: 3.5 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1.5, 
                          mb: 2,
                          p: 1.5,
                          background: category.requiresTopic 
                            ? 'linear-gradient(135deg, rgba(234, 88, 12, 0.1), rgba(251, 146, 60, 0.1))'
                            : 'linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(139, 92, 246, 0.1))',
                          borderRadius: '12px',
                          border: category.requiresTopic 
                            ? '1px solid rgba(234, 88, 12, 0.2)'
                            : '1px solid rgba(79, 70, 229, 0.2)'
                        }}>
                          <Box sx={{
                            p: 1,
                            bgcolor: category.requiresTopic 
                              ? 'rgba(234, 88, 12, 0.1)'
                              : 'rgba(79, 70, 229, 0.1)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {category.icon}
                          </Box>
                          <Typography 
                            variant='subtitle2' 
                            sx={{ 
                              fontWeight: 700,
                              color: category.requiresTopic ? '#ea580c' : '#4f46e5',
                              fontSize: '14px'
                            }}
                          >
                            {category.category}
                          </Typography>
                          {category.requiresTopic && (
                            <Typography
                              variant='caption'
                              sx={{
                                ml: 'auto',
                                px: 1.5,
                                py: 0.5,
                                bgcolor: 'rgba(234, 88, 12, 0.1)',
                                color: '#ea580c',
                                borderRadius: '12px',
                                fontSize: '10px',
                                fontWeight: 600
                              }}
                            >
                              ✏️ Cần nhập chủ đề
                            </Typography>
                          )}
                        </Box>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          {category.questions.map((question, questionIndex) => (
                            <Chip
                              key={questionIndex}
                              label={question}
                              onClick={() => handleSuggestionClick(question, category.requiresTopic)}
                              sx={{
                                justifyContent: 'flex-start',
                                height: 'auto',
                                py: 1.5,
                                px: 2,
                                fontSize: '13px',
                                cursor: 'pointer',
                                bgcolor: category.requiresTopic 
                                  ? 'rgba(255, 247, 237, 0.8)' 
                                  : 'rgba(248, 250, 252, 0.8)',
                                color: category.requiresTopic ? '#ea580c' : '#374151',
                                border: category.requiresTopic 
                                  ? '1px solid rgba(234, 88, 12, 0.3)' 
                                  : '1px solid rgba(226, 232, 240, 0.8)',
                                borderRadius: '14px',
                                backdropFilter: 'blur(10px)',
                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                position: 'relative',
                                '&:hover': {
                                  bgcolor: category.requiresTopic 
                                    ? 'rgba(255, 237, 213, 0.9)' 
                                    : 'rgba(102, 126, 234, 0.1)',
                                  borderColor: category.requiresTopic ? '#ea580c' : '#667eea',
                                  transform: 'translateY(-2px) scale(1.02)',
                                  boxShadow: category.requiresTopic 
                                    ? '0 8px 25px rgba(234, 88, 12, 0.2)' 
                                    : '0 8px 25px rgba(102, 126, 234, 0.2)',
                                  color: category.requiresTopic ? '#c2410c' : '#4f46e5'
                                },
                                '&::after': category.requiresTopic ? {
                                  content: '"✏️"',
                                  position: 'absolute',
                                  right: '12px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  fontSize: '14px'
                                } : {},
                                '& .MuiChip-label': {
                                  whiteSpace: 'normal',
                                  textAlign: 'left',
                                  padding: 0,
                                  fontWeight: 500,
                                  paddingRight: category.requiresTopic ? '28px' : '0'
                                }
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Fade>
              )}

              {/* Messages - Enhanced */}
              {messages.map((message) => (
                <Fade in={true} key={message.id} timeout={400}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 2,
                      alignSelf: message.isBot ? 'flex-start' : 'flex-end',
                      flexDirection: message.isBot ? 'row' : 'row-reverse',
                      maxWidth: '85%'
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        background: message.isBot 
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                        flexShrink: 0,
                        boxShadow: message.isBot 
                          ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                          : '0 4px 12px rgba(240, 147, 251, 0.3)',
                        border: '2px solid rgba(255, 255, 255, 0.8)'
                      }}
                    >
                      {message.isBot ? 
                        <SmartToyIcon sx={{ fontSize: 20 }} /> : 
                        <PersonIcon sx={{ fontSize: 20 }} />
                      }
                    </Avatar>
                    
                    <Box
                      sx={{
                        background: message.isBot 
                          ? 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9))'
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: message.isBot ? '#1f2937' : 'white',
                        borderRadius: '20px',
                        px: 3,
                        py: 2,
                        boxShadow: message.isBot 
                          ? '0 4px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)'
                          : '0 6px 20px rgba(102, 126, 234, 0.4)',
                        border: message.isBot ? '1px solid rgba(226, 232, 240, 0.6)' : 'none',
                        maxWidth: '100%',
                        wordWrap: 'break-word',
                        backdropFilter: 'blur(15px)',
                        position: 'relative',
                        '&::before': message.isBot ? {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent)',
                          borderRadius: '20px',
                          pointerEvents: 'none'
                        } : {}
                      }}
                    >
                      <Typography 
                        variant='body2' 
                        sx={{ 
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.6,
                          fontSize: '14px',
                          fontWeight: 500
                        }}
                      >
                        {message.text}
                      </Typography>
                      <Typography 
                        variant='caption' 
                        sx={{
                          display: 'block',
                          mt: 1.5,
                          textAlign: message.isBot ? 'left' : 'right',
                          opacity: 0.7,
                          fontSize: '11px',
                          fontWeight: 500
                        }}
                      >
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </Box>
                </Fade>
              ))}
              
              {/* Loading indicator - Enhanced */}
              {isLoading && (
                <Fade in={true}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, maxWidth: '85%' }}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                        border: '2px solid rgba(255, 255, 255, 0.8)'
                      }}
                    >
                      <SmartToyIcon sx={{ fontSize: 20 }} />
                    </Avatar>
                    <Box
                      sx={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9))',
                        borderRadius: '20px',
                        px: 3,
                        py: 2.5,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
                        border: '1px solid rgba(226, 232, 240, 0.6)',
                        backdropFilter: 'blur(15px)'
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Box 
                          sx={{ 
                            width: '8px', 
                            height: '8px', 
                            bgcolor: '#667eea', 
                            borderRadius: '50%',
                            animation: 'bounce 1.4s ease-in-out infinite both'
                          }} 
                        />
                        <Box 
                          sx={{ 
                            width: '8px', 
                            height: '8px', 
                            bgcolor: '#764ba2', 
                            borderRadius: '50%',
                            animation: 'bounce 1.4s ease-in-out 0.16s infinite both'
                          }} 
                        />
                        <Box 
                          sx={{ 
                            width: '8px', 
                            height: '8px', 
                            bgcolor: '#667eea', 
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

            {/* Input Area - Enhanced */}
            <Box
              sx={{
                p: 3,
                borderTop: '1px solid rgba(241, 245, 249, 0.8)',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.95))',
                backdropFilter: 'blur(20px)'
              }}
            >
              {/* Topic Input Section */}
              {showTopicInput && (
                <Fade in={showTopicInput}>
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{
                      p: 2.5,
                      background: 'linear-gradient(135deg, rgba(255, 247, 237, 0.9), rgba(254, 243, 199, 0.9))',
                      borderRadius: '16px',
                      border: '1px solid rgba(234, 88, 12, 0.3)',
                      mb: 2
                    }}>
                      <Typography variant='subtitle2' sx={{ 
                        color: '#ea580c', 
                        fontWeight: 600,
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        ✏️ Nhập chủ đề nhóm của bạn
                      </Typography>
                      <Typography variant='body2' sx={{ 
                        color: '#c2410c',
                        fontSize: '12px',
                        opacity: 0.9
                      }}>
                        Vui lòng nhập tên chủ đề mà nhóm bạn đã chọn để được tư vấn cụ thể
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      maxRows={2}
                      value={userTopic}
                      onChange={(e) => setUserTopic(e.target.value)}
                      onKeyPress={handleTopicKeyPress}
                      placeholder="Ví dụ: Nghiên cứu về trí tuệ nhân tạo trong giáo dục..."
                      inputRef={topicInputRef}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          bgcolor: 'rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(234, 88, 12, 0.3)',
                          transition: 'all 0.3s ease',
                          fontSize: '14px',
                          '&:hover': {
                            borderColor: '#ea580c',
                            bgcolor: 'rgba(255, 255, 255, 0.9)'
                          },
                          '&.Mui-focused': {
                            borderColor: '#ea580c',
                            bgcolor: 'rgba(255, 255, 255, 1)',
                            boxShadow: '0 0 0 3px rgba(234, 88, 12, 0.1)'
                          }
                        },
                        '& .MuiOutlinedInput-input': {
                          color: '#1f2937',
                          fontWeight: 500,
                          '&::placeholder': {
                            color: '#9ca3af',
                            opacity: 0.8
                          }
                        }
                      }}
                    />
                    
                    <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={handleCancelTopic}
                        sx={{
                          borderRadius: '10px',
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '13px',
                          px: 2.5,
                          py: 1,
                          borderColor: '#d1d5db',
                          color: '#6b7280',
                          '&:hover': {
                            borderColor: '#9ca3af',
                            bgcolor: 'rgba(156, 163, 175, 0.1)'
                          }
                        }}
                      >
                        ❌ Hủy
                      </Button>
                      
                      <Button
                        variant="contained"
                        onClick={handleTopicSubmit}
                        disabled={userTopic.trim() === ''}
                        sx={{
                          borderRadius: '10px',
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '13px',
                          px: 2.5,
                          py: 1,
                          background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
                          color: 'white',
                          flexGrow: 1,
                          boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                            boxShadow: '0 6px 16px rgba(234, 88, 12, 0.4)',
                            transform: 'translateY(-1px)'
                          },
                          '&:disabled': {
                            background: 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)',
                            color: '#6b7280',
                            boxShadow: 'none'
                          }
                        }}
                      >
                        ✨ Gửi câu hỏi
                      </Button>
                    </Box>
                  </Box>
                </Fade>
              )}

              {/* Main Input */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  value={input}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder={showTopicInput ? 'Câu hỏi đã được chọn...' : 'Nhập tin nhắn của bạn...'}
                  disabled={isLoading || showTopicInput}
                  inputRef={inputRef}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '18px',
                      bgcolor: showTopicInput ? 'rgba(243, 244, 246, 0.5)' : 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(15px)',
                      border: showTopicInput ? '1px solid rgba(209, 213, 219, 0.5)' : '1px solid rgba(226, 232, 240, 0.8)',
                      transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      fontSize: '14px',
                      '&:hover': !showTopicInput ? {
                        borderColor: '#667eea',
                        bgcolor: 'rgba(255, 255, 255, 1)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 8px 25px rgba(102, 126, 234, 0.15)'
                      } : {},
                      '&.Mui-focused': !showTopicInput ? {
                        borderColor: '#667eea',
                        bgcolor: 'rgba(255, 255, 255, 1)',
                        boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1), 0 8px 25px rgba(102, 126, 234, 0.15)'
                      } : {}
                    },
                    '& .MuiOutlinedInput-input': {
                      color: showTopicInput ? '#9ca3af' : '#1f2937',
                      fontWeight: 500,
                      py: 1.5,
                      '&::placeholder': {
                        color: showTopicInput ? '#d1d5db' : '#9ca3af',
                        opacity: 0.8
                      }
                    }
                  }}
                />
                
                <IconButton
                  onClick={handleSendMessage}
                  disabled={input.trim() === '' || isLoading || showTopicInput}
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '14px',
                    background: showTopicInput ? 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    flexShrink: 0,
                    boxShadow: showTopicInput ? 'none' : '0 6px 20px rgba(102, 126, 234, 0.4)',
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    border: '2px solid rgba(255, 255, 255, 0.8)',
                    '&:hover': !showTopicInput ? {
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                      transform: 'scale(1.05)',
                      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.5)'
                    } : {},
                    '&:disabled': {
                      background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
                      color: '#9ca3af',
                      boxShadow: 'none'
                    }
                  }}
                >
                  <SendIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>
              
              {/* Quick tip */}
              <Typography 
                variant='caption' 
                sx={{ 
                  color: '#9ca3af',
                  fontSize: '11px',
                  mt: 1.5,
                  display: 'block',
                  textAlign: 'center',
                  fontWeight: 500
                }}
              >
                💡 Nhấn Enter để gửi, Shift + Enter để xuống dòng
              </Typography>
            </Box>
          </Paper>
        </Slide>
      )}

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes glow {
          0% { box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4), 0 0 0 0 rgba(102, 126, 234, 0.7); }
          100% { box-shadow: 0 15px 40px rgba(118, 75, 162, 0.5), 0 0 20px rgba(118, 75, 162, 0.3); }
        }
        
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }
        
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </>
  )
}

export default ChatBot