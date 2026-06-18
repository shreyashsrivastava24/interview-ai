import { RouterProvider } from "react-router-dom"
import { router } from "./app.routes.jsx"
import { AuthProvider } from "./features/auth/auth.context.jsx"

function App() {
  // auth provider k andr pura application wrap kr diya taki puri appn me user,setuser,loading,setloading ka access mil jayega
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

export default App
