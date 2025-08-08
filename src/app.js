import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// Now app.use is for middle ware configuration which runs between you routefetching functions like .get .post
// they have (err,req,res,next) the middleware can be alligned -> [] -> [] like this so you can move it form one middle ware to another
// You can write logic for auth,parsing or simply logging here you can also modify req,res

// There are some basic best practices for middlewares to be set up

// Cors as we studied before is also a type of middleware
// ORigin is the allowed frontend can be func or string
// Whitelist is when you have multiple origins to check with allowibility you define a function for it in the origin
// credentials is when you allow cookies and auth headers?????
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// you need to be able to understand the json data that is being sent lets say through a post protocol a form data
// it will be undefined in app.posts req.body if you dont configure middleware for parsing json data
// before you needed body-parser
// for file we will use multer in future
app.use(express.json({ limit: "16kb" }));
// Urlencoding is when you get data through url queries when you say get a request through html doc you want to parse it beofre storing in req.query
app.use(express.urlencoded({ extended : true, limit : "16kb"}))
// for static serving of folders like imagees or css, js or frontends build folder you can use express.static
app.use(express.static("public"))
// To securely access cookies of users browser from  the server you need cookieParser
app.use(cookieParser())

// We will bring routes here also the imports here reasioning
// Visual clarity and some global middleware might be needed before the routes is imported
import userRouter from "./routes/user.routes.js";

//routes declaration
// This is how you define an api with a version and named api now the Router api is gonna hit when 
// https:localhost/8000/api/v1/users/ in here now you nest the route handlers 
app.use("/api/v1/users",userRouter)


export default app;
