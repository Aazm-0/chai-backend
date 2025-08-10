import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/aynchandler.js";
import jwt from "jsonwebtoken";

// Benefit of making this middleware any prottected routes now will properly check for jwt authentication

export const verifyJwt = asyncHandler( async (req,res,next) => {
    try {
        // we also may take it from header because mobile dont have http only cookies some other logic  
        // Why we only use accessToken not refresh token
        // Next video we see how this is used in front end 
        const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    
        if(!accessToken){
            // Discussion in next video maybe we create a new access token using refresh Token
            throw new ApiError(401,"Unauthorized Request")
        }
    
        const decodedUser = jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET) 
        const user = await User.findById(decodedUser._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(401,"Token not authorized")
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access Token")
    }

})