import mongoose from 'mongoose';
const item=new mongoose.Schema({product:{type:mongoose.Schema.Types.ObjectId,ref:'Product',required:true},qty:{type:Number,required:true,min:0.01},cost:{type:Number,required:true,min:0},totalCost:{type:Number,required:true}},{_id:false});
const fileSchema=new mongoose.Schema({id:String,filename:String,contentType:String,size:Number,url:String},{_id:false});
const schema=new mongoose.Schema({purchaseNo:{type:String,required:true,unique:true},dateOfPurchase:{type:Date,required:true},vendorName:{type:String,required:true,trim:true},invoiceNumber:{type:String,required:true,trim:true},invoiceFiles:{type:[fileSchema],default:[]},invoiceFileUrl:String,items:{type:[item],validate:[a=>a.length>0,'At least one product is required']},subTotalCost:{type:Number,required:true},vatPercent:{type:Number,default:0},vatAmount:{type:Number,default:0},totalCost:{type:Number,required:true},status:{type:String,enum:['Active','Cancelled'],default:'Active'},createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true}},{timestamps:true});
schema.index({dateOfPurchase:-1,status:1});
schema.index({vendorName:1,dateOfPurchase:-1});
export default mongoose.model('Purchase',schema);
