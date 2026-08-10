import mongoose from "mongoose";
import { GridFSBucket } from "mongodb";

let bucket;

export const initGridFS = () => {
    const db = mongoose.connection.db;
    bucket = new GridFSBucket(db, {
        bucketName: "resumes", // Collection prefix: resumes.files, resumes.chunks
    });
    console.log("GridFS initialized for resumes");
    return bucket;
};

export const getGridFSBucket = () => {
    if (!bucket) {
        throw new Error("GridFS not initialized. Call initGridFS first.");
    }
    return bucket;
};
