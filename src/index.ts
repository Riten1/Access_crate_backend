import dotenv from "dotenv";
import app from "./app.js";  
import dbConnect from "./db/index.js";

dotenv.config({ path: "./.env" });

dbConnect().then(() => {
  app.listen(process.env.PORT || 8000, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
}).catch((error) => {
  console.log("MongoDB connection error:", error);
  process.exit(1);
});

