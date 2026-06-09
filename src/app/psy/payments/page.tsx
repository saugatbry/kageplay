"use client";
import React from "react";
import { usePremiumStore } from "@/store/premium-store";
import { Check, X, Clock, CheckCircle, XCircle } from "lucide-react";

const PaymentsPage = () => {
  const { payments, approvePayment, rejectPayment } = usePremiumStore();

  const pending = payments.filter((p) => p.status === "pending");
  const history = payments.filter((p) => p.status !== "pending");

  return (
    <div className="space-y-8 max-w-5xl">
      <h1 className="text-2xl font-bold">Payments</h1>

      {/* Pending */}
      <div className="bg-slate-900 border border-white/5 rounded-xl p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-400" />
          Pending Approval ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">No pending payments</p>
        ) : (
          <div className="space-y-3">
            {pending.map((p) => (
              <div key={p.id} className="bg-slate-800 rounded-lg p-4 border border-white/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold">{p.username}</p>
                    <p className="text-xs text-gray-400">{p.email}</p>
                    <p className="text-xs text-gray-500">
                      UTR: <span className="font-mono text-amber-400">{p.utr}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      Amount: <span className="font-bold text-green-400">₹{p.amount}</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(p.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approvePayment(p.id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" /> Approve
                    </button>
                    <button
                      onClick={() => rejectPayment(p.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <X className="h-3 w-3" /> Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-slate-900 border border-white/5 rounded-xl p-5">
        <h2 className="font-semibold mb-4">History ({history.length})</h2>
        {history.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">No payment history</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-xs border-b border-white/5">
                  <th className="text-left py-2">User</th>
                  <th className="text-left py-2">UTR</th>
                  <th className="text-left py-2">Amount</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((p) => (
                  <tr key={p.id} className="border-b border-white/5 last:border-0">
                    <td className="py-2">{p.username}</td>
                    <td className="py-2 font-mono text-xs text-gray-400">{p.utr}</td>
                    <td className="py-2">₹{p.amount}</td>
                    <td className="py-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                        p.status === "approved" ? "text-green-400" : "text-red-400"
                      }`}>
                        {p.status === "approved" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2 text-xs text-gray-400">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentsPage;
