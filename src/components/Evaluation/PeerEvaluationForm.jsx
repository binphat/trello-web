import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Grid
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchEvaluationCriteriaAPI } from '~/redux/activeEvaluation/activeEvaluationSlice'
import { selectCurrentUser } from '~/redux/auth/authSlice'

function PeerEvaluationForm({ open, onClose, board }) {
  const dispatch = useDispatch()
  const currentUser = useSelector(selectCurrentUser)

  const [criteriaList, setCriteriaList] = useState([])
  const [scores, setScores] = useState({}) // { userId: { criterionTitle: score } }

  useEffect(() => {
    if (open && board?._id) {
      dispatch(fetchEvaluationCriteriaAPI(board._id)).then((res) => {
        if (res.payload) {
          setCriteriaList(res.payload)
        }
      })
    }
  }, [open, board, dispatch])

  const handleScoreChange = (userId, criterion, value) => {
    setScores((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [criterion]: value
      }
    }))
  }

  const handleSubmit = () => {
    console.log('Submitted scores:', scores)
    // TODO: Gửi dữ liệu scores lên server tại đây nếu cần
    onClose()
  }

  const evaluableMembers = board?.members?.filter(m => m._id !== currentUser._id) || []

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Đánh giá thành viên</DialogTitle>
      <DialogContent dividers>
        {evaluableMembers.map((member) => (
          <Box key={member._id} mb={4}>
            <Typography variant="h6" fontWeight="bold">{member.fullName}</Typography>
            <Grid container spacing={2} mt={1}>
              {criteriaList.map((criterion, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <TextField
                    label={criterion.title}
                    type="number"
                    fullWidth
                    inputProps={{ min: 0, max: 10 }}
                    value={scores[member._id]?.[criterion.title] || ''}
                    onChange={(e) =>
                      handleScoreChange(member._id, criterion.title, e.target.value)
                    }
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Hủy</Button>
        <Button variant="contained" onClick={handleSubmit}>Gửi đánh giá</Button>
      </DialogActions>
    </Dialog>
  )
}

export default PeerEvaluationForm
