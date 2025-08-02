// OK whenever we are talking to a database we will have to have async code with try and catch block
// This will be commen throughout the application for any databse communication so why not create a util
// which handles this

// 1st method

const asyncHandler = fn => (req,res,next) => {
    Promise.resolve(fn(req,res,next)).catch(next);
}

export {asyncHandler}

/*  The reason we use next is because it moves the flow into expresses built in error handler middle ware for exampel
// This centralizes all error handling methods
// next(err) automatically moves it into error handler middle ware which is think on the opposite workflow 

app.use((err, req, res, next) => {
  res.status(err.code || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
}); 

*/



// 2nd method : Async await
// Higher order function take in a function and amke it asynchronous 

// const asyncHandler = fn => async (req, res, next) => {
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         // What happens when you chain responses???
//         res.status(error.code || 500).json(
//             {
//                 success: false,
//                 message: error.message
//             }
//         )
//     }
// }

/* 
Instead of doing this:
app.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

You can use it like this 
app.get(
  "/users",
  asyncHandler(async (req, res) => {
    const users = await User.find();
    res.json(users);
  })
); 

*/
