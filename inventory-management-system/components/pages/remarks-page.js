"use client"

import { useEffect, useMemo, useState } from "react"
import { logsAPI } from "@/lib/api"
import { NotebookText, RefreshCw, AlertCircle, Package, Calendar, Hash, MessageSquare } from "lucide-react"

const formatDate = (value) => {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString()
}

export function RemarksPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchRemarks = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await logsAPI.getDefectiveRemarks(1000)
      setRows(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || "Failed to load remarks")
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRemarks()
  }, [])

  const grouped = useMemo(() => {
    const map = new Map()
    rows.forEach((row) => {
      const key = row.productName || "Unknown product"
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key).push(row)
    })
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [rows])

  const totalDefective = useMemo(() => {
    return rows.reduce((sum, row) => sum + (row.quantity || 0), 0)
  }, [rows])

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ color: "oklch(24.571% 0.12604 288.685)" }}
          >
            Defective Remarks
          </h1>
          <p className="text-sm text-muted-foreground">
            Track and monitor component-wise defective item history
          </p>
        </div>

        <button
          type="button"
          onClick={fetchRemarks}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 hover:bg-purple-700 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Total Entries</p>
              <p className="mt-2 text-3xl font-bold text-purple-900">{rows.length}</p>
            </div>
            <div className="rounded-full bg-purple-200 p-3">
              <NotebookText className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">Total Defective</p>
              <p className="mt-2 text-3xl font-bold text-orange-900">{totalDefective}</p>
            </div>
            <div className="rounded-full bg-orange-200 p-3">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Components</p>
              <p className="mt-2 text-3xl font-bold text-blue-900">{grouped.length}</p>
            </div>
            <div className="rounded-full bg-blue-200 p-3">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-purple-700 to-purple-500 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 p-2">
                <NotebookText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Defective Records</h2>
                <p className="text-xs text-purple-100 mt-0.5">Component-wise breakdown</p>
              </div>
            </div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold text-white backdrop-blur-sm">
              {rows.length} records
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <RefreshCw className="h-8 w-8 text-purple-600 animate-spin" />
            <p className="text-sm font-medium text-gray-600">Loading remarks...</p>
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <div className="rounded-full bg-gray-100 p-4">
              <NotebookText className="h-8 w-8 text-gray-400" />
            </div>
            <p className="font-medium text-gray-900">No Defective Remarks</p>
            <p className="text-sm text-gray-500">No defective items have been recorded yet</p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {grouped.map(([component, entries]) => {
              const componentTotal = entries.reduce((sum, e) => sum + (e.quantity || 0), 0)
              return (
                <div key={component} className="rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-5 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-purple-600" />
                        <h3 className="font-bold text-gray-900">{component}</h3>
                      </div>
                      <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                        {componentTotal} defective
                      </span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-5 py-3 text-left">
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                              <Calendar className="h-3.5 w-3.5" />
                              Date
                            </div>
                          </th>
                          <th className="px-5 py-3 text-left">
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                              <Hash className="h-3.5 w-3.5" />
                              Quantity
                            </div>
                          </th>
                          <th className="px-5 py-3 text-left">
                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                              <MessageSquare className="h-3.5 w-3.5" />
                              Remarks
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {entries.map((entry, idx) => (
                          <tr key={entry.id} className="hover:bg-purple-50/50 transition-colors">
                            <td className="px-5 py-3 text-sm text-gray-600">
                              {formatDate(entry.createdAt)}
                            </td>
                            <td className="px-5 py-3">
                              <span className="inline-flex items-center rounded-md bg-orange-100 px-2.5 py-1 text-sm font-semibold text-orange-700">
                                {entry.quantity || 0}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              {entry.remarks && entry.remarks !== "-" ? (
                                <span className="text-sm text-gray-700 font-medium">{entry.remarks}</span>
                              ) : (
                                <span className="text-sm text-gray-400 italic">No remarks</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
