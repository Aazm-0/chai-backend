import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Here we will be assuming that we are taking the files from the local storage then uploading them 
// and then unlinking them on successfel uploads from local storage using fs.syncunlink
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Again this uploading to cloud server can have errros and may take time
const uploadOnCloudinary = async (localFilePath) => {
    if(!localFilePath){
        console.log("No file path defined")
        return null
    };
    try {
        // Check for file path you can throw error message here
        // There are other options for uploading
        // auto allows all types of files upload
        const uploadResult = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        })
        // We have to return the result to user for him to use it 
        console.log(`file has been uploaded successfuly The URL is: ${uploadResult.url}`);
        fs.unlinkSync(localFilePath)
        // Also delete ffile from temp storage on successful storage comment the deltion just for checking then you can upload
        return uploadResult
    } catch (error) {
        // Removes the locally saved temporary file as the upload operation failed for cleanup
        fs.unlinkSync(localFilePath)
        return null
    }
}

export {uploadOnCloudinary}