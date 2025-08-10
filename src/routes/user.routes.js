import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJwt } from "../middleware/auth.middleware.js";


// This is all done to segregate all the logic

const router = Router()

// here you can now define global middle ware which will be hit when /users is written

// Then you can also make route handlers here and give it controller and even its own more middlewares one or multiple
// writing route handelrs like this make chaining easier and also makes readability very good for restful api
router.route("/register").post(
    // This is creating a middleware in between the register user to allow file handling
    // .fields creeatts a specific middleware which can process  multiple files 
    // The frontend should use the avatar name
    // This middleware will allow you to process req to add req.files
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser)

// Securred routes
router.route("/logout").post(verifyJwt,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

export default router