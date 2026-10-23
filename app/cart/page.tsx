"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { CartItem, cartTotal, getCart, updateCart } from "@/lib/store";
import { formatINR } from "@/lib/data";

export default function CartPage(){
  const [items,setItems]=useState<CartItem[]>([]);
  const refresh=()=>setItems(getCart());
  useEffect(()=>{refresh(); window.addEventListener("cart-updated",refresh); return()=>window.removeEventListener("cart-updated",refresh)},[]);
  const total=cartTotal(items);
  return <main><section className="page-head"><div className="container"><div className="breadcrumb">Home › Cart</div><h1 className="page-title serif">Your Cart</h1></div></section><section className="section"><div className="container cart-layout"><div className="panel"><h2>Cart ({items.length} products)</h2>{items.length===0?<div className="empty">Your cart is empty.<br/><br/><Link className="primary-btn" href="/products">Shop Tea</Link></div>:items.map((x,i)=><div className="cart-item" key={`${x.productId}-${x.size}`}><img src={x.image} alt={x.name}/><div><b>{x.name}</b><div style={{color:"var(--muted)",fontSize:13,marginTop:5}}>{x.size} · {formatINR(x.price)}</div><div className="qty-row"><div className="qty-control"><button onClick={()=>updateCart(i,x.quantity-1)}><Minus size={13}/></button><span>{x.quantity}</span><button onClick={()=>updateCart(i,x.quantity+1)}><Plus size={13}/></button></div><button className="outline-btn" style={{minHeight:38,padding:"0 12px"}} onClick={()=>updateCart(i,0)}><Trash2 size={14}/></button></div></div><b>{formatINR(x.price*x.quantity)}</b></div>)}</div><aside className="panel"><h2>Order Summary</h2><div className="summary-row"><span>Subtotal</span><b>{formatINR(total)}</b></div><div className="summary-row"><span>Shipping</span><b>{total>=499||total===0?"Free":"Calculated at checkout"}</b></div><div className="summary-row summary-total"><span>Total</span><b>{formatINR(total)}</b></div><Link className="primary-btn" style={{width:"100%",marginTop:15}} href="/checkout">Proceed to Checkout</Link></aside></div></section></main>
}