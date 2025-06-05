import { useState, useEffect } from 'react'
import { useColorScheme } from '@mui/material/styles'
import MDEditor from '@uiw/react-md-editor'
import rehypeSanitize from 'rehype-sanitize'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import EditNoteIcon from '@mui/icons-material/EditNote'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import { useDispatch, useSelector } from 'react-redux'
import { paraphraseText, clearResult } from '~/redux/ExplainAI/explainAISlice'

function CardDescriptionMdEditor({ cardDescriptionProp, handleUpdateCardDescription }) {
  const { mode } = useColorScheme()
  const dispatch = useDispatch()

  // State nội bộ giữ nội dung markdown
  const [markdownEditMode, setMarkdownEditMode] = useState(false)
  const [cardDescription, setCardDescription] = useState(cardDescriptionProp)
  const [originalDescription, setOriginalDescription] = useState(cardDescriptionProp)

  // Lấy trạng thái redux từ slice explainAI
  const loadingParaphrase = useSelector(state => state.explainAI.isLoading)
  const paraphraseResult = useSelector(state => state.explainAI.result)
  const paraphraseError = useSelector(state => state.explainAI.error) // nếu cần show lỗi

  // Đồng bộ khi prop thay đổi
  useEffect(() => {
    setCardDescription(cardDescriptionProp)
    setOriginalDescription(cardDescriptionProp)
  }, [cardDescriptionProp])

  // Khi có kết quả diễn giải mới, cập nhật nội dung markdown
  useEffect(() => {
    if (paraphraseResult) {
      setCardDescription(paraphraseResult.paraphrased)
    }
  }, [paraphraseResult])

  // Lưu chỉnh sửa, gọi callback truyền từ cha, reset redux
  const updateCardDescription = () => {
    setMarkdownEditMode(false)
    dispatch(clearResult())
    setOriginalDescription(cardDescription)
    handleUpdateCardDescription(cardDescription)
  }

  // Hủy chỉnh sửa, phục hồi nội dung cũ
  const cancelEdit = () => {
    setCardDescription(originalDescription)
    dispatch(clearResult())
    setMarkdownEditMode(false)
  }

  // Gửi yêu cầu diễn giải
  const handleParaphrase = () => {
    if (!cardDescription?.trim()) return
    dispatch(paraphraseText(cardDescription))
  }

  return (
    <Box sx={{ mt: -4 }}>
      {markdownEditMode ? (
        <Box sx={{ mt: 5, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box data-color-mode={mode}>
            <MDEditor
              value={cardDescription}
              onChange={setCardDescription}
              previewOptions={{ rehypePlugins: [[rehypeSanitize]] }}
              height={400}
              preview="edit"
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              onClick={handleParaphrase}
              disabled={loadingParaphrase}
              variant="outlined"
              size="small"
              startIcon={<AutorenewIcon />}
            >
              {loadingParaphrase ? 'Đang diễn giải...' : 'Diễn giải'}
            </Button>
            <Button
              onClick={updateCardDescription}
              variant="contained"
              size="small"
              color="info"
            >
              Save
            </Button>
            <Button
              onClick={cancelEdit}
              variant="outlined"
              size="small"
              color="error"
            >
              Cancel
            </Button>
          </Box>
          {paraphraseError && (
            <Box sx={{ color: 'error.main', mt: 1 }}>
              Lỗi: {paraphraseError}
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            sx={{ alignSelf: 'flex-end' }}
            onClick={() => setMarkdownEditMode(true)}
            variant="contained"
            color="info"
            size="small"
            startIcon={<EditNoteIcon />}
          >
            Edit
          </Button>
          <Box data-color-mode={mode}>
            <MDEditor.Markdown
              source={cardDescription}
              style={{
                whiteSpace: 'pre-wrap',
                padding: cardDescription ? '10px' : '0px',
                border: cardDescription ? '0.5px solid rgba(0, 0, 0, 0.2)' : 'none',
                borderRadius: '8px'
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  )
}

export default CardDescriptionMdEditor
