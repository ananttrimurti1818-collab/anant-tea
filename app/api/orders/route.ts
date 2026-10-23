import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export const dynamic="force-dynamic";
const text=(v:unknown)=>typeof v==='string'?v.trim():'';
const num=(v:unknown)=>{const n=Number(v);return Number.isFinite(n)?n:0};
type CartItem={productId:string;size:string;quantity:number};
export async function POST(req:NextRequest){try{const b=await req.json(),c=b.customer??{},raw=Array.isArray(b.items)?b.items:[],name=text(c.name),phone=text(c.phone).replace(/\D/g,''),email=text(c.email)||null,address=text(c.address),city=text(c.city),state=text(c.state),pincode=text(c.pincode),paymentMethod=text(b.paymentMethod)||'COD',couponCode=text(b.couponCode).toUpperCase();if(phone.length!==10||!name||!address||!city||!state||pincode.length<6)return NextResponse.json({error:'Enter a valid 10-digit mobile number and complete delivery details.'},{status:400});if(!raw.length)return NextResponse.json({error:'Your cart is empty.'},{status:400});const items:CartItem[]=raw.map((x:Record<string,unknown>)=>({productId:text(x.productId),size:text(x.size),quantity:Math.max(1,Math.floor(num(x.quantity)))})).filter((x:CartItem)=>Boolean(x.productId&&x.size));if(!items.length)return NextResponse.json({error:'Cart items are invalid.'},{status:400});const sql=db();if(paymentMethod==='COD'){const paymentSettings=await sql`SELECT cod_enabled FROM site_settings WHERE id='default' LIMIT 1`;if(paymentSettings[0]?.cod_enabled===false)return NextResponse.json({error:'Cash on Delivery is currently unavailable. Please choose online payment.'},{status:400});}const orderNumber=`ANT-${Date.now().toString().slice(-8)}`;const result=await sql.begin(async tx=>{let customerId='';const existing=await tx`SELECT id FROM "Customer" WHERE regexp_replace(phone, '\\D', '', 'g')=${phone} LIMIT 1`;if(existing[0]){customerId=String(existing[0].id);await tx`UPDATE "Customer" SET name=${name},email=${email},address=${address},city=${city},state=${state},pincode=${pincode},"updatedAt"=CURRENT_TIMESTAMP WHERE id=${customerId}`;}else{customerId=crypto.randomUUID();await tx`INSERT INTO "Customer" (id,name,phone,email,address,city,state,pincode,"totalOrders","totalSpent","welcomeCouponUsed","createdAt","updatedAt") VALUES (${customerId},${name},${phone},${email},${address},${city},${state},${pincode},0,0,false,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`;}const resolved:Array<{productId:string;size:string;quantity:number;productName:string;variantId:string;variantPackSize:string;price:number}>=[];for(const item of items){const rows=await tx`SELECT p.id product_id,p.name product_name,pv.id variant_id,pv."packSize",pv.price,pv."discountPrice" FROM "Product" p JOIN "ProductVariant" pv ON pv."productId"=p.id WHERE p.id=${item.productId} AND pv."packSize"=${item.size} AND p."isActive"=true LIMIT 1`;if(!rows[0])throw new Error(`Product variant not found: ${item.productId} / ${item.size}`);resolved.push({...item,productId:String(rows[0].product_id),productName:String(rows[0].product_name),variantId:String(rows[0].variant_id),variantPackSize:String(rows[0].packSize),price:Number(rows[0].discountPrice !== null && rows[0].discountPrice !== undefined && Number(rows[0].discountPrice) < Number(rows[0].price) ? rows[0].discountPrice : rows[0].price)});}const subtotal=resolved.reduce((s,x)=>s+x.price*x.quantity,0);const shippingRows=await tx`SELECT shipping_charge,free_shipping_above FROM site_settings WHERE id='default' LIMIT 1`;const shippingCharge=Number(shippingRows[0]?.shipping_charge ?? 60);const freeShippingAbove=Number(shippingRows[0]?.free_shipping_above ?? 499);const shipping=(freeShippingAbove<=0||subtotal>=freeShippingAbove)?0:shippingCharge;let discount=0;let coupon:any=null;if(couponCode){const rows=await tx`SELECT * FROM "Coupon" WHERE upper(code)=${couponCode} LIMIT 1`;coupon=rows[0];if(!coupon||!coupon.active)throw new Error('Coupon is invalid or inactive.');if(coupon.startsAt&&new Date(coupon.startsAt)>new Date())throw new Error('Coupon has not started yet.');if(coupon.expiresAt&&new Date(coupon.expiresAt)<=new Date())throw new Error('Coupon has expired.');if(coupon.usageLimit!==null&&Number(coupon.usedCount)>=Number(coupon.usageLimit))throw new Error('Coupon usage limit has been reached.');if(subtotal<Number(coupon.minimumOrder||0))throw new Error(`Minimum order value is ₹${Number(coupon.minimumOrder).toLocaleString('en-IN')}.`);discount=String(coupon.type).toUpperCase().includes('PERCENT')?subtotal*Number(coupon.value)/100:Number(coupon.value);if(coupon.maximumDiscount!==null)discount=Math.min(discount,Number(coupon.maximumDiscount));discount=Math.round(Math.max(0,Math.min(discount,subtotal)));}
const total=Math.max(0,subtotal+shipping-discount);const orderId=crypto.randomUUID();await tx`INSERT INTO "Order" (id,"orderNumber","customerId",subtotal,shipping,discount,total,"paymentMethod","paymentStatus","orderStatus","createdAt","updatedAt",address,city,state,pincode,"couponCode") VALUES (${orderId},${orderNumber},${customerId},${subtotal},${shipping},${discount},${total},${paymentMethod},'PENDING','PENDING_PAYMENT',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,${address},${city},${state},${pincode},${couponCode||null})`;for(const x of resolved)await tx`INSERT INTO "OrderItem" (id,"orderId","productId","variantId",quantity,price,"createdAt","productName","variantPackSize") VALUES (${crypto.randomUUID()},${orderId},${x.productId},${x.variantId},${x.quantity},${x.price},CURRENT_TIMESTAMP,${x.productName},${x.variantPackSize})`;await tx`UPDATE "Customer" SET "totalOrders"="totalOrders"+1,"totalSpent"="totalSpent"+${total},"updatedAt"=CURRENT_TIMESTAMP WHERE id=${customerId}`;if(coupon){await tx`UPDATE "Coupon" SET "usedCount"="usedCount"+1,"updatedAt"=CURRENT_TIMESTAMP WHERE id=${coupon.id}`;}return {orderId,orderNumber,total,subtotal,shipping,discount,couponCode:couponCode||null};});
if (paymentMethod === "ONLINE" || paymentMethod === "RAZORPAY") {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json({ error: "Online payment is not configured. Please choose Cash on Delivery or contact the store." }, { status: 503 });
  }
  if (Math.round(Number(result.total) * 100) < 100) {
    return NextResponse.json({ error: "Razorpay requires a minimum payment of ₹1.00." }, { status: 400 });
  }
  const gatewayResponse = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(Number(result.total) * 100),
      currency: "INR",
      receipt: String(result.orderNumber).slice(0, 40),
      notes: { anant_order_id: result.orderId, anant_order_number: result.orderNumber },
    }),
    cache: "no-store",
  });
  const gatewayData = await gatewayResponse.json().catch(() => ({}));
  if (!gatewayResponse.ok || !gatewayData.id) {
    console.error("Razorpay order creation failed", gatewayData);
    return NextResponse.json({ error: "Could not start online payment. Please retry or choose Cash on Delivery." }, { status: 502 });
  }
  await sql`UPDATE "Order" SET "razorpayOrderId"=${String(gatewayData.id)}, "paymentGateway"='RAZORPAY', "paymentMethod"='ONLINE', "updatedAt"=CURRENT_TIMESTAMP WHERE id=${result.orderId}`;
  return NextResponse.json({
    success: true,
    order: result,
    payment: {
      order_id: String(gatewayData.id),
      amount: Number(gatewayData.amount),
      currency: String(gatewayData.currency || "INR"),
      key_id: keyId,
    },
  }, { status: 201 });
}
return NextResponse.json({success:true,order:result},{status:201});}catch(e){console.error('POST /api/orders',e);return NextResponse.json({error:e instanceof Error?e.message:'Unable to place order.'},{status:500});}}
