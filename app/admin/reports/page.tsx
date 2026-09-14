"use client";
import { useEffect, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { formatINR } from "@/lib/data";

type Data = {
  summary: {
    totalOrders: number; deliveredOrders: number; cancelledOrders: number;
    customers: number; newCustomers: number; grossSales: number;
    discounts: number; netSales: number; monthSales: number; todaySales: number;
  };
  daily: { day: string; value: number; orders: number }[];
};

export default function Reports() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  async function load() {
    try { const r = await fetch("/api/admin/reports", { cache: "no-store" }); const d = await r.json(); if (!r.ok) throw new Error(d.error); setData(d); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load reports."); }
  }
  useEffect(() => { load(); }, []);
  function exportCsv() {
    if (!data) return;
    const rows = [
      ["Metric", "Value"], ["Net sales", data.summary.netSales], ["Gross merchandise sales", data.summary.grossSales],
      ["Discounts", data.summary.discounts], ["Total orders", data.summary.totalOrders],
      ["Delivered orders", data.summary.deliveredOrders], ["Cancelled orders", data.summary.cancelledOrders],
      ["Customers", data.summary.customers], ["New customers today", data.summary.newCustomers],
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `anant-tea-sales-report-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }
  const max = Math.max(...(data?.daily.map(x => x.value) ?? [1]), 1);
  return <>
    <div className="admin-top"><div><div className="eyebrow">Analytics</div><h1>Sales Reports</h1><p className="admin-muted">Merchandise sales only — shipping revenue, best-selling products and best-selling categories are excluded.</p></div><div className="admin-actions"><button className="outline-btn" onClick={load}><RefreshCw size={15}/> Refresh</button><button className="primary-btn" onClick={exportCsv} disabled={!data}><Download size={15}/> Export CSV</button></div></div>
    {error && <div className="admin-alert">{error}</div>}
    {data && <>
      <div className="stats"><Stat t="Today's Sales" v={formatINR(data.summary.todaySales)}/><Stat t="This Month" v={formatINR(data.summary.monthSales)}/><Stat t="Net Sales" v={formatINR(data.summary.netSales)}/><Stat t="Discounts" v={formatINR(data.summary.discounts)}/></div>
      <div className="admin-card"><h2>Last 7 Days</h2><div className="report-bars">{data.daily.map(x => <div key={x.day} className="report-bar"><div className="report-bar-value">{formatINR(x.value)}</div><div className="report-bar-track"><span style={{height:`${Math.max(4, x.value/max*100)}%`}}/></div><small>{x.day}</small><em>{x.orders} orders</em></div>)}</div></div>
      <div className="admin-card"><h2>Order Summary</h2><table className="admin-table"><tbody><tr><td>Gross merchandise sales</td><td>{formatINR(data.summary.grossSales)}</td></tr><tr><td>Discounts given</td><td>{formatINR(data.summary.discounts)}</td></tr><tr><td><b>Net merchandise sales</b></td><td><b>{formatINR(data.summary.netSales)}</b></td></tr><tr><td>Total orders</td><td>{data.summary.totalOrders}</td></tr><tr><td>Delivered orders</td><td>{data.summary.deliveredOrders}</td></tr><tr><td>Cancelled orders</td><td>{data.summary.cancelledOrders}</td></tr><tr><td>Total customers</td><td>{data.summary.customers}</td></tr><tr><td>New customers today</td><td>{data.summary.newCustomers}</td></tr></tbody></table></div>
    </>}
  </>;
}
function Stat({t,v}:{t:string;v:string}) { return <div className="stat"><small>{t}</small><strong>{v}</strong></div>; }
