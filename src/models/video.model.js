import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    videoFile: {
        type: String, // Btw cloud services like cloudinary keeps the different types of files seperate
        required: true
    },
    thumbnail: {
        type: String,
        required : true
    },
    title: {
        type: String,
        required : true
    },
    description: {
        type: String,
        required : true
    },
    duration : {
        type: Number, // Whenever cloudinary stores data it sends url as ref but it also sends the meta data like duration
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    isPublished: {
        type: Boolean,
        default: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
    
}, { timestamps: true })

// Schema has its own middlewares and hooks in the middlewares you can define your own logic but you can also define plugins
videoSchema.plugin(mongooseAggregatePaginate)
// Now mongodb has its own aggregattion middleware and operation but you need paginations and $limit,$skip and total docs   

export const Video = mongoose.model("Video", videoSchema)