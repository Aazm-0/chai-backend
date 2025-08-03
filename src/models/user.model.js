import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';

const userSchema = new Schema({
    userName: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        // We studied this in mongodb it creattes a seperate document for all possible values and them matches the values form there so querying becomes faster
        index: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    fullName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String, // we will get ref from cloudinary/Aws
        required: true
    },
    coverImage: {
        type: String,
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    // These last two will be abit complex
    // The password here is being stored as String if db leaks isnt this security issue lets see
    // But if you encrypt it then how will you retrieve the data
    password: {
        type: String,
        required: [true, "You Cant leave the password field empty"]
    },
    refreshToken: {
        type: String
    }
}, { timestamps: true })

// Like middlewares in express mongoose has hooks that attach logic to documents event points in a lifecyle
// .save,.find.aggregate are all the operations before or after these operattions occur you want to attach logic in between
// So you use hooks
// The definiton is like express route operatioons methods
// Use normal functions because arrows dont have this. context which you need to alter data in userSchema
// Async because encryption takes time and next because it is a middleware
userSchema.pre("save", async function (next) {
    // return not requried but for control flow clarity put it in
    if (!this.isModified("password")) return next();
    // Since this middleware is now attached for all save operations it wil hash password on every save
    // so negative check for passing to next if there is no modifications on password field 

    // rounds is second parameter which says how many times we need to run hashing
    this.password = await bcrypt.hash(this.password, 10)
    next()
})
// The schema class has 4 main properties middlewares, instance methods, model methods and virtual
// 1:instance method for checking password comaprison like isModified

userSchema.methods.comparePassword(async function (password) {
    return await bcrypt.compare(password, this.password);
})

// JWt is bearer token anyone who bears it can get access to protected routes 
// Jwt library requries

userSchema.methods.generateAccessToken(function () {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        userName: this.userName,
        fullName: this.fullName
    },
        process.env.ACCESS_TOKEN_SECRET
        ,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        })
})

// This will be used again so keep payload less
userSchema.methods.generateRefreshToken(function () {
    return jwt.sign({
        _id: this._id,
    },
        process.env.REFRESH_TOKEN_SECRET
        ,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        })
})

export const User = mongoose.model("User", userSchema)

/*
 2. Statics (Model Methods)
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email });
};

// Usage:
const user = await User.findByEmail("x@example.com");

3. Middle Wares

4: Virtuals
    These are fields not saved in MongoDB, but computed on the fly.
    Useful for things like fullName, derived values, or URL slugs.

userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Usage: user.fullName


*/

