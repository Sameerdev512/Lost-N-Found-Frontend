import { useState } from 'react'
import Login from './components/auth/Login'
import Register from './components/auth/Register'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Login/>
      <Register/>
    </>
  )
}

export default App
