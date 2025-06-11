import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import AppBar from '~/components/AppBar/AppBar'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import SecurityIcon from '@mui/icons-material/Security'
import PersonIcon from '@mui/icons-material/Person'
import { Link, useLocation } from 'react-router-dom'
import AccountTab from './AccountTab'
import SecurityTab from './SecurityTab'
import RatingTab from './RatingTab'
import GradeIcon from '@mui/icons-material/Grade'
import { 
  fetchAllMyEvaluationResultsThunk,
  selectAllMyEvaluationResults,
  selectAllResultsLoading,
  selectAllResultsError,
  selectEvaluationStatistics,
  selectTopSkills
} from '~/redux/activeEvaluationSubmission/myEvaluationResultsSlice'
import { selectCurrentUser } from '~/redux/User/userSlice'

// Khai báo đống tabs ra biến const để dùng lại cho gọn
const TABS = {
  ACCOUNT: 'account',
  SECURITY: 'security',
  RATING: 'rating'
}

function Settings() {
  const location = useLocation()
  const dispatch = useDispatch()
  
  // Redux selectors
  const currentUser = useSelector(selectCurrentUser)
  const allEvaluationResults = useSelector(selectAllMyEvaluationResults)
  const evaluationLoading = useSelector(selectAllResultsLoading)
  const evaluationError = useSelector(selectAllResultsError)
  const evaluationStats = useSelector(selectEvaluationStatistics)
  const topSkills = useSelector(selectTopSkills(10)) // Lấy top 10 skills
  
  // Function đơn giản có nhiệm vụ lấy ra cái tab mặc định dựa theo url.
  const getDefaultTab = () => {
    if (location.pathname.includes(TABS.SECURITY)) {return TABS.SECURITY}
    else if (location.pathname.includes(TABS.RATING)) {return TABS.RATING}
    return TABS.ACCOUNT
  }
  
  // State lưu trữ giá trị tab nào đang active
  const [activeTab, setActiveTab] = useState(getDefaultTab())

  // Fetch evaluation data when component mounts
  useEffect(() => {
    if (currentUser?._id && activeTab === TABS.RATING) {
      console.log('🔄 Fetching all evaluation results for Settings page')
      dispatch(fetchAllMyEvaluationResultsThunk(currentUser._id))
    }
  }, [dispatch, currentUser?._id, activeTab])

  // https://mui.com/material-ui/react-tabs
  const handleChangeTab = (event, selectedTab) => { 
    setActiveTab(selectedTab) 
  }

  // Prepare evaluation data to pass to RatingTab
  const evaluationData = {
    results: allEvaluationResults,
    loading: evaluationLoading,
    error: evaluationError,
    statistics: evaluationStats,
    topSkills: topSkills,
    // Helper methods
    refreshData: () => {
      if (currentUser?._id) {
        dispatch(fetchAllMyEvaluationResultsThunk(currentUser._id))
      }
    },
    // Get specific board data
    getBoardData: (boardId) => {
      return allEvaluationResults.find(boardData => 
        boardData.board?._id === boardId
      ) || null
    },
    // Get evaluations for specific board
    getBoardEvaluations: (boardId) => {
      const boardData = allEvaluationResults.find(boardData => 
        boardData.board?._id === boardId
      )
      return boardData?.evaluations || []
    },
    // Get criteria for specific board
    getBoardCriteria: (boardId) => {
      const boardData = allEvaluationResults.find(boardData => 
        boardData.board?._id === boardId
      )
      return boardData?.criteria || []
    }
  }

  return (
    <Container disableGutters maxWidth={false}>
      <AppBar />
      <TabContext value={activeTab}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChangeTab}>
            <Tab
              label="Account"
              value={TABS.ACCOUNT}
              icon={<PersonIcon />}
              iconPosition="start"
              component={Link}
              to="/settings/account" />
            <Tab
              label="Security"
              value={TABS.SECURITY}
              icon={<SecurityIcon />}
              iconPosition="start"
              component={Link}
              to="/settings/security" />
            <Tab
              label="Rating"
              value={TABS.RATING}
              icon={<GradeIcon />}
              iconPosition="start"
              component={Link}
              to="/settings/rating" />
          </TabList>
        </Box>
        <TabPanel value={TABS.ACCOUNT}>
          <AccountTab />
        </TabPanel>
        <TabPanel value={TABS.SECURITY}>
          <SecurityTab />
        </TabPanel>
        <TabPanel value={TABS.RATING}>
          <RatingTab evaluationData={evaluationData} />
        </TabPanel>
      </TabContext>
    </Container>
  )
}

export default Settings