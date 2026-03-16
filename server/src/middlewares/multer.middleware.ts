import multer from "multer";
import { ApiError } from "../utils/apiError";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
})

export const upload = multer({
    storage,
    limits: {fileSize: 5*1024*1024},
    fileFilter: (req, file, cb)=> {
        if(file.mimetype === 'application/pdf') {
            cb(null,true)
        } else {
            cb(new ApiError(400,"Only pdf files are allowed"))
        }
    }
})