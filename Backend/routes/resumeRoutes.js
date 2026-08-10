import express from "express";
import { getGridFSBucket } from "../config/gridfs.js";
import mongoose from "mongoose";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get resume file by GridFS file ID
router.get("/download/:fileId", protect, async (req, res) => {
    try {
        const bucket = getGridFSBucket();
        const fileId = new mongoose.Types.ObjectId(req.params.fileId);

        // Find file metadata
        const files = await bucket.find({ _id: fileId }).toArray();

        if (!files || files.length === 0) {
            return res.status(404).json({ success: false, message: "File not found" });
        }

        const file = files[0];

        // Set response headers
        res.set("Content-Type", file.contentType || "application/pdf");
        res.set("Content-Disposition", `inline; filename="${file.filename}"`);

        // Stream file from GridFS to response
        const downloadStream = bucket.openDownloadStream(fileId);

        downloadStream.on("error", (error) => {
            console.error("Download stream error:", error);
            return res.status(500).json({ success: false, message: "Error streaming file" });
        });

        downloadStream.pipe(res);
    } catch (error) {
        console.error("Resume download error:", error);
        return res.status(500).json({ success: false, message: "Download failed", error: error.message });
    }
});

export default router;
