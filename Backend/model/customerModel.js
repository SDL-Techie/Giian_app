import mongoose from 'mongoose';
const fileSchema=new mongoose.Schema({id:String,filename:String,contentType:String,size:Number,storedSize:Number,compressed:Boolean,compression:String,targetReached:Boolean,url:String},{_id:false});
const customerSchema=new mongoose.Schema({
 companyName:{type:String,required:[true,'Name of the company is required'],trim:true},telephoneNumber:{type:String,trim:true},email:{type:String,trim:true,lowercase:true},mobileNumber:{type:String,trim:true},contactPersonName:{type:String,trim:true},companyAddress:{type:String,trim:true},creditLimit:{type:Number,default:0,min:0},companyDocuments:{type:[fileSchema],default:[]},companyDocumentUrl:String,status:{type:String,enum:['Active','Inactive'],default:'Active'},createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'User',required:true}
},{timestamps:true});customerSchema.index({companyName:'text',contactPersonName:'text'});
customerSchema.index({status:1,createdAt:-1});
customerSchema.index({email:1});
export default mongoose.model('Customer',customerSchema);
