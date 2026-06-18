const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

async function authUser(req, res, next) {

    const token = req.cookies.token

    if (!token) {
        return res.status(401).json({
            message: "Token not provided!"
        })
    }

    const isTokenBlacklisted = await tokenBlacklistModel.findOne({
        token
    })

    if(isTokenBlacklisted) {
        return res.status(401).json({
            message: "token is invalid"
        })
    }

    try {
        //if token shi hai to data mil jata
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        // agr data mil jata hai to hm req.user me data set kr dete hain
        // req k andr hm nayi property create kr rhe user
        req.user = decoded

        next()
    } catch (err) {

        return res.status(401).json({
            message: "Invalid Token!"
        })
    }
}

module.exports = { authUser }
