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
    <div className="flex items-center gap-2.5 mb-2 pb-3 border-b border-kb-sand">
      {Icon && <Icon className="w-5 h-5 text-kb-strawberry" />}
      <div>
        <h3 className="font-semibold text-kb-cocoa text-base">{title}</h3>
        {description && <p className="text-xs text-kb-muted mt-0.5">{description}</p>}
      </div>
    </div>
    <div className="space-y-4 pt-2">{children}</div>
  </div>
)

const FormGroup = ({ label, required, error, hint, children }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <label className="label mb-0">{label}{required && <span className="text-kb-crimson ml-0.5">*</span>}</label>
      {hint && <span className="text-xs text-kb-muted">{hint}</span>}
    </div>
    {children}
    {error && <p className="text-kb-crimson text-xs mt-1">{error}</p>}
  </div>
)

const CustomSelect = ({
  options = [],
  value,
  onChange,
  placeholder,
  canAddCustom = false,
  onAddCustom,
  allowOther = true,
  otherLabel = 'Other',
  otherPlaceholder,
}) => {
  const [isAdding, setIsAdding] = useState(false)
  const [customVal, setCustomVal] = useState('')
  const [savingCustom, setSavingCustom] = useState(false)

  const handleSaveCustom = async () => {
    const trimmed = customVal.trim()
    if (!trimmed) {
      setIsAdding(false)
      return
    }
    if (onAddCustom) {
      setSavingCustom(true)
      try {
        await onAddCustom(trimmed)
      } finally {
        setSavingCustom(false)
      }
    }
    onChange(trimmed)
    setIsAdding(false)
  }

  if (isAdding && canAddCustom) {
    return (
      <div className="flex gap-2">
        <input
          autoFocus
          type="text"
          className="input flex-1 py-1.5 px-3 text-sm"
          placeholder="Add persistent option for all members..."
          value={customVal}
          disabled={savingCustom}
          onChange={e => setCustomVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSaveCustom()
            } else if (e.key === 'Escape') {
              setIsAdding(false)
            }
          }}
        />
        <button
          type="button"
          disabled={savingCustom}
          className="btn-primary px-3 text-xs"
          onClick={handleSaveCustom}
        >
          {savingCustom ? 'Saving...' : 'Add'}
        </button>
        <button
          type="button"
          disabled={savingCustom}
          className="btn-ghost px-2 text-kb-muted text-xs"
          onClick={() => setIsAdding(false)}
        >
          Cancel
        </button>
      </div>
    )
  }

  const isOtherValue = allowOther && (value === otherLabel || (value && value.startsWith(`${otherLabel}: `)))
  const selectValue = isOtherValue ? otherLabel : (value || '')
  const otherText = value && value.startsWith(`${otherLabel}: `) ? value.slice(otherLabel.length + 2) : ''

  const baseWithoutOther = options.filter(o => o && o !== otherLabel)
  const extraCurrent = !isOtherValue && selectValue && !baseWithoutOther.includes(selectValue) ? [selectValue] : []
  const allOptions = Array.from(new Set([...baseWithoutOther, ...extraCurrent, ...(allowOther ? [otherLabel] : [])]))

  return (
    <div>
      <select
        className="input"
        value={selectValue}
        onChange={e => {
          if (e.target.value === '__CUSTOM__' && canAddCustom) {
            setCustomVal('')
            setIsAdding(true)
          } else {
            onChange(e.target.value)
          }
        }}
      >
        <option value="" disabled>{placeholder}</option>
        {allOptions.map(o => <option key={o} value={o}>{o}</option>)}
        {canAddCustom && (
          <option value="__CUSTOM__" className="font-semibold text-kb-strawberry bg-kb-cream-deep">
            + Add Custom...
          </option>
        )}
      </select>
      {isOtherValue && (
        <input
          type="text"
          className="input mt-2 text-sm"
          placeholder={otherPlaceholder || `Specify ${otherLabel.toLowerCase()} details...`}
          value={otherText}
          onChange={e => {
            const typed = e.target.value
            onChange(typed ? `${otherLabel}: ${typed}` : otherLabel)
          }}
        />
      )}
    </div>
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
    subCategoriesByCategory: {},
    services: [],
    statuses: [],
    reachTypes: []
  })
  const [leadMeta, setLeadMeta] = useState(null)

  const fetchDynamicOptions = async () => {
    try {
      const res = await leadsService.getOptions()
      setDynamicOptions(res.data.data)
    } catch {}
  }

  const handleAddCustomOption = async (field, value, parentCategory = '') => {
    try {
      await leadsService.addOption({ field, value, parentCategory })
      await fetchDynamicOptions()
      toast.success(`Added "${value}" for all team members`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Only admins can add custom dropdown options')
    }
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
    const staticSubs = BUSINESS_CATEGORIES_MAP[form.businessCategory] || []
    const dynamicSubs = dynamicOptions.subCategoriesByCategory?.[form.businessCategory] || []
    return Array.from(new Set([...staticSubs, ...dynamicSubs]))
  }, [form.businessCategory, dynamicOptions.subCategoriesByCategory])

  useEffect(() => {
    fetchDynamicOptions()
    if (isAdmin || isTeamLeader) {
      usersService.getSalesUsers().then(res => setSalesUsers(res.data.data)).catch(() => {})
    }
    if (isEdit) {
      leadsService.getById(id).then(res => {
        const lead = res.data.data
        if (lead.canViewSalesSection === false) {
          toast.error('Sales section is restricted to the assigned Sales Executive')
          navigate(`/leads/${id}`)
          return
        }
        setLeadMeta(lead)
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
        <div className="w-8 h-8 rounded-full border-2 border-kb-sand border-t-kb-strawberry animate-spin" />
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
        <div className="card p-4 border border-kb-amber-border bg-kb-amber-bg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-kb-amber-fg flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-kb-amber-fg">Possible duplicate detected</p>
              <p className="text-sm text-kb-text mt-1">A lead with this phone/email already exists in the system:</p>
              <p className="text-sm text-kb-cocoa font-medium mt-1">{duplicate.name} ({duplicate.companyName || 'No Company'}) — {duplicate.phone}</p>
              <Link to={`/leads/${duplicate._id}`} className="text-sm text-kb-strawberry hover:text-kb-strawberry-hover font-semibold mt-1 inline-block">View existing lead →</Link>
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
                className={`input ${errors.companyName ? 'border-kb-crimson' : ''}`}
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
                canAddCustom={isAdmin}
                onAddCustom={val => handleAddCustomOption('businessCategory', val)}
                otherLabel="Other Industry"
                otherPlaceholder="Specify other business category..."
              />
            </FormGroup>

            <FormGroup label="Business Sub-Category">
              <CustomSelect
                placeholder={form.businessCategory ? "Select or add sub-category" : "Select category first..."}
                value={form.businessSubCategory}
                onChange={v => handleChange('businessSubCategory', v)}
                options={availableSubCategories}
                canAddCustom={isAdmin && !!form.businessCategory}
                onAddCustom={val => handleAddCustomOption('businessSubCategory', val, form.businessCategory)}
                otherLabel="Other"
                otherPlaceholder="Specify other sub-category..."
              />
            </FormGroup>
          </div>

          {/* Full Address Details */}
          <div className="pt-2 border-t border-kb-sand">
            <p className="text-xs font-semibold text-kb-muted uppercase tracking-wider mb-3">Address & Location</p>
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
                className={`input ${errors.name ? 'border-kb-crimson' : ''}`}
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
                className={`input ${errors.phone ? 'border-kb-crimson' : ''}`}
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
                className={`input ${errors.email ? 'border-kb-crimson' : ''}`}
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
                canAddCustom={isAdmin}
                onAddCustom={val => handleAddCustomOption('typeOfReach', val)}
                otherLabel="Other"
                otherPlaceholder="Specify other outreach method..."
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
                canAddCustom={isAdmin}
                onAddCustom={val => handleAddCustomOption('interestedIn', val)}
                otherLabel="Other"
                otherPlaceholder="Specify other service requirement..."
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
                canAddCustom={isAdmin}
                onAddCustom={val => handleAddCustomOption('status', val)}
                allowOther={false}
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
                        ? 'border-kb-strawberry bg-kb-strawberry-tint text-kb-strawberry ring-1 ring-kb-strawberry'
                        : 'border-kb-sand bg-kb-white text-kb-muted hover:border-kb-umber hover:text-kb-cocoa'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </FormGroup>

            {(isAdmin || isTeamLeader) && (
              <div className="space-y-2">
                <FormGroup
                  label={
                    isEdit && leadMeta?.primaryAssignedTo
                      ? 'Reassign Lead To Team Member'
                      : 'Primary Assign To Team Member'
                  }
                >
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
                {isEdit && leadMeta ? (
                  <div className="rounded-xl bg-kb-cream-deep border border-kb-sand p-2.5 text-xs text-kb-muted space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span>Created By:</span>
                      <span className="text-kb-cocoa font-medium">{leadMeta.createdBy?.name || 'System'}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span>Primary Assigned:</span>
                      <span className="text-kb-strawberry font-medium">
                        {leadMeta.primaryAssignedTo?.name || 'Not assigned yet'}
                      </span>
                    </div>
                    {leadMeta.reassignedBy && (
                      <div className="flex items-center justify-between gap-2">
                        <span>Last Reassigned By:</span>
                        <span className="text-kb-amber-fg font-medium">{leadMeta.reassignedBy.name}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-kb-muted">
                    First assignee is saved as Primary Assigned; managers can reassign anytime.
                  </p>
                )}
              </div>
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
