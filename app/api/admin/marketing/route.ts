import { requireAdmin } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export const dynamic="force-dynamic";
const norm=(v:unknown)=>typeof v==='string'?v.trim():'';
export async function GET(){
  const denied = await requireAdmin();
  if (denied) return denied;try{const sql=db();const [templates,customers]=await Promise.all([sql`SELECT id,name,template,is_active,updated_at FROM marketing_templates ORDER BY updated_at DESC`,sql`SELECT id,name,phone,email,"totalOrders","totalSpent" FROM "Customer" ORDER BY "updatedAt" DESC`]);return NextResponse.json({templates:templates.map((x:any)=>({id:String(x.id),name:String(x.name),template:String(x.template).replace(/\\n/g,'\n'),isActive:Boolean(x.is_active)})),customers:customers.map((x:any)=>({id:String(x.id),name:String(x.name),phone:String(x.phone),email:x.email?String(x.email):'',totalOrders:Number(x.totalOrders||0),totalSpent:Number(x.totalSpent||0)}))});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to load marketing data.'},{status:500});}}
export async function POST(req:NextRequest){
  const denied = await requireAdmin();
  if (denied) return denied;try{const b=await req.json();const name=norm(b.name),template=typeof b.template==='string'?b.template:'';if(!name||!template.trim())return NextResponse.json({error:'Template name and message are required.'},{status:400});const sql=db();const rows=await sql`INSERT INTO marketing_templates(name,template) VALUES(${name},${template}) RETURNING id,name,template,is_active`;return NextResponse.json({template:{id:String(rows[0].id),name:String(rows[0].name),template:String(rows[0].template),isActive:Boolean(rows[0].is_active)}},{status:201});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to create template.'},{status:500});}}
export async function PATCH(req:NextRequest){
  const denied = await requireAdmin();
  if (denied) return denied;try{const b=await req.json();const id=norm(b.id),name=norm(b.name),template=typeof b.template==='string'?b.template:'';if(!id||!name||!template.trim())return NextResponse.json({error:'Template details are required.'},{status:400});const sql=db();const rows=await sql`UPDATE marketing_templates SET name=${name},template=${template},updated_at=CURRENT_TIMESTAMP WHERE id=${id} RETURNING id,name,template,is_active`;if(!rows[0])return NextResponse.json({error:'Template not found.'},{status:404});return NextResponse.json({template:{id:String(rows[0].id),name:String(rows[0].name),template:String(rows[0].template),isActive:Boolean(rows[0].is_active)}});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to save template.'},{status:500});}}
