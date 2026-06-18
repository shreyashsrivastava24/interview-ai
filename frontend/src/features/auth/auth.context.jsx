import { createContext, useState, useEfect } from "react";
import { getMe } from "./services/auth.api";

export const AuthContext = createContext()

// Hydrate user = App start hote hi user ki info (login state, profile, token se data) fetch karke state/store me bhar dena.
// Dehydrate user = User ki state/store ko clear kar dena (logout ya page close ke time).

export const AuthProvider = ({ children }) => {
   const [user, setUser] = useState(null)
   const [loading, setLoading] = useState(true)

   // states return kr dia
   return (
      <AuthContext.Provider value={{ user, setUser, loading, setLoading }}>
         {children}
      </AuthContext.Provider>
   )

}