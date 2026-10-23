import { useEffect, useMemo, useState } from 'react'
import roomlerMascot from './assets/roomler-mascot.png'
import './App.css'


type PropertyStatus = 'Published' | 'Draft' | 'Paused' | 'Removed' | 'Unknown'

type VerificationStatus =
  | 'Unverified'
  | 'Owner confirmed'
  | 'Independently checked'
  | 'Unknown'

type Property = {
  id: string
  title: string
  city: string
  locality: string
  type: string
  eligibility: string
  startingRent: number | null
  startingRentCurrency: string | null
  owner: string
  status: PropertyStatus
  verification: VerificationStatus
  updated: string
  dataLabel: string
}

type ApiProperty = {
  id: string
  title: string
  property_type: string
  city: string | null
  locality: string | null
  owner_name: string | null
  gender_eligibility: string | null
  listing_status: string
  verification_status: string
  updated_at: string
  data_label: string
  starting_monthly_amount: string | number | null
  starting_monthly_currency: string | null
}


type FormOptions = {
  cities: { id: string; name: string; state_name: string }[]
  localities: { id: string; name: string; city_id: string; city_name: string }[]
  owners: { id: string; name: string; data_label: string }[]
}

type ChargeForm = { name: string; amount: string; basis: 'one_time' | 'monthly' | 'per_unit' | 'per_use' | 'other'; mandatory: boolean; description: string }
type OfferForm = { amount: string; foodOption: 'included' | 'excluded' | 'unknown'; status: 'active' | 'inactive' | 'unknown' }
type RoomForm = { label: string; type: 'single' | 'shared'; maxOccupants: string; status: 'available' | 'occupied' | 'reserved' | 'unavailable' | 'unknown'; furnishingStatus: 'furnished' | 'semi_furnished' | 'unfurnished' | ''; attachedBathroom: 'yes' | 'no' | 'unknown'; wifiAvailableInRoom: 'yes' | 'no' | 'unknown'; wifiSpeedMbps: string; notes: string; offers: OfferForm[]; charges: ChargeForm[] }
type FloorForm = { number: string; label: string; notes: string; rooms: RoomForm[] }
type PropertyFormValues = {
  title: string; description: string; cityId: string; localityId: string; ownerId: string; propertyType: 'PG' | 'Flat';
  address: string; googleMapsUrl: string; latitude: string; longitude: string; coordinateSource: 'manual' | 'owner_submitted' | 'google_places' | 'openstreetmap' | 'other';
  genderEligibility: 'Boys' | 'Girls' | 'Unisex' | 'unknown'; couplesAllowed: 'yes' | 'no' | 'unknown'; coEdRoomsAllowed: 'yes' | 'no' | 'unknown'; cookingAllowed: 'yes' | 'no' | 'unknown'; houseRulesNotes: string;
  securityDepositBasis: 'two_weeks_rent' | 'one_month_rent' | 'two_months_rent' | 'three_months_rent' | 'four_months_rent' | 'fixed_amount' | 'not_required' | 'unknown'; securityDepositAmount: string; securityDepositRefundPolicy: 'fully_refundable_no_deductions' | 'refundable_with_deductions' | 'unknown'; securityDepositDeductionNotes: string;
  noticePeriodMonths: string; electricityBillingMode: 'included_in_rent' | 'metered' | 'unknown'; electricityRatePerUnit: string; fourWheelerParkingSpaces: string; twoWheelerParkingSpaces: string;
  floors: FloorForm[]; images: { url: string; label: 'exterior' | 'bedroom' | 'kitchen' | 'bathroom' | 'living_area' | 'other'; altText: string; isCover: boolean }[];
}

const newCharge = (): ChargeForm => ({ name: '', amount: '', basis: 'monthly', mandatory: false, description: '' })
const newOffer = (): OfferForm => ({ amount: '', foodOption: 'unknown', status: 'active' })
const newRoom = (index = 1): RoomForm => ({ label: `Room ${index}`, type: 'shared', maxOccupants: '2', status: 'unknown', furnishingStatus: '', attachedBathroom: 'unknown', wifiAvailableInRoom: 'unknown', wifiSpeedMbps: '', notes: '', offers: [newOffer()], charges: [] })
const initialFormValues: PropertyFormValues = {
  title: '', description: '', cityId: '', localityId: '', ownerId: '', propertyType: 'PG', address: '', googleMapsUrl: '', latitude: '', longitude: '', coordinateSource: 'owner_submitted',
  genderEligibility: 'unknown', couplesAllowed: 'unknown', coEdRoomsAllowed: 'unknown', cookingAllowed: 'unknown', houseRulesNotes: '',
  securityDepositBasis: 'unknown', securityDepositAmount: '', securityDepositRefundPolicy: 'unknown', securityDepositDeductionNotes: '', noticePeriodMonths: '',
  electricityBillingMode: 'unknown', electricityRatePerUnit: '', fourWheelerParkingSpaces: '', twoWheelerParkingSpaces: '',
  floors: [{ number: '0', label: 'Ground floor', notes: '', rooms: [newRoom(1)] }], images: [],
}

function mapApiProperty(property: ApiProperty): Property {
  const statusMap: Record<string, PropertyStatus> = {
    published: 'Published',
    draft: 'Draft',
    paused: 'Paused',
    removed: 'Removed',
  }

  const verificationMap: Record<string, VerificationStatus> = {
    unverified: 'Unverified',
    owner_confirmed: 'Owner confirmed',
    independently_checked: 'Independently checked',
  }

  const amount =
    property.starting_monthly_amount === null
      ? null
      : Number(property.starting_monthly_amount)

  return {
    id: property.id,
    title: property.title,
    city: property.city ?? 'Not provided',
    locality: property.locality ?? 'Not provided',
    type: property.property_type,
    eligibility: property.gender_eligibility ?? 'Not provided',
    startingRent:
      amount !== null && Number.isFinite(amount) ? amount : null,
    startingRentCurrency: property.starting_monthly_currency,
    owner: property.owner_name ?? 'Not provided',
    status: statusMap[property.listing_status] ?? 'Unknown',
    verification:
      verificationMap[property.verification_status] ?? 'Unknown',
    updated: Number.isNaN(Date.parse(property.updated_at))
      ? 'Not provided'
      : new Date(property.updated_at).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
    dataLabel: property.data_label.replaceAll('_', ' '),
  }
}

const navItems = [
  { label: 'Overview', icon: '◫' },
  { label: 'Properties', icon: '⌂' },
  { label: 'Owners', icon: '♙' },
  { label: 'Cities & localities', icon: '⌖' },
  { label: 'Amenities', icon: '✳' },
]

function App() {
  const [activeNav, setActiveNav] = useState('Properties')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [typeFilter, setTypeFilter] = useState('All types')
  const [showAddForm, setShowAddForm] = useState(false)
  const [toast, setToast] = useState('')
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [formOptions, setFormOptions] = useState<FormOptions>({ cities: [], localities: [], owners: [] })
  const [formLoading, setFormLoading] = useState(false)
  const [savingProperty, setSavingProperty] = useState(false)
  const [formError, setFormError] = useState('')
  const [formValues, setFormValues] = useState<PropertyFormValues>(initialFormValues)
  const [reviewMode, setReviewMode] = useState(false)

  const filteredProperties = useMemo(() => properties.filter((property) => {
    const search = query.trim().toLowerCase()
    const matchesSearch = !search || [property.id, property.title, property.city, property.locality, property.owner]
      .some((value) => value.toLowerCase().includes(search))
    const matchesStatus = statusFilter === 'All statuses' || property.status === statusFilter
    const matchesType = typeFilter === 'All types' || property.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  }), [properties, query, statusFilter, typeFilter])

  async function openAddPropertyForm() {
    setShowAddForm(true)
    setFormError('')
    setFormValues(initialFormValues)
    setReviewMode(false)
    setFormLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/admin/form-options')
      if (!response.ok) throw new Error(`Could not load form options (${response.status}).`)
      setFormOptions(await response.json())
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to load form options.')
    } finally {
      setFormLoading(false)
    }
  }

  function parseOptionalNumber(value: string): number | null {
    if (!value.trim()) return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  async function submitProperty(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError('')
    if (!formValues.title.trim() || !formValues.cityId || !formValues.ownerId) {
      setFormError('Enter a title and select a city and owner.')
      setReviewMode(false)
      return
    }
    if (!formValues.floors.length || formValues.floors.some(floor => !floor.label.trim() || !floor.rooms.length)) {
      setFormError('Every floor needs a label and at least one room.')
      setReviewMode(false)
      return
    }
    for (const floor of formValues.floors) {
      for (const room of floor.rooms) {
        const capacity = Number(room.maxOccupants)
        if (!room.label.trim() || !Number.isSafeInteger(capacity) || capacity < (room.type === 'single' ? 1 : 2) || (room.type === 'single' && capacity !== 1)) {
          setFormError(`Check the room name, type and capacity for ${room.label || 'an unnamed room'}.`)
          setReviewMode(false)
          return
        }
        if (!room.offers.length || room.offers.some(offer => !offer.amount.trim() || !Number.isFinite(Number(offer.amount)) || Number(offer.amount) <= 0)) {
          setFormError(`Add a valid positive monthly rent offer for ${room.label}.`)
          setReviewMode(false)
          return
        }
        if (room.charges.some(charge => !charge.name.trim() || !charge.amount.trim() || !Number.isFinite(Number(charge.amount)) || Number(charge.amount) < 0)) {
          setFormError(`Check the charge name and amount for ${room.label}.`)
          setReviewMode(false)
          return
        }
      }
    }
    if (!reviewMode) {
      setReviewMode(true)
      return
    }
    const toNullableBoolean = (value: string) => value === 'unknown' ? null : value === 'yes'
    const payload = {
      title: formValues.title.trim(), description: formValues.description.trim(), propertyType: formValues.propertyType,
      cityId: formValues.cityId, localityId: formValues.localityId || null, ownerId: formValues.ownerId,
      address: formValues.address.trim() || null, googleMapsUrl: formValues.googleMapsUrl.trim() || null,
      latitude: parseOptionalNumber(formValues.latitude), longitude: parseOptionalNumber(formValues.longitude),
      coordinateSource: formValues.latitude.trim() && formValues.longitude.trim() ? formValues.coordinateSource : null,
      genderEligibility: formValues.genderEligibility === 'unknown' ? null : formValues.genderEligibility,
      couplesAllowed: toNullableBoolean(formValues.couplesAllowed), coEdRoomsAllowed: toNullableBoolean(formValues.coEdRoomsAllowed),
      cookingAllowed: toNullableBoolean(formValues.cookingAllowed), houseRulesNotes: formValues.houseRulesNotes.trim() || null,
      securityDepositBasis: formValues.securityDepositBasis === 'unknown' ? null : formValues.securityDepositBasis,
      securityDepositAmount: formValues.securityDepositBasis === 'fixed_amount' ? parseOptionalNumber(formValues.securityDepositAmount) : null,
      securityDepositRefundPolicy: formValues.securityDepositRefundPolicy,
      securityDepositDeductionNotes: formValues.securityDepositDeductionNotes.trim() || null,
      noticePeriodMonths: formValues.noticePeriodMonths === '' ? null : Number(formValues.noticePeriodMonths),
      electricityBillingMode: formValues.electricityBillingMode,
      electricityRatePerUnit: formValues.electricityBillingMode === 'metered' ? parseOptionalNumber(formValues.electricityRatePerUnit) : null,
      fourWheelerParkingSpaces: parseOptionalNumber(formValues.fourWheelerParkingSpaces),
      twoWheelerParkingSpaces: parseOptionalNumber(formValues.twoWheelerParkingSpaces),
      floors: formValues.floors.map(floor => ({ number: Number(floor.number), label: floor.label.trim(), notes: floor.notes.trim() || undefined,
        rooms: floor.rooms.map(room => ({ label: room.label.trim(), type: room.type, maxOccupants: Number(room.maxOccupants), status: room.status,
          furnishingStatus: room.furnishingStatus || undefined, attachedBathroom: toNullableBoolean(room.attachedBathroom),
          wifiAvailableInRoom: toNullableBoolean(room.wifiAvailableInRoom), wifiSpeedMbps: parseOptionalNumber(room.wifiSpeedMbps), notes: room.notes.trim() || undefined,
          offers: room.offers.map(offer => ({ amount: Number(offer.amount), foodOption: offer.foodOption, status: offer.status, rentBasis: room.type === 'shared' ? 'per_bed' : 'per_room' })),
          charges: room.charges.map(charge => ({ name: charge.name.trim(), amount: Number(charge.amount), basis: charge.basis, mandatory: charge.mandatory, description: charge.description.trim() || undefined }))
        }))
      })),
      images: formValues.images.filter(image => image.url.trim()).map((image, index) => ({ url: image.url.trim(), label: image.label, altText: image.altText.trim(), isCover: image.isCover, displayOrder: index }))
    }
    if ((payload.latitude === null) !== (payload.longitude === null)) {
      setFormError('Enter both latitude and longitude, or leave both blank.')
      setReviewMode(false)
      return
    }
    if (formValues.securityDepositBasis === 'fixed_amount' && payload.securityDepositAmount === null) {
      setFormError('Enter the fixed deposit amount.')
      return
    }
    if (formValues.electricityBillingMode === 'metered' && payload.electricityRatePerUnit === null) {
      setFormError('Enter the electricity rate per unit, or select Unknown.')
      return
    }
    if (formValues.securityDepositRefundPolicy === 'refundable_with_deductions' && !formValues.securityDepositDeductionNotes.trim()) {
      setFormError('Explain possible deposit deductions.')
      return
    }

    setSavingProperty(true)
    try {
      const response = await fetch('http://localhost:3001/api/admin/properties', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? `Save failed (${response.status}).`)
      setShowAddForm(false); setFormValues(initialFormValues); setReviewMode(false)
      const listResponse = await fetch('http://localhost:3001/api/admin/properties')
      if (listResponse.ok) {
        const listResult: { data: ApiProperty[]; count: number } = await listResponse.json()
        setProperties(listResult.data.map(mapApiProperty)); showDemoToast('Draft property saved. It is marked synthetic and unverified.')
      } else showDemoToast('Property saved. Refresh the page to update the list.')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save property.')
    } finally { setSavingProperty(false) }
  }

  useEffect(() => {
    let cancelled = false
    async function loadProperties() {
      setLoading(true)
      setLoadError('')
      try {
        const response = await fetch('http://localhost:3001/api/admin/properties')
        if (!response.ok) throw new Error(`API request failed (${response.status})`)
        const result: { data: ApiProperty[]; count: number } = await response.json()
        if (!Array.isArray(result.data)) throw new Error('The API returned an unexpected response.')
        if (!cancelled) setProperties(result.data.map(mapApiProperty))
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : 'Unable to load properties.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadProperties()
    return () => { cancelled = true }
  }, [])

  function showDemoToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 3200)
  }

  return (
    <div className="admin-app">
      <aside className="sidebar">
        <a className="brand" href="#home" aria-label="Roomler admin home">
          <img className="brand-mascot" src={roomlerMascot} alt="" />
          <span className="brand-word">roomler<span>ADMIN CONSOLE</span></span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav" aria-label="Admin navigation">
          {navItems.map((item) => (
            <button
              className={`nav-item ${activeNav === item.label ? 'active' : ''}`}
              key={item.label}
              onClick={() => setActiveNav(item.label)}
              type="button"
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
              {item.label === 'Properties' && <span className="nav-count">{properties.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="admin-avatar">RT</div>
          <div className="admin-identity"><strong>Roomler team</strong><span>Administrator</span></div>
          <span className="more-icon" aria-hidden="true">···</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{activeNav}</strong></div>
          <div className="topbar-right">
            <span className="environment"><span className="environment-dot" /> Local preview</span>
            <button className="help-button" type="button" onClick={() => showDemoToast('Help documentation is not connected in this preview.')}>Help</button>
          </div>
        </header>

        {activeNav === 'Properties' ? (
          <section className="page">
            <div className="page-heading">
              <div>
                <div className="eyebrow">LISTING OPERATIONS</div>
                <h1>Properties</h1>
                <p className="page-description">Manage accommodation listings, eligibility, pricing and verification.</p>
              </div>
              <button className="primary-button" onClick={() => void openAddPropertyForm()} type="button"><span aria-hidden="true">＋</span> Add property</button>
            </div>

            <div className="notice">
              <span className="notice-icon" aria-hidden="true">i</span>
              <p><strong>Local database records.</strong> Demo records may be synthetic. Verification labels reflect stored data and do not guarantee current accuracy.</p>
              <span className="demo-pill">DEMO</span>
            </div>

            <div className="stat-grid">
              <StatCard label="Total properties" value={String(properties.length)} note="Loaded from local API" icon="⌂" />
              <StatCard label="Published" value={String(properties.filter(p => p.status === 'Published').length)} note="Stored listing status" icon="↗" />
              <StatCard label="Needs verification" value={String(properties.filter(p => p.verification === 'Unverified').length)} note="Stored verification status" icon="◎" />
              <StatCard label="Missing rent" value={String(properties.filter(p => p.startingRent === null).length)} note="Price not available" icon="₹" />
            </div>

            <section className="table-panel">
              <div className="table-panel-heading">
                <div><h2>All properties</h2><p>Search and filter properties loaded from the local API.</p></div>
                <button className="secondary-button" type="button" onClick={() => showDemoToast('Export will be added after the API and real data flow are connected.')}>↧ Export</button>
              </div>
              <div className="filters">
                <label className="search-box">
                  <span aria-hidden="true">⌕</span>
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, city, locality or owner" aria-label="Search properties" />
                  {query && <button type="button" className="clear-search" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
                </label>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by listing status">
                  <option>All statuses</option><option>Published</option><option>Draft</option><option>Paused</option>
                </select>
                <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Filter by property type">
                  <option>All types</option><option>PG</option><option>Flat</option>
                </select>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>PROPERTY</th><th>TYPE / ELIGIBILITY</th><th>STARTING PRICE</th><th>OWNER</th><th>LISTING STATUS</th><th>VERIFICATION</th><th>UPDATED</th><th><span className="sr-only">Actions</span></th></tr></thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td colSpan={8}>Loading properties from the database...</td>
                      </tr>
                    )}

                    {!loading && loadError && (
                      <tr>
                        <td colSpan={8}>
                          Could not load properties: {loadError}
                        </td>
                      </tr>
                    )}
                    {!loading && !loadError && filteredProperties.map((property) => (
                      <tr key={property.id}>
                        <td><div className="property-cell"><div className={`property-thumb ${property.type === 'Flat' ? 'flat-thumb' : ''}`} aria-hidden="true">{property.type === 'PG' ? '⌂' : '▦'}</div><div className="property-name"><strong>{property.title}</strong><span>{property.city} · {property.locality}</span><small>{property.id} · {property.dataLabel}</small></div></div></td>
                        <td><span className="type-label">{property.type}</span><span className="secondary-line">{property.eligibility}</span></td>
                        <td>
                          <strong className="price">
                            {property.startingRent === null
                              ? 'Not provided'
                              : property.startingRentCurrency === 'INR'
                                ? `₹${property.startingRent.toLocaleString('en-IN')}/month`
                                : property.startingRentCurrency
                                  ? `${property.startingRent.toLocaleString()} ${property.startingRentCurrency}/month`
                                  : `${property.startingRent.toLocaleString()}/month`}
                          </strong>
                          <span className="secondary-line">
                            {property.startingRent === null ? 'Unknown' : 'Basis not shown'}
                          </span>
                        </td>
                        <td><span className="owner-name">{property.owner}</span></td>
                        <td><StatusPill status={property.status} /></td>
                        <td><VerificationPill status={property.verification} /></td>
                        <td><span className="updated-date">{property.updated}</span></td>
                        <td><button className="row-action" type="button" aria-label={`More actions for ${property.title}`} onClick={() => showDemoToast('Property actions will be enabled after the API is connected.')}>···</button></td>
                      </tr>
                    ))}
                    {!loading && !loadError && filteredProperties.length === 0 && (
                      <tr>
                        <td colSpan={8}>
                          <div className="empty-state">
                            <div className="empty-icon">⌕</div>
                            <strong>No properties found</strong>
                            <p>Try another search term or clear the filters.</p>
                            <button
                              className="secondary-button"
                              type="button"
                              onClick={() => {
                                setQuery('')
                                setStatusFilter('All statuses')
                                setTypeFilter('All types')
                              }}
                            >
                              Clear filters
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="table-footer"><span>Showing <strong>{filteredProperties.length}</strong> of <strong>{properties.length}</strong> records</span><div className="pagination"><button type="button" disabled aria-label="Previous page">‹</button><button type="button" className="current-page" aria-current="page">1</button><button type="button" disabled aria-label="Next page">›</button></div></div>
            </section>
            <p className="page-footnote"><span className="footnote-dot" /> Unknown values remain unknown. Admin entry does not imply verification.</p>
          </section>
        ) : (
          <section className="page placeholder-page">
            <div className="page-heading"><div><div className="eyebrow">ROOMLER OPERATIONS</div><h1>{activeNav}</h1><p className="page-description">This section is planned but not implemented in this UI preview.</p></div></div>
            <div className="placeholder-card"><div className="placeholder-symbol">{navItems.find(item => item.label === activeNav)?.icon}</div><h2>{activeNav} management</h2><p>We’ll add this after the property workflow is connected to the existing database.</p><button className="secondary-button" onClick={() => setActiveNav('Properties')} type="button">Return to properties</button></div>
          </section>
        )}
      </main>

      {showAddForm && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingProperty) setShowAddForm(false) }}>
          <section className="modal property-modal" role="dialog" aria-modal="true" aria-labelledby="add-property-title">
            <div className="modal-heading"><div><div className="eyebrow">PROPERTY WORKFLOW · {reviewMode ? 'FINAL REVIEW' : 'DRAFT ENTRY'}</div><h2 id="add-property-title">{reviewMode ? 'Review property' : 'Add a property'}</h2></div>
              <button className="modal-close" type="button" disabled={savingProperty} onClick={() => setShowAddForm(false)} aria-label="Close dialog">×</button></div>
            <div className="modal-notice">Demo workflow: records are saved as synthetic drafts and marked unverified. Unknown means not provided; it does not mean No.</div>
            {formLoading ? <p>Loading cities, localities and owners…</p> : (
              <form onSubmit={submitProperty}>
                {!reviewMode ? <>
                  <h3 className="form-section-title">1. Property details</h3>
                  <label className="form-field">Property title *<input required minLength={3} maxLength={150} value={formValues.title} onChange={e => setFormValues({ ...formValues, title: e.target.value })} placeholder="e.g. Furnished PG near campus" /></label>
                  <label className="form-field">Description<textarea rows={3} maxLength={10000} value={formValues.description} onChange={e => setFormValues({ ...formValues, description: e.target.value })} placeholder="Describe the accommodation; avoid unverified claims." /></label>
                  <div className="form-row">
                    <label className="form-field">City *<select required value={formValues.cityId} onChange={e => setFormValues({ ...formValues, cityId: e.target.value, localityId: '' })}><option value="">Select city</option>{formOptions.cities.map(city => <option key={city.id} value={city.id}>{city.name}, {city.state_name}</option>)}</select></label>
                    <label className="form-field">Property type<select value={formValues.propertyType} onChange={e => setFormValues({ ...formValues, propertyType: e.target.value as 'PG' | 'Flat' })}><option value="PG">PG</option><option value="Flat">Flat</option></select></label>
                  </div>
                  <div className="form-row"><label className="form-field">Locality<select value={formValues.localityId} disabled={!formValues.cityId} onChange={e => setFormValues({ ...formValues, localityId: e.target.value })}><option value="">Unknown / not specified</option>{formOptions.localities.filter(l => l.city_id === formValues.cityId).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
                    <label className="form-field">Demo owner *<select required value={formValues.ownerId} onChange={e => setFormValues({ ...formValues, ownerId: e.target.value })}><option value="">Select owner</option>{formOptions.owners.map(owner => <option key={owner.id} value={owner.id}>{owner.name} — {owner.data_label.replaceAll('_', ' ')}</option>)}</select></label></div>
                  <label className="form-field">Street address (optional)<input maxLength={500} value={formValues.address} onChange={e => setFormValues({ ...formValues, address: e.target.value })} placeholder="Address supplied by owner" /></label>
                  <label className="form-field">Google Maps URL (optional)<input type="url" value={formValues.googleMapsUrl} onChange={e => setFormValues({ ...formValues, googleMapsUrl: e.target.value })} placeholder="https://maps.google.com/…" /></label>
                  <div className="form-row"><label className="form-field">Latitude<input type="number" step="any" min="-90" max="90" value={formValues.latitude} onChange={e => setFormValues({ ...formValues, latitude: e.target.value })} placeholder="Optional" /></label><label className="form-field">Longitude<input type="number" step="any" min="-180" max="180" value={formValues.longitude} onChange={e => setFormValues({ ...formValues, longitude: e.target.value })} placeholder="Optional" /></label></div>
                  <label className="form-field">Coordinate source<select value={formValues.coordinateSource} onChange={e => setFormValues({ ...formValues, coordinateSource: e.target.value as PropertyFormValues['coordinateSource'] })}><option value="owner_submitted">Owner submitted</option><option value="manual">Manual entry</option><option value="google_places">Google Places</option><option value="openstreetmap">OpenStreetMap</option><option value="other">Other</option></select></label>
                  <h3 className="form-section-title">2. Eligibility and house rules</h3>
                  <div className="form-row"><label className="form-field">Occupancy eligibility<select value={formValues.genderEligibility} onChange={e => setFormValues({ ...formValues, genderEligibility: e.target.value as PropertyFormValues['genderEligibility'] })}><option value="unknown">Unknown</option><option value="Boys">Boys</option><option value="Girls">Girls</option><option value="Unisex">Unisex</option></select></label><label className="form-field">Couples allowed?<select value={formValues.couplesAllowed} onChange={e => setFormValues({ ...formValues, couplesAllowed: e.target.value as PropertyFormValues['couplesAllowed'] })}><option value="unknown">Unknown</option><option value="yes">Yes</option><option value="no">No</option></select></label></div>
                  <div className="form-row"><label className="form-field">Co-ed rooms allowed?<select value={formValues.coEdRoomsAllowed} onChange={e => setFormValues({ ...formValues, coEdRoomsAllowed: e.target.value as PropertyFormValues['coEdRoomsAllowed'] })}><option value="unknown">Unknown</option><option value="yes">Yes</option><option value="no">No</option></select></label><label className="form-field">Cooking allowed?<select value={formValues.cookingAllowed} onChange={e => setFormValues({ ...formValues, cookingAllowed: e.target.value as PropertyFormValues['cookingAllowed'] })}><option value="unknown">Unknown</option><option value="yes">Yes</option><option value="no">No</option></select></label></div>
                  <label className="form-field">House rules / restrictions<textarea rows={2} value={formValues.houseRulesNotes} onChange={e => setFormValues({ ...formValues, houseRulesNotes: e.target.value })} placeholder="Curfew, visitors, parents, other rules (if known)" /></label>
                  <h3 className="form-section-title">3. Rent, deposit and utilities</h3>
                  <div className="form-row"><label className="form-field">Security deposit<select value={formValues.securityDepositBasis} onChange={e => setFormValues({ ...formValues, securityDepositBasis: e.target.value as PropertyFormValues['securityDepositBasis'] })}><option value="unknown">Unknown</option><option value="two_weeks_rent">Two weeks' rent</option><option value="one_month_rent">One month's rent</option><option value="two_months_rent">Two months' rent</option><option value="three_months_rent">Three months' rent</option><option value="four_months_rent">Four months' rent</option><option value="fixed_amount">Fixed amount</option><option value="not_required">No deposit required</option></select></label>{formValues.securityDepositBasis === 'fixed_amount' && <label className="form-field">Deposit amount (₹)<input type="number" min="0" step="0.01" value={formValues.securityDepositAmount} onChange={e => setFormValues({ ...formValues, securityDepositAmount: e.target.value })} /></label>}</div>
                  <label className="form-field">Deposit refund policy<select value={formValues.securityDepositRefundPolicy} onChange={e => setFormValues({ ...formValues, securityDepositRefundPolicy: e.target.value as PropertyFormValues['securityDepositRefundPolicy'] })}><option value="unknown">Unknown / not confirmed</option><option value="fully_refundable_no_deductions">100% refundable, no deductions (confirmed)</option><option value="refundable_with_deductions">Refundable with possible deductions</option></select></label>
                  {formValues.securityDepositRefundPolicy === 'refundable_with_deductions' && <label className="form-field">Possible deductions *<textarea required rows={2} value={formValues.securityDepositDeductionNotes} onChange={e => setFormValues({ ...formValues, securityDepositDeductionNotes: e.target.value })} /></label>}
                  <div className="form-row"><label className="form-field">Notice period<select value={formValues.noticePeriodMonths} onChange={e => setFormValues({ ...formValues, noticePeriodMonths: e.target.value })}><option value="">Unknown</option><option value="0">No notice period</option>{[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'month' : 'months'}</option>)}</select></label><label className="form-field">Electricity billing<select value={formValues.electricityBillingMode} onChange={e => setFormValues({ ...formValues, electricityBillingMode: e.target.value as PropertyFormValues['electricityBillingMode'] })}><option value="unknown">Unknown</option><option value="included_in_rent">Included in rent</option><option value="metered">Metered / charged separately</option></select></label></div>
                  {formValues.electricityBillingMode === 'metered' && <label className="form-field">Electricity rate per unit (₹)<input type="number" min="0" step="0.01" value={formValues.electricityRatePerUnit} onChange={e => setFormValues({ ...formValues, electricityRatePerUnit: e.target.value })} placeholder="Rate if known" /></label>}
                  <div className="form-row"><label className="form-field">Four-wheeler parking spaces<input type="number" min="0" step="1" value={formValues.fourWheelerParkingSpaces} onChange={e => setFormValues({ ...formValues, fourWheelerParkingSpaces: e.target.value })} placeholder="Unknown" /></label><label className="form-field">Two-wheeler parking spaces<input type="number" min="0" step="1" value={formValues.twoWheelerParkingSpaces} onChange={e => setFormValues({ ...formValues, twoWheelerParkingSpaces: e.target.value })} placeholder="Unknown" /></label></div>
                  <h3 className="form-section-title">4. Floors, rooms and monthly offers</h3>
                  <p className="form-help">Shared rooms are priced per bed; single/private rooms are priced per room. Food-included and food-excluded offers can coexist. Availability is separate from capacity.</p>
                  {formValues.floors.map((floor, fi) => <div className="nested-card" key={fi}><div className="nested-card-heading"><strong>Floor {fi + 1}</strong>{formValues.floors.length > 1 && <button type="button" className="text-button danger-text" onClick={() => setFormValues({ ...formValues, floors: formValues.floors.filter((_, i) => i !== fi) })}>Remove floor</button>}</div>
                    <div className="form-row"><label className="form-field">Floor number<input type="number" min="-5" max="100" step="1" value={floor.number} onChange={e => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, number: e.target.value } : f) })} /></label><label className="form-field">Floor label<input required value={floor.label} onChange={e => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, label: e.target.value } : f) })} placeholder="Ground floor, First floor…" /></label></div>
                    <label className="form-field">Floor notes<input value={floor.notes} onChange={e => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, notes: e.target.value } : f) })} placeholder="Optional" /></label>
                    {floor.rooms.map((room, ri) => <div className="room-card" key={ri}><div className="nested-card-heading"><strong>Room {ri + 1}</strong>{floor.rooms.length > 1 && <button type="button" className="text-button danger-text" onClick={() => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.filter((_, j) => j !== ri) } : f) })}>Remove room</button>}</div>
                      <div className="form-row"><label className="form-field">Room label<input required value={room.label} onChange={e => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, label: e.target.value } : r) } : f) })} /></label><label className="form-field">Room type<select value={room.type} onChange={e => { const type = e.target.value as RoomForm['type']; setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, type, maxOccupants: type === 'single' ? '1' : '2' } : r) } : f) }) }}><option value="single">Single / private</option><option value="shared">Shared</option></select></label></div>
                      <div className="form-row"><label className="form-field">Maximum occupants<input type="number" min={room.type === 'single' ? 1 : 2} max="50" step="1" value={room.maxOccupants} onChange={e => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, maxOccupants: e.target.value } : r) } : f) })} /></label><label className="form-field">Availability<select value={room.status} onChange={e => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, status: e.target.value as RoomForm['status'] } : r) } : f) })}><option value="unknown">Unknown</option><option value="available">Available</option><option value="occupied">Occupied</option><option value="reserved">Reserved</option><option value="unavailable">Unavailable</option></select></label></div>
                      <div className="form-row"><label className="form-field">Furnishing<select value={room.furnishingStatus} onChange={e => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, furnishingStatus: e.target.value as RoomForm['furnishingStatus'] } : r) } : f) })}><option value="">Unknown</option><option value="furnished">Furnished</option><option value="semi_furnished">Semi-furnished</option><option value="unfurnished">Unfurnished</option></select></label><label className="form-field">Attached bathroom<select value={room.attachedBathroom} onChange={e => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, attachedBathroom: e.target.value as RoomForm['attachedBathroom'] } : r) } : f) })}><option value="unknown">Unknown</option><option value="yes">Yes</option><option value="no">No</option></select></label></div>
                      <div className="form-row"><label className="form-field">Wi-Fi in room<select value={room.wifiAvailableInRoom} onChange={e => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, wifiAvailableInRoom: e.target.value as RoomForm['wifiAvailableInRoom'] } : r) } : f) })}><option value="unknown">Unknown</option><option value="yes">Yes</option><option value="no">No</option></select></label><label className="form-field">Wi-Fi speed (Mbps)<input type="number" min="0" step="1" value={room.wifiSpeedMbps} onChange={e => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, wifiSpeedMbps: e.target.value } : r) } : f) })} placeholder="Unknown" /></label></div>
                      <label className="form-field">Room notes<input value={room.notes} onChange={e => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, notes: e.target.value } : r) } : f) })} placeholder="Optional" /></label>
                      <div className="subsection-heading"><strong>Monthly rent offers</strong><button type="button" className="text-button" onClick={() => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, offers: [...r.offers, newOffer()] } : r) } : f) })}>＋ Add offer</button></div>
                      {room.offers.map((offer, oi) => <div className="form-row offer-row" key={oi}><label className="form-field">Monthly rent (₹)<input required type="number" min="0.01" step="0.01" value={offer.amount} onChange={e => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, offers: r.offers.map((o, k) => k === oi ? { ...o, amount: e.target.value } : o) } : r) } : f) })} /></label><label className="form-field">Food option<select value={offer.foodOption} onChange={e => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, offers: r.offers.map((o, k) => k === oi ? { ...o, foodOption: e.target.value as OfferForm['foodOption'] } : o) } : r) } : f) })}><option value="unknown">Unknown</option><option value="included">Food included</option><option value="excluded">Food excluded</option></select></label>{room.offers.length > 1 && <button type="button" className="text-button danger-text" onClick={() => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, offers: r.offers.filter((_, k) => k !== oi) } : r) } : f) })}>Remove offer</button>}</div>)}
                      <div className="subsection-heading"><strong>Additional room charges</strong><button type="button" className="text-button" onClick={() => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, charges: [...r.charges, newCharge()] } : r) } : f) })}>＋ Add charge</button></div>
                      {room.charges.map((charge, ci) => (
                        <div className="charge-card" key={ci}>
                          <div className="form-row">
                            <label className="form-field">Charge name
                              <input value={charge.name} onChange={e => setFormValues(prev => ({ ...prev, floors: prev.floors.map((f, i) => i !== fi ? f : ({ ...f, rooms: f.rooms.map((r, j) => j !== ri ? r : ({ ...r, charges: r.charges.map((c, k) => k === ci ? { ...c, name: e.target.value } : c) })) })) }))} placeholder="e.g. Cleaning" />
                            </label>
                            <label className="form-field">Amount (₹)
                              <input type="number" min="0" step="0.01" value={charge.amount} onChange={e => setFormValues(prev => ({ ...prev, floors: prev.floors.map((f, i) => i !== fi ? f : ({ ...f, rooms: f.rooms.map((r, j) => j !== ri ? r : ({ ...r, charges: r.charges.map((c, k) => k === ci ? { ...c, amount: e.target.value } : c) })) })) }))} />
                            </label>
                          </div>
                          <div className="form-row">
                            <label className="form-field">Charge basis
                              <select value={charge.basis} onChange={e => setFormValues(prev => ({ ...prev, floors: prev.floors.map((f, i) => i !== fi ? f : ({ ...f, rooms: f.rooms.map((r, j) => j !== ri ? r : ({ ...r, charges: r.charges.map((c, k) => k === ci ? { ...c, basis: e.target.value as ChargeForm['basis'] } : c) })) })) }))}>
                                <option value="one_time">One-time</option><option value="monthly">Monthly</option><option value="per_unit">Per unit</option><option value="per_use">Per use</option><option value="other">Other</option>
                              </select>
                            </label>
                            <label className="form-field">Mandatory?
                              <select value={String(charge.mandatory)} onChange={e => setFormValues(prev => ({ ...prev, floors: prev.floors.map((f, i) => i !== fi ? f : ({ ...f, rooms: f.rooms.map((r, j) => j !== ri ? r : ({ ...r, charges: r.charges.map((c, k) => k === ci ? { ...c, mandatory: e.target.value === 'true' } : c) })) })) }))}>
                                <option value="false">No / optional</option><option value="true">Yes</option>
                              </select>
                            </label>
                          </div>
                          <label className="form-field">Charge description
                            <input value={charge.description} onChange={e => setFormValues(prev => ({ ...prev, floors: prev.floors.map((f, i) => i !== fi ? f : ({ ...f, rooms: f.rooms.map((r, j) => j !== ri ? r : ({ ...r, charges: r.charges.map((c, k) => k === ci ? { ...c, description: e.target.value } : c) })) })) }))} placeholder="Optional" />
                          </label>
                          <button type="button" className="text-button danger-text" onClick={() => setFormValues(prev => ({ ...prev, floors: prev.floors.map((f, i) => i !== fi ? f : ({ ...f, rooms: f.rooms.map((r, j) => j !== ri ? r : ({ ...r, charges: r.charges.filter((_, k) => k !== ci) })) })) }))}>Remove charge</button>
                        </div>
                      ))}
                    </div>)}
                    <button type="button" className="secondary-button compact-button" onClick={() => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: [...f.rooms, newRoom(f.rooms.length + 1)] } : f) })}>＋ Add room to this floor</button>
                  </div>)}
                  <button type="button" className="secondary-button compact-button" onClick={() => setFormValues({ ...formValues, floors: [...formValues.floors, { number: String(formValues.floors.length), label: `Floor ${formValues.floors.length}`, notes: '', rooms: [newRoom(1)] }] })}>＋ Add floor</button>
                  <h3 className="form-section-title">5. Photos (optional)</h3>
                  <p className="form-help">Add image URLs that are already accessible. This field does not upload files to storage.</p>
                  {formValues.images.map((image, i) => <div className="nested-card" key={i}><label className="form-field">Image URL<input type="url" value={image.url} onChange={e => setFormValues({ ...formValues, images: formValues.images.map((im, j) => j === i ? { ...im, url: e.target.value } : im) })} placeholder="https://…" /></label><div className="form-row"><label className="form-field">Photo label<select value={image.label} onChange={e => setFormValues({ ...formValues, images: formValues.images.map((im, j) => j === i ? { ...im, label: e.target.value as PropertyFormValues['images'][number]['label'] } : im) })}><option value="exterior">Exterior</option><option value="bedroom">Bedroom</option><option value="kitchen">Kitchen</option><option value="bathroom">Bathroom</option><option value="living_area">Living area</option><option value="other">Other</option></select></label><label className="form-field">Alt text<input value={image.altText} onChange={e => setFormValues({ ...formValues, images: formValues.images.map((im, j) => j === i ? { ...im, altText: e.target.value } : im) })} placeholder="Describe the photo" /></label></div><label className="checkbox-field"><input type="checkbox" checked={image.isCover} onChange={e => setFormValues({ ...formValues, images: formValues.images.map((im, j) => ({ ...im, isCover: j === i ? e.target.checked : false })) })} /> Use as cover photo</label><button type="button" className="text-button danger-text" onClick={() => setFormValues({ ...formValues, images: formValues.images.filter((_, j) => j !== i) })}>Remove photo</button></div>)}
                  {formValues.images.length < 30 && <button type="button" className="secondary-button compact-button" onClick={() => setFormValues({ ...formValues, images: [...formValues.images, { url: '', label: 'other', altText: '', isCover: formValues.images.length === 0 }] })}>＋ Add photo URL</button>}
                </> : <div className="review-panel"><h3>Confirm before saving</h3><p>This creates a draft record, not a published or verified listing.</p><div className="review-grid"><span>Property</span><strong>{formValues.title}</strong><span>City / locality</span><strong>{formOptions.cities.find(c => c.id === formValues.cityId)?.name ?? 'Unknown'} · {formOptions.localities.find(l => l.id === formValues.localityId)?.name ?? 'Locality unknown'}</strong><span>Property type</span><strong>{formValues.propertyType}</strong><span>Owner</span><strong>{formOptions.owners.find(o => o.id === formValues.ownerId)?.name ?? 'Unknown'}</strong><span>Floors / rooms</span><strong>{formValues.floors.length} floors · {formValues.floors.reduce((sum, f) => sum + f.rooms.length, 0)} rooms</strong><span>Monthly rent offers</span><strong>{formValues.floors.reduce((sum, f) => sum + f.rooms.reduce((rSum, r) => rSum + r.offers.length, 0), 0)} offers</strong><span>Deposit</span><strong>{formValues.securityDepositBasis.replaceAll('_', ' ')}</strong><span>Notice period</span><strong>{formValues.noticePeriodMonths === '' ? 'Unknown' : formValues.noticePeriodMonths === '0' ? 'None' : `${formValues.noticePeriodMonths} months`}</strong><span>Photos</span><strong>{formValues.images.filter(i => i.url.trim()).length} URLs</strong><span>Record status</span><strong>Draft · Synthetic demo · Unverified</strong></div><div className="review-caution">Please confirm rent, eligibility, deposit, rules and availability are based on information you actually have. Leave unsupported details as Unknown.</div></div>}
                {formError && <p role="alert" className="form-error">{formError}</p>}
                <div className="modal-footer">{reviewMode && <button className="secondary-button" type="button" disabled={savingProperty} onClick={() => { setReviewMode(false); setFormError('') }}>Back to edit</button>}<button className="secondary-button" type="button" disabled={savingProperty} onClick={() => setShowAddForm(false)}>Cancel</button><button className="primary-button" type="submit" disabled={savingProperty}>{savingProperty ? 'Saving…' : reviewMode ? 'Confirm and save draft' : 'Review before saving'}</button></div>
              </form>
            )}
            {formError && formLoading && <p role="alert" className="form-error">{formError}</p>}
          </section>
        </div>
      )}
      {toast && <div className="toast" role="status"><span>i</span>{toast}</div>}
    </div>
  )
}

function StatCard({ label, value, note, icon }: { label: string; value: string; note: string; icon: string }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><span className="stat-icon" aria-hidden="true">{icon}</span></div><strong className="stat-value">{value}</strong><span className="stat-note">{note}</span></div>
}

function StatusPill({ status }: { status: PropertyStatus }) {
  return <span className={`status-pill ${status.toLowerCase()}`}><span />{status}</span>
}

function VerificationPill({ status }: { status: VerificationStatus }) {
  return <span className={`verification-pill ${status === 'Independently checked' ? 'checked' : status === 'Owner confirmed' ? 'owner-confirmed' : 'unverified'}`}><span className="verification-dot" />{status}</span>
}

export default App
