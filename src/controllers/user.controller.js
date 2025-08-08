import { asyncHandler } from "../utils/aynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinaryFileUpload.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
    const coverImageLocalPath = req.files?.coverImage[0]?.path

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
        zavatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.lowerCase()
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

export { registerUser }