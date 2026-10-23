"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, FileText, Printer, Download, LoaderCircle } from "lucide-react";
import { formatINR } from "@/lib/data";

type Item = { id: string; productName: string; packSize: string; quantity: number; price: number; lineTotal?: number };
type Order = {
  id: string; orderNumber: string; customerName: string; customerPhone: string; customerEmail: string;
  subtotal: number; shipping: number; discount: number; total: number; paymentMethod: string;
  paymentStatus: string; orderStatus: string; createdAt: string; address: string; city: string;
  state: string; pincode: string; couponCode: string; items: Item[];
};
type PrintMode = "packing" | "invoice" | "both";

export default function OrderDocumentsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<PrintMode>("both");
  const [printAfterUpdate, setPrintAfterUpdate] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/orders/${id}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load order.");
        if (alive) setOrder(data.order);
      })
      .catch((err) => { if (alive) setError(err instanceof Error ? err.message : "Unable to load order."); });
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    if (!printAfterUpdate || !order) return;
    const timer = window.setTimeout(() => {
      window.print();
      setPrintAfterUpdate(false);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [printAfterUpdate, mode, order]);

  function printAs(nextMode: PrintMode) {
    setMode(nextMode);
    setPrintAfterUpdate(true);
  }

  if (error) return <main className="document-shell"><p className="document-error">{error}</p><a href="/admin/orders">Back to Orders</a></main>;
  if (!order) return <main className="document-shell"><LoaderCircle className="spin" /> Loading order documents…</main>;

  const itemsTotal = order.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const created = new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  return <main className="document-shell">
    <style jsx global>{`
      .document-shell{font-family:Arial,Helvetica,sans-serif;color:#17231d;padding:24px;max-width:980px;margin:0 auto}
      .document-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:20px}
      .document-toolbar button,.document-toolbar a{display:inline-flex;align-items:center;gap:7px;border:1px solid #d7e2d9;border-radius:8px;padding:10px 12px;background:#fff;color:#145b39;text-decoration:none;font-weight:600;font-size:13px;cursor:pointer}
      .document-hint{font-size:13px;color:#65756b;margin:0 0 18px}
      .a5-sheet{box-sizing:border-box;width:148mm;min-height:210mm;padding:9mm;margin:0 auto 22px;background:#fff;border:1px solid #e1e7e2;box-shadow:0 5px 22px #102a1610;page-break-after:always;break-after:page;font-size:11px}
      .a5-sheet:last-child{page-break-after:auto;break-after:auto}
      .doc-brand{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #12633f;padding-bottom:10px;margin-bottom:14px}
      .doc-brand img{width:34mm;height:auto;object-fit:contain}.doc-brand h1{font-size:17px;color:#125335;margin:0}.doc-brand p{font-size:9px;margin:4px 0 0;color:#5f6f65}
      .doc-title{font-size:18px;margin:12px 0;color:#10472f}.doc-meta{display:flex;justify-content:space-between;gap:10px;margin-bottom:14px}.doc-box{border:1px solid #dce5de;border-radius:6px;padding:9px;margin-bottom:12px;line-height:1.5}.doc-box h3{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#46725a;margin:0 0 5px}.doc-table{width:100%;border-collapse:collapse;margin:10px 0 12px}.doc-table th{background:#edf4ee;text-align:left;color:#24533b}.doc-table th,.doc-table td{padding:7px 5px;border-bottom:1px solid #e1e8e2;font-size:10px}.doc-table .num{text-align:right;white-space:nowrap}.doc-total{width:65%;margin-left:auto}.doc-total div{display:flex;justify-content:space-between;padding:4px 0}.doc-total .grand{border-top:1px solid #165b3c;margin-top:4px;padding-top:8px;font-weight:bold;font-size:13px;color:#125335}.doc-foot{border-top:1px solid #dce5de;margin-top:18px;padding-top:8px;color:#65756b;font-size:9px;text-align:center}.doc-status{display:inline-block;border-radius:20px;background:#edf4ee;padding:4px 8px;color:#145b39;font-weight:bold}
      .document-shell,.document-shell *{box-sizing:border-box}
      .doc-table{table-layout:fixed;width:100%;overflow-wrap:anywhere}
      .doc-table th,.doc-table td{overflow-wrap:anywhere;word-break:normal}
      .doc-table th:first-child,.doc-table td:first-child{width:43%}
      .invoice-sheet .doc-table th:nth-child(2),.invoice-sheet .doc-table td:nth-child(2){width:12%}
      .invoice-sheet .doc-table th:nth-child(3),.invoice-sheet .doc-table td:nth-child(3){width:20%}
      .invoice-sheet .doc-table th:nth-child(4),.invoice-sheet .doc-table td:nth-child(4){width:25%}
      .doc-meta>div{min-width:0;max-width:50%;overflow-wrap:anywhere}
      .doc-box{overflow-wrap:anywhere;word-break:normal}
      @page{size:A5 portrait;margin:0}
      @media print{
        html,body{width:148mm!important;min-width:0!important;max-width:148mm!important;margin:0!important;padding:0!important;overflow:visible!important;background:#fff!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        body *{visibility:hidden!important}
        .document-shell,.document-shell *{visibility:visible!important}
        .document-shell{position:fixed!important;left:0!important;top:0!important;width:148mm!important;max-width:148mm!important;min-width:0!important;margin:0!important;padding:0!important;overflow:visible!important;background:#fff!important}
        .document-toolbar,.no-print{display:none!important;visibility:hidden!important}
        .a5-sheet{display:block;box-sizing:border-box!important;width:148mm!important;min-width:0!important;max-width:148mm!important;height:210mm!important;min-height:210mm!important;max-height:210mm!important;margin:0!important;padding:8mm!important;border:0!important;border-radius:0!important;box-shadow:none!important;overflow:hidden!important;page-break-after:always!important;break-after:page!important;font-size:10px!important}
        .a5-sheet:last-child{page-break-after:auto!important;break-after:auto!important}
        .doc-brand img{max-width:32mm!important;max-height:18mm!important}
        .doc-table{width:100%!important;table-layout:fixed!important;border-collapse:collapse!important}
        .doc-table th,.doc-table td{font-size:9px!important;padding:5px 3px!important;overflow-wrap:anywhere!important}
        .doc-total{width:72%!important;max-width:100%!important}
        .print-packing .invoice-sheet{display:none!important}
        .print-invoice .packing-sheet{display:none!important}
        .print-both .packing-sheet,.print-both .invoice-sheet{display:block!important}
      }
    `}</style>

    <div className="document-toolbar no-print">
      <a href="/admin/orders"><ArrowLeft size={15}/> Back to Orders</a>
      <button onClick={() => printAs("packing")}><Printer size={15}/> Print Packing Slip</button>
      <button onClick={() => printAs("invoice")}><Printer size={15}/> Print Invoice</button>
      <button onClick={() => printAs("both")}><Printer size={15}/> Print Both (A5)</button>
      <button onClick={() => printAs("packing")}><Download size={15}/> Packing Slip PDF</button>
      <button onClick={() => printAs("invoice")}><Download size={15}/> Invoice PDF</button>
      <button onClick={() => printAs("both")}><FileText size={15}/> Both PDFs / Print</button>
    </div>
    <p className="document-hint no-print">For PDF, choose “Save as PDF” in your browser’s print destination. Each document is formatted for A5 paper.</p>

    <div className={`print-${mode}`}>
      <section className="a5-sheet packing-sheet">
        <div className="doc-brand"><div><img src="/logo.png" alt="Anant Tea"/><p>Premium Assam Tea</p></div><div style={{textAlign:"right"}}><h1>PACKING SLIP</h1><p>Order #{order.orderNumber}</p></div></div>
        <div className="doc-meta"><div><b>Order Date</b><br/>{created}</div><div style={{textAlign:"right"}}><b>Order Status</b><br/><span className="doc-status">{order.orderStatus}</span></div></div>
        <div className="doc-box"><h3>Ship To</h3><b>{order.customerName}</b><br/>{order.address}<br/>{order.city}, {order.state} - {order.pincode}<br/>Phone: {order.customerPhone}</div>
        <h2 className="doc-title">Items to pack</h2>
        <table className="doc-table"><thead><tr><th>Product</th><th>Pack</th><th className="num">Qty</th></tr></thead><tbody>{order.items.map(item=><tr key={item.id}><td>{item.productName}</td><td>{item.packSize}</td><td className="num">{item.quantity}</td></tr>)}</tbody></table>
        <div className="doc-box"><h3>Fulfilment note</h3>Please verify product, pack size and quantity before sealing the parcel.</div>
        <div className="doc-foot">Thank you for choosing Anant Tea. Packed with care.</div>
      </section>

      <section className="a5-sheet invoice-sheet">
        <div className="doc-brand"><div><img src="/logo.png" alt="Anant Tea"/><p>Premium Assam Tea</p></div><div style={{textAlign:"right"}}><h1>INVOICE</h1><p>Order #{order.orderNumber}</p></div></div>
        <div className="doc-meta"><div><b>Invoice Date</b><br/>{created}</div><div style={{textAlign:"right"}}><b>Payment</b><br/>{order.paymentMethod} · {order.paymentStatus}</div></div>
        <div className="doc-box"><h3>Billed / Delivered To</h3><b>{order.customerName}</b><br/>{order.address}<br/>{order.city}, {order.state} - {order.pincode}<br/>Phone: {order.customerPhone}{order.customerEmail ? <><br/>{order.customerEmail}</> : null}</div>
        <table className="doc-table"><thead><tr><th>Item</th><th className="num">Qty</th><th className="num">Rate</th><th className="num">Amount</th></tr></thead><tbody>{order.items.map(item=><tr key={item.id}><td>{item.productName}<br/><span style={{color:"#65756b"}}>{item.packSize}</span></td><td className="num">{item.quantity}</td><td className="num">{formatINR(item.price)}</td><td className="num">{formatINR(item.price*item.quantity)}</td></tr>)}</tbody></table>
        <div className="doc-total"><div><span>Items subtotal</span><b>{formatINR(order.subtotal || itemsTotal)}</b></div><div><span>Shipping</span><b>{formatINR(order.shipping)}</b></div>{order.discount>0&&<div><span>Discount{order.couponCode?` (${order.couponCode})`:""}</span><b>-{formatINR(order.discount)}</b></div>}<div className="grand"><span>Total</span><b>{formatINR(order.total)}</b></div></div>
        <div className="doc-foot">Thank you for your order!<br/>Please retain this invoice for your records.</div>
      </section>
    </div>
  </main>;
}
