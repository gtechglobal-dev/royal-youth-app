import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/user.js";

dotenv.config();

const migrateBranch = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const result = await User.updateMany(
      { branch: { $exists: false } },
      { $set: { branch: "Plot C4/C5 Owerri" } }
    );

    console.log(`Updated ${result.modifiedCount} users with branch: Plot C4/C5 Owerri`);
    console.log("Migration complete");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  }
};

migrateBranch();
