const mongoose = require("mongoose");

// Ensure MONGODB_URI is set
const DB_URI = process.env.MONGODB_URI;

if (!DB_URI) {
    console.error("❌ MONGODB_URI is not set. Please configure it in Render's environment variables.");
    process.exit(1);
}

mongoose
    .connect(DB_URI) // Removed deprecated options
    .then(() => {
        console.log(`✅ MongoDB connected successfully`);
    })
    .catch((err) => {
        console.error("❌ Failed to connect to MongoDB:", err.message);
        process.exit(1);
    });

// Handle MongoDB disconnections
mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB connection lost. Attempting to reconnect...");
    mongoose.connect(DB_URI);
});

const LoginSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique: true,
        maxlength: 15
    },
    password:{
        type:String,
        required:true,
        minlength: 8
    },
    displayName: {
        type: String,
        maxlength: 15
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other']
    },
    dateOfBirth: {
        type: Date
    },
    profilePic: {
        type: String
    }
})

// Chat message schema
const MessageSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        ref: 'collection1'
    },
    text: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    type: {
        type: String,
        enum: ['user', 'system'],
        default: 'user'
    }
})

// Direct message schema for private messages
const DirectMessageSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true,
        ref: 'collection1'
    },
    recipient: {
        type: String,
        required: true,
        ref: 'collection1'
    },
    text: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    read: {
        type: Boolean,
        default: false
    }
})

// Conversation schema to track message threads between users
const ConversationSchema = new mongoose.Schema({
    participants: {
        type: [String],
        required: true
    },
    lastMessage: {
        type: String
    },
    lastMessageTime: {
        type: Date
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
})

// Friend request schema
const FriendRequestSchema = new mongoose.Schema({
    sender: {
        type: String,
        required: true,
        ref: 'collection1'
    },
    recipient: {
        type: String,
        required: true,
        ref: 'collection1'
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
})

// Friends schema
const FriendSchema = new mongoose.Schema({
    user: {
        type: String,
        required: true,
        ref: 'collection1'
    },
    friend: {
        type: String,
        required: true,
        ref: 'collection1'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const collection = new mongoose.model("collection1", LoginSchema)
const Message = new mongoose.model("Message", MessageSchema)
const DirectMessage = new mongoose.model("DirectMessage", DirectMessageSchema)
const Conversation = new mongoose.model("Conversation", ConversationSchema)
const FriendRequest = new mongoose.model("FriendRequest", FriendRequestSchema)
const Friend = new mongoose.model("Friend", FriendSchema)

module.exports = {
    collection,
    Message,
    DirectMessage,
    Conversation,
    FriendRequest,
    Friend
}
