import axios from "axios";

// to avoid repeititve code we created an instance of axios
const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true
})

// these functions interact with backend apis like login,logout etc
export async function register({ username, email, password }) {

    // withCredentials: true isliye lagaya hai kyunki frontend (localhost:5173)
    // aur backend (localhost:3000) different origins par hain.
    // Isse browser request ke saath cookies bhej sakta hai
    // aur backend se aayi cookies ko save bhi kar sakta hai.

    try {
        // used axios instance to avoid repeitive code
        const response = await api.post("/api/auth/register", {
            username,
            email,
            password,
        })

        return response.data

    } catch (err) {
        console.log(err)
    }

}

export async function login({ email, password }) {
    try {
        const response = await api.post('/api/auth/login', {
            email, password
        })

        return response.data

    } catch (err) {
        console.log(err);
    }
}

export async function logout() {
    try {
        const response = await api.get('/api/auth/logout')
        return response.data

    } catch (err) {
        console.log(err)
    }
}

export async function getMe() {
    try {
        const response = await api.get('/api/auth/get-me')
        return response.data

    } catch (error) {
        console.log(err)
    }
}

// without creating axios instance
// export async function getMe() {
//     try {
//         const response = await axios.get('http://localhost:3000/api/auth/get-me', {
//             withCredentials: true
//         })
//         return response.data

//     } catch (error) {
//         console.log(err)
//     }
// }