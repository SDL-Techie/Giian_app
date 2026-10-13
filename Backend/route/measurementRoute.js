import express from "express";
import Measurement from "../model/measurementModel.js";
import Product from "../model/productModel.js";
import { verifyUser, authorize } from "../helper/userAuth.js";
import { isValidObjectId } from "../utils/validators.js";
const router = express.Router();
router.use(verifyUser);
router.get("/", (req,res,next) => {
  if (req.user?.isAdmin || req.user?.role?.permissions?.measurements?.view || req.user?.role?.permissions?.products?.view || req.user?.role?.permissions?.products?.create) return next();
  return res.status(403).json({success:false,message:"Measurement list access denied"});
}, async (req,res,next) => { try { const filter = req.query.status ? { status: req.query.status } : {}; res.json({ success:true, data: await Measurement.find(filter).sort({name:1}) }); } catch(e){next(e);} });
router.post("/", authorize("measurements", "create"), async (req,res,next) => { try { const name=String(req.body.name||"").trim(); if(!name) return res.status(400).json({success:false,message:"Measurement name is required"}); const status=req.body.status===undefined ? "Active" : req.body.status; if(!["Active","Inactive"].includes(status)) return res.status(400).json({success:false,message:"Invalid status"}); const data=await Measurement.create({name,abbreviation:String(req.body.abbreviation||"").trim(),status,createdBy:req.user._id});res.status(201).json({success:true,data}); } catch(e){next(e);} });
router.put("/:id", authorize("measurements", "modify"), async (req,res,next) => { try { if(!isValidObjectId(req.params.id)) return res.status(400).json({success:false,message:"Invalid measurement"}); const update={}; if(req.body.name!==undefined){update.name=String(req.body.name).trim();if(!update.name)return res.status(400).json({success:false,message:"Name is required"});} if(req.body.abbreviation!==undefined)update.abbreviation=String(req.body.abbreviation).trim();if(req.body.status!==undefined){if(!["Active","Inactive"].includes(req.body.status)) return res.status(400).json({success:false,message:"Invalid status"});update.status=req.body.status;}const old=await Measurement.findById(req.params.id);
 if(!old)return res.status(404).json({success:false,message:"Not found"});
 // Products currently store unit names as strings; prohibit renaming a unit in use.
 if(update.name!==undefined && update.name!==old.name && await Product.exists({unitOfMeasure:old.name}))return res.status(409).json({success:false,message:"Cannot rename a measurement used by products"});
 if(update.abbreviation!==undefined && update.abbreviation!==old.abbreviation && old.abbreviation && await Product.exists({unitOfMeasure:old.abbreviation}))return res.status(409).json({success:false,message:"Cannot change abbreviation used by products"});
 const data=await Measurement.findByIdAndUpdate(req.params.id,update,{new:true,runValidators:true});if(!data)return res.status(404).json({success:false,message:"Not found"});res.json({success:true,data});}catch(e){next(e);} });
router.delete("/:id", authorize("measurements", "modify"), async(req,res,next)=>{try{if(!isValidObjectId(req.params.id))return res.status(400).json({success:false,message:"Invalid measurement"});const row=await Measurement.findById(req.params.id);if(!row)return res.status(404).json({success:false,message:"Not found"});if(await Product.exists({unitOfMeasure:{$in:[row.name,row.abbreviation].filter(Boolean)}}))return res.status(409).json({success:false,message:"Measurement is in use by products"});await row.deleteOne();res.json({success:true,message:"Measurement deleted"});}catch(e){next(e);}});
export default router;
