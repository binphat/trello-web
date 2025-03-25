import Box from '@mui/material/Box'
import Column from './Column/Column'
import Button from '@mui/material/Button'
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'

function ListColumns({ columns }) {
/**
 * Thằng SortableContext yêu cầu items là một mảng dạng ['id-1', 'id-2'] chứ không phải [{id: 'id-1'}, {id: 'id-2'}]
 * Nếu không dùng thì vẫn kéo thả được nhưng không có animation
 * https://github.com/clauderic/dnd-kit/issues/183#issuecomment-812569512
 */

  return (
    <div>
      <SortableContext items={columns?.map(c => c._id )} strategy={horizontalListSortingStrategy}>
        <Box sx={{
          bgcolor: 'inherit',
          width: '100%',
          height: '100%',
          display: 'flex',
          overflowX: 'auto',
          overflowY: 'hidden',
          '&::-webkit-scrollbar-track': {
            m: 2
          }
        }}>
          {/* Column 1*/}
          {columns?.map(column => (<Column key={column._id} column={column}/>))}

          {/* Add New Column */}
          <Box sx={{
            minWidth: '200px',
            maxWidth: '200px',
            mx: 2,
            borderRadius: '6px',
            height: 'fit-content',
            bgcolor: '#ffffff3d'
          }}>
            <Button
              startIcon={<PlaylistAddIcon />}
              sx={{
                color: 'white',
                width: '100%',
                justifyContent: 'flex-start',
                pl: 2.5,
                py: 1
              }}
            >Add New Column
            </Button>
          </Box>
        </Box>
      </SortableContext>
    </div>
  )
}

export default ListColumns
