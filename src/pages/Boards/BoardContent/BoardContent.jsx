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
  defaultDropAnimationSideEffects,
  closestCorners,
  pointerWithin,
  getFirstCollision,
  rectIntersection 
} from '@dnd-kit/core'
import { useEffect, useState, useCallback, useRef } from 'react'
import { cloneDeep, isEmpty } from 'lodash'
import { arrayMove } from '@dnd-kit/sortable'
import Column from './ListColumns/Column/Column'
import Card from './ListColumns/Column/ListCards/Card/Card'
import { generatePlaceholderCard } from '~/utils/formatters'

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
  const [oldColumnWhenDragginCard, setOldColumnWhenDragginCard] = useState(null)
  // Điểm va chạm cuối cùng (xử lý thuật toán phát hiện va chạm)
  const lastOverId = useRef(null)

  useEffect(() => {
    setOderedColumns(mapOrder(board?.columns, board?.columnOrderIds, '_id'))
  }, [board])
  // Tìm một cái Colum theo CardId
  const findColumByCardId = (cardID) => {
    // Đoạn này cần lưu ý, nên dùng c.cards thay vì c.cardOrderIds bởi
    // vì ở bước handleDragOver chúng ta sẽ làm dữ liệu cho cards hoàn chỉnh trước rồi mới tạo ra cardOrderIds mới.
    return orderedColumns.find(column => column.cards.map(card => card._id)?.includes(cardID))
  }

  // Function chung xử lý việc cập nhật lại state trong trường hợp di chuyển Cảd giữa các column khác nhau
  const moveCardBetweenDifferentColumns = (
    overColumn,
    overCardId,
    active,
    over,
    activeColumn,
    activeDraggingCardId,
    activeDraggingCardData
  ) => {
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

      if (nextActiveColumn) {
      // // Xóa card ở cái column active (cũng có thể hiểu là column cũ, cái lúc mà kéo card ra khỏi nó để
      // sang column khác)
        nextActiveColumn.cards = nextActiveColumn.cards.filter(card => card._id !== activeDraggingCardId)

        // Thêm Placeholder Card nếu Column rỗng: Bị kéo hết Card đi, không còn cái nào nữa
        if (isEmpty(nextActiveColumn.cards)) {
          nextActiveColumn.cards = [generatePlaceholderCard(nextActiveColumn)]
        }
        // Cập nhật lại mảng cardOrderIds cho chuẩn dữ liệu
        nextActiveColumn.cardOrderIds = nextActiveColumn.cards.map(card => card._id)
      }
      if (nextOverColumn) {
      // Kiểm tra xem card đang kéo nó có tồn tại ở overColumn chưa, nếu có thì cần xóa nó trước đi
        nextOverColumn.cards = nextOverColumn.cards.filter(card => card._id !== activeDraggingCardId)
        // Đối với trường hợp dragEnd thì phải cập nhật lại chuẩn dữ liệu columnid trong card sau khi kéo card giữa 2 column khác nhau .
        const rebuild_activeDraggingCardData = {
          ...activeDraggingCardData,
          columnId: nextOverColumn._id
        }
        // Tiếp theo là thêm card đang kéo vào overcolumn theo vị trí index mới
        nextOverColumn.cards = nextOverColumn.cards.toSpliced(newCardIndex, 0, rebuild_activeDraggingCardData)

        // Xóa cái Placeholder Card đi nếu nó đang tồn tại
        nextOverColumn.cards = nextOverColumn.cards.filter(card => !card.FE_PlaceholderCard)

        // Cập nhật lại mảng cardOrderIds cho chuẩn dữ liệu
        nextOverColumn.cardOrderIds = nextOverColumn.cards.map(card => card._id)
      }
      return nextColumns
    }
    )
  }
  //-------------------------------//
  //------handleDragStart----------//
  //-------------------------------//
  // Khi bắt đầu kéo 1 phần tử
  const handleDragStart = (event) => {
    setActiveDragItemID(event?.active?.id)
    setActiveDragItemType(event?.active?.data?.current?.columnId ? ACTIVE_DRAG_ITEM_TYPE.CARD : ACTIVE_DRAG_ITEM_TYPE.COLUMN )
    setActiveDragItemData(event?.active?.data?.current)

    // Nếu là kéo card thì mới thực hiện hành động set giá trị oldColumn
    if (event?.active?.data?.current?.columnId) {
      setOldColumnWhenDragginCard(findColumByCardId(event?.active?.id))
    }
  }
  //-------------------------------//
  //-------handleDragOver----------//
  //-------------------------------//
  const handleDragOver = (event) => {
  // Không làm gì thêm nếu đang kéo column
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) return
    // Còn nếu kéo card thì xử lý thêm để có thể kéo thêm card qua lại giữa các column
    const { active, over } = event
    // Cần đảm bảo nếu khôn tồn tại active hoặc over (kéo linh tinh ra ngoài phạm vi container thì return luôn tránh crash trang)
    if (!active || !over) return

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
      moveCardBetweenDifferentColumns(
        overColumn,
        overCardId,
        active,
        over,
        activeColumn,
        activeDraggingCardId,
        activeDraggingCardData
      )
    }
  }
  //-------------------------------//
  //-------handleDragEnd----------//
  //-------------------------------//
  // Khi kết thúc kéo 1 phần tử
  const handleDragEnd = (event) => {
    // console.log('handleDragEnd', event)
    const { active, over } = event
    // Cần đảm bảo nếu khôn tồn tại active hoặc over (kéo linh tinh ra ngoài phạm vi container thì return luôn tránh crash trang)
    if (!active || !over) return

    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) {
      //activeDraggingCardId: Là Card đang được kéo
      const { id: activeDraggingCardId, data: { current: activeDraggingCardData } } = active

      //overCardId: Là Card đang tương tác trên hoặc dưới so với card được kéo ở trên
      const { id: overCardId } = over

      //Tìm 2 cái Columns theo cardID
      const activeColumn = findColumByCardId(activeDraggingCardId)
      const overColumn = findColumByCardId(overCardId)
      // nếu không tồn tại 2 column thì không lam gì cả để tránh crash web
      if (!activeColumn || !overColumn) return

      // Hình động kéo thả card giữa 2 column khác nhau
      // Phải dùng tới activeDragItemData.columnId hoặc oldColumnWhenDragginCard._id ( set vào state từ bước handleDragStart )
      // chứ không phải activeData
      // trong scope handleDragEnd này vì sau khi đi qua onDragOver tới đây là state của card đã bị cập nhật một
      // lần rồi .
      if (oldColumnWhenDragginCard._id !== overColumn._id) {
        moveCardBetweenDifferentColumns(
          overColumn,
          overCardId,
          active,
          over,
          activeColumn,
          activeDraggingCardId,
          activeDraggingCardData
        )
      } else {
        // Kéo thả card trong cùng 1 cái column

        // Lấy từ vị trí cũ (từ thành oldColumnWhenDragginCard )
        const oldCardIndex = oldColumnWhenDragginCard?.cards?.findIndex(c => c._id === activeDragItemID)
        const newCardIndex = overColumn?.cards?.findIndex(c => c._id === overCardId)
        // Dùng arrayMove của thằng dnd-kit để sắp xếp lại mảng Cards ban đầu
        // Code của arrayMove ở đây : dnd-kit/packages/sortable/src/utilities/arrayMove.ts
        const dndOrderedCards = arrayMove(oldColumnWhenDragginCard?.cards, oldCardIndex, newCardIndex)
        setOderedColumns(prevColumns => {
          const nextColumns = cloneDeep(prevColumns)
          // Tìm tới column đang thả
          const targetColumn = nextColumns.find(c => c._id === overColumn._id)

          // Cập nhật lại 2 giá trị mới là card và cardOderIds trong cái targetColumn
          targetColumn.cards = dndOrderedCards
          targetColumn.cardOrderIds = dndOrderedCards.map(card => card._id)
          return nextColumns
        })
      }
    }
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
    // Nếu vị trí sau khi kéo thả khác với vị trí ban đầu
      if (active.id !== over.id) {
        // lấy vị trí cũ từ thằng active
        const oldColumnIndex = orderedColumns.findIndex(c => c._id === active.id )
        const newColumnIndex = orderedColumns.findIndex(c => c._id === over.id )

        // Dùng arrayMove của thằng dnd-kit để sắp xếp lại mảng columns ban đầu
        // Code của arrayMove ở đây : dnd-kit/packages/sortable/src/utilities/arrayMove.ts
        const dndOrderedColumns = arrayMove(orderedColumns, oldColumnIndex, newColumnIndex)
        // const dndOrderedColumnsIds = dndOrderedColumns.map(c => c._id) sau này sử dụng
        // Cập nhật lại state column ban đầu sau khi kéo thả
        setOderedColumns(dndOrderedColumns)
      }
    }
    // Những dữ liệu sau khi kéo thả này luôn phải đưa về giá trị null ban đầu
    setActiveDragItemID(null)
    setActiveDragItemType(null)
    setActiveDragItemData(null)
    setOldColumnWhenDragginCard(null)
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
  // Chúng ta sẽ custom lại chiến lược / thuật toán phát hiện và chạm tối ưu cho việc kéo thả card giữa nhiều columns

  // args =  arguments = Các Đối số , tham số
  const collisionDetectionStrategy = useCallback((args) => {
    // Trường hợp kéo column thì dùng thuật toán closestConers là chuẩn nhất
    if (activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) {
      return rectIntersection({ ...args })

    }
    // Tìm các điểm giao nhau, va chạm, trả về một mảng các va chạm - intersection với con trỏ
    const pointerInterSections = pointerWithin(args)

    // Video 37.1 : Nếu pointerIntersections là mảng rỗng, return luôn không làm gì hết.
    // Fix triệt để cái bug flickering của thư viện Dnd-kit trong trường hợp sau :
    // - Kéo một cái card có image cover lớn và kéo lên phía trên cùng ra khỏi khu vực kéo thả
    if (!pointerInterSections?.length) return

    // // Thuật toán phát hiện va chạm và sẽ trả về một mảng các va chạm tại đây ( không cần bước này nữa - video 37.1)
    // const interSections = !!pointerInterSections?.length
    //   ? pointerInterSections
    //   : rectIntersection(args)

    // Tìm overId đầu tiên trong đám pointerInterSections ở trên
    let overId = getFirstCollision(pointerInterSections, 'id')
    if (overId) {
      // Video 37: Đoạn này để fix cái vụ flickering nhé.
      // Nếu cái over nó là column thì sẽ tìm tới cái cardId gần nhất bên trong khu vực
      // va chạm đó dựa vào thuật toán phát hiện và chạm closestCenter hoặc closestCorners đều được.
      // Tuy nhiên ở đây dùng closestCenter mình thấy mượt mà hơn.
      const checkColumn = orderedColumns.find(column => column.id === overId)
      if (checkColumn) {
        overId = closestCorners({
          ...args,
          droppableContainers: args.droppableContainers
            .filter(container => {
              return (container.id !== overId) && (checkColumn?.cardOrderIds?.includes(container.id))
            })
        })[0]?.id
      }
      lastOverId.current = overId
      return [{ id: overId }]
    }

    return lastOverId.current ? [{ id: lastOverId.current }] : []
  }, [activeDragItemType, orderedColumns])


  return (
    <DndContext
      sensors={mySensors}
      // collisionDetection={closestCorners}
      // Nếu chỉ dùng closestConers sẽ có bug flickering + sai lệch dữ liệu
      // Tự custom nâng cao thuật toán phát hiện va chạm
      collisionDetection={collisionDetectionStrategy}
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
          {!activeDragItemType && null}
          {(activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.COLUMN) && <Column column={activeDragItemData}/>}
          {(activeDragItemType === ACTIVE_DRAG_ITEM_TYPE.CARD) && <Card card={activeDragItemData}/>}
        </DragOverlay>
      </Box>
    </DndContext >
  )
}

export default BoardContent
