import ReactDOM from 'react-dom/client'
import App from '~/App.jsx'
import CssBaseline from '@mui/material/CssBaseline'
import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles'
import theme from '~/theme'

// Cấu hình MUI Dialog
import { ConfirmProvider } from 'material-ui-confirm'

// Cấu hình react-toastify
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <CssVarsProvider theme={theme}>
      <ConfirmProvider defaultOptions={{
        allowClose: false,
        dialogProps: { maxWidth: 'xs' },
        buttonOrder: ['confirm', 'cancel'],
        cancellationButtonProps: {
          color: 'inherit'
        },
        confirmationButtonProps: {
          color: 'secondary',
          variant: 'outlined'
        }
      }}>
        <CssBaseline />
        <App />
        <ToastContainer position='top-center' theme='colored' />
      </ConfirmProvider>
    </CssVarsProvider>
  </>
)
