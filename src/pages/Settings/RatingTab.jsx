
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Rating,
  Divider,
  Avatar
} from '@mui/material'
import { Work as ProjectIcon, Groups as TeamIcon } from '@mui/icons-material'

// Dữ liệu mẫu
const projectHistory = [
  {
    id: 1,
    projectName: 'Website E-commerce',
    teamName: 'Team Frontend',
    period: '01/2023 - 04/2023',
    skills: {
      'Frontend': 4,
      'React': 5,
      'UI/UX': 3,
      'Giao tiếp': 4
    },
    description: 'Xây dựng giao diện người dùng và tích hợp API'
  },
  {
    id: 2,
    projectName: 'Hệ thống quản lý',
    teamName: 'Team Fullstack',
    period: '05/2023 - 08/2023',
    skills: {
      'Frontend': 5,
      'Backend': 4,
      'Database': 3,
      'Quản lý': 4
    },
    description: 'Phát triển cả frontend và backend hệ thống'
  },
  {
    id: 3,
    projectName: 'Mobile App',
    teamName: 'Team Mobile',
    period: '09/2023 - Hiện tại',
    skills: {
      'React Native': 5,
      'API Integration': 4,
      'Performance': 4,
      'Mentoring': 3
    },
    description: 'Xây dựng ứng dụng di động đa nền tảng'
  }
]

const PersonalSkillHistory = () => {
  // Tổng hợp tất cả các kỹ năng từ tất cả dự án
  const allSkills = Array.from(
    new Set(
      projectHistory.flatMap(project => Object.keys(project.skills))
    )
  ).sort()

  // Tính điểm trung bình cho từng kỹ năng
  const calculateAverage = (skill) => {
    const projectsWithSkill = projectHistory.filter(project => project.skills[skill])
    if (projectsWithSkill.length === 0) return 0

    const sum = projectsWithSkill.reduce(
      (total, project) => total + project.skills[skill], 0
    )
    return (sum / projectsWithSkill.length).toFixed(1)
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Lịch Sử Phát Triển Kỹ Năng
      </Typography>

      {/* Phần tổng quan kỹ năng */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Tổng quan kỹ năng
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {allSkills.map((skill, index) => (
            <Box key={index} sx={{ width: 200 }}>
              <Typography>{skill}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Rating
                  value={parseFloat(calculateAverage(skill))}
                  precision={0.1}
                  readOnly
                  sx={{ mr: 1 }}
                />
                <Typography>({calculateAverage(skill)})</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Chi tiết từng dự án */}
      <Typography variant="h5" gutterBottom>
        Chi tiết theo dự án
      </Typography>

      {projectHistory.map((project) => (
        <Paper key={project.id} elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <ProjectIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">{project.projectName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {project.period}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TeamIcon color="action" sx={{ mr: 1 }} />
            <Typography variant="body1">{project.teamName}</Typography>
          </Box>

          <Typography paragraph>{project.description}</Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" gutterBottom>
            Đánh giá kỹ năng trong dự án:
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {Object.entries(project.skills).map(([skill, rating]) => (
              <Box key={skill} sx={{ width: 180 }}>
                <Typography variant="body2">{skill}</Typography>
                <Rating value={rating} max={5} readOnly />
              </Box>
            ))}
          </Box>
        </Paper>
      ))}

      {/* Bảng tổng hợp */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Bảng Tổng Hợp Kỹ Năng
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Dự án</TableCell>
              {allSkills.map((skill, index) => (
                <TableCell key={index} align="center">{skill}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {projectHistory.map((project) => (
              <TableRow key={project.id}>
                <TableCell>{project.projectName}</TableCell>
                {allSkills.map((skill, index) => (
                  <TableCell key={index} align="center">
                    {project.skills[skill] || '-'}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell><strong>Trung bình</strong></TableCell>
              {allSkills.map((skill, index) => (
                <TableCell key={index} align="center">
                  <strong>{calculateAverage(skill)}</strong>
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default PersonalSkillHistory