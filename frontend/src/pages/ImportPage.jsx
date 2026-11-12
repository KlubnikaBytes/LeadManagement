import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { leadsService } from '../services/leads.service'
import { usersService } from '../services/users.service'
import { useAuth } from '../context/AuthContext'
import { useEffect } from 'react'
import toast from 'react-hot-toast'

export const ImportPage = () => {
  const { canImport } = useAuth()
  const [file, setFile] = useState(null)
  const [assignedTo, setAssignedTo] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [salesUsers, setSalesUsers] = useState([])
  const fileInputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    usersService.getSalesUsers().then(res => setSalesUsers(res.data.data)).catch(() => {})
  }, [])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) setFile(dropped)
  }

  const handleSubmit = async () => {
    if (!file) { toast.error('Please select a file'); return }
    setLoading(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (assignedTo) formData.append('assignedTo', assignedTo)
      const res = await leadsService.import(formData)
      setResult(res.data.data)
      toast.success(`Import complete: ${res.data.data.imported} leads imported!`)
    } catch {} finally {
      setLoading(false)
    }
  }

  const csvTemplate = `Name,Company,Phone,Email,City,State,Source,InterestedIn,BusinessType\nRahul Sharma,ABC Restaurant,9876543210,rahul@gmail.com,Mumbai,Maharashtra,Instagram,Website Development,Restaurant\nPriya Gupta,XYZ Salon,9123456789,priya@salon.com,Delhi,Delhi,Google,Mobile App,Salon`

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'leads_template.csv'
    a.click()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Import Leads</h1>
        <p className="text-muted mt-1">Upload CSV or Excel file to bulk import leads</p>
      </div>

      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-300">Upload File</h3>
          <button onClick={downloadTemplate} className="btn-ghost text-sm text-primary-400 hover:text-primary-300">
            Download Template
          </button>
        </div>

        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${dragging ? 'border-primary-500 bg-primary-500/10' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'}`}
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={e => setFile(e.target.files[0])} className="hidden" />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
              <div className="text-left">
                <p className="font-semibold text-slate-200">{file.name}</p>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setFile(null) }} className="btn-icon text-red-400 ml-2">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Drop your file here, or click to browse</p>
              <p className="text-xs text-slate-600 mt-1">Supports CSV, XLSX, XLS — Max 10MB</p>
            </div>
          )}
        </div>

        {/* Assign To */}
        <div>
          <label className="label">Assign All Leads To (Optional)</label>
          <select className="input" value={assignedTo} onChange={e => setAssignedTo(e.target.value)}>
            <option value="">Unassigned</option>
            {salesUsers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
        </div>

        {/* Expected Columns */}
        <div className="bg-slate-800/50 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Expected CSV Columns</p>
          <p className="text-xs text-slate-500 font-mono leading-relaxed">
            Name, Company, Phone, Email, City, State, Country, Source, Status, Priority, InterestedIn, Budget, Website, AlternatePhone, BusinessType
          </p>
        </div>

        <button onClick={handleSubmit} disabled={loading || !file} className="btn-primary w-full justify-center py-3">
          {loading ? (
            <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Importing...</>
          ) : (
            <><Upload className="w-4 h-4" /> Import Leads</>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="card p-5 space-y-4 animate-slide-up">
          <h3 className="font-semibold text-slate-300">Import Results</h3>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total Records', value: result.total, color: 'text-slate-200' },
              { label: 'Successfully Imported', value: result.imported, color: 'text-green-400' },
              { label: 'Duplicates Skipped', value: result.duplicates, color: 'text-amber-400' },
              { label: 'Invalid Records', value: result.invalid, color: 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="bg-slate-800/50 rounded-xl p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {result.errors?.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-red-400">Invalid Records:</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {result.errors.map((e, i) => (
                  <div key={i} className="text-xs text-slate-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                    <span className="font-semibold">Row {e.row}:</span> {e.errors.join(', ')}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.duplicateLeads?.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-amber-400">Duplicate Records Skipped:</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {result.duplicateLeads.map((d, i) => (
                  <div key={i} className="text-xs text-slate-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                    Row {d.row}: {d.name} ({d.phone}) — already exists
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
