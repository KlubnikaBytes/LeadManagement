import { useState, useRef, useEffect } from 'react'
import { Upload, FileSpreadsheet, X, Download, CheckCircle2, AlertCircle, UserCheck } from 'lucide-react'
import { leadsService } from '../services/leads.service'
import { usersService } from '../services/users.service'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export const ImportPage = () => {
  const { user, isAdmin, isTeamLeader } = useAuth()
  const [file, setFile] = useState(null)
  const [assignedTo, setAssignedTo] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [salesUsers, setSalesUsers] = useState([])
  const fileInputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    if (isAdmin || isTeamLeader) {
      usersService.getSalesUsers().then(res => setSalesUsers(res.data.data)).catch(() => {})
    }
  }, [isAdmin, isTeamLeader])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) setFile(dropped)
  }

  const handleSubmit = async () => {
    if (!file) { toast.error('Please select an Excel or CSV file'); return }
    setLoading(true)
    setResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (assignedTo && (isAdmin || isTeamLeader)) {
        formData.append('assignedTo', assignedTo)
      }
      const res = await leadsService.import(formData)
      setResult(res.data.data)
      toast.success(`Import complete: ${res.data.data.imported} leads imported successfully!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to import file')
    } finally {
      setLoading(false)
    }
  }

  const downloadExcelTemplate = async () => {
    setDownloadingTemplate(true)
    try {
      const res = await leadsService.downloadTemplate()
      const url = window.URL.createObjectURL(new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'leads_sample_template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Sample Excel template downloaded')
    } catch {
      toast.error('Failed to download Excel template')
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const csvTemplate = `Company Name,Business Category,Sub Category,Website,Address,City,State,Country,Pincode,Business Description,POC Name,POC Job Title,POC Phone,POC Alt Phone,POC Email,POC LinkedIn,POC Talk Notes,Type of Reach,Reach Notes,Status,Priority,Interested In,Estimated Budget,General Notes
Sharma Enterprises,Restaurant,Cafe & Bakery,https://sharmacafe.example.com,12/A Park Street,Kolkata,West Bengal,India,700016,Family cafe planning online ordering portal,Rajesh Sharma,Managing Director,9876543210,9876543211,rajesh@sharmacafe.example.com,,Spoke briefly; excited to digitize menu,Cold Call,Direct outreach,NEW,HIGH,Mobile App Development,₹1,50,000 - ₹2,50,000,Follow up Tuesday morning
Gupta Dental Care,Healthcare,Dental Clinic,https://guptadental.example.com,45 MG Road,Mumbai,Maharashtra,India,400001,Expanding dental practice,Dr. Priya Gupta,Owner,9123456780,,drpriya@guptadental.example.com,,Needs appointment scheduling site,Instagram,Ad campaign reply,NEW,MEDIUM,Website Development,₹75,000 - ₹1,00,000,Prefers weekend updates`

  const downloadCsvTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'leads_sample_template.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Import Leads</h1>
        <p className="text-muted mt-1">Upload an Excel (.xlsx / .xls) or CSV sheet to bulk import leads directly into KlubCRM</p>
      </div>

      <div className="card p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-kb-sand">
          <div>
            <h3 className="section-header">Upload Spreadsheet</h3>
            <p className="text-xs text-kb-muted mt-0.5">Quickly import all records at once with automatic duplicate protection</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadExcelTemplate}
              disabled={downloadingTemplate}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
              title="Download Microsoft Excel formatted template"
            >
              <Download className="w-3.5 h-3.5 text-kb-strawberry" />
              <span>{downloadingTemplate ? 'Downloading...' : 'Excel Template (.xlsx)'}</span>
            </button>
            <button
              onClick={downloadCsvTemplate}
              className="btn-ghost text-xs py-1.5 px-2.5 text-kb-muted hover:text-kb-cocoa"
              title="Download plain CSV template"
            >
              CSV
            </button>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
            dragging
              ? 'border-kb-strawberry bg-kb-strawberry-tint'
              : 'border-kb-sand bg-kb-cream hover:border-kb-umber hover:bg-kb-cream-deep'
          }`}
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            onChange={e => {
              if (e.target.files?.[0]) setFile(e.target.files[0])
            }}
            className="hidden"
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-kb-teal-bg border border-kb-teal-border flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-kb-teal-fg" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-kb-cocoa">{file.name}</p>
                <p className="text-xs text-kb-muted">{(file.size / 1024).toFixed(1)} KB · Ready to import</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
                className="btn-icon text-kb-crimson ml-3 hover:bg-kb-lost-bg"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <div className="w-12 h-12 rounded-full bg-kb-cream-deep border border-kb-sand flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6 text-kb-strawberry" />
              </div>
              <p className="text-kb-cocoa font-medium">Drop your Excel (.xlsx, .xls) or CSV file here</p>
              <p className="text-xs text-kb-muted mt-1">or click to browse from your device · Max file size 10MB</p>
            </div>
          )}
        </div>

        {/* Ownership / Assignment Option */}
        {isAdmin || isTeamLeader ? (
          <div>
            <label className="label">Assign Imported Leads To (Optional)</label>
            <select
              className="input"
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
            >
              <option value="">Unassigned (Team can claim or assign later)</option>
              {salesUsers.map(u => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role?.replace('_', ' ')})
                </option>
              ))}
            </select>
            <p className="text-xs text-kb-muted mt-1">Leave unassigned to distribute leads to sales executives later</p>
          </div>
        ) : (
          <div className="bg-kb-cream-deep border border-kb-sand rounded-xl p-3.5 flex items-center gap-3 text-xs text-kb-cocoa">
            <div className="w-8 h-8 rounded-lg bg-kb-white border border-kb-sand flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-4 h-4 text-kb-strawberry" />
            </div>
            <div>
              <p className="font-semibold text-kb-cocoa">Automatic Self-Assignment</p>
              <p className="text-kb-muted mt-0.5">All leads uploaded from this file will be automatically assigned to you ({user?.name})</p>
            </div>
          </div>
        )}

        {/* Column Reference */}
        <div className="bg-kb-cream-deep border border-kb-sand rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-kb-cocoa uppercase tracking-wider">Accepted Spreadsheet Columns</p>
            <span className="text-[11px] text-kb-muted">Order of columns does not matter</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <p className="text-kb-cocoa font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-kb-strawberry inline-block" />
              Mandatory: <span className="font-mono text-kb-strawberry">POC Name</span>, <span className="font-mono text-kb-strawberry">POC Phone</span>
            </p>
            <p className="text-kb-muted leading-relaxed">
              <span className="font-semibold text-kb-cocoa">Optional fields:</span> Company Name, Business Category, Sub Category, Website, Address, City, State, Country, Pincode, Business Description, POC Job Title, POC Alt Phone, POC Email, POC LinkedIn, POC Talk Notes, Type of Reach, Reach Notes, Status, Priority, Interested In, Estimated Budget, General Notes
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !file}
          className="btn-primary w-full justify-center py-3 text-sm font-semibold"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-kb-sand border-t-kb-white animate-spin" />
              Processing & Importing Leads...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Import Leads from File
            </>
          )}
        </button>
      </div>

      {/* Results Section */}
      {result && (
        <div className="card p-5 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between pb-2 border-b border-kb-sand">
            <h3 className="section-header">Import Summary</h3>
            <span className="text-xs text-kb-muted">Batch ID: {new Date().toLocaleTimeString()}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total In File', value: result.total, color: 'text-kb-cocoa' },
              { label: 'Imported', value: result.imported, color: 'text-kb-won-fg' },
              { label: 'Duplicates Skipped', value: result.duplicates, color: 'text-kb-amber-fg' },
              { label: 'Invalid Rows', value: result.invalid, color: 'text-kb-crimson' },
            ].map(s => (
              <div key={s.label} className="bg-kb-cream-deep border border-kb-sand rounded-xl p-3 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[11px] text-kb-muted mt-1 uppercase font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          {result.imported > 0 && (
            <div className="p-3 bg-kb-won-bg border border-kb-won-border rounded-xl flex items-center gap-2 text-xs text-kb-won-fg">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Successfully added {result.imported} leads! They are now live in the system and visible on your Leads list.</span>
            </div>
          )}

          {result.duplicateLeads?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-kb-amber-fg uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Duplicate Records Skipped ({result.duplicateLeads.length}):
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {result.duplicateLeads.map((d, i) => (
                  <div key={i} className="text-xs text-kb-text bg-kb-amber-bg border border-kb-amber-border rounded-lg p-2.5 flex items-center justify-between">
                    <span className="font-medium">Row {d.row}: {d.name || 'Unnamed'} ({d.phone})</span>
                    <span className="text-[11px] text-kb-amber-fg font-medium">Already exists</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.errors?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-kb-crimson uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Invalid Rows ({result.errors.length}):
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {result.errors.map((e, i) => (
                  <div key={i} className="text-xs text-kb-text bg-kb-lost-bg border border-kb-lost-border rounded-lg p-2.5">
                    <span className="font-semibold text-kb-crimson">Row {e.row}:</span> {e.errors.join('; ')}
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
