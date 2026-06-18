"use client";
import { useState, useEffect } from "react";
import { usePremiumStore } from "@/store/premium-store";
import { useSettingsStore } from "@/store/settings-store";
import { Users, Banknote, ShieldCheck, X, Clock, Eye, EyeOff } from "lucide-react";

const PsyPage = () => {
  const {
    allPremiumUsers, grantPremium, revokePremium,
    payments, loadPremiumUsers, loading,
  } = usePremiumStore();
  const { adsEnabled, setAdsEnabled, load: loadSettings } = useSettingsStore();
  const [showGrant, setShowGrant] = useState(false);
  const [grantUsername, setGrantUsername] = useState("");
  const [grantEmail, setGrantEmail] = useState("");

  useEffect(() => {
    loadPremiumUsers();
    loadSettings();
  }, [loadPremiumUsers, loadSettings]);

  const activePremiums = allPremiumUsers.filter((u) => u.active);
  const pendingPayments = payments.filter((p) => p.status === "pending");

  const handleGrant = async () => {
    if (!grantUsername.trim()) return;
    await grantPremium(grantUsername.trim(), grantEmail.trim(), "monthly", "admin");
    setGrantUsername("");
    setGrantEmail("");
    setShowGrant(false);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Active Premium", value: activePremiums.length, icon: ShieldCheck, color: "text-green-400 bg-green-500/10" },
          { label: "Pending Payments", value: pendingPayments.length, icon: Clock, color: "text-amber-400 bg-amber-500/10" },
          { label: "Total Payments", value: payments.length, icon: Banknote, color: "text-blue-400 bg-blue-500/10" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-900 border border-white/5 rounded-xl p-4">
            <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-gray-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Premium Users */}
      <div className="bg-slate-900 border border-white/5 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-400" />
            Premium Users ({activePremiums.length})
          </h2>
          <button
            onClick={() => setShowGrant(true)}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-xs font-semibold transition-colors"
          >
            + Grant Premium
          </button>
        </div>

        {loading && <p className="text-gray-500 text-sm py-4 text-center">Loading...</p>}

        {!loading && showGrant && (
          <div className="bg-slate-800 rounded-lg p-4 mb-4 border border-green-500/20">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold">Grant Premium (1 month)</span>
              <button onClick={() => setShowGrant(false)} className="text-gray-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <input
                placeholder="Username"
                value={grantUsername}
                onChange={(e) => setGrantUsername(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700 rounded-lg text-sm"
              />
              <input
                placeholder="Email"
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-700 rounded-lg text-sm"
              />
              <button
                onClick={handleGrant}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-semibold"
              >
                Grant
              </button>
            </div>
          </div>
        )}

        {!loading && activePremiums.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">No premium users yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-xs border-b border-white/5">
                  <th className="text-left py-2">Username</th>
                  <th className="text-left py-2">Email</th>
                  <th className="text-left py-2">Expires</th>
                  <th className="text-right py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {allPremiumUsers.filter((u) => u.active).map((u) => (
                  <tr key={u.username} className="border-b border-white/5 last:border-0">
                    <td className="py-2">{u.username}</td>
                    <td className="py-2 text-gray-400">{u.email || "-"}</td>
                    <td className="py-2 text-xs text-gray-400">
                      {new Date(u.premiumUntil).toLocaleDateString()}
                    </td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => revokePremium(u.username)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* All Users (including inactive) */}
      {allPremiumUsers.length > activePremiums.length && (
        <div className="bg-slate-900 border border-white/5 rounded-xl p-5">
          <h2 className="font-semibold mb-3 text-sm text-gray-400">Expired / Revoked</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs border-b border-white/5">
                  <th className="text-left py-2">Username</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-right py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {allPremiumUsers.filter((u) => !u.active).map((u) => (
                  <tr key={u.username} className="border-b border-white/5 last:border-0 text-gray-500">
                    <td className="py-2">{u.username}</td>
                    <td className="py-2 text-xs text-red-400">Inactive</td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => {
                          grantPremium(u.username, u.email, "monthly", "admin");
                        }}
                        className="text-xs text-green-400 hover:text-green-300"
                      >
                        Re-grant
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Additional Tools */}
      <div className="bg-slate-900 border border-white/5 rounded-xl p-5">
        <h2 className="font-semibold mb-3">Tools</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-800 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-semibold flex items-center gap-2">
                {adsEnabled ? <Eye className="h-4 w-4 text-green-400" /> : <EyeOff className="h-4 w-4 text-red-400" />}
                Ads
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {adsEnabled ? "Ads showing, premium button visible" : "No ads, premium button hidden"}
              </p>
            </div>
            <button
              onClick={() => setAdsEnabled(!adsEnabled)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                adsEnabled ? "bg-green-600" : "bg-gray-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  adsEnabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <button
            onClick={() => { allPremiumUsers.forEach((u) => revokePremium(u.username)); }}
            className="w-full px-4 py-3 bg-red-600/10 border border-red-500/20 rounded-lg text-sm hover:bg-red-600/20 transition-colors text-left"
          >
            Clear All Premium
          </button>
        </div>
      </div>
    </div>
  );
};

export default PsyPage;
