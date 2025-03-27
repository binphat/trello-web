import Box from '@mui/material/Box'
import ListColumns from './ListColumns/ListColumns'
import { mapOrder } from '~/utils/sorts'
import {
  DndContext,
  // PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core'
import { useEffect, useState } from 'react'
import { cloneDeep } from 'lodash'
import { arrayMove } from '@dnd-kit/sortable'
import Column from './ListColumns/Column/Column'
import Card from './ListColumns/Column/ListCards/Card/Card'

const ACTIVE_DRAG_ITEM_TYPE = {
  COLUMN: 'ACTIVE_DRAG_ITEM_TYPE_COLUMN',
  CARD: 'ACTIVE_DRAG_ITEM_TYPE_CARD'
}

function BoardContent({ board }) {
  //https://docs.dndkit.com/api-documentation/sensors
  // const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 10 } }) // Yêu cầu chuột kéo 10px mới gọi event
  const mouseSensor = useSensor(MouseSensor, { activationConstraint: { distance: 10 } }) // Yêu cầu chuột kéo 10px mới gọi event
  // Nhấn giữ 250ms và dung sai của cảm ứng (dễ hiểu là di chuyển/chênh lệch 500px) thì mới kích hoạt event
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 500 } })

  // Ưu tiên sử dụng kết hợp 2 loại sensors là mouse và touch để có trải nghiệm trên mobile tốt nhất, không bị bug.
  // const mySensors = useSensors(pointerSensor)
  const mySensors = useSensors(mouseSensor, touchSensor)
  const [orderedColumns, setOderedColumns] = useState([])

  // Cùng một thời điểm chỉ có một phần tử đang được kéo (column hoặc card)
  const [activeDragItemID, setActiveDragItemID] = useState(null)
  const [activeDragItemType, setActiveDragItemType] = useState(null)
  const [activeDragItemData, setActiveDragItemData] = useState(null)

  useEffect(() => {
    setOderedColumns(mapOrder(board?.columns, board?.columnOrderIds, '_id'))
  }, [board])
  // Tìm một cái Colum theo CardId
  const findColumByCardId = (cardID) => {
    // Đoạn này cần lưu ý, nên dùng c.cards thay vì c.cardOrderIds bởi
    // vì ở bước handleDragOver chúng ta sẽ làm dữ liệu cho cards hoàn chỉnh trước rồi mới tạo ra cardOrderIds mới.
    return orderedColumns.find(column => column.cards.map(card => card._id)?.includes(cardID))
  }
  // Khi bắt đầu kéo 1 phần tử
  const handleDragStart = (event) => {
    // console.log('handleDragStart', event)
    setActiveDragItemID(event?.active?.id)
    setActiveDragItemType(event?.active?.data?.current?.columnId ? ACTIVE_DRAG_ITEM_TYPE.CARD : ACTIVE_DRAG_ITEM_TYPE.COLUMN )
    setActiveDragItemData(event?.active?.data?.current)
  }
  const handleDragOver = (event) => {
  // Không làm gì thêm nếu đang kéo column
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) return
    // Còn nếu kéo card thì xử lý thêm để có thể kéo thêm card qua lại giữa các column
    const { active, over } = event
    // Cần đảm bảo nếu khôn tồn tại active hoặc over (kéo linh tinh ra ngoài phạm vi container thì return luôn tránh crash trang)
    if (!active || !over) return
    // console.log('handleDragOver', event)

    //activeDraggingCardId: Là Card đang được kéo
    const { id: activeDraggingCardId, data: { current: activeDraggingCardData } } = active

    //overCardId: Là Card đang tương tác trên hoặc dưới so với card được kéo ở trên
    const { id: overCardId } = over

    //Tìm 2 cái Columns theo cardID
    const activeColumn = findColumByCardId(activeDraggingCardId)
    const overColumn = findColumByCardId(overCardId)
    // nếu không tồn tại 2 column thì không lam gì cả để tránh crash web
    if (!activeColumn || !overColumn) return
    // Xử lý logic ở đây chỉ khi kéo card qua 2 column khác nhau, còn nếu kéo card trong chính column ban đầu
    // của nó thì không làm gì
    // Vì đây đang là đoạn xử lý lực kéo (handleDragover), còn xử lý lúc kéo xong xuôi thì nó lại là vấn đề
    // khác ở (handleDragEnd)
    if (activeColumn._id !== overColumn._id) {
      setOderedColumns(prevColumns => {
        // Tìm vị trí (index) của cái OverCard trong column đích (nơi card sắp được thả)
        const overCardIndex = overColumn?.cards.findIndex(card => card._id === overCardId)
        // Logic tính toán " cardIndex mới " ( trên hoặc dưới của overCard ) lấy chuẩn ra từ code của thư viện
        let newCardIndex
        const isBelowOverItem = active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height
        const modifier = isBelowOverItem ? 1 : 0
        newCardIndex = overCardIndex >= 0 ? overCardIndex + modifier : overColumn?.card?.length + 1
        // Clone mảng OrderedColumnsState ra một cái mới để xử lý data rồi return - cập nhật tại  You have uncommitted changes
        // OrderedColumnsState mới
        const nextColumns = cloneDeep(prevColumns)
        const nextActiveColumn = nextColumns.find(column => column._id === activeColumn._id )
        const nextOverColumn = nextColumns.find(column => column._id === overColumn._id )
        // Column cũ
        if (nextActiveColumn) {
          // // Xóa card ở cái coluna active (cũng có thể hiểu là column cũ, cái lúc mà kéo card ra khỏi nó để
          // sang column khác)
          nextActiveColumn.cards = nextActiveColumn.cards.filter(card => card._id !== activeDraggingCardId)
          // Cập nhật lại mảng cardOrderIds cho chuẩn dữ liệu
          nextActiveColumn.cardOrderIds = nextActiveColumn.cards.map(card => card._id)
        }
        // Column mới
        if (nextOverColumn) {
          // Kiểm tra xem card đang kéo nó có tồn tại ở overColumn chưa, nếu có thì cần xóa nó trước đi
          nextOverColumn.cards = nextOverColumn.cards.filter(card => card._id !== activeDraggingCardId)

          // Tiếp theo là thêm card đang kéo vào overcolumn theo vị trí index mới
          nextOverColumn.cards = nextOverColumn.cards.toSpliced(newCardIndex, 0, activeDraggingCardData)

          // Cập nhật lại mảng cardOrderIds cho chuẩn dữ liệu
          nextOverColumn.cardOrderIds = nextOverColumn.cards.map(card => card._id)
        }
        return nextColumns
      })
    }
  }
  // Khi kết thúc kéo 1 phần tử
  const handleDragEnd = (event) => {
    // console.log('handleDragEnd', event)

    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) {
      console.log('Hanh dong keo tha Card - Tam thoi khong lam gi ca!')
      return
    }
    const { active, over } = event

    // Cần đảm bảo nếu khôn tồn tại active hoặc over (kéo linh tinh ra ngoài phạm vi container thì return luôn tránh crash trang)
    if (!active || !over) return
    // Nếu vị trí sau khi kéo thả khác với vị trí ban đầu
    if (active.id !== over.id) {
      // lấy vị trí cũ từ thằng active
      const oldIndex = orderedColumns.findIndex(c => c._id === active.id )
      const newIndex = orderedColumns.findIndex(c => c._id === over.id )

      // Dùng arrayMove của thằng dnd-kit để sắp xếp lại mảng columns ban đầu
      // Code của arrayMove ở đây : dnd-kit/packages/sortable/src/utilities/arrayMove.ts
      const dndOrderedColumns = arrayMove(orderedColumns, oldIndex, newIndex)
      // const dndOrderedColumnsIds = dndOrderedColumns.map(c => c._id) sau này sử dụng
      // Cập nhật lại state column ban đầu sau khi kéo thả
      setOderedColumns(dndOrderedColumns)
    }
    setActiveDragItemID(null)
    setActiveDragItemType(null)
    setActiveDragItemData(null)
  }
  // Animation khi thả (drop) phần tử - Test bằng cách kéo xong thả trực tiếp và nhìn phần giữ chỗ overlay
  const customDropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5'
        }
      }
    })
  }
  return (
    <DndContext
      sensors={mySensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}>
      <Box sx={{
        bgcolor: (theme) => (
          theme.palette.mode === 'dark' ? '#34495e' : '#1976d2'
        ),
        borderBottom: '1px solid white',
        width: '100%',
        height: (theme) => theme.trello.boardContentHeight,
        p : '10px 0'
      }}>
        <ListColumns columns={orderedColumns} />
        <DragOverlay dropAnimation={customDropAnimation}>
          {(!activeDragItemType ) && null}
          {(activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) && <Column column={activeDragItemData}/>}
          {(activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) && <Card card={activeDragItemData}/>}
        </DragOverlay>
      </Box>
    </DndContext >
  )
}

export default BoardContent
