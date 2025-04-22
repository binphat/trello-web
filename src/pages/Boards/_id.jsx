import { useEffect, useState } from 'react'
import Container from '@mui/material/Container'
import AppBar from '~/components/AppBar/AppBar'
import BoardBar from './BoardBar/BoardBar'
import BoardContent from './BoardContent/BoardContent'
// import { mockData } from '~/apis/mock-data'
import { fetchBoardDetailsAPI,
  createNewColumnAPI,
  createNewCardAPI,
  updateBoardDetailsAPI,
  updateColumnDetailsAPI,
  moveCardToDifferentColumnAPI
} from '~/apis'
import { generatePlaceholderCard } from '~/utils/formatters'
import { isEmpty } from 'lodash'
import { mapOrder } from '~/utils/sorts'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'


function Board() {
  const [board, setBoard] = useState(null)

  useEffect(() => {
    const boardId = '6800a4e43d2e90f5dd5bd70c'
    // Call API
    fetchBoardDetailsAPI(boardId).then(board => {
      // Sắp xếp thứ tự các column ở đây trước khi đưa dữ liệu xuống bên dưới các component con
      board.columns = mapOrder(board.columns, board.columnOrderIds, '_id')
      board.columns.forEach(column => {
      // Khi F5 trang web, cần xử lý vấn đề kéo thả vào một column rỗng (37.2)
        if (isEmpty(column.cards)) {
          column.cards = [generatePlaceholderCard(column)]
          column.cardOrderIds = [generatePlaceholderCard(column)._id]
        } else {
          // Sắp xếp thứ tự cards ở đây luôn trước khi đưa dữ liệu xuống dưới các component con
          column.cards = mapOrder(column.cards, column.cardOrderIds, '_id')
        }
      })
      console.log('full board:', board)
      setBoard(board)
    })
  }, [])
  // Function này có nhiệm vụ gọi API tạo mới column và làm lại dữ liệu State Board
  const createNewColumn = async (newColumnData) => {
    const createdColumn = await createNewColumnAPI({
      ...newColumnData,
      boardId: board._id
    })

    createdColumn.cards = [generatePlaceholderCard(createdColumn)]
    createdColumn.cardOrderIds = [generatePlaceholderCard(createdColumn)._id]

    // Cập nhật state board
    // Phía Front-end chúng ta phải tự làm đúng lại state data board (thay vì phải gọi lại api
    // fetchBoardDetailsAPI)
    // Lưu ý: cách làm này phụ thuộc vào tùy lựa chọn và đặc thù dự án, có nơi thì BE sẽ hỗ trợ trả về luôn
    // toàn bộ Board dù đây có là api tạo Column hay Card đi chăng nữa. => Lúc này FE sẽ nhàn hơn.
    const newBoard = { ...board }
    newBoard.columns.push(createdColumn)
    newBoard.columnOrderIds.push(createdColumn._id)
    setBoard(newBoard)

  }
  // Function này có nhiệm vụ gọi API tạo mới card và làm lại dữ liệu State Board
  const createNewCard = async (newCardData) => {
    const createdCard = await createNewCardAPI({
      ...newCardData,
      boardId: board._id
    })

    // Cập nhật state column
    // Phía Front-end chúng ta phải tự làm đúng lại state data board (thay vì phải gọi lại api
    // fetchBoardDetailsAPI)
    // Lưu ý: cách làm này phụ thuộc vào tùy lựa chọn và đặc thù dự án, có nơi thì BE sẽ hỗ trợ trả về luôn
    // toàn bộ Board dù đây có là api tạo Column hay Card đi chăng nữa. => Lúc này FE sẽ nhàn hơn.
    const newBoard = { ...board }
    const columnToUpdate = newBoard.columns.find(column => column._id === createdCard.columnId)
    if (columnToUpdate) {
      columnToUpdate.cards.push(createdCard)
      columnToUpdate.cardOrderIds.push(createdCard._id)
      setBoard(newBoard)
    }
  }
  // Function này có nhiệm vụ gọi API tạo mới card và xử lý khi kéo thả column xong xuôi
  const moveColumns = (dndOrderedColumns) => {
    const dndOrderedColumnsIds = dndOrderedColumns.map(c => c._id)
    // Cập nhật lại cho chuẩn dữ liệu state Board
    const newBoard = { ...board }
    newBoard.columns = dndOrderedColumns
    newBoard.columnOrderIds = dndOrderedColumnsIds
    setBoard(newBoard)

    // Gọi API update Board
    updateBoardDetailsAPI(newBoard._id, { columnOrderIds: newBoard.columnOrderIds })
  }
  /**
   * Khi di chuyển card trong cùng Column:
   * Chỉ cần gọi API để cập nhật mảng cardOrderIds của Column chứa nó (không cần thay đổi vị trí của nó trong mảng)
   */
  const moveCardInTheSameColumn = (dndOrderedCards, dndOrderedCardIds, columnId) => {
    // Cập nhật lại cho chuẩn dữ liệu state Board
    const newBoard ={ ...board }
    const columnToUpdate = newBoard.columns.find(column => column._id === columnId)
    if (columnToUpdate) {
      columnToUpdate.cards = dndOrderedCards
      columnToUpdate.cardOrderIds = dndOrderedCardIds
    }
    setBoard(newBoard)
    // Gọi API update Column
    updateColumnDetailsAPI(columnId, { cardOrderIds: dndOrderedCardIds })
  }
  /**
    * Khi di chuyển card sang Column khác:
    * B1: Cập nhật mảng cardOrderIds của Column ban đầu chứa nó (Hiểu bản chất là xóa cái _id của Card ra khỏi mảng)
    * B2: Cập nhật mảng cardOrderIds của Column tiếp theo (Hiểu bản chất là thêm _id của Card vào mảng)
    * B3: Cập nhật lại trường columnId của cái Card đã kéo
    * ==> Làm một API support riêng.
    */
  const moveCardToDifferentColumn = (currentCardId, prevColumnId, nextColumnId, dndOrderedColumns) => {
    // Cập nhật lại cho chuẩn dữ liệu state Board
    const dndOrderedColumnsIds = dndOrderedColumns.map(c => c._id)
    const newBoard = { ...board }
    newBoard.columns = dndOrderedColumns
    newBoard.columnOrderIds = dndOrderedColumnsIds
    setBoard(newBoard)

    // Gọi API xử lý phía Backend
    moveCardToDifferentColumnAPI({
      currentCardId,
      prevColumnId,
      prevCardOrderIds: dndOrderedColumns.find(c => c._id === prevColumnId)?.cardOrderIds,
      nextColumnId,
      nextCardOrderIds: dndOrderedColumns.find(c => c._id === nextColumnId)?.cardOrderIds
    })

  }

  if (!board) { 
    return (
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        width: '100vw',
        height: '100vh'
      }}>
        <CircularProgress />
        <Typography>Loading Board....</Typography>
      </Box>
    )
  }
  return (
    <Container disableGutters maxWidth={false} sx={{ height: '100vh' }}>
      <AppBar />
      <BoardBar board={board}/>
      <BoardContent
        board={board}
        createNewColumn={createNewColumn}
        createNewCard={createNewCard}
        moveColumns={moveColumns}
        moveCardInTheSameColumn={moveCardInTheSameColumn}
        moveCardToDifferentColumn={moveCardToDifferentColumn}
      />
    </Container>
  )
}
export default Board
