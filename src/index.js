// require('dotenv').config({path : './env'})
// You only need to specify the path when its not in the root directory
import "dotenv/config";
import connectDb from "./db/index.js";
import app from "./app.js";

// An asynchronous function always returns a Promise
connectDb()
  .then(() => {
    app.on("error", (error) => {
      console.log("Error in express connection", error);
      throw error;
    });
    // .listen() should be called at the end when all the server logic is set up
    app.listen(process.env.PORT || 8000, () => {
      console.log(`The server is running at the port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    // Use it like this if you are rethrowing the error and not exiting the function
    console.log("Error in connecting the database", err);
    process.exit(1);
  });

/*
// This is the first approach to connect the database directly in index
// But this polutes the index
// Start iffys with ; so if you forget commas before it it doesnt make a problem 
; (async () => {
    try {
        await mongoose.connect(`${process.env.DATABASE_URI}/${DB_NAME}`)
        app.on("error",(error) => {
            console.log("Error in express connection",error)
            throw error
        })
        app.listen(process.env.PORT,() =>{
            console.log("Listenign on Port",process.env.PORT);
        })
    } catch (error) {
        console.log("Error connecting to db",error)
        throw error
    }
})()

*/
