import { asyncHandler } from "../utils/aynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinaryFileUpload.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// helper method to generate both the tokens for a user 
const generateRefreshTokenAndAccessToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken

        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh or access token")
    }
}

// Remember the async handler we can now use it here to wrap the controller
const registerUser = asyncHandler(async (req, res) => {
    // Step by step solution to a problem
    // Remember the watch history and refresh token will be added programatically 
    // Solution:
    // Take input from users response 
    // Validate the attributes if they are correct for example // password,email ,username etc
    // Check if they document exists already or not? // username, email
    // upload file using multer middleware to diskstorage 
    // validate if properly uploaded
    // upload file to cloudinary
    // validate if properly uploaded
    // take url from cloudinary and all tthe above response details and create a document
    // check if the the document is properly created
    // take out the password and refresh token from the response
    // send it using API Response

    const { userName, fullName, email, password } = req.body
    console.log(`The email is ${email}`)

    // Validationn for checking if any of the details are empty
    // .some checks if any of the values returns true for the callback functions arguments
    if ([userName, fullName, email, password].some(elem => elem?.trim() === "")) {
        throw new ApiError(400, "The required fields for the inputs are Empty")
    }

    // Checking if user exists this USer is directly connected to mongodb model
    const userExists = await User.findOne({
        $or: [{ userName }, { email }]
    })

    if (userExists) {
        throw new ApiError(409, "User with email or username already exists")
    }

    // multer will give acces to files optioanlly chain because you dont know if it is there
    // Read about all the properties in the avatar object
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    // WHen optionally chaining you can get errors like cannot read the properties of undefined

    let coverImageLocalPath
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }


    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required in multer")
    }

    // Uplaoding on cloudinary 
    const avatarUpload = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatarUpload) {
        throw new ApiError(400, "Avatar file required on cloudinary")
    }

    // Entry into data base
    // Check coverImage because you didnt validate them above
    const user = await User.create({
        fullName,
        avatar: avatarUpload.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase()
    })


    // Now validation for entry created or not do it abit different because here after checking if it exist we can 
    // chain it to take out the password and the refreshToken
    // the .select takes out the passwork and refresh token
    const userEntry = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!userEntry) {
        throw new ApiError(500, "Somethign went wrong while registering user")
    }

    res.status(201).json(
        new ApiResponse(201, userEntry, "User Registered Successfully"
        )
    )

})

const loginUser = asyncHandler(async (req, res) => {
    // Get data from user using req.body
    // validate data
    // Using user/email check if it exists in the db
    // validate existing
    // check password using the method you created
    // now using the metthods for generating token make refresh access token
    // put reffresh token into the model
    // export the token using res.cookies as secured

    const { email, userName, password } = req.body

    if (!(userName || email)) {
        throw new ApiError(400, "Username or Email Empty")
    }

    const user = await User.findOne({
        $or: [{ email }, { userName }]
    })

    if (!user) {
        throw new ApiError(404, "Wrong email or username")
    }

    const isPasswordValid = await user.comparePassword(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Wrong password for the userr")
    }

    const { refreshToken, accessToken } = await generateRefreshTokenAndAccessToken(user._id)

    const updatedUser = await User.findById(user._id)
        .select("-password -refreshToken")

    // Now these cookies are only modifiable via server not through front end you can still view them but cant modify them
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                // Here you could send accessToken and refreshToken as an object too if user wants to save on local storage for mobile
                // but less scure then 
                updatedUser,
                "User Logged In"
            )
        )
})

// Secured Routes
const logoutUser = asyncHandler(async (req, res) => {
    // clear cookies cause you can only handle them in backend so clear refresh and access token
    // clear refresh token out of the user 
    // but problem how do you access user when in req.body you dont have any user details?
    // Solution make a middleware for authentication of jwt where it sends a req.user for ex where from you can take the id

    // finds tthe document and only changes the one that are used in set
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(
            200,
            {},
            "User logged out successfully"
        ))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    // Take refresh token from cookies or header or body if mobile device 
    // Verify the token using the signature 
    // Take out the user from the db
    // Check if the token matches with the orignal token 
    // generate new tokens 
    // send it via cookies and response

    const refreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!refreshToken) {
        throw new ApiError(401, "Unauthorized Request")
    }

    try {
        const decodedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedRefreshToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }

        if (refreshToken !== user.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        // Always generate new refresh token with new accesssToken 
        const { refreshToken: newRefreshToken, accessToken } = await generateRefreshTokenAndAccessToken(user._id)

        const options = {
            httpOnly: true,
            secure: true
        }
        return res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(new ApiResponse(
                200,
                { accessToken, newRefreshToken },
                "New Refresh Token Generated"
            ))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token ")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.files
    // IF functionality like old password confirmold password then take it out from files
    // then in an if bloc if(!(oldPassword === newPassword)) throw new ApiError() 

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "No fields should be empty")
    }

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.comparePassword(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid old password")
    }

    user.password = newPassword

    //  All the requirements such as requierd minlength if you want to bypass them then you need validate Before save
    // The hooks still run tho
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "Password changed successfully"
        ))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    // IF you have the jwt middleware then you can access the user
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            req.user,
            "Successfully got the user"
        ))
})

// You decide which properties you want to allow for change and which you dont want to allow
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { email, fullName } = req.files
    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    // mongodb operator to change specific field
    const updatedUser = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            fullName,
            email
        }
    }, { new: true })
        .select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            updatedUser,
            "Successfully changed email and fullName"
        ))
})

// Keep the file updates and details change seperate becauese if you do em all togethar it has load on server 
// What order should be for middleware
const updateAvatarImage = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) {
        throw new ApiError(400, "Avatar from cloudinary is missing")
    }

    const updatedUser = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            avatar: avatar.url
        }
    }, { new: true })
        .select("-password -refreshToken")

    return res.
        status(200)
        .json(new ApiResponse(
            200,
            updatedUser,
            "Avatar updated Succesfully"
        ))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
        throw new ApiError(400, "coverImage from cloudinary is missing")
    }

    const updatedUser = await User.findByIdAndUpdate(req.user?._id, {
        $set: {
            coverImage: coverImage.url
        }
    }, { new: true })
        .select("-password -refreshToken")

    return res.
        status(200)
        .json(new ApiResponse(
            200,
            updatedUser,
            "Cover Image updated Succesfully"
        ))
})

const getChannelInformation = asyncHandler(async (req, res) => {
    // Now first of all we will get the channel userName from the params 
    const { userName } = req.params

    if (!userName?.trim()) {
        throw new ApiError(400, "Username is empty")
    }

    const channelInfo = await User.aggregate([
        // Matching the channel which information we need from user
        {
            $match: {
                userName: userName?.toLowerCase()
            }
        },
        // getting the subscribers so basically we will get all the documents with the channel matching the user id 
        // use look ups for joins 
        {
            $lookup: {
                // mongodb changes name lower case plural
                from: "subscriptions",
                localField: "$._id",
                foreignField: "$channel",
                as: "subscribers"
            }
        },
        // gets the field which has array of documents which mattch local with foreighn
        {
            $lookup: {
                from: "subscriptions",
                localField: "$._id",
                foreignField: "$subscriber",
                as:  "subscribedTo"
            }
        },
        // adds additonal fields to the orignal document
        {
            $addFields:{
                subscriberCount: {
                    $size : "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size : "$subscribedTo"
                },
                isSubscribed: {
                    $condition: {
                        // based on condition returns specific values $in is used for checking arrays and project 
                        // remember mongodb
                        if: {$in  : [req.user?._id,"$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        // project the fields we need has 1 and not is 0
        {
            $project: {
                fullName: 1,
                userName: 1,
                subscriberCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1
            }
        }
    ])

    if(!channelInfo.length){
        throw new ApiError(404,"Channel doesnt exist")
    }

    // the data type the aggregate returns is usually an array of objects with documents we have one so take out one

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        channelInfo[0],
        "User Channel fetched successfull;y"
    ))

})

const getVideoWatchHistory = asyncHandler(async (req,res) => {
    // Remember the req.user that you get from mongoose methods is a string if you need touse it inside matching use it to make it an id first

    const user = await User.aggregate([
        {
            $match: new mongoose.Types.ObjectId(req.user?._id)
        },
        {   
            // joining the watchHistory or overriding the field by joining users with videos model
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                // This probably overrides the old watch history
                as: "watchHistory",
                // subpipline to now make another join inside the field
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    // another pipeline to project it
                                    $project: {
                                        userName: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    // This is to change output which is in array to normal data form we need
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user.watchHistory[0],
        "Successfuly retrieved users watch History"
    ))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    updateAccountDetails,
    updateAvatarImage,
    updateUserCoverImage,
    getCurrentUser,
    getChannelInformation,
    getVideoWatchHistory
}