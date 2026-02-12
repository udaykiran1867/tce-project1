"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useInventory } from "@/lib/inventory-context"
import { logsAPI } from "@/lib/api"

export default function MonthlyTransactionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { getMonthlyReport, products } = useInventory()
  const [reportRows, setReportRows] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadError, setLoadError] = useState("")

  const yearParam = searchParams.get("year")
  const monthParam = searchParams.get("month")
  const monthlyData = getMonthlyReport()

  const record = useMemo(() => {
    if (!yearParam || !monthParam) return null
    const yearNumber = parseInt(yearParam, 10)
    if (Number.isNaN(yearNumber)) return null
    return monthlyData.find(
      (m) => m.year === yearNumber && m.month === monthParam
    )
  }, [monthlyData, monthParam, yearParam])

  const fetchReport = async () => {
    if (!record) return
    setIsLoading(true)
    setLoadError("")
    try {
      const report = await logsAPI.getMonthlyProductReport(record.month, record.year)
      setReportRows(report?.rows || [])
    } catch (error) {
      setLoadError(error.message || "Failed to load report")
      setReportRows([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [record, products])

  const handleRefresh = async () => {
    if (!record) return
    setIsRefreshing(true)
    try {
      await fetchReport()
    } finally {
      setTimeout(() => setIsRefreshing(false), 300)
    }
  }

  return (
    <div className="monthly-page">
      <div className="monthly-hero">
        <div className="hero-content">
          <p className="eyebrow">Monthly Snapshot</p>
          <h1 className="hero-title">Monthly Transactions</h1>
          <p className="hero-subtitle">
            {record ? `${record.month} ${record.year}` : "Month not found"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-outline"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            className="btn-outline"
            onClick={() => router.back()}
          >
            Back
          </button>
        </div>
      </div>

      <div className="card-shell">
        <div className="card-header">
          <div>
            <p className="card-title">Inventory Details</p>
            <p className="card-caption">Line item breakdown for the month</p>
          </div>
          <div className="chip">{reportRows.length} items</div>
        </div>

        {isLoading ? (
          <div className="state-text">Loading report...</div>
        ) : loadError ? (
          <div className="state-text error">{loadError}</div>
        ) : reportRows.length === 0 ? (
          <div className="state-text">No records found for this month.</div>
        ) : (
          <div className="table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Sl.No</th>
                  <th>Particulars</th>
                  <th className="text-right">OP Bal</th>
                  <th className="text-right">Addition</th>
                  <th className="text-right">Scrap</th>
                  <th className="text-right">Utilised</th>
                  <th className="text-right">Closing Stock</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.map((row, index) => (
                  <tr key={row.productId}>
                    <td>{index + 1}</td>
                    <td className="name-cell">{row.productName}</td>
                    <td className="text-right">{row.openingStock ?? "-"}</td>
                    <td className="text-right accent-add">{row.additions ?? "-"}</td>
                    <td className="text-right accent-scrap">{row.scrap ?? "-"}</td>
                    <td className="text-right accent-util">{row.utilized ?? "-"}</td>
                    <td className="text-right accent-close">{row.closingStock ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx global>{`
        .monthly-page {
          --ink: #0d1b1e;
          --mid: #49606b;
          --glow: #e7f1f7;
          --brand: #125e70;
          --brand-2: #0b3c4a;
          --accent-add: #0f8a5f;
          --accent-scrap: #d97706;
          --accent-util: #1d4ed8;
          --accent-close: #111827;
          min-height: 100vh;
          padding: 28px 20px 36px;
          display: flex;
          flex-direction: column;
          gap: 22px;
          background:
            radial-gradient(1400px 500px at 10% -10%, #eff6ff 0%, transparent 60%),
            radial-gradient(900px 400px at 90% 0%, #e0f2fe 0%, transparent 55%),
            linear-gradient(180deg, #f7fafc 0%, #ffffff 45%, #f8fafc 100%);
          color: var(--ink);
          font-family: "Space Grotesk", "Segoe UI", "Trebuchet MS", sans-serif;
          position: relative;
          overflow: hidden;
        }

        .monthly-page::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: radial-gradient(#d7e3ea 1px, transparent 1px);
          background-size: 28px 28px;
          opacity: 0.35;
          pointer-events: none;
        }

        .monthly-hero {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 20px;
          border-radius: 18px;
          background: linear-gradient(135deg, #ffffff 0%, #eef6fa 100%);
          border: 1px solid #d8e2e8;
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
          animation: riseIn 420ms ease-out;
        }

        .hero-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .eyebrow {
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 11px;
          color: var(--mid);
          font-weight: 600;
        }

        .hero-title {
          font-size: 32px;
          line-height: 1.1;
          font-weight: 700;
          color: #200a41;
        }

        .hero-subtitle {
          font-size: 14px;
          color: var(--mid);
          font-weight: 500;
        }

        .btn-outline {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: 38px;
          padding: 0 16px;
          border-radius: 999px;
          border: 1px solid #c7d3dc;
          background: #ffffff;
          color: var(--brand-2);
          font-size: 13px;
          font-weight: 600;
          transition: transform 150ms ease, box-shadow 150ms ease, background 150ms ease;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
        }

        .btn-outline:hover {
          background: #f1f5f9;
          transform: translateY(-1px);
        }

        .btn-outline:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .card-shell {
          position: relative;
          z-index: 1;
          border-radius: 18px;
          border: 1px solid #d5dee6;
          background: #ffffff;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.1);
          overflow: hidden;
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 18px 20px;
          border-bottom: 1px solid #edf2f6;
          background: linear-gradient(120deg, #f8fafc 0%, #f0f7fb 100%);
        }

        .card-title {
          font-size: 16px;
          font-weight: 700;
        }

        .card-caption {
          font-size: 13px;
          color: var(--mid);
        }

        .chip {
          padding: 6px 12px;
          border-radius: 999px;
          background: #e6f1f6;
          color: var(--brand);
          font-size: 12px;
          font-weight: 700;
        }

        .state-text {
          padding: 22px 20px;
          font-size: 14px;
          color: var(--mid);
        }

        .state-text.error {
          color: #b91c1c;
        }

        .table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .report-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .report-table thead {
          background: #f3f7fa;
        }

        .report-table th {
          text-align: left;
          padding: 12px 16px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--mid);
        }

        .report-table th.text-right {
          text-align: right;
        }

        .report-table td {
          padding: 14px 16px;
          border-top: 1px solid #eef2f6;
        }

        .report-table tbody tr {
          transition: background 150ms ease;
        }

        .report-table tbody tr:hover {
          background: #f8fafc;
        }

        .name-cell {
          font-weight: 600;
        }

        .accent-add {
          color: var(--accent-add);
          font-weight: 600;
        }

        .accent-scrap {
          color: var(--accent-scrap);
          font-weight: 600;
        }

        .accent-util {
          color: var(--accent-util);
          font-weight: 600;
        }

        .accent-close {
          color: var(--accent-close);
          font-weight: 600;
        }

        @keyframes riseIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .monthly-hero {
            flex-direction: column;
            align-items: flex-start;
          }

          .hero-title {
            font-size: 26px;
          }
        }
      `}</style>
    </div>
  )
}
