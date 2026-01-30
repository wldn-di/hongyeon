import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode> 2회 호출 원인 파악을 위해 잠시 끔
    <AuthProvider>
      <App />
    </AuthProvider>
  // </React.StrictMode>
)
