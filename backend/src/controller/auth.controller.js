import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js "
import jwt from "jsonwebtoken"; 

export async function signup(req, res){
    const {email,password,fullName} = req.body;

    try {
        if(!email || !password || !fullName){
            return res.status(400).json({message: "All fields are required"});

        }
        if(password.length<6){
            return res.status(400).json({message: "Password must be at least 6 characters"})
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; 

        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists, please use a diffrent one" });
        }
        const idx = Math.floor(Math.random()*100) + 1;
        const randomAvtar = `https://avatar.iran.liara.run/public/${idx}.png`

        const newUser = await User.create({
            email,
            fullName,
            password,
            profilePic: randomAvtar,
        })
       try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });
      console.log(`Stream user created for ${newUser.fullName}`);
    } catch (error) {
      console.log("Error creating Stream user:", error);
    }

        const token = jwt.sign({userId:newUser._id},process.env.JWT_SECRET_KEY,{
            expiresIn:"7d"

        })
        res.cookie("jwt", token, {
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "Strict", // <-- 🔥 change this!
            secure: process.env.NODE_ENV === "production"
        });
        res.status(201).json({ success: true, user: newUser });

        }
    

    catch(error){
        console.log("Error in singnup controller", error);
        res.status(500).json({message: "Internal Server Error"});

    }
}

export async function login(req, res){
    try{
        const {email, password} = req.body;

        if(!email || !password){
            return res.status(400).json({message: "All fields are required"});
        }
        const user = await User.findOne({email});
        if(!user)
            return res.status(400).json({message:"Invalid email or password"});
        const isPasswordCorrect = await user.matchPassword(password);
        if(!isPasswordCorrect)return res.status(400).json({message:"Invalid email or password"});

        const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET_KEY,{
            expiresIn: "7d",
        });
        res.cookie("jwt",token,{
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            sameSite: "Strict",
            secure: process.env.NODE_ENV === "production"
        });
        res.status(200).json({success: true, user });
        
        

    }catch(error){
        console.log("error in login controller", error.message);
        res.status(500).json({message: "Internal Server Error"});

    }
}

export async function logout(req, res){
    res.clearCookie("jwt");
    res.status(200).json({success:true,message:"Logout successful"});
} 

export async function onboard(req, res){
    console.log(req.user);
    try {
        const userID = req.user._id

        const {fullName, bio, nativeLanguage, learningLanguage, location}= req.body
 
        if(!fullName || !bio || !nativeLanguage || !learningLanguage || !location){
            return res.status(400).json({
                message:"All field are requird",
                missingFields:[
                    !fullName && "fullName",
                    !bio && "bio",
                    !nativeLanguage && "nativeLenguage",
                    !learningLanguage && "learningLanguage",
                    !location && "location",
                ].filter(Boolean)
            });
        }
        const updateUser = await User.findByIdAndUpdate(userID,{
            ...req.body,
            isOnboarded: true,
        },{new:true})
        if(!updateUser)return res.status(404).json({message:"User not found"})
            try {
                await upsertStreamUser ({
                    id: updateUser._id.toString(),
                    name: updateUser.fullName,
                    image: updateUser.profilePic || "",
                })
                console.log(`stream user updated after onboarding for ${updateUser.fullName}`);
            } catch (streamErrorerror) {
                console.log("Error updating Stream user during onbording", streamError.message)
                
            }
            

            res.status(200).json({sucess: true, user: updateUser});



    } catch (error) {
        console.error("Onboarding error:", error);
        res.status(500).json({message: "Internal server error"})

        
    }
}