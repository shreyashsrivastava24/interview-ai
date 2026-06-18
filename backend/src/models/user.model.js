// hmara user kaisa dikhega iska schema
const mongooese = require('mongoose');

const userSchema = new mongooese.Schema({
    username:{
        type:String,
        unique:[true,"Username already exists"],
        required:true
    },
    email:{
        type:String,
        unique:[true,"Account already exists with this email address"],
        required:true
    },
    password:{
        type:String,
        required:true
    }
});

//user ka data "users" collection me store hoga
const userModel = mongooese.model("users",userSchema)

module.exports = userModel