const mongoose = require("mongoose")

// Use either local MongoDB or MongoDB Atlas
const DB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/registration"

mongoose.connect(DB_URI)
.then(()=>{
    console.log("MongoDB connected successfully");
})
.catch((err)=>{
    console.log("Failed to connect to MongoDB");
    console.error(err);
})

const LoginSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    }
})


const collection = new mongoose.model("collection1",LoginSchema)

module.exports = collection