const multer = require("multer")


const upload = multer({
    // file temporarily store kni isliye multer m/r storage
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 3 * 1024 * 1024 // 3MB
    }
})


module.exports = upload