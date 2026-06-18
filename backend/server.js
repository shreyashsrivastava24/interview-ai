//iss method se hm jo v variables .env file me store krte h unko access kr skte h pure express server me
require("dotenv").config()
const app = require("./src/app")
const connectToDB = require("./src/config/database")

//database se connect krne ke liye
connectToDB()

app.listen(3000,()=>{
    console.log("Server is running on port 3000")
})