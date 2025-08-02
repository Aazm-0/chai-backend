import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";
// Check fir import statements when using backend you need to make them proper file type

const connectDb = async () => {
  try {
    // This connection method returns an object of connection Instance so yoou can actually see which db you connected to
    // this is useful to know because in production and deployment the dbs are actually different
    const connectionInstance = await mongoose.connect(
      `${process.env.DATABASE_URI}/${DB_NAME}`
    );
    console.log(
      `\n Mongo DB connected \n Db Host : ${connectionInstance.connection.host}`
    );
  } catch (error) {
    /*
        // Always write meaningful errors when connecting 
        console.log("Error in Connecting the Databse",error);
        process.exit(1)
        // Node global object read more like process.env use before this shus down any node.js program abnormally\
        // For server its better to use server.close() read more about it later
        */
    throw error;
    // If you want to catch the error outside then only rethrow it here you dont need to exit and log it here
  }
};

export default connectDb;
