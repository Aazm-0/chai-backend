import multer from "multer";

// We are going to use disk storage instead of memory storage it is useful for handling bigger files too
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, '/public/temp')
    //   You can also handle errors here instead of null
    },
    filename: function (req, file, cb) {
    //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) we can add suffix to the file name but for now we arre only storing them temp so no need
      cb(null, file.originalname)
    }
  })
  
  export const upload = multer({ storage })

//   Now we can call this middle ware in betweeen a route handler with a route and a controller 