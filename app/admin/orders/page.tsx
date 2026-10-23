"use client";
import { useEffect, useState } from "react";
import { Eye, MessageCircle, RefreshCw, X, Trash2, FileText } from "lucide-react";
import { formatINR } from "@/lib/data";

const statuses = ["New", "Confirmed", "Processing", "Packed", "Shipped", "Out for Delivery", "Delivered", "Cancelled"] as const;
type Order = { id:string; orderNumber:string; customerName:string; customerPhone:string; customerEmail:string; subtotal:number; shipping:number; discount:number; total:number; paymentMethod:string; paymentStatus:string; status:string; createdAt:string; address:string; city:string; state:string; pincode:string; couponCode:string; items:{id:string;productName:string;packSize:string;quantity:number;price:number}[] };
type Detail = Order & { history:{id:string;oldStatus:string;newStatus:string;changedBy:string;createdAt:string}[] };

export default function Orders(){
  const [orders,setOrders]=useState<Order[]>([]),[templates,setTemplates]=useState<Record<string,string>>({}),[error,setError]=useState(""),[loading,setLoading]=useState(true),[updating,setUpdating]=useState(""),[detail,setDetail]=useState<Detail|null>(null),[detailLoading,setDetailLoading]=useState(false);
  async function load(){setLoading(true);setError("");try{const r=await fetch("/api/admin/orders",{cache:"no-store"}),d=await r.json();if(!r.ok)throw new Error(d.error);setOrders(d.orders);setTemplates(d.templates||{});}catch(e){setError(e instanceof Error?e.message:"Unable to load orders.");}finally{setLoading(false);}}
  useEffect(()=>{load();},[]);
  async function viewOrder(id:string){setDetailLoading(true);setError("");try{const r=await fetch(`/api/admin/orders/${id}`,{cache:"no-store"}),d=await r.json();if(!r.ok)throw new Error(d.error);setDetail(d.order);}catch(e){setError(e instanceof Error?e.message:"Unable to load order details.");}finally{setDetailLoading(false);}}
  async function changeStatus(order:Order,status:string){setUpdating(order.id);setError("");try{const r=await fetch("/api/admin/orders",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:order.id,status})}),d=await r.json();if(!r.ok)throw new Error(d.error);setOrders(prev=>prev.map(x=>x.id===order.id?{...x,status}:x));setTemplates(prev=>({...prev,[status]:d.template||prev[status]||""}));if(detail?.id===order.id){setDetail(prev=>prev?{...prev,orderStatus:status,status}:prev);}}catch(e){setError(e instanceof Error?e.message:"Unable to update order.");}finally{setUpdating("");}}
  async function deleteOrder(order: Order) {
    const confirmed = window.confirm(`Delete order #${order.orderNumber}? This permanently removes the order and its items and cannot be undone.`);
    if (!confirmed) return;
    setUpdating(order.id);
    setError("");
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete order.");
      setOrders(previous => previous.filter(item => item.id !== order.id));
      if (detail?.id === order.id) setDetail(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete order.");
    } finally {
      setUpdating("");
    }
  }
  function whatsappHref(o:Order){const phone=o.customerPhone.replace(/\D/g,"");const waPhone=phone.length===10?`91${phone}`:phone;const msg=(templates[o.status]||"").replaceAll("{customer_name}",o.customerName).replaceAll("{order_number}",o.orderNumber).replaceAll("{order_total}",formatINR(o.total)).replaceAll("{order_status}",o.status).replaceAll("{phone}",o.customerPhone);return `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`;}
  return <>
    <div className="admin-top"><div><div className="eyebrow">Order Management</div><h1>Orders</h1><p className="admin-muted">Live orders from the existing Neon Order and OrderItem tables.</p></div><button className="outline-btn" onClick={load}><RefreshCw size={15}/> Refresh</button></div>
    {error&&<div className="admin-alert">{error}</div>}
    <div className="admin-card"><div className="notice">Changing status selects the matching WhatsApp template. WhatsApp opens with the message pre-filled; nothing is sent automatically.</div></div>
    {loading?<div className="admin-card">Loading orders...</div>:orders.length===0?<div className="admin-card admin-empty">No orders found.</div>:<div className="admin-card" style={{overflowX:"auto"}}><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td><b>#{o.orderNumber}</b><div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>{new Date(o.createdAt).toLocaleString("en-IN")}</div></td><td>{o.customerName}<div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>{o.customerPhone}</div></td><td>{formatINR(o.total)}</td><td>{o.paymentMethod}<div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>{o.paymentStatus}</div></td><td><select value={o.status} disabled={updating===o.id} onChange={e=>changeStatus(o,e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></td><td><div className="table-actions"><button className="outline-btn small-btn" onClick={()=>viewOrder(o.id)}><Eye size={13}/> View</button><a className="outline-btn small-btn" href={`/admin/orders/${o.id}/documents`}><FileText size={13}/> Print / PDF</a><a className="whatsapp small-btn" href={whatsappHref(o)} target="_blank" rel="noreferrer"><MessageCircle size={13}/> Message</a><button className="danger-btn small-btn" disabled={updating===o.id} onClick={()=>deleteOrder(o)}><Trash2 size={13}/> Delete</button></div></td></tr>)}</tbody></table></div>}
    {(detailLoading||detail)&&<div className="modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)setDetail(null)}}><div className="order-modal"><div className="modal-head"><div><div className="eyebrow">Order Details</div><h2>#{detail?.orderNumber||"Loading..."}</h2></div><button className="icon-btn" onClick={()=>setDetail(null)}><X size={20}/></button></div>{detailLoading?<div className="admin-card">Loading order...</div>:detail&&<><div className="detail-grid"><section><h3>Customer</h3><p><b>{detail.customerName}</b><br/>{detail.customerPhone}{detail.customerEmail&&<><br/>{detail.customerEmail}</>} </p></section><section><h3>Delivery Address</h3><p>{detail.address}<br/>{detail.city}, {detail.state} - {detail.pincode}</p></section><section><h3>Payment</h3><p>{detail.paymentMethod}<br/>{detail.paymentStatus}</p></section><section><h3>Order Status</h3><p><span className="status">{detail.status}</span></p></section></div><div className="admin-subsection"><h3>Items</h3><table className="admin-table"><thead><tr><th>Product</th><th>Pack</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>{detail.items.map(i=><tr key={i.id}><td>{i.productName}</td><td>{i.packSize}</td><td>{i.quantity}</td><td>{formatINR(i.price)}</td><td>{formatINR(i.price*i.quantity)}</td></tr>)}</tbody></table></div><div className="detail-summary"><div><span>Subtotal</span><b>{formatINR(detail.subtotal)}</b></div><div><span>Shipping</span><b>{formatINR(detail.shipping)}</b></div><div><span>Discount</span><b>- {formatINR(detail.discount)}</b></div><div className="grand"><span>Total</span><b>{formatINR(detail.total)}</b></div></div>{detail.couponCode&&<div className="notice">Coupon: <b>{detail.couponCode}</b></div>}<div className="admin-subsection"><h3>Status History</h3>{detail.history.length?<div className="timeline">{detail.history.map(h=><div className="timeline-item" key={h.id}><b>{h.newStatus}</b><span>{h.oldStatus?`${h.oldStatus} → `:""}{new Date(h.createdAt).toLocaleString("en-IN")}</span></div>)}</div>:<p className="admin-muted">No status history recorded yet.</p>}</div></>}</div></div>}
  </>;
}
