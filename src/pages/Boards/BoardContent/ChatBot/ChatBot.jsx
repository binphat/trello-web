
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
  Avatar,
  Fade,
  Slide,
  Chip
} from '@mui/material'
import {
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as SmartToyIcon,
  Person as PersonIcon,
  Chat as ChatIcon,
  Calculate as CalculateIcon,
  Add as AddIcon,
  ViewColumn as ViewColumnIcon, // Thay đổi icon
} from '@mui/icons-material'

import { toggleChatbot, addUserMessage, sendMessageToGemini } from '~/redux/chatBot/ChatBotSlice'
import { addColumnsToCurrentBoard } from '~/redux/activeBoard/activeBoardSlice' // Import action mới
  
const ChatBot = () => {
  const dispatch = useDispatch()
  const { isOpen, messages, isLoading } = useSelector(state => state.chatbot)
  const { isCreatingBoard, currentActiveBoard } = useSelector(state => state.activeBoard) // Thêm currentActiveBoard
  const [input, setInput] = useState('')
  const [showTopicInput, setShowTopicInput] = useState(false)
  const [userTopic, setUserTopic] = useState('')
  const [showColumnCreation, setShowColumnCreation] = useState(false) // Đổi tên
  const [columnCreationData, setColumnCreationData] = useState(null) // Đổi tên
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const topicInputRef = useRef(null)

  // Rút ngắn chỉ còn 1 category
  const academicSuggestions = [
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
    }
  ]

  // Hàm làm sạch và trích xuất từ khóa chính
  const cleanAndExtractKeywords = (text) => {
    if (!text || typeof text !== 'string') return ''
    
    // Loại bỏ các ký tự đặc biệt và markdown
    let cleaned = text
      .replace(/[#*_`]/g, '') // Loại bỏ markdown
      .replace(/card title\s*=\s*/gi, '') // Loại bỏ "card title ="
      .replace(/title\s*[:=]\s*/gi, '') // Loại bỏ "title:" hoặc "title ="
      .replace(/^\d+\.\s*/, '') // Loại bỏ số thứ tự đầu dòng
      .replace(/^[-*+]\s*/, '') // Loại bỏ bullet points
      .replace(/[()[\]{}]/g, '') // Loại bỏ dấu ngoặc
      .replace(/\s+/g, ' ') // Chuẩn hóa khoảng trắng
      .trim()

    // Loại bỏ các từ không có ý nghĩa
    const meaninglessWords = [
      'và nhiều hơn thế nữa', 'nhiều hơn nữa', 'vv', 'v.v',
      'etc', 'example', 'ví dụ', 'chẳng hạn', 'như là',
      'bao gồm', 'gồm có', 'such as', 'including'
    ]
    
    meaninglessWords.forEach(word => {
      const regex = new RegExp(word, 'gi')
      cleaned = cleaned.replace(regex, '')
    })

    // Loại bỏ các cụm từ thừa ở cuối
    cleaned = cleaned
      .replace(/[,;:]$/, '') // Loại bỏ dấu phẩy, chấm phẩy ở cuối
      .replace(/\s+$/, '') // Loại bỏ khoảng trắng cuối
      .trim()

    return cleaned
  }

  // Kiểm tra xem text có phải là title có ý nghĩa không
  const isValidTitle = (text, isColumn = false) => {
    if (!text || typeof text !== 'string') return false
    
    const cleaned = cleanAndExtractKeywords(text)
    
    // Kiểm tra độ dài
    if (cleaned.length < 3 || cleaned.length >= 50) return false
    
    // Loại bỏ những title không có ý nghĩa
    const invalidPatterns = [
      /^[.]{3,}/, // Dấu ba chấm
      /^[=\-_]{2,}/, // Dấu gạch ngang liên tiếp
      /^\s*$/, // Chỉ có khoảng trắng
      /^(title|tiêu đề|tên|name)\s*[:=]?\s*$/i, // Chỉ là từ "title"
      /^(card|thẻ|nhiệm vụ|task)\s*[:=]?\s*$/i, // Chỉ là từ "card"
      /^[0-9]+\s*[:.]?\s*$/i, // Chỉ là số
      /^[a-z]\s*[:.]?\s*$/i, // Chỉ là một chữ cái
    ]
    
    const hasInvalidPattern = invalidPatterns.some(pattern => pattern.test(cleaned))
    if (hasInvalidPattern) return false
    
    // Kiểm tra có ít nhất một từ có ý nghĩa (từ có ít nhất 2 ký tự)
    const meaningfulWords = cleaned.split(/\s+/).filter(word => 
      word.length >= 2 && !/^[0-9]+$/.test(word)
    )
    
    if (meaningfulWords.length === 0) return false
    
    // Đối với column, yêu cầu nghiêm ngặt hơn
    if (isColumn) {
      // Loại bỏ các từ thường gặp trong tài liệu/nguồn tham khảo
      const excludeForColumn = [
        'tài liệu', 'nguồn', 'tham khảo', 'references', 'sources',
        'bibliography', 'link', 'website', 'url'
      ]
      const hasExcludedWords = excludeForColumn.some(word => 
        cleaned.toLowerCase().includes(word.toLowerCase())
      )
      if (hasExcludedWords) return false
    }
    
    return true
  }

  // Parse ChatBot response to extract column structure (thay vì board structure)
  const parseColumnStructure = (response) => {
    if (!response || typeof response !== 'string') {
      console.warn('Invalid response provided to parseColumnStructure:', response)
      return []
    }

    const lines = response.split('\n').filter(line => line && typeof line === 'string' && line.trim())
    const columns = []
    let currentColumn = null
    
    lines.forEach(line => {
      if (!line || typeof line !== 'string') return
      
      const trimmedLine = line.trim()
      if (!trimmedLine) return
      
      // Detect column headers
      const columnPatterns = [
        /^##\s*(.+)$/,
        /^\*\*(.+?)\*\*:?$/,
        /^\d+\.\s*(.+)$/,
        /^[A-Z][^:]*:$/,
        /^-\s*([A-Z][^-]*?)(?:\s*[-:].*)?$/
      ]
      
      let isColumn = false
      let columnTitle = ''
      
      for (let pattern of columnPatterns) {
        const match = trimmedLine.match(pattern)
        if (match && match[1]) {
          const rawTitle = match[1].trim()
          const cleanedTitle = cleanAndExtractKeywords(rawTitle)
          
          if (isValidTitle(cleanedTitle, true)) {
            columnTitle = cleanedTitle
            isColumn = true
            break
          }
        }
      }
      
      if (isColumn && columnTitle) {
        if (currentColumn && currentColumn.cards.length > 0) {
          columns.push(currentColumn)
        }
        
        currentColumn = {
          title: columnTitle,
          cards: [],
          color: getRandomColor()
        }
      } else if (currentColumn) {
        const cardPatterns = [
          /^[-*+]\s*(.+)$/,
          /^\d+\.\s*(.+)$/,
          /^[•·▪▫]\s*(.+)$/
        ]
        
        for (let pattern of cardPatterns) {
          const match = trimmedLine.match(pattern)
          if (match && match[1]) {
            const rawCardTitle = match[1].trim()
            const cleanedCardTitle = cleanAndExtractKeywords(rawCardTitle)
            
            if (isValidTitle(cleanedCardTitle, false)) {
              currentColumn.cards.push(cleanedCardTitle)
            }
            break
          }
        }
      }
    })
    
    if (currentColumn && currentColumn.cards.length > 0) {
      columns.push(currentColumn)
    }
    
    // Nếu không tìm thấy cấu trúc rõ ràng, tạo columns mặc định với titles dưới 50 ký tự
    if (columns.length === 0) {
      return [
        {
          title: 'Cần làm',
          color: '#ff6b6b',
          cards: ['Phân tích yêu cầu', 'Thu thập tài liệu', 'Lập kế hoạch chi tiết']
        },
        {
          title: 'Đang làm',
          color: '#4ecdc4',
          cards: ['Nghiên cứu chủ đề', 'Soạn thảo outline']
        },
        {
          title: 'Hoàn thành',
          color: '#45b7d1',
          cards: ['Xác định chủ đề']
        }
      ]
    }
    
    return columns
  }

  const getRandomColor = () => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffd93d', '#6c5ce7', '#fd79a8', '#00b894']
    return colors[Math.floor(Math.random() * colors.length)]
  }

  // Check if the latest bot message contains actionable content
  useEffect(() => {
    if (messages.length > 0 && userTopic && currentActiveBoard) { // Thêm kiểm tra currentActiveBoard
      const lastMessage = messages[messages.length - 1]
      if (lastMessage && lastMessage.isBot && lastMessage.text && !showColumnCreation) {
        try {
          const columnsData = parseColumnStructure(lastMessage.text) // Thay đổi tên function
          if (columnsData && columnsData.length > 0) {
            setColumnCreationData(columnsData) // Đổi tên state
            setShowColumnCreation(true) // Đổi tên state
          }
        } catch (error) {
          console.error('Error parsing column structure:', error)
        }
      }
    }
  }, [messages, userTopic, currentActiveBoard]) // Thêm currentActiveBoard vào dependencies

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
    setShowColumnCreation(false) // Đổi tên
    setColumnCreationData(null) // Đổi tên
  }

  const handleInputChange = (e) => {
    setInput(e.target.value)
  }

  const handleSendMessage = () => {
    if (input.trim() === '' || isLoading) return

    dispatch(addUserMessage(input))
    dispatch(sendMessageToGemini({ message: input }))
    setInput('')
    setShowColumnCreation(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestionClick = (question) => {
    setShowTopicInput(true)
    setInput(question)
    setTimeout(() => {
      topicInputRef.current?.focus()
    }, 100)
  }

  const handleTopicSubmit = () => {
    if (userTopic.trim() === '') return
    
    const finalMessage = `${input} - Chủ đề của nhóm tôi là: '${userTopic.trim()}'`
    dispatch(addUserMessage(finalMessage))
    dispatch(sendMessageToGemini({ message: finalMessage }))
    
    setInput('')
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

  // Tạo columns trong board hiện tại thay vì tạo board mới
  const handleAddColumnsToBoard = async () => {
    if (!columnCreationData || isCreatingBoard || !currentActiveBoard) return

    try {
      // Dispatch action để thêm columns vào board hiện tại
      await dispatch(addColumnsToCurrentBoard({
        columnsData: columnCreationData
      }))

      setShowColumnCreation(false)
      setColumnCreationData(null)
      
      // Thông báo thành công
      const successMessage = `Đã thêm ${columnCreationData.length} cột mới vào board "${currentActiveBoard.title}"! 🎉`
      dispatch(addUserMessage(successMessage))
      
    } catch (error) {
      console.error('Error adding columns to board:', error)
      dispatch(addUserMessage('Có lỗi xảy ra khi thêm cột vào board. Vui lòng thử lại.'))
    }
  }

  return (
    <>
      {/* Chat Toggle Button */}
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
            boxShadow: '0 12px 35px rgba(102, 126, 234, 0.4)',
            zIndex: 1000,
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            '&:hover': {
              transform: 'scale(1.15)',
              boxShadow: '0 20px 50px rgba(102, 126, 234, 0.6)'
            }
          }}
        >
          <ChatIcon sx={{ fontSize: '32px' }} />
        </Button>
      </Fade>

      {/* Chat Window */}
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
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.15)'
            }}
          >
            {/* Header */}
            <Box
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                p: 3,
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.25)' }}>
                  <SmartToyIcon />
                </Avatar>
                <Box>
                  <Typography variant='h6' sx={{ fontWeight: 700 }}>
                    Gemini Assistant
                  </Typography>
                  <Typography variant='caption' sx={{ opacity: 0.9 }}>
                    Trợ lý học tập thông minh
                  </Typography>
                </Box>
              </Box>
              
              <IconButton onClick={handleClose} sx={{ color: 'white' }}>
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Messages Container */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                p: 2.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 2.5
              }}
            >
              {/* Hiển thị thông tin board hiện tại nếu có */}
              {currentActiveBoard && (
                <Fade in={true}>
                  <Box
                    sx={{
                      p: 2,
                      background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(63, 81, 181, 0.1))',
                      borderRadius: '12px',
                      border: '1px solid rgba(33, 150, 243, 0.3)',
                      mb: 2
                    }}
                  >
                    <Typography variant='body2' sx={{ color: '#1976d2', fontWeight: 600 }}>
                      📋 Đang làm việc trên: {currentActiveBoard.title}
                    </Typography>
                    <Typography variant='caption' sx={{ color: '#1976d2', opacity: 0.8 }}>
                      Hiện có {currentActiveBoard.columns?.length || 0} cột
                    </Typography>
                  </Box>
                </Fade>
              )}

              {/* Suggestions - chỉ hiện khi có board hiện tại */}
              {messages.length === 0 && currentActiveBoard && (
                <Fade in={true} timeout={800}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ 
                      textAlign: 'center', 
                      mb: 3,
                      p: 2,
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
                      borderRadius: '16px'
                    }}>
                      <Typography variant='h6' sx={{ color: '#374151', fontWeight: 700, mb: 1 }}>
                        ✨ Mở rộng board của bạn
                      </Typography>
                      <Typography variant='body2' sx={{ color: '#6b7280' }}>
                        Tôi sẽ giúp bạn thêm cột và nhiệm vụ mới vào board hiện tại
                      </Typography>
                    </Box>
                    
                    {academicSuggestions.map((category, categoryIndex) => (
                      <Box key={categoryIndex} sx={{ mb: 3 }}>
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1.5, 
                          mb: 2,
                          p: 1.5,
                          background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.1), rgba(251, 146, 60, 0.1))',
                          borderRadius: '12px'
                        }}>
                          {category.icon}
                          <Typography variant='subtitle2' sx={{ fontWeight: 700, color: '#ea580c' }}>
                            {category.category}
                          </Typography>
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
                        </Box>
                        
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          {category.questions.map((question, questionIndex) => (
                            <Chip
                              key={questionIndex}
                              label={question}
                              onClick={() => handleSuggestionClick(question)}
                              sx={{
                                justifyContent: 'flex-start',
                                height: 'auto',
                                py: 1.5,
                                px: 2,
                                fontSize: '13px',
                                cursor: 'pointer',
                                bgcolor: 'rgba(255, 247, 237, 0.8)',
                                color: '#ea580c',
                                border: '1px solid rgba(234, 88, 12, 0.3)',
                                borderRadius: '14px',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  bgcolor: 'rgba(255, 237, 213, 0.9)',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 8px 25px rgba(234, 88, 12, 0.2)'
                                },
                                '& .MuiChip-label': {
                                  whiteSpace: 'normal',
                                  textAlign: 'left',
                                  padding: 0,
                                  fontWeight: 500
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

              {/* Thông báo nếu không có board hiện tại */}
              {messages.length === 0 && !currentActiveBoard && (
                <Fade in={true}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: 3,
                      background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 152, 0, 0.1))',
                      borderRadius: '16px',
                      border: '1px solid rgba(255, 193, 7, 0.3)'
                    }}
                  >
                    <Typography variant='h6' sx={{ color: '#f57c00', fontWeight: 700, mb: 1 }}>
                      📋 Chưa có board nào
                    </Typography>
                    <Typography variant='body2' sx={{ color: '#ff8f00' }}>
                      Vui lòng mở một board để tôi có thể giúp bạn thêm cột và nhiệm vụ mới
                    </Typography>
                  </Box>
                </Fade>
              )}

              {/* Messages */}
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
                        flexShrink: 0
                      }}
                    >
                      {message.isBot ? <SmartToyIcon sx={{ fontSize: 20 }} /> : <PersonIcon sx={{ fontSize: 20 }} />}
                    </Avatar>
                    
                    <Box
                      sx={{
                        background: message.isBot 
                          ? 'rgba(255,255,255,0.9)'
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: message.isBot ? '#1f2937' : 'white',
                        borderRadius: '20px',
                        px: 3,
                        py: 2,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        maxWidth: '100%',
                        wordWrap: 'break-word'
                      }}
                    >
                      <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {message.text}
                      </Typography>
                      <Typography variant='caption' sx={{ display: 'block', mt: 1, opacity: 0.7 }}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </Box>
                </Fade>
              ))}
              
              {/* Column Creation Suggestion - thay đổi từ Board Creation */}
              {showColumnCreation && columnCreationData && currentActiveBoard && (
                <Fade in={true}>
                  <Box
                    sx={{
                      p: 3,
                      background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(139, 195, 74, 0.1))',
                      borderRadius: '16px',
                      border: '1px solid rgba(76, 175, 80, 0.3)',
                      mt: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <ViewColumnIcon sx={{ color: '#4caf50', fontSize: 24 }} />
                      <Typography variant='h6' sx={{ color: '#2e7d32', fontWeight: 700 }}>
                        Thêm Cột Mới Vào Board
                      </Typography>
                    </Box>
                    
                    <Typography variant='body2' sx={{ color: '#388e3c', mb: 2 }}>
                      Tôi có thể thêm {columnCreationData.length} cột mới vào board {currentActiveBoard.title}:
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                      {columnCreationData.map((col, index) => (
                        <Chip
                          key={index}
                          label={`${col.title} (${col.cards.length} nhiệm vụ)`}
                          sx={{
                            bgcolor: col.color,
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '12px'
                          }}
                        />
                      ))}
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        onClick={handleAddColumnsToBoard}
                        disabled={isCreatingBoard}
                        startIcon={isCreatingBoard ? null : <AddIcon />}
                        sx={{
                          background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                          color: 'white',
                          fontWeight: 600,
                          borderRadius: '12px',
                          textTransform: 'none',
                          flex: 1,
                          '&:hover': {
                            background: 'linear-gradient(135deg, #388e3c 0%, #4caf50 100%)'
                          }
                        }}
                      >
                        {isCreatingBoard ? 'Đang thêm...' : '🚀 Thêm Cột Ngay'}
                      </Button>
                      
                      <Button
                        variant="outlined"
                        onClick={() => setShowColumnCreation(false)}
                        sx={{
                          borderColor: '#4caf50',
                          color: '#4caf50',
                          borderRadius: '12px',
                          textTransform: 'none'
                        }}
                      >
                        Bỏ qua
                      </Button>
                    </Box>
                  </Box>
                </Fade>
              )}
              
              {/* Loading indicator */}
              {isLoading && (
                <Fade in={true}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                      <SmartToyIcon />
                    </Avatar>
                    <Box sx={{ bgcolor: 'rgba(255,255,255,0.9)', borderRadius: '20px', px: 3, py: 2 }}>
                      <Typography variant='body2' sx={{ color: '#667eea' }}>
                        Đang suy nghĩ... 🤔
                      </Typography>
                    </Box>
                  </Box>
                </Fade>
              )}
              
              <div ref={messagesEndRef} />
            </Box>

            {/* Input Area */}
            <Box sx={{ p: 3, borderTop: '1px solid rgba(241, 245, 249, 0.8)' }}>
              {/* Topic Input Section */}
              {showTopicInput && (
                <Fade in={showTopicInput}>
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{
                      p: 2,
                      background: 'linear-gradient(135deg, rgba(255, 247, 237, 0.9), rgba(254, 243, 199, 0.9))',
                      borderRadius: '12px',
                      mb: 2
                    }}>
                      <Typography variant='subtitle2' sx={{ color: '#ea580c', fontWeight: 600, mb: 1 }}>
                        ✏️ Nhập chủ đề nhóm của bạn
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
                          bgcolor: 'rgba(255, 255, 255, 0.9)'
                        }
                      }}
                    />
                    
                    <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
                      <Button variant="outlined" onClick={handleCancelTopic} sx={{ borderRadius: '10px' }}>
                        Hủy
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleTopicSubmit}
                        disabled={userTopic.trim() === ''}
                        sx={{
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
                          flex: 1
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
                      bgcolor: 'rgba(255, 255, 255, 0.9)'
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
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
                    }
                  }}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        </Slide>
      )}
    </>
  )
}

export default ChatBot