import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, AlertCircle, Building2, User, Send, Briefcase, Globe, Phone, Mail, MapPin, MessageSquare } from 'lucide-react'
import { Country, State, City } from 'country-state-city'
import { useMemo } from 'react'
import { leadsService } from '../services/leads.service'
import { usersService } from '../services/users.service'
import { useAuth } from '../context/AuthContext'
import {
  BUSINESS_CATEGORIES,
  BUSINESS_CATEGORIES_MAP,
  REACH_TYPES,
  PRIORITIES,
  STATUSES,
  SERVICES,
} from '../utils/constants'
import toast from 'react-hot-toast'

const FormSection = ({ title, icon: Icon, description, children }) => (
  <div className="card p-5">
    <div className="flex items-center gap-2.5 mb-2 pb-3 border-b border-slate-800">
      {Icon && <Icon className="w-5 h-5 text-primary-400" />}
      <div>
        <h3 className="font-semibold text-slate-200 text-base">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
    </div>
    <div className="space-y-4 pt-2">{children}</div>
  </div>
)

const FormGroup = ({ label, required, error, hint, children }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <label className="label mb-0">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </div>
    {children}
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
  </div>
)

const CustomSelect = ({ options = [], value, onChange, placeholder }) => {
  const [isAdding, setIsAdding] = useState(false)
  const [customVal, setCustomVal] = useState('')

  if (isAdding) {
    return (
      <div className="flex gap-2">
        <input 
          autoFocus
          type="text" 
          className="input flex-1 py-1.5 px-3 text-sm" 
          placeholder="Type custom entry & hit Enter..." 
          value={customVal} 
          onChange={e => setCustomVal(e.target.value)} 
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              if (customVal.trim()) onChange(customVal.trim())
              setIsAdding(false)
            } else if (e.key === 'Escape') {
              setIsAdding(false)
            }
          }}
        />
        <button 
          type="button" 
          className="btn-primary px-3 text-xs"
          onClick={() => {
            if (customVal.trim()) onChange(customVal.trim())
            setIsAdding(false)
          }}
        >
          Add
        </button>
        <button 
          type="button" 
          className="btn-ghost px-2 text-slate-400 text-xs"
          onClick={() => setIsAdding(false)}
        >
          Cancel
        </button>
      </div>
    )
  }

  const allOptions = Array.from(new Set([...options, ...(value ? [value] : [])]))

  return (
    <select 
      className="input" 
      value={value || ''}
      onChange={e => {
        if (e.target.value === '__CUSTOM__') {
          setCustomVal('')
          setIsAdding(true)
        } else {
          onChange(e.target.value)
        }
      }}
    >
      <option value="" disabled>{placeholder}</option>
      {allOptions.map(o => <option key={o} value={o}>{o}</option>)}
      <option value="__CUSTOM__" className="font-semibold text-primary-400 bg-slate-800">
        + Add Custom...
      </option>
    </select>
  )
}

export const LeadFormPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin, isTeamLeader } = useAuth()
  const isEdit = !!id

  const [form, setForm] = useState({
    // 1. Prospective Business Info
    companyName: '',
    businessCategory: '',
    businessSubCategory: '',
    website: '',
    address: '',
    country: 'India',
    state: '',
    city: '',
    pincode: '',
    businessDescription: '',

    // 2. POC Details
    name: '', // POC Name
    pocJobTitle: '',
    phone: '',
    alternatePhone: '',
    email: '',
    pocLinkedIn: '',
    pocTalkNotes: '',

    // 3. Type of Reach
    typeOfReach: 'Cold Call',
    reachNotes: '',

    // 4. Sales & Engagement Details
    interestedIn: '',
    estimatedBudget: '',
    priority: 'MEDIUM',
    status: 'NEW',
    assignedTo: '',
    nextFollowUpAt: '',
    notes: '',
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [salesUsers, setSalesUsers] = useState([])
  const [duplicate, setDuplicate] = useState(null)
  const [loadingLead, setLoadingLead] = useState(isEdit)
  const [dynamicOptions, setDynamicOptions] = useState({
    sources: [],
    businessCategories: [],
    businessTypes: [],
    services: [],
    statuses: [],
    reachTypes: []
  })

  const fetchDynamicOptions = async () => {
    try {
      const res = await leadsService.getOptions()
      setDynamicOptions(res.data.data)
    } catch {}
  }

  // Geographic selector helpers
  const countries = useMemo(() => Country.getAllCountries(), [])
  const selectedCountry = useMemo(() => countries.find(c => c.name === form.country), [form.country, countries])
  
  const states = useMemo(() => {
    if (!selectedCountry) return []
    return State.getStatesOfCountry(selectedCountry.isoCode)
  }, [selectedCountry])
  
  const selectedState = useMemo(() => {
    if (!selectedCountry) return null
    return states.find(s => s.name === form.state)
  }, [form.state, states, selectedCountry])
  
  const cities = useMemo(() => {
    if (!selectedCountry || !selectedState) return []
    return City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode)
  }, [selectedCountry, selectedState])

  // Sub-category options based on selected Business Category
  const availableSubCategories = useMemo(() => {
    if (!form.businessCategory) return []
    return BUSINESS_CATEGORIES_MAP[form.businessCategory] || []
  }, [form.businessCategory])

  useEffect(() => {
    fetchDynamicOptions()
    if (isAdmin || isTeamLeader) {
      usersService.getSalesUsers().then(res => setSalesUsers(res.data.data)).catch(() => {})
    }
    if (isEdit) {
      leadsService.getById(id).then(res => {
        const lead = res.data.data
        setForm({
          // 1. Business Info
          companyName: lead.companyName || '',
          businessCategory: lead.businessCategory || lead.businessType || '',
          businessSubCategory: lead.businessSubCategory || '',
          website: lead.website || '',
          address: lead.address || '',
          country: lead.country || 'India',
          state: lead.state || '',
          city: lead.city || '',
          pincode: lead.pincode || '',
          businessDescription: lead.businessDescription || '',

          // 2. POC Details
          name: lead.name || '',
          pocJobTitle: lead.pocJobTitle || '',
          phone: lead.phone || '',
          alternatePhone: lead.alternatePhone || '',
          email: lead.email || '',
          pocLinkedIn: lead.pocLinkedIn || '',
          pocTalkNotes: lead.pocTalkNotes || '',

          // 3. Type of Reach
          typeOfReach: lead.typeOfReach || lead.source || 'Cold Call',
          reachNotes: lead.reachNotes || '',

          // 4. Sales Details
          interestedIn: lead.interestedIn || '',
          estimatedBudget: lead.estimatedBudget || '',
          priority: lead.priority || 'MEDIUM',
          status: lead.status || 'NEW',
          assignedTo: lead.assignedTo?._id || '',
          nextFollowUpAt: lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toISOString().slice(0, 16) : '',
          notes: lead.notes || '',
        })
      }).catch(() => navigate('/leads')).finally(() => setLoadingLead(false))
    }
  }, [id, isEdit, isAdmin, isTeamLeader])

  const validate = () => {
    const e = {}
    if (!form.companyName.trim()) e.companyName = 'Company / Business name is required'
    if (!form.name.trim()) e.name = 'POC name is required'
    if (!form.phone.trim()) e.phone = 'POC phone number is required'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email address'
    if (form.phone && !/^\+?[0-9]{7,15}$/.test(form.phone.replace(/[\s-]/g, ''))) e.phone = 'Invalid phone number'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const checkDuplicate = async () => {
    if (!form.phone && !form.email) return
    try {
      const res = await leadsService.checkDuplicate({ phone: form.phone, email: form.email })
      if (res.data.duplicate && res.data.duplicate._id !== id) {
        setDuplicate(res.data.duplicate)
      } else {
        setDuplicate(null)
      }
    } catch {}
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Please fill in the required fields marked with *')
      return
    }
    setLoading(true)
    try {
      const data = { ...form }
      if (!data.assignedTo) delete data.assignedTo
      if (!data.nextFollowUpAt) delete data.nextFollowUpAt
      if (!data.notes) delete data.notes
      if (!data.pocTalkNotes) delete data.pocTalkNotes
      if (!data.businessDescription) delete data.businessDescription
      if (!data.reachNotes) delete data.reachNotes

      // Keep legacy source & businessType in sync
      data.source = data.typeOfReach
      data.businessType = data.businessCategory

      if (isEdit) {
        await leadsService.update(id, data)
        toast.success('Lead updated successfully!')
        navigate(`/leads/${id}`)
      } else {
        const res = await leadsService.create(data)
        toast.success('Lead created successfully!')
        navigate(`/leads/${res.data.data._id}`)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save lead')
    } finally {
      setLoading(false)
    }
  }

  if (loadingLead) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-primary-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/leads" className="btn-ghost text-sm">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Lead' : 'Add New Lead'}</h1>
          <p className="text-muted mt-1">{isEdit ? 'Update comprehensive prospective lead information' : 'Record prospective business info, POC details, and outreach method'}</p>
        </div>
      </div>

      {/* Duplicate Warning */}
      {duplicate && (
        <div className="card p-4 border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-400">Possible duplicate detected</p>
              <p className="text-sm text-slate-400 mt-1">A lead with this phone/email already exists in the system:</p>
              <p className="text-sm text-slate-200 font-medium mt-1">{duplicate.name} ({duplicate.companyName || 'No Company'}) — {duplicate.phone}</p>
              <Link to={`/leads/${duplicate._id}`} className="text-sm text-primary-400 hover:text-primary-300 mt-1 inline-block">View existing lead →</Link>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ========================================================
            SECTION 1: PROSPECTIVE BUSINESS INFORMATION
           ======================================================== */}
        <FormSection
          icon={Building2}
          title="1. Prospective Business Information"
          description="Company profile, business categories, location, and web presence"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup label="Company / Business Name" required error={errors.companyName}>
              <input
                type="text"
                className={`input ${errors.companyName ? 'border-red-500' : ''}`}
                placeholder="e.g. Acme Tech Solutions, Green Foods Pvt Ltd"
                value={form.companyName}
                onChange={e => handleChange('companyName', e.target.value)}
              />
            </FormGroup>

            <FormGroup label="Website URL">
              <input
                type="text"
                className="input"
                placeholder="https://example.com"
                value={form.website}
                onChange={e => handleChange('website', e.target.value)}
              />
            </FormGroup>

            <FormGroup label="Business Category">
              <CustomSelect
                placeholder="Select category"
                value={form.businessCategory}
                onChange={v => {
                  handleChange('businessCategory', v)
                  handleChange('businessSubCategory', '')
                }}
                options={Array.from(new Set([...BUSINESS_CATEGORIES, ...(dynamicOptions.businessCategories || [])]))}
              />
            </FormGroup>

            <FormGroup label="Business Sub-Category">
              <CustomSelect
                placeholder={form.businessCategory ? "Select or add sub-category" : "Select category first..."}
                value={form.businessSubCategory}
                onChange={v => handleChange('businessSubCategory', v)}
                options={availableSubCategories}
              />
            </FormGroup>
          </div>

          {/* Full Address Details */}
          <div className="pt-2 border-t border-slate-800/60">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Address & Location</p>
            <div className="space-y-3">
              <FormGroup label="Street Address / Building / Landmark">
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Unit 402, Signature Tower, Outer Ring Road"
                  value={form.address}
                  onChange={e => handleChange('address', e.target.value)}
                />
              </FormGroup>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <FormGroup label="Country">
                  <select
                    className="input"
                    value={form.country}
                    onChange={e => {
                      handleChange('country', e.target.value)
                      handleChange('state', '')
                      handleChange('city', '')
                    }}
                  >
                    <option value="">Select country...</option>
                    {countries.map(c => <option key={c.isoCode} value={c.name}>{c.name}</option>)}
                  </select>
                </FormGroup>

                <FormGroup label="State">
                  <select
                    className="input"
                    value={form.state}
                    onChange={e => {
                      handleChange('state', e.target.value)
                      handleChange('city', '')
                    }}
                    disabled={!selectedCountry}
                  >
                    <option value="">Select state...</option>
                    {states.map(s => <option key={s.isoCode} value={s.name}>{s.name}</option>)}
                  </select>
                </FormGroup>

                <FormGroup label="City">
                  <select
                    className="input"
                    value={form.city}
                    onChange={e => handleChange('city', e.target.value)}
                    disabled={!selectedState}
                  >
                    <option value="">Select city...</option>
                    {cities.map(c => <option key={`${c.name}-${c.stateCode}`} value={c.name}>{c.name}</option>)}
                  </select>
                </FormGroup>

                <FormGroup label="Pincode / Zip Code">
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. 700091"
                    value={form.pincode}
                    onChange={e => handleChange('pincode', e.target.value)}
                  />
                </FormGroup>
              </div>
            </div>
          </div>

          <FormGroup label="About the Business / Description">
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="What does this prospective business do, product/service offerings, market size, etc."
              value={form.businessDescription}
              onChange={e => handleChange('businessDescription', e.target.value)}
            />
          </FormGroup>
        </FormSection>

        {/* ========================================================
            SECTION 2: POINT OF CONTACT (POC) DETAILS
           ======================================================== */}
        <FormSection
          icon={User}
          title="2. Point of Contact (POC) Details"
          description="Details of the person you are communicating with, title, and conversation notes"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup label="POC Name (Full Name)" required error={errors.name}>
              <input
                type="text"
                className={`input ${errors.name ? 'border-red-500' : ''}`}
                placeholder="e.g. Rajesh Sharma"
                value={form.name}
                onChange={e => handleChange('name', e.target.value)}
              />
            </FormGroup>

            <FormGroup label="Job Title / Designation">
              <input
                type="text"
                className="input"
                placeholder="e.g. Founder & CEO, Marketing Director, Operations Head"
                value={form.pocJobTitle}
                onChange={e => handleChange('pocJobTitle', e.target.value)}
              />
            </FormGroup>

            <FormGroup label="Primary Phone" required error={errors.phone}>
              <input
                type="tel"
                className={`input ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="+91 9876543210"
                value={form.phone}
                onChange={e => handleChange('phone', e.target.value)}
                onBlur={checkDuplicate}
              />
            </FormGroup>

            <FormGroup label="Alternate Phone / WhatsApp">
              <input
                type="tel"
                className="input"
                placeholder="+91 9876543211"
                value={form.alternatePhone}
                onChange={e => handleChange('alternatePhone', e.target.value)}
              />
            </FormGroup>

            <FormGroup label="Email Address" error={errors.email}>
              <input
                type="email"
                className={`input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="poc.email@example.com"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                onBlur={checkDuplicate}
              />
            </FormGroup>

            <FormGroup label="LinkedIn Profile URL">
              <input
                type="text"
                className="input"
                placeholder="https://linkedin.com/in/username"
                value={form.pocLinkedIn}
                onChange={e => handleChange('pocLinkedIn', e.target.value)}
              />
            </FormGroup>
          </div>

          <FormGroup label="Notes About Talk with POC" hint="Discussion summary, client requirements, objections">
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="What did you discuss with this POC? Key points, attitude/interest level, specific questions asked, requirements discussed..."
              value={form.pocTalkNotes}
              onChange={e => handleChange('pocTalkNotes', e.target.value)}
            />
          </FormGroup>
        </FormSection>

        {/* ========================================================
            SECTION 3: TYPE OF REACH
           ======================================================== */}
        <FormSection
          icon={Send}
          title="3. Type of Reach"
          description="How did you or the team reach out to this prospective lead?"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup label="Outreach Method / Type of Reach" required>
              <CustomSelect
                placeholder="Select reach method"
                value={form.typeOfReach}
                onChange={v => handleChange('typeOfReach', v)}
                options={Array.from(new Set([...REACH_TYPES, ...(dynamicOptions.reachTypes || [])]))}
              />
            </FormGroup>

            <FormGroup label="Reach Campaign / Channel Details">
              <input
                type="text"
                className="input"
                placeholder="e.g. Q4 InMail Campaign, Referred by Rajesh, Booth #14 at Summit"
                value={form.reachNotes}
                onChange={e => handleChange('reachNotes', e.target.value)}
              />
            </FormGroup>
          </div>
        </FormSection>

        {/* ========================================================
            SECTION 4: SALES & ENGAGEMENT DETAILS
           ======================================================== */}
        <FormSection
          icon={Briefcase}
          title="4. Sales & Engagement Details"
          description="Pipeline status, priority, budget, service interest, and next follow-up"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup label="Service / Product Interested In">
              <CustomSelect
                placeholder="Select or enter service"
                value={form.interestedIn}
                onChange={v => handleChange('interestedIn', v)}
                options={Array.from(new Set([...SERVICES, ...(dynamicOptions.services || [])]))}
              />
            </FormGroup>

            <FormGroup label="Estimated Budget">
              <input
                type="text"
                className="input"
                placeholder="e.g. ₹1,00,000 - ₹2,50,000"
                value={form.estimatedBudget}
                onChange={e => handleChange('estimatedBudget', e.target.value)}
              />
            </FormGroup>

            <FormGroup label="Lead Pipeline Status">
              <CustomSelect
                placeholder="Select status"
                value={form.status}
                onChange={v => handleChange('status', v)}
                options={Array.from(new Set([...STATUSES.map(s => s.value), ...(dynamicOptions.statuses || [])]))}
              />
            </FormGroup>

            <FormGroup label="Next Follow-up Date & Time">
              <input
                type="datetime-local"
                className="input"
                value={form.nextFollowUpAt}
                onChange={e => handleChange('nextFollowUpAt', e.target.value)}
              />
            </FormGroup>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <FormGroup label="Priority Level">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRIORITIES.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleChange('priority', p)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                      form.priority === p
                        ? 'border-primary-500 bg-primary-500/15 text-primary-300 ring-1 ring-primary-500'
                        : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </FormGroup>

            {(isAdmin || isTeamLeader) && (
              <FormGroup label="Assign To Team Member">
                <select
                  className="input"
                  value={form.assignedTo}
                  onChange={e => handleChange('assignedTo', e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {salesUsers.map(u => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role?.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </FormGroup>
            )}
          </div>

          <FormGroup label="General Internal Notes">
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Any additional team comments, internal notes, special conditions..."
              value={form.notes}
              onChange={e => handleChange('notes', e.target.value)}
            />
          </FormGroup>
        </FormSection>

        {/* Submit Actions */}
        <div className="flex items-center gap-3 justify-end pt-2">
          <Link to={isEdit ? `/leads/${id}` : '/leads'} className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary px-8 py-2.5">
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : isEdit ? 'Update Lead' : 'Save Lead'}
          </button>
        </div>
      </form>
    </div>
  )
}
