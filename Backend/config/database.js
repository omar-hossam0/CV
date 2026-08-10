import mongoose from "mongoose";
import { initGridFS } from "./gridfs.js";

const connectDB = async () => {
  try {
    const defaultUri = "mongodb://localhost:27017/cv_project_db";
    const mongoUri = process.env.MONGO_URI || defaultUri;
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    console.log(`Connection State: ${conn.connection.readyState}`);

    // Initialize GridFS after connection
    initGridFS();

    mongoose.connection.on("connected", () => {
      console.log(`Mongoose connected to ${mongoUri}`);
    });

    mongoose.connection.on("error", (err) => {
      console.error("Mongoose connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("Mongoose disconnected");
    });
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error(`Full Error:`, error);
    process.exit(1);
  }
};

export default connectDB;
