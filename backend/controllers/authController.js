import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { uploadToCloudinary } from "../config/cloudinary.js";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Helper function to sanitize input against NoSQL injection
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  // Convert to string and remove any non-printable characters
  return String(input).trim().substring(0, 100);
};

// Helper function to calculate age
const calculateAge = (dob) => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// UPLOAD PROFILE IMAGE (pre-upload before registration)
export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: "No image file provided" });
    }
    console.log("Uploading profile image... Size:", req.file.size, "bytes");
    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    if (!result || !result.secure_url) {
      return res.status(500).json({ message: "Image upload failed" });
    }
    console.log("Image uploaded successfully:", result.secure_url);
    res.json({ imageUrl: result.secure_url });
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({ message: "Image upload failed" });
  }
};

// REGISTER USER
export const registerUser = async (req, res) => {
  try {
    console.log("Registration attempt:", req.body.email, req.body.phone);
    
    const {
      surname,
      firstname,
      othername,
      email,
      phone,
      dob,
      address,
      stateOfOrigin,
      lga,
      branch,
      occupation,
      hobbies,
      serviceUnit,
      serviceUnitLove,
      bornAgain,
      password,
      profileImage,
    } = req.body;

    const age = calculateAge(dob);
    if (age < 18 || age > 45) {
      return res.status(400).json({ 
        message: "You must be between 18 and 45 years old to register in the Royal Youth Community.",
        ageRestricted: true 
      });
    }

    if (!phone || !/^0\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Phone number must be 11 digits starting with 0" });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!surname || !/^[a-zA-Z]+$/.test(surname.trim().replace(/['-]/g, ""))) {
      return res.status(400).json({ message: "Surname must contain letters only, no spaces or special characters" });
    }
    
    if (!firstname || !/^[a-zA-Z]+$/.test(firstname.trim().replace(/['-]/g, ""))) {
      return res.status(400).json({ message: "First name must contain letters only, no spaces or special characters" });
    }

    if (!address || !address.trim()) {
      return res.status(400).json({ message: "Address is required" });
    }

    if (!stateOfOrigin || !stateOfOrigin.trim()) {
      return res.status(400).json({ message: "State of Origin is required" });
    }

    if (!lga || !lga.trim()) {
      return res.status(400).json({ message: "Local Government Area is required" });
    }

    if (!occupation || !occupation.trim()) {
      return res.status(400).json({ message: "Occupation is required" });
    }

    if (!serviceUnit || !serviceUnit.trim()) {
      return res.status(400).json({ message: "Service Unit is required" });
    }

    const validServiceUnits = [
      "Choir", "Sanctuary", "Protocol", "Ushers", "Lighthouse", "Security",
      "Pastoral", "Prayer Unit", "Altar Ministrations", "Media", "Children Ministry", "Evangelism/Follow Up", "None"
    ];

    if (!validServiceUnits.includes(serviceUnit)) {
      return res.status(400).json({ message: "Invalid service unit selected" });
    }

    if (serviceUnit === "None" && (!serviceUnitLove || !serviceUnitLove.trim())) {
      return res.status(400).json({ message: "Please select a service unit you'd like to join" });
    }

    const validBornAgainOptions = ["Yes", "No", "Not sure"];
    if (!bornAgain || !validBornAgainOptions.includes(bornAgain)) {
      return res.status(400).json({ message: "Please select a valid Born Again status" });
    }

    console.log("Checking existing phone:", phone);
    const existingPhone = await User.findOne({ phone, isDeleted: false });
    if (existingPhone) {
      return res.status(400).json({ message: "Phone number already registered" });
    }

    if (email) {
      console.log("Checking existing email:", email);
      const existingEmail = await User.findOne({ email, isDeleted: false });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(32).toString("hex");

    let imagePath = profileImage || "";
    if (!imagePath && req.file && req.file.buffer && req.file.buffer.length > 0) {
      try {
        console.log("Uploading image to Cloudinary... Size:", req.file.size, "bytes");
        const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
        if (result && result.secure_url) {
          imagePath = result.secure_url;
          console.log("Image uploaded:", imagePath);
        }
      } catch (cloudErr) {
        console.error("Cloudinary upload failed:", cloudErr.message);
      }
    }

    console.log("Creating new user...");
    const newUser = new User({
      surname,
      firstname,
      othername,
      email,
      phone,
      dob,
      address,
      stateOfOrigin,
      lga,
      branch: branch || "Plot C4/C5 Owerri",
      occupation,
      hobbies: hobbies ? hobbies.split(",").map(h => h.trim()) : [],
      serviceUnit,
      serviceUnitLove,
      bornAgain,
      password: hashedPassword,
      profileImage: imagePath,
      verificationToken,
    });

    await newUser.save();
    console.log("User registered successfully:", newUser._id);

    res.status(201).json({
      message: "User registered successfully",
      userId: newUser._id,
    });
  } catch (error) {
    console.error("Registration error:", error.message);
    console.error("Error stack:", error.stack);
    let msg = "Registration failed. Please try again.";
    if (typeof error.message === 'string') {
      msg = error.message;
    } else if (error.name === 'MongoServerError' && error.code === 11000) {
      msg = "Phone number or email already registered";
    }
    res.status(500).json({ message: msg });
  }
};

// LOGIN USER
export const loginUser = async (req, res) => {
  try {
    const identifier = sanitizeInput(req.body.identifier);
    const password = sanitizeInput(req.body.password);

    if (!identifier || !password) {
      return res.status(400).json({ message: "Email/phone and password are required" });
    }

    const user = await User.findOne({
      $or: [{ phone: identifier }, { email: identifier }],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isDeleted) {
      return res.status(403).json({ 
        message: "Account Deleted: No longer a member of Royal Youth Community.",
        accountDeleted: true 
      });
    }

    if (user.registrationStatus === "Pending") {
      return res.status(403).json({ 
        message: "Your registration is pending approval. You will be able to login after admin approves your registration." 
      });
    }

    if (user.registrationStatus === "Rejected") {
      return res.status(403).json({ 
        message: "Your registration was rejected. Please contact admin for assistance." 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    user.lastLogin = new Date();
    await user.save();

    res.json({
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllMembers = async (req, res) => {
  try {
    const members = await User.find({ isDeleted: false, registrationStatus: "Approved" }).select("-password");

    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching members",
      error: error.message,
    });
  }
};

export const getSingleMember = async (req, res) => {
  try {
    const member = await User.findOne({ _id: req.params.id, isDeleted: false }).select("-password");

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    res.status(200).json(member);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching member",
      error: error.message,
    });
  }
};

export const updateMembershipStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const member = await User.findByIdAndUpdate(
      req.params.id,
      { membershipStatus: status },
      { returnDocument: "after" },
    );

    res.status(200).json(member);
  } catch (error) {
    res.status(500).json({
      message: "Error updating membership status",
      error,
    });
  }
};

export const updateDues = async (req, res) => {
  try {
    const { month, status, amount, year } = req.body;
    const duesField = year === "2027" ? "dues2027" : "dues";

    const member = await User.findById(req.params.id);

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    member[duesField][month].status = status;
    member[duesField][month].amount = amount;
    
    if (status === "Paid") {
      member[duesField][month].date = new Date();
    } else {
      member[duesField][month].date = null;
    }

    await member.save();

    res.status(200).json(member);
  } catch (error) {
    res.status(500).json({
      message: "Error updating dues",
      error: error.message,
    });
  }
};

// ADMIN LOGIN
export const adminLogin = async (req, res) => {
  try {
    const username = sanitizeInput(req.body.username);
    const password = sanitizeInput(req.body.password);

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const adminUser = {
      _id: "admin",
      firstname: "Admin",
      surname: "Admin",
      role: "admin",
    };

    const token = jwt.sign({ id: "admin", role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: adminUser,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// VERIFY EMAIL
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: "Invalid verification token" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET CURRENT USER
export const getCurrentUser = async (req, res) => {
  try {
    if (req.user._id === "admin") {
      return res.status(200).json({ _id: "admin", firstname: "Admin", surname: "Admin", role: "admin" });
    }

    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE USER ROLE
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["member", "admin", "youth_president"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { returnDocument: "after" }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Member not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE MEMBER (Hard delete from database)
export const deleteMember = async (req, res) => {
  try {
    const member = await User.findByIdAndDelete(req.params.id);

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    res.status(200).json({ message: "Member account deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET MEMBER DUES
export const getMemberDues = async (req, res) => {
  try {
    const member = await User.findOne({ _id: req.params.id, isDeleted: false }).select("dues dues2027 firstname surname");

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    res.status(200).json(member);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const { occupation, hobbies, address, branch } = req.body;
    const updateData = {};

    if (occupation) updateData.occupation = occupation;
    if (hobbies) updateData.hobbies = hobbies;
    if (address !== undefined) updateData.address = address;
    if (branch) updateData.branch = branch;

    if (req.file && req.file.buffer && req.file.buffer.length > 0) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
        if (result && result.secure_url) {
          updateData.profileImage = result.secure_url;
        }
      } catch (cloudErr) {
        console.error("Cloudinary upload failed:", cloudErr.message);
        updateData.profileImage = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { returnDocument: "after" },
    ).select("-password");

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
