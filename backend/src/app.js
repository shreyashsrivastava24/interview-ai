const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

//allow krta hai ki hum json data ko request body me bhej sakte hai
app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: "http://localhost:5173",
    // bcoz cookies se data handle krna hai
    credentials: true
}))

// require all the routes here
const authRouter = require("./routes/auth.routes")

// using all the routes here
app.use("/api/auth",authRouter)


module.exports = app