import multer from "multer";
import { ApiError } from "../utils/apiError";
import fs from 'fs'
import { UPLOAD_DIR } from "../utils/constants";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        }
        cb(null, UPLOAD_DIR);
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