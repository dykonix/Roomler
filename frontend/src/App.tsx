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



type PropertyDetail = {
  id: string; title: string; description: string; property_type: 'PG' | 'Flat';
  city_id: string; city: string | null; locality_id: string | null; locality: string | null;
  owner_id: string; owner_name: string | null; address: string | null; google_maps_url: string | null;
  gender_eligibility: string | null; couples_allowed: boolean | null; co_ed_rooms_allowed: boolean | null;
  cooking_allowed: boolean | null; house_rules_notes: string | null; listing_status: string;
  verification_status: string; listing_source: string; data_label: string; updated_at: string;
  security_deposit_basis: string | null; security_deposit_amount: string | number | null;
  security_deposit_refund_policy: string | null; notice_period_value: string | number | null;
  notice_period_unit: string | null; electricity_billing_mode: string | null;
  electricity_rate_per_unit: string | number | null; four_wheeler_parking_spaces: number | null;
  two_wheeler_parking_spaces: number | null;
  property_amenities: { key: string; value: 'yes' | 'no' | 'unknown'; verification_status?: string; source_note?: string | null }[];
  floors: { id: string; number: number; label: string; notes: string | null;
    amenities: { key: string; value: 'yes' | 'no' | 'unknown'; verification_status?: string; source_note?: string | null }[];
    rooms: { id: string; label: string; type: 'single' | 'shared'; maxOccupants: number; status: string;
      furnishingStatus: string | null; attachedBathroom: boolean | null; wifiAvailableInRoom: boolean | null; notes: string | null;
      amenities: { key: string; value: 'yes' | 'no' | 'unknown'; verification_status?: string; source_note?: string | null }[];
      offers: { id: string; amount: string | number; currency: string; rentBasis: string; stayPeriod: string; foodOption: string; status: string }[];
      charges: { id: string; name: string; amount: string | number; currency: string; basis: string; mandatory: boolean | null; description: string | null }[];
      beds: { id: string; label: string; type: string; status: string }[];
    }[];
  }[];
  images: { id: string; image_url: string; image_label: string | null; alt_text: string | null; is_cover: boolean }[];
}
type PropertyEditValues = {
  title: string; description: string; propertyType: 'PG' | 'Flat'; cityId: string;
  localityId: string; ownerId: string; address: string; googleMapsUrl: string;
  genderEligibility: string; couplesAllowed: string; coEdRoomsAllowed: string; cookingAllowed: string;
}

type AmenityScope = 'property' | 'floor' | 'room'
type AmenityOption = { attribute_key: string; display_name: string; scope: AmenityScope }
type AmenityValue = { key: string; value: 'yes' | 'no' | 'unknown' }
type FormOptions = {
  cities: { id: string; name: string; state_name: string }[]
  localities: { id: string; name: string; city_id: string; city_name: string }[]
  owners: { id: string; name: string; contact_phone: string | null; contact_email: string | null; data_label: string }[]
  amenities: AmenityOption[]
}

type ChargeForm = { name: string; amount: string; basis: 'one_time' | 'monthly' | 'per_unit' | 'per_use' | 'other'; mandatory: boolean; description: string }
type OfferForm = { amount: string; foodOption: 'included' | 'excluded' | 'unknown'; status: 'active' | 'inactive' | 'unknown' }
type RoomForm = { label: string; type: 'single' | 'shared'; maxOccupants: string; totalBeds: string; availableBeds: string; availabilityLastConfirmedAt: string; status: 'available' | 'occupied' | 'reserved' | 'unavailable' | 'unknown'; furnishingStatus: 'furnished' | 'semi_furnished' | 'unfurnished' | ''; attachedBathroom: 'yes' | 'no' | 'unknown'; wifiAvailableInRoom: 'yes' | 'no' | 'unknown'; wifiSpeedMbps: string; notes: string; amenities: AmenityValue[]; offers: OfferForm[]; charges: ChargeForm[] }
type FloorForm = { number: string; label: string; notes: string; amenities: AmenityValue[]; rooms: RoomForm[] }
type PropertyFormValues = {
  title: string; description: string; cityId: string; localityId: string; ownerId: string; propertyType: 'PG' | 'Flat';
  address: string; googleMapsUrl: string; latitude: string; longitude: string; coordinateSource: 'manual' | 'owner_submitted' | 'google_places' | 'openstreetmap' | 'other';
  genderEligibility: 'Boys' | 'Girls' | 'Unisex' | 'unknown'; couplesAllowed: 'yes' | 'no' | 'unknown'; coEdRoomsAllowed: 'yes' | 'no' | 'unknown'; cookingAllowed: 'yes' | 'no' | 'unknown'; houseRulesNotes: string;
  securityDepositBasis: 'two_weeks_rent' | 'one_month_rent' | 'two_months_rent' | 'three_months_rent' | 'four_months_rent' | 'fixed_amount' | 'not_required' | 'unknown'; securityDepositAmount: string; securityDepositRefundPolicy: 'fully_refundable_no_deductions' | 'refundable_with_deductions' | 'unknown'; securityDepositDeductionNotes: string;
  noticePeriodMonths: string; electricityBillingMode: 'included_in_rent' | 'metered' | 'unknown'; electricityRatePerUnit: string; fourWheelerParkingSpaces: string; twoWheelerParkingSpaces: string;
  propertyAmenities: AmenityValue[]; floors: FloorForm[]; images: { key: string; url: string; previewUrl: string; fileName: string; label: 'exterior' | 'bedroom' | 'kitchen' | 'bathroom' | 'living_area' | 'other'; altText: string; isCover: boolean }[];
}

const newCharge = (): ChargeForm => ({ name: '', amount: '', basis: 'monthly', mandatory: false, description: '' })
const newOffer = (): OfferForm => ({ amount: '', foodOption: 'unknown', status: 'active' })
const newRoom = (index = 1): RoomForm => ({ label: `Room ${index}`, type: 'shared', maxOccupants: '2', totalBeds: '2', availableBeds: '', availabilityLastConfirmedAt: '', status: 'unknown', furnishingStatus: '', attachedBathroom: 'unknown', wifiAvailableInRoom: 'unknown', wifiSpeedMbps: '', notes: '', amenities: [], offers: [newOffer()], charges: [] })
const initialFormValues: PropertyFormValues = {
  title: '', description: '', cityId: '', localityId: '', ownerId: '', propertyType: 'PG', address: '', googleMapsUrl: '', latitude: '', longitude: '', coordinateSource: 'owner_submitted',
  genderEligibility: 'unknown', couplesAllowed: 'unknown', coEdRoomsAllowed: 'unknown', cookingAllowed: 'unknown', houseRulesNotes: '',
  securityDepositBasis: 'unknown', securityDepositAmount: '', securityDepositRefundPolicy: 'unknown', securityDepositDeductionNotes: '', noticePeriodMonths: '',
  electricityBillingMode: 'unknown', electricityRatePerUnit: '', fourWheelerParkingSpaces: '', twoWheelerParkingSpaces: '',
  propertyAmenities: [], floors: [{ number: '0', label: 'Ground floor', notes: '', amenities: [], rooms: [newRoom(1)] }], images: [],
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
  const [openActionId, setOpenActionId] = useState<string | null>(null)
  const [detailProperty, setDetailProperty] = useState<PropertyDetail | null>(null)
  const [editingProperty, setEditingProperty] = useState<PropertyDetail | null>(null)
  const [editValues, setEditValues] = useState<PropertyEditValues | null>(null)
  const [inventoryValues, setInventoryValues] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null)
  const [actionBusy, setActionBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [toast, setToast] = useState('')
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [formOptions, setFormOptions] = useState<FormOptions>({
  cities: [],
  localities: [],
  owners: [],
  amenities: [],
})
  const [formLoading, setFormLoading] = useState(false)
  const [savingProperty, setSavingProperty] = useState(false)
  const [formError, setFormError] = useState('')
  const [formValues, setFormValues] = useState<PropertyFormValues>(initialFormValues)
  const [reviewMode, setReviewMode] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)

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
      const options = await response.json() as FormOptions
      setFormOptions(options)
      const defaults = (scope: AmenityScope): AmenityValue[] => options.amenities.filter(item => item.scope === scope).map(item => ({ key: item.attribute_key, value: 'unknown' }))
      setFormValues({
        ...initialFormValues,
        propertyAmenities: defaults('property'),
        floors: [{ number: '0', label: 'Ground floor', notes: '', amenities: defaults('floor'), rooms: [{ ...newRoom(1), amenities: defaults('room') }] }],
      })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to load form options.')
    } finally {
      setFormLoading(false)
    }
  }

  async function handlePhotoSelection(fileList: FileList | null) {
    if (!fileList?.length) return
    const files = Array.from(fileList)
    if (formValues.images.length + files.length > 30) {
      setFormError('A property can have at most 30 photos.')
      return
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
    for (const file of files) {
      if (!allowed.includes(file.type)) { setFormError(`${file.name}: use JPG, PNG, WebP or AVIF.`); return }
      if (file.size > 10 * 1024 * 1024) { setFormError(`${file.name}: each photo must be 10 MB or smaller.`); return }
    }
    setFormError('')
    setUploadingPhotos(true)
    try {
      const uploaded: PropertyFormValues['images'] = []
      for (const file of files) {
        const presignResponse = await fetch('http://localhost:3001/api/admin/media/presign-upload', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentType: file.type, fileSize: file.size }),
        })
        const presign = await presignResponse.json()
        if (!presignResponse.ok) throw new Error(presign.error ?? `Could not prepare upload for ${file.name}.`)
        const uploadForm = new FormData()
        Object.entries(presign.fields as Record<string, string>).forEach(([key, value]) => uploadForm.append(key, value))
        uploadForm.append('file', file)
        const uploadResponse = await fetch(presign.url as string, { method: 'POST', body: uploadForm })
        if (!uploadResponse.ok) throw new Error(`S3 upload failed for ${file.name} (${uploadResponse.status}). Check the bucket CORS settings.`)
        uploaded.push({ key: presign.key as string, url: `s3://${presign.key as string}`, previewUrl: URL.createObjectURL(file), fileName: file.name, label: 'other', altText: file.name.replace(/\.[^.]+$/, ''), isCover: formValues.images.length === 0 && uploaded.length === 0 })
      }
      setFormValues(prev => ({ ...prev, images: [...prev.images, ...uploaded].map((image, index) => ({ ...image, isCover: prev.images.some(existing => existing.isCover) ? image.isCover : index === 0 })) }))
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Photo upload failed.')
    } finally {
      setUploadingPhotos(false)
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
        if (room.type === 'shared') {
          const totalBeds = Number(room.totalBeds)
          const availableBeds = room.availableBeds.trim() === '' ? null : Number(room.availableBeds)
          if (!Number.isSafeInteger(totalBeds) || totalBeds < 2 || totalBeds > capacity || (availableBeds !== null && (!Number.isSafeInteger(availableBeds) || availableBeds < 0 || availableBeds > totalBeds))) {
            setFormError(`Check total and available bed counts for ${room.label}. Available beds cannot exceed total beds or room capacity.`)
            setReviewMode(false)
            return
          }
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
      propertyAmenities: formValues.propertyAmenities,
      floors: formValues.floors.map(floor => ({ number: Number(floor.number), label: floor.label.trim(), notes: floor.notes.trim() || undefined, amenities: floor.amenities,
        rooms: floor.rooms.map(room => ({ label: room.label.trim(), type: room.type, maxOccupants: Number(room.maxOccupants), status: room.status,
          availabilityLastConfirmedAt: room.availabilityLastConfirmedAt || null,
          beds: room.type === 'single' ? [{ label: 'Bed 1', type: 'single', status: room.status === 'available' ? 'available' : room.status === 'occupied' ? 'occupied' : room.status === 'reserved' ? 'reserved' : room.status === 'unavailable' ? 'unavailable' : 'unknown' }] : Array.from({ length: Number(room.totalBeds) || 0 }, (_, bedIndex) => ({ label: `Bed ${bedIndex + 1}`, type: 'single', status: room.availableBeds.trim() === '' ? 'unknown' : bedIndex < Number(room.availableBeds) ? 'available' : 'unavailable' })),
          amenities: room.amenities,
          furnishingStatus: room.furnishingStatus || undefined, attachedBathroom: toNullableBoolean(room.attachedBathroom),
          wifiAvailableInRoom: toNullableBoolean(room.wifiAvailableInRoom), wifiSpeedMbps: parseOptionalNumber(room.wifiSpeedMbps), notes: room.notes.trim() || undefined,
          offers: room.offers.map(offer => ({ amount: Number(offer.amount), foodOption: offer.foodOption, status: offer.status, rentBasis: room.type === 'shared' ? 'per_bed' : 'per_room' })),
          charges: room.charges.map(charge => ({ name: charge.name.trim(), amount: Number(charge.amount), basis: charge.basis, mandatory: charge.mandatory, description: charge.description.trim() || undefined }))
        }))
      })),
      images: formValues.images.map((image, index) => ({ key: image.key, url: image.url, label: image.label, altText: image.altText.trim(), isCover: image.isCover, displayOrder: index }))
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


  async function loadPropertyDetail(id: string): Promise<PropertyDetail> {
    const response = await fetch(`http://localhost:3001/api/admin/properties/${id}`)
    const result = await response.json()
    if (!response.ok) throw new Error(result.error ?? `Could not load property (${response.status}).`)
    return result.data as PropertyDetail
  }

  async function openPropertyDetails(property: Property) {
    setOpenActionId(null); setActionError(''); setActionBusy(true)
    try { setDetailProperty(await loadPropertyDetail(property.id)) }
    catch (error) { setActionError(error instanceof Error ? error.message : 'Unable to load property details.') }
    finally { setActionBusy(false) }
  }

  async function openPropertyEdit(property: Property) {
    setOpenActionId(null); setActionError(''); setActionBusy(true)
    try {
      const optionsResponse = await fetch('http://localhost:3001/api/admin/form-options')
      const options = await optionsResponse.json() as FormOptions
      if (!optionsResponse.ok) throw new Error('Could not load cities, localities and owners for editing.')
      setFormOptions(options)
      const detail = await loadPropertyDetail(property.id)
      setEditingProperty(detail)
      setInventoryValues({
        propertyAmenities: (detail.property_amenities ?? []).map(a => ({ key: a.key, value: a.value })),
        floors: (detail.floors ?? []).map(f => ({
          id: f.id, number: String(f.number), label: f.label, notes: f.notes ?? '',
          amenities: (f.amenities ?? []).map(a => ({ key: a.key, value: a.value })),
          rooms: (f.rooms ?? []).map(r => ({
            id: r.id, label: r.label, type: r.type, maxOccupants: String(r.maxOccupants),
            status: r.status ?? 'unknown', furnishingStatus: r.furnishingStatus ?? '',
            attachedBathroom: r.attachedBathroom == null ? 'unknown' : r.attachedBathroom ? 'yes' : 'no',
            wifiAvailableInRoom: r.wifiAvailableInRoom == null ? 'unknown' : r.wifiAvailableInRoom ? 'yes' : 'no',
            notes: r.notes ?? '', amenities: (r.amenities ?? []).map(a => ({ key: a.key, value: a.value })),
            offers: (r.offers ?? []).map(o => ({ id: o.id, amount: String(o.amount), rentBasis: o.rentBasis, foodOption: o.foodOption ?? 'unknown', status: o.status ?? 'unknown' })),
            charges: (r.charges ?? []).map(ch => ({ id: ch.id, name: ch.name, amount: String(ch.amount), basis: ch.basis, mandatory: ch.mandatory ?? false, description: ch.description ?? '' })),
            beds: r.beds ?? [],
          })),
        })),
      })
      setEditValues({
        title: detail.title, description: detail.description ?? '', propertyType: detail.property_type,
        cityId: detail.city_id, localityId: detail.locality_id ?? '', ownerId: detail.owner_id,
        address: detail.address ?? '', googleMapsUrl: detail.google_maps_url ?? '',
        genderEligibility: detail.gender_eligibility ?? 'unknown',
        couplesAllowed: detail.couples_allowed === null ? 'unknown' : detail.couples_allowed ? 'yes' : 'no',
        coEdRoomsAllowed: detail.co_ed_rooms_allowed === null ? 'unknown' : detail.co_ed_rooms_allowed ? 'yes' : 'no',
        cookingAllowed: detail.cooking_allowed === null ? 'unknown' : detail.cooking_allowed ? 'yes' : 'no',
      })
    } catch (error) { setActionError(error instanceof Error ? error.message : 'Unable to load property for editing.') }
    finally { setActionBusy(false) }
  }

  async function refreshProperties() {
    const response = await fetch('http://localhost:3001/api/admin/properties')
    const result = await response.json()
    if (!response.ok || !Array.isArray(result.data)) throw new Error(result.error ?? 'Unable to refresh properties.')
    setProperties(result.data.map(mapApiProperty))
  }

  async function changePropertyStatus(property: Property, status: 'draft' | 'published' | 'paused' | 'removed') {
    setOpenActionId(null); setActionBusy(true); setActionError('')
    try {
      const response = await fetch(`http://localhost:3001/api/admin/properties/${property.id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? `Status update failed (${response.status}).`)
      await refreshProperties()
      showDemoToast(`Listing status changed to ${status}.${status === 'published' ? ' Verification remains unchanged.' : ''}`)
    } catch (error) { setActionError(error instanceof Error ? error.message : 'Unable to change listing status.') }
    finally { setActionBusy(false) }
  }

  async function savePropertyEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingProperty || !editValues) return
    setActionBusy(true); setActionError('')
    const toNullableBoolean = (value: string) => value === 'unknown' ? null : value === 'yes'
    try {
      const response = await fetch(`http://localhost:3001/api/admin/properties/${editingProperty.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editValues.title.trim(), description: editValues.description, propertyType: editValues.propertyType,
          cityId: editValues.cityId, localityId: editValues.localityId || null, ownerId: editValues.ownerId,
          address: editValues.address.trim() || null, googleMapsUrl: editValues.googleMapsUrl.trim() || null,
          genderEligibility: editValues.genderEligibility === 'unknown' ? null : editValues.genderEligibility,
          couplesAllowed: toNullableBoolean(editValues.couplesAllowed),
          coEdRoomsAllowed: toNullableBoolean(editValues.coEdRoomsAllowed),
          cookingAllowed: toNullableBoolean(editValues.cookingAllowed),
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? `Save failed (${response.status}).`)
      const inventoryResponse = await fetch(`http://localhost:3001/api/admin/properties/${editingProperty.id}/inventory`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyAmenities: inventoryValues.propertyAmenities,
          floors: inventoryValues.floors.map((floor: any) => ({
            ...floor, number: Number(floor.number),
            rooms: floor.rooms.map((room: any) => ({
              ...room, maxOccupants: Number(room.maxOccupants),
              furnishingStatus: room.furnishingStatus || null,
              attachedBathroom: room.attachedBathroom === 'unknown' ? null : room.attachedBathroom === 'yes',
              wifiAvailableInRoom: room.wifiAvailableInRoom === 'unknown' ? null : room.wifiAvailableInRoom === 'yes',
              offers: room.offers.map((offer: any) => ({ ...offer, amount: Number(offer.amount) })),
              charges: room.charges.map((charge: any) => ({ ...charge, amount: Number(charge.amount) })),
            })),
          })),
        }),
      })
      const inventoryResult = await inventoryResponse.json()
      if (!inventoryResponse.ok) throw new Error(inventoryResult.error ?? `Inventory save failed (${inventoryResponse.status}).`)
      setEditingProperty(null); setEditValues(null); setInventoryValues(null)
      await refreshProperties()
      showDemoToast('Property details, inventory and amenities saved. Omitted records were preserved.')
    } catch (error) { setActionError(error instanceof Error ? error.message : 'Unable to update property.') }
    finally { setActionBusy(false) }
  }

  async function deleteProperty() {
    if (!deleteTarget) return
    setActionBusy(true); setActionError('')
    try {
      const response = await fetch(`http://localhost:3001/api/admin/properties/${deleteTarget.id}`, { method: 'DELETE' })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? `Delete failed (${response.status}).`)
      const title = deleteTarget.title
      setDeleteTarget(null)
      await refreshProperties()
      showDemoToast(`Deleted "${title}" from the database. Associated S3 files may need cleanup.`)
    } catch (error) { setActionError(error instanceof Error ? error.message : 'Unable to delete property.') }
    finally { setActionBusy(false) }
  }

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
                  <option>All statuses</option><option>Published</option><option>Draft</option><option>Paused</option><option>Removed</option>
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
                        <td className="action-cell"><button className="row-action" type="button" aria-label={`Actions for ${property.title}`} aria-expanded={openActionId === property.id} onClick={() => setOpenActionId(openActionId === property.id ? null : property.id)}>···</button>
                          {openActionId === property.id && <div className="action-menu" role="menu">
                            <button type="button" role="menuitem" onClick={() => void openPropertyDetails(property)}>View details</button>
                            <button type="button" role="menuitem" onClick={() => void openPropertyEdit(property)}>Edit property</button>
                            <div className="action-menu-label">Change listing status</div>
                            {(['draft','published','paused','removed'] as const).filter(status => status !== property.status.toLowerCase()).map(status => <button key={status} type="button" role="menuitem" onClick={() => void changePropertyStatus(property, status)}>Set {status}</button>)}
                            <div className="action-menu-divider" />
                            <button className="danger-action" type="button" role="menuitem" onClick={() => { setOpenActionId(null); setActionError(''); setDeleteTarget(property) }}>Delete property…</button>
                          </div>}</td>
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


      {actionError && !editingProperty && !deleteTarget && !detailProperty && <div className="action-error-banner" role="alert">{actionError}<button type="button" onClick={() => setActionError('')} aria-label="Dismiss error">×</button></div>}

      {detailProperty && <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setDetailProperty(null) }}>
        <section className="modal action-modal" role="dialog" aria-modal="true" aria-labelledby="property-details-title">
          <div className="modal-heading"><div><div className="eyebrow">PROPERTY RECORD · VIEW ONLY</div><h2 id="property-details-title">{detailProperty.title}</h2></div><button className="modal-close" type="button" onClick={() => setDetailProperty(null)} aria-label="Close details">×</button></div>
          <div className="modal-notice">Listing status and verification status are separate. Viewing this record does not verify its claims.</div>
          <dl className="detail-grid">
            <div><dt>Property ID</dt><dd>{detailProperty.id}</dd></div><div><dt>Property type</dt><dd>{detailProperty.property_type}</dd></div>
            <div><dt>City</dt><dd>{detailProperty.city ?? 'Unknown'}</dd></div><div><dt>Locality</dt><dd>{detailProperty.locality ?? 'Unknown'}</dd></div>
            <div><dt>Owner</dt><dd>{detailProperty.owner_name ?? 'Unknown'}</dd></div><div><dt>Listing status</dt><dd>{detailProperty.listing_status}</dd></div>
            <div><dt>Verification</dt><dd>{detailProperty.verification_status.replaceAll('_',' ')}</dd></div><div><dt>Data label</dt><dd>{detailProperty.data_label.replaceAll('_',' ')}</dd></div>
            <div><dt>Occupancy eligibility</dt><dd>{detailProperty.gender_eligibility ?? 'Unknown'}</dd></div>
            <div><dt>Couples allowed</dt><dd>{detailProperty.couples_allowed === null ? 'Unknown' : detailProperty.couples_allowed ? 'Yes' : 'No'}</dd></div>
            <div><dt>Co-ed rooms</dt><dd>{detailProperty.co_ed_rooms_allowed === null ? 'Unknown' : detailProperty.co_ed_rooms_allowed ? 'Yes' : 'No'}</dd></div>
            <div><dt>Cooking allowed</dt><dd>{detailProperty.cooking_allowed === null ? 'Unknown' : detailProperty.cooking_allowed ? 'Yes' : 'No'}</dd></div>
            <div className="detail-full"><dt>Address</dt><dd>{detailProperty.address ?? 'Not provided'}</dd></div>
            <div className="detail-full"><dt>Description</dt><dd>{detailProperty.description || 'Not provided'}</dd></div>
            <div><dt>Security deposit</dt><dd>{detailProperty.security_deposit_basis?.replaceAll('_',' ') ?? 'Unknown'}{detailProperty.security_deposit_amount != null ? ` · ₹${Number(detailProperty.security_deposit_amount).toLocaleString('en-IN')}` : ''}</dd></div>
            <div><dt>Notice period</dt><dd>{detailProperty.notice_period_value == null ? 'Unknown' : `${detailProperty.notice_period_value} ${detailProperty.notice_period_unit ?? 'units'}`}</dd></div>
            <div><dt>Electricity</dt><dd>{detailProperty.electricity_billing_mode?.replaceAll('_',' ') ?? 'Unknown'}</dd></div>
            <div><dt>Photos</dt><dd>{detailProperty.images?.length ?? 0} stored photo record(s)</dd></div>
          </dl>
          <div className="modal-footer"><button className="secondary-button" type="button" onClick={() => setDetailProperty(null)}>Close</button><button className="primary-button" type="button" onClick={() => { const selected = properties.find(p => p.id === detailProperty.id); setDetailProperty(null); if (selected) void openPropertyEdit(selected) }}>Edit property</button></div>
        </section>
      </div>}

      {editingProperty && editValues && <div className="modal-backdrop" role="presentation">
        <section className="modal action-modal" role="dialog" aria-modal="true" aria-labelledby="edit-property-title">
          <div className="modal-heading"><div><div className="eyebrow">PROPERTY WORKFLOW · EDIT</div><h2 id="edit-property-title">Edit property details</h2></div><button className="modal-close" type="button" disabled={actionBusy} onClick={() => { setEditingProperty(null); setEditValues(null); setActionError('') }} aria-label="Close edit">×</button></div>
          <div className="modal-notice">This edit form updates property-level fields. Existing floors, rooms, beds, pricing, charges and amenities are preserved. Photos are shown below for reference; photo editing is not enabled in this form yet.</div>
          <section className="edit-photo-section" aria-label="Existing property photos">
            <div className="edit-photo-heading"><strong>Property photos</strong><span>{editingProperty.images?.length ?? 0} saved photo(s)</span></div>
            {editingProperty.images?.length ? <div className="edit-photo-grid">{editingProperty.images.map((image, index) => {
              const usableUrl = image.image_url && !image.image_url.startsWith('s3://');
              return <figure className="edit-photo-card" key={image.id}>
                {usableUrl ? <img src={image.image_url} alt={image.alt_text || image.image_label || `Property photo ${index + 1}`} /> : <div className="edit-photo-unavailable">Image preview unavailable</div>}
                <figcaption><strong>{image.image_label?.replaceAll('_', ' ') || 'Photo'}</strong>{image.is_cover && <span className="edit-photo-cover">Cover photo</span>}<small>{image.alt_text || 'No alt text provided'}</small></figcaption>
              </figure>;
            })}</div> : <p className="edit-photo-empty">No saved photos are attached to this property.</p>}
          </section>
          <form onSubmit={savePropertyEdit}>
            <label className="form-field">Property title *<input required minLength={3} maxLength={150} value={editValues.title} onChange={e => setEditValues({...editValues,title:e.target.value})}/></label>
            <label className="form-field">Description<textarea rows={4} maxLength={10000} value={editValues.description} onChange={e => setEditValues({...editValues,description:e.target.value})}/></label>
            <div className="form-row">
              <label className="form-field">City *<select required value={editValues.cityId} onChange={e => setEditValues({...editValues,cityId:e.target.value,localityId:''})}><option value="">Select city</option>{formOptions.cities.map(city=><option key={city.id} value={city.id}>{city.name}, {city.state_name}</option>)}</select></label>
              <label className="form-field">Property type<select value={editValues.propertyType} onChange={e => setEditValues({...editValues,propertyType:e.target.value as 'PG'|'Flat'})}><option value="PG">PG</option><option value="Flat">Flat</option></select></label>
            </div>
            <div className="form-row">
              <label className="form-field">Locality<select value={editValues.localityId} onChange={e=>setEditValues({...editValues,localityId:e.target.value})}><option value="">Unknown / not specified</option>{formOptions.localities.filter(l=>l.city_id===editValues.cityId).map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
              <label className="form-field">Owner *<select required value={editValues.ownerId} onChange={e=>setEditValues({...editValues,ownerId:e.target.value})}><option value="">Select owner</option>{formOptions.owners.map(owner=><option key={owner.id} value={owner.id}>{owner.name}</option>)}</select></label>
            </div>
            <label className="form-field">Address<input value={editValues.address} onChange={e=>setEditValues({...editValues,address:e.target.value})}/></label>
            <label className="form-field">Google Maps URL<input type="url" value={editValues.googleMapsUrl} onChange={e=>setEditValues({...editValues,googleMapsUrl:e.target.value})}/></label>
            <div className="form-row">
              <label className="form-field">Occupancy eligibility<select value={editValues.genderEligibility} onChange={e=>setEditValues({...editValues,genderEligibility:e.target.value})}><option value="unknown">Unknown</option><option value="Boys">Boys</option><option value="Girls">Girls</option><option value="Unisex">Unisex</option></select></label>
              <label className="form-field">Couples allowed<select value={editValues.couplesAllowed} onChange={e=>setEditValues({...editValues,couplesAllowed:e.target.value})}><option value="unknown">Unknown</option><option value="yes">Yes</option><option value="no">No</option></select></label>
            </div>
            <div className="form-row">
              <label className="form-field">Co-ed rooms allowed<select value={editValues.coEdRoomsAllowed} onChange={e=>setEditValues({...editValues,coEdRoomsAllowed:e.target.value})}><option value="unknown">Unknown</option><option value="yes">Yes</option><option value="no">No</option></select></label>
              <label className="form-field">Cooking allowed<select value={editValues.cookingAllowed} onChange={e=>setEditValues({...editValues,cookingAllowed:e.target.value})}><option value="unknown">Unknown</option><option value="yes">Yes</option><option value="no">No</option></select></label>
            </div>

            {inventoryValues && <section className="edit-inventory">
              <h3>Property amenities</h3>
              <p className="form-help">Unknown means the information has not been confirmed. Saving does not verify an attribute.</p>
              <div className="amenity-grid">{formOptions.amenities.filter(a=>a.scope==='property').map(option => {
                const current = inventoryValues.propertyAmenities.find((a:any)=>a.key===option.attribute_key)?.value ?? 'unknown'
                return <label className="amenity-row" key={option.attribute_key}><span>{option.display_name}</span><select value={current} onChange={e=>setInventoryValues((prev:any)=>({...prev,propertyAmenities:prev.propertyAmenities.some((a:any)=>a.key===option.attribute_key)?prev.propertyAmenities.map((a:any)=>a.key===option.attribute_key?{...a,value:e.target.value}:a):[...prev.propertyAmenities,{key:option.attribute_key,value:e.target.value}]}))}><option value="unknown">Unknown</option><option value="yes">Yes</option><option value="no">No</option></select></label>
              })}</div>
              <h3>Floors and rooms</h3>
              {inventoryValues.floors.map((floor:any, fi:number) => <section className="edit-floor" key={floor.id ?? `new-floor-${fi}`}>
                <h4>Floor {fi+1}</h4>
                <div className="form-row">
                  <label className="form-field">Floor number<input type="number" value={floor.number} onChange={e=>setInventoryValues((p:any)=>({...p,floors:p.floors.map((f:any,i:number)=>i===fi?{...f,number:e.target.value}:f)}))}/></label>
                  <label className="form-field">Floor label<input required value={floor.label} onChange={e=>setInventoryValues((p:any)=>({...p,floors:p.floors.map((f:any,i:number)=>i===fi?{...f,label:e.target.value}:f)}))}/></label>
                </div>
                <label className="form-field">Floor notes<input value={floor.notes} onChange={e=>setInventoryValues((p:any)=>({...p,floors:p.floors.map((f:any,i:number)=>i===fi?{...f,notes:e.target.value}:f)}))}/></label>
                <strong>Floor amenities</strong>
                <div className="amenity-grid">{formOptions.amenities.filter(a=>a.scope==='floor').map(option => {
                  const current = floor.amenities.find((a:any)=>a.key===option.attribute_key)?.value ?? 'unknown'
                  return <label className="amenity-row" key={option.attribute_key}><span>{option.display_name}</span><select value={current} onChange={e=>setInventoryValues((p:any)=>({...p,floors:p.floors.map((f:any,i:number)=>i!==fi?f:{...f,amenities:f.amenities.some((a:any)=>a.key===option.attribute_key)?f.amenities.map((a:any)=>a.key===option.attribute_key?{...a,value:e.target.value}:a):[...f.amenities,{key:option.attribute_key,value:e.target.value}]})}))}><option value="unknown">Unknown</option><option value="yes">Yes</option><option value="no">No</option></select></label>
                })}</div>
                {floor.rooms.map((room:any, ri:number) => <section className="edit-room" key={room.id ?? `new-room-${fi}-${ri}`}>
                  <h4>Room {ri+1}</h4>
                  <div className="form-row">
                    <label className="form-field">Room label<input required value={room.label} onChange={e=>setInventoryValues((p:any)=>({...p,floors:p.floors.map((f:any,i:number)=>i!==fi?f:{...f,rooms:f.rooms.map((r:any,j:number)=>j===ri?{...r,label:e.target.value}:r)} )}))}/></label>
                    <label className="form-field">Room type<select value={room.type} onChange={e=>setInventoryValues((p:any)=>({...p,floors:p.floors.map((f:any,i:number)=>i!==fi?f:{...f,rooms:f.rooms.map((r:any,j:number)=>j===ri?{...r,type:e.target.value,maxOccupants:e.target.value==='single'?'1':(Number(r.maxOccupants)<2?'2':r.maxOccupants)}:r)} )}))}><option value="single">Private / single</option><option value="shared">Shared</option></select></label>
                  </div>
                  <div className="form-row">
                    <label className="form-field">Maximum occupants<input type="number" min="1" max="50" required value={room.maxOccupants} onChange={e=>setInventoryValues((p:any)=>({...p,floors:p.floors.map((f:any,i:number)=>i!==fi?f:{...f,rooms:f.rooms.map((r:any,j:number)=>j===ri?{...r,maxOccupants:e.target.value}:r)} )}))}/></label>
                    <label className="form-field">Availability<select value={room.status} onChange={e=>setInventoryValues((p:any)=>({...p,floors:p.floors.map((f:any,i:number)=>i!==fi?f:{...f,rooms:f.rooms.map((r:any,j:number)=>j===ri?{...r,status:e.target.value}:r)} )}))}><option value="unknown">Unknown</option><option value="available">Available</option><option value="occupied">Occupied</option><option value="reserved">Reserved</option><option value="unavailable">Unavailable</option></select></label>
                  </div>
                  <div className="form-row">
                    <label className="form-field">Furnishing<select value={room.furnishingStatus} onChange={e=>setInventoryValues((p:any)=>({...p,floors:p.floors.map((f:any,i:number)=>i!==fi?f:{...f,rooms:f.rooms.map((r:any,j:number)=>j===ri?{...r,furnishingStatus:e.target.value}:r)} )}))}><option value="">Unknown</option><option value="furnished">Furnished</option><option value="semi_furnished">Semi-furnished</option><option value="unfurnished">Unfurnished</option></select></label>
                    <label className="form-field">Attached bathroom<select value={room.attachedBathroom} onChange={e=>setInventoryValues((p:any)=>({...p,floors:p.floors.map((f:any,i:number)=>i!==fi?f:{...f,rooms:f.rooms.map((r:any,j:number)=>j===ri?{...r,attachedBathroom:e.target.value}:r)} )}))}><option value="unknown">Unknown</option><option value="yes">Yes</option><option value="no">No</option></select></label>
                  </div>
                  <label className="form-field">Room notes<input value={room.notes} onChange={e=>setInventoryValues((p:any)=>({...p,floors:p.floors.map((f:any,i:number)=>i!==fi?f:{...f,rooms:f.rooms.map((r:any,j:number)=>j===ri?{...r,notes:e.target.value}:r)} )}))}/></label>
                  <strong>Room amenities</strong>
                  <div className="amenity-grid">{formOptions.amenities.filter(a=>a.scope==='room').map(option => {
                    const current = room.amenities.find((a:any)=>a.key===option.attribute_key)?.value ?? 'unknown'
                    return <label className="amenity-row" key={option.attribute_key}><span>{option.display_name}</span><select value={current} onChange={e=>setInventoryValues((p:any)=>({...p,floors:p.floors.map((f:any,i:number)=>i!==fi?f:{...f,rooms:f.rooms.map((r:any,j:number)=>j!==ri?r:{...r,amenities:r.amenities.some((a:any)=>a.key===option.attribute_key)?r.amenities.map((a:any)=>a.key===option.attribute_key?{...a,value:e.target.value}:a):[...r.amenities,{key:option.attribute_key,value:e.target.value}]})})))}><option value="unknown">Unknown</option><option value="yes">Yes</option><option value="no">No</option></select></label>
                  })}</div>
                  <strong>Monthly rent offers</strong>
                  {room.offers.map((offer:any, oi:number)=><div className="form-row" key={offer.id ?? `offer-${oi}`}>
                    <label className="form-field">Monthly rent (₹)<input type="number" min="1" required value={offer.amount} onChange={e=>setInventoryValues((p:any)=>({...p,floors:p.floors.map((f:any,i:number)=>i!==fi?f:{...f,rooms:f.rooms.map((r:any,j:number)=>j!==ri?r:{...r,offers:r.offers.map((o:any,k:number)=>k===oi?{...o,amount:e.target.value}:o)})})) )}/></label>
                    <label className="form-field">Food option<select value={offer.foodOption} onChange={e=>setInventoryValues((p:any)=>({...p,floors:p.floors.map((f:any,i:number)=>i!==fi?f:{...f,rooms:f.rooms.map((r:any,j:number)=>j!==ri?r:{...r,offers:r.offers.map((o:any,k:number)=>k===oi?{...o,foodOption:e.target.value}:o)})})) )}><option value="unknown">Unknown</option><option value="included">Included</option><option value="excluded">Excluded</option></select></label>
                  </div>)}
                  <button type="button" className="secondary-button compact-button" onClick={()=>setInventoryValues((p:any)=>({...p,floors:p.floors.map((f:any,i:number)=>i!==fi?f:{...f,rooms:f.rooms.map((r:any,j:number)=>j!==ri?r:{...r,offers:[...r.offers,{amount:'',rentBasis:r.type==='shared'?'per_bed':'per_room',foodOption:'unknown',status:'unknown'}]})}))})}>＋ Add rent offer</button>
                  <strong>Additional room charges</strong>
                  {room.charges.map((charge:any, ci:number)=><div className="form-row" key={charge.id ?? `charge-${ci}`}>
                    <label className="form-field">Charge name<input required value={charge.name} onChange={e=>setInventoryValues((p:any)=>({...p,floors:p.floors.map((f:any,i:number)=>i!==fi?f:{...f,rooms:f.rooms.map((r:any,j:number)=>j!==ri?r:{...r,charges:r.charges.map((ch:any,k:number)=>k===ci?{...ch,name:e.target.value}:ch)})})) )}/></label>
                    <label className="form-field">Amount (₹)<input type="number" min="0" required value={charge.amount} onChange={e=>setInventoryValues((p:any)=>({...p,floors:p.floors.map((f:any,i:number)=>i!==fi?f:{...f,rooms:f.rooms.map((r:any,j:number)=>j!==ri?r:{...r,charges:r.charges.map((ch:any,k:number)=>k===ci?{...ch,amount:e.target.value}:ch)})})) )}/></label>
                  </div>)}
                  <button type="button" className="secondary-button compact-button" onClick={()=>setInventoryValues((p:any)=>({...p,floors:p.floors.map((f:any,i:number)=>i!==fi?f:{...f,rooms:f.rooms.map((r:any,j:number)=>j!==ri?r:{...r,charges:[...r.charges,{name:'',amount:'',basis:'monthly',mandatory:false,description:''}]})}))})}>＋ Add charge</button>
                </section>)}
                <button type="button" className="secondary-button compact-button" onClick={()=>setInventoryValues((p:any)=>({...p,floors:p.floors.map((f:any,i:number)=>i!==fi?f:{...f,rooms:[...f.rooms,{label:`Room ${f.rooms.length+1}`,type:'single',maxOccupants:'1',status:'unknown',furnishingStatus:'',attachedBathroom:'unknown',wifiAvailableInRoom:'unknown',notes:'',amenities:formOptions.amenities.filter(a=>a.scope==='room').map(a=>({key:a.attribute_key,value:'unknown'})),offers:[{amount:'',rentBasis:'per_room',foodOption:'unknown',status:'unknown'}],charges:[],beds:[]}]})})))}>＋ Add room to floor</button>
              </section>)}
              <button type="button" className="secondary-button compact-button" onClick={()=>setInventoryValues((p:any)=>({...p,floors:[...p.floors,{number:String(p.floors.length),label:`Floor ${p.floors.length}`,notes:'',amenities:formOptions.amenities.filter(a=>a.scope==='floor').map(a=>({key:a.attribute_key,value:'unknown'})),rooms:[{label:'Room 1',type:'single',maxOccupants:'1',status:'unknown',furnishingStatus:'',attachedBathroom:'unknown',wifiAvailableInRoom:'unknown',notes:'',amenities:formOptions.amenities.filter(a=>a.scope==='room').map(a=>({key:a.attribute_key,value:'unknown'})),offers:[{amount:'',rentBasis:'per_room',foodOption:'unknown',status:'unknown'}],charges:[],beds:[]}] }]}))}>＋ Add floor</button>
              <p className="form-help">Safety: removing floors, rooms, prices or charges is intentionally not supported here; omitted records remain in the database. Photos remain display-only.</p>
            </section>}
            {actionError && <p className="form-error" role="alert">{actionError}</p>}
            <div className="modal-footer"><button className="secondary-button" type="button" disabled={actionBusy} onClick={()=>{setEditingProperty(null);setEditValues(null);setActionError('')}}>Cancel</button><button className="primary-button" type="submit" disabled={actionBusy}>{actionBusy ? 'Saving…' : 'Save changes'}</button></div>
          </form>
        </section>
      </div>}

      {deleteTarget && <div className="modal-backdrop" role="presentation">
        <section className="modal confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-property-title">
          <div className="modal-heading"><div><div className="eyebrow">DESTRUCTIVE ACTION</div><h2 id="delete-property-title">Delete property?</h2></div><button className="modal-close" type="button" disabled={actionBusy} onClick={()=>setDeleteTarget(null)} aria-label="Cancel delete">×</button></div>
          <p>You are about to permanently delete <strong>{deleteTarget.title}</strong> and its linked database records. This cannot be undone.</p>
          <p className="delete-warning">Stored S3 image files are not deleted by this operation and may need separate cleanup.</p>
          {actionError && <p className="form-error" role="alert">{actionError}</p>}
          <div className="modal-footer"><button className="secondary-button" type="button" disabled={actionBusy} onClick={()=>{setDeleteTarget(null);setActionError('')}}>Cancel</button><button className="danger-button" type="button" disabled={actionBusy} onClick={()=>void deleteProperty()}>{actionBusy ? 'Deleting…' : 'Delete permanently'}</button></div>
        </section>
      </div>}

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
                    <label className="form-field">Owner *<select required value={formValues.ownerId} onChange={e => setFormValues({ ...formValues, ownerId: e.target.value })}><option value="">Select owner</option>{formOptions.owners.map(owner => <option key={owner.id} value={owner.id}>{owner.name} — {owner.data_label.replaceAll('_', ' ')}</option>)}</select>{formValues.ownerId && <span className="field-hint">Contact: {[formOptions.owners.find(o => o.id === formValues.ownerId)?.contact_phone, formOptions.owners.find(o => o.id === formValues.ownerId)?.contact_email].filter(Boolean).join(' · ') || 'No contact details on record'}</span>}</label></div>
                  <label className="form-field">Street address (optional)<input maxLength={500} value={formValues.address} onChange={e => setFormValues({ ...formValues, address: e.target.value })} placeholder="Address supplied by owner" /></label>
                  <label className="form-field">Google Maps URL (optional)<input type="url" value={formValues.googleMapsUrl} onChange={e => setFormValues({ ...formValues, googleMapsUrl: e.target.value })} placeholder="https://maps.google.com/…" /></label>
                  <div className="form-row"><label className="form-field">Latitude<input type="number" step="any" min="-90" max="90" value={formValues.latitude} onChange={e => setFormValues({ ...formValues, latitude: e.target.value })} placeholder="Optional" /></label><label className="form-field">Longitude<input type="number" step="any" min="-180" max="180" value={formValues.longitude} onChange={e => setFormValues({ ...formValues, longitude: e.target.value })} placeholder="Optional" /></label></div>
                  <label className="form-field">Coordinate source<select value={formValues.coordinateSource} onChange={e => setFormValues({ ...formValues, coordinateSource: e.target.value as PropertyFormValues['coordinateSource'] })}><option value="owner_submitted">Owner submitted</option><option value="manual">Manual entry</option><option value="google_places">Google Places</option><option value="openstreetmap">OpenStreetMap</option><option value="other">Other</option></select></label>
                  <h3 className="form-section-title">2. Eligibility and house rules</h3>
                  <div className="form-row"><label className="form-field">Occupancy eligibility<select value={formValues.genderEligibility} onChange={e => setFormValues({ ...formValues, genderEligibility: e.target.value as PropertyFormValues['genderEligibility'] })}><option value="unknown">Unknown</option><option value="Boys">Boys</option><option value="Girls">Girls</option><option value="Unisex">Unisex</option></select></label><label className="form-field">Couples allowed?<select value={formValues.couplesAllowed} onChange={e => setFormValues({ ...formValues, couplesAllowed: e.target.value as PropertyFormValues['couplesAllowed'] })}><option value="unknown">Unknown</option><option value="yes">Yes</option><option value="no">No</option></select></label></div>
                  <div className="form-row"><label className="form-field">Co-ed rooms allowed?<select value={formValues.coEdRoomsAllowed} onChange={e => setFormValues({ ...formValues, coEdRoomsAllowed: e.target.value as PropertyFormValues['coEdRoomsAllowed'] })}><option value="unknown">Unknown</option><option value="yes">Yes</option><option value="no">No</option></select></label><label className="form-field">Cooking allowed?<select value={formValues.cookingAllowed} onChange={e => setFormValues({ ...formValues, cookingAllowed: e.target.value as PropertyFormValues['cookingAllowed'] })}><option value="unknown">Unknown</option><option value="yes">Yes</option><option value="no">No</option></select></label></div>
                  <label className="form-field">House rules / restrictions<textarea rows={2} value={formValues.houseRulesNotes} onChange={e => setFormValues({ ...formValues, houseRulesNotes: e.target.value })} placeholder="Curfew, visitors, parents, other rules (if known)" /></label>
                  <AmenityChecklist title="Property amenities" options={formOptions.amenities.filter(a => a.scope === 'property')} values={formValues.propertyAmenities} onChange={values => setFormValues(prev => ({ ...prev, propertyAmenities: values }))} />
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
                    <AmenityChecklist title="Amenities on this floor" options={formOptions.amenities.filter(a => a.scope === 'floor')} values={floor.amenities} onChange={values => setFormValues(prev => ({ ...prev, floors: prev.floors.map((f, i) => i === fi ? { ...f, amenities: values } : f) }))} />
                    {floor.rooms.map((room, ri) => <div className="room-card" key={ri}><div className="nested-card-heading"><strong>Room {ri + 1}</strong>{floor.rooms.length > 1 && <button type="button" className="text-button danger-text" onClick={() => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.filter((_, j) => j !== ri) } : f) })}>Remove room</button>}</div>
                      <div className="form-row"><label className="form-field">Room label<input required value={room.label} onChange={e => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, label: e.target.value } : r) } : f) })} /></label><label className="form-field">Room type<select value={room.type} onChange={e => { const type = e.target.value as RoomForm['type']; setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, type, maxOccupants: type === 'single' ? '1' : '2', totalBeds: type === 'single' ? '1' : '2', availableBeds: '' } : r) } : f) }) }}><option value="single">Single / private</option><option value="shared">Shared</option></select></label></div>
                      <div className="form-row"><label className="form-field">Maximum occupants<input type="number" min={room.type === 'single' ? 1 : 2} max="50" step="1" value={room.maxOccupants} onChange={e => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, maxOccupants: e.target.value } : r) } : f) })} /></label><label className="form-field">Availability<select value={room.status} onChange={e => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, status: e.target.value as RoomForm['status'] } : r) } : f) })}><option value="unknown">Unknown</option><option value="available">Available</option><option value="occupied">Occupied</option><option value="reserved">Reserved</option><option value="unavailable">Unavailable</option></select></label></div>
                      <label className="form-field">Availability last confirmed (optional)<input type="date" value={room.availabilityLastConfirmedAt} onChange={e => setFormValues(prev => ({ ...prev, floors: prev.floors.map((f, i) => i !== fi ? f : ({ ...f, rooms: f.rooms.map((r, j) => j !== ri ? r : ({ ...r, availabilityLastConfirmedAt: e.target.value })) })) }))} /><span className="field-hint">Leave blank if nobody has recently confirmed availability.</span></label>
                      {room.type === 'shared' && <div className="form-row"><label className="form-field">Total beds *<input type="number" min="2" max={room.maxOccupants} step="1" value={room.totalBeds} onChange={e => setFormValues(prev => ({ ...prev, floors: prev.floors.map((f, i) => i !== fi ? f : ({ ...f, rooms: f.rooms.map((r, j) => j !== ri ? r : ({ ...r, totalBeds: e.target.value })) })) }))} /></label><label className="form-field">Available beds<select value={room.availableBeds} onChange={e => setFormValues(prev => ({ ...prev, floors: prev.floors.map((f, i) => i !== fi ? f : ({ ...f, rooms: f.rooms.map((r, j) => j !== ri ? r : ({ ...r, availableBeds: e.target.value })) })) }))}><option value="">Unknown</option>{Array.from({ length: Math.max(0, Number(room.totalBeds) || 0) + 1 }, (_, n) => <option key={n} value={n}>{n}</option>)}</select></label></div>}
                      <div className="form-row"><label className="form-field">Furnishing<select value={room.furnishingStatus} onChange={e => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, furnishingStatus: e.target.value as RoomForm['furnishingStatus'] } : r) } : f) })}><option value="">Unknown</option><option value="furnished">Furnished</option><option value="semi_furnished">Semi-furnished</option><option value="unfurnished">Unfurnished</option></select></label><label className="form-field">Attached bathroom<select value={room.attachedBathroom} onChange={e => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, attachedBathroom: e.target.value as RoomForm['attachedBathroom'] } : r) } : f) })}><option value="unknown">Unknown</option><option value="yes">Yes</option><option value="no">No</option></select></label></div>
                      <div className="form-row"><label className="form-field">Wi-Fi in room<select value={room.wifiAvailableInRoom} onChange={e => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, wifiAvailableInRoom: e.target.value as RoomForm['wifiAvailableInRoom'] } : r) } : f) })}><option value="unknown">Unknown</option><option value="yes">Yes</option><option value="no">No</option></select></label><label className="form-field">Wi-Fi speed (Mbps)<input type="number" min="0" step="1" value={room.wifiSpeedMbps} onChange={e => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, wifiSpeedMbps: e.target.value } : r) } : f) })} placeholder="Unknown" /></label></div>
                      <label className="form-field">Room notes<input value={room.notes} onChange={e => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, notes: e.target.value } : r) } : f) })} placeholder="Optional" /></label>
                      <AmenityChecklist title="Room amenities" options={formOptions.amenities.filter(a => a.scope === 'room')} values={room.amenities} onChange={values => setFormValues(prev => ({ ...prev, floors: prev.floors.map((f, i) => i !== fi ? f : ({ ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, amenities: values } : r) })) }))} />
                      <div className="subsection-heading"><strong>Monthly rent offers — {room.type === 'shared' ? 'price per bed' : 'price per room'}</strong><button type="button" className="text-button" onClick={() => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, offers: [...r.offers, newOffer()] } : r) } : f) })}>＋ Add offer</button></div>
                      {room.offers.map((offer, oi) => <div className="form-row offer-row" key={oi}><label className="form-field">Monthly rent (₹/{room.type === 'shared' ? 'bed' : 'room'})<input required type="number" min="0.01" step="0.01" value={offer.amount} onChange={e => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, offers: r.offers.map((o, k) => k === oi ? { ...o, amount: e.target.value } : o) } : r) } : f) })} /></label><label className="form-field">Food option<select value={offer.foodOption} onChange={e => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, offers: r.offers.map((o, k) => k === oi ? { ...o, foodOption: e.target.value as OfferForm['foodOption'] } : o) } : r) } : f) })}><option value="unknown">Unknown</option><option value="included">Food included</option><option value="excluded">Food excluded</option></select></label>{room.offers.length > 1 && <button type="button" className="text-button danger-text" onClick={() => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: f.rooms.map((r, j) => j === ri ? { ...r, offers: r.offers.filter((_, k) => k !== oi) } : r) } : f) })}>Remove offer</button>}</div>)}
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
                    <button type="button" className="secondary-button compact-button" onClick={() => setFormValues({ ...formValues, floors: formValues.floors.map((f, i) => i === fi ? { ...f, rooms: [...f.rooms, { ...newRoom(f.rooms.length + 1), amenities: formOptions.amenities.filter(a => a.scope === 'room').map(a => ({ key: a.attribute_key, value: 'unknown' as const })) }] } : f) })}>＋ Add room to this floor</button>
                  </div>)}
                  <button type="button" className="secondary-button compact-button" onClick={() => setFormValues({ ...formValues, floors: [...formValues.floors, { number: String(formValues.floors.length), label: `Floor ${formValues.floors.length}`, notes: '', amenities: formOptions.amenities.filter(a => a.scope === 'floor').map(a => ({ key: a.attribute_key, value: 'unknown' as const })), rooms: [{ ...newRoom(1), amenities: formOptions.amenities.filter(a => a.scope === 'room').map(a => ({ key: a.attribute_key, value: 'unknown' as const })) }] }] })}>＋ Add floor</button>
                  <h3 className="form-section-title">5. Property photos</h3>
                  <p className="form-help">Upload up to 30 JPG, PNG, WebP or AVIF photos. Each file must be 10 MB or smaller. Files upload to the configured S3 bucket; the property is not saved until you confirm the review.</p>
                  <label className="upload-dropzone"><span className="upload-icon">↑</span><strong>{uploadingPhotos ? 'Uploading photos…' : 'Choose photos from your device'}</strong><span>Multiple files supported · 10 MB maximum each</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={uploadingPhotos || formValues.images.length >= 30} onChange={event => { void handlePhotoSelection(event.currentTarget.files); event.currentTarget.value = '' }} /></label>
                  {formValues.images.map((image, i) => <div className="photo-edit-card" key={image.key}><img src={image.previewUrl} alt={image.altText || image.fileName} className="photo-preview" /><div className="photo-edit-fields"><strong>{image.fileName}</strong><div className="form-row"><label className="form-field">Photo label<select value={image.label} onChange={e => setFormValues(prev => ({ ...prev, images: prev.images.map((im, j) => j === i ? { ...im, label: e.target.value as PropertyFormValues['images'][number]['label'] } : im) }))}><option value="exterior">Exterior</option><option value="bedroom">Bedroom</option><option value="kitchen">Kitchen</option><option value="bathroom">Bathroom</option><option value="living_area">Living area</option><option value="other">Other</option></select></label><label className="form-field">Alt text<input value={image.altText} onChange={e => setFormValues(prev => ({ ...prev, images: prev.images.map((im, j) => j === i ? { ...im, altText: e.target.value } : im) }))} placeholder="Describe the photo" /></label></div><label className="checkbox-field"><input type="checkbox" checked={image.isCover} onChange={e => setFormValues(prev => ({ ...prev, images: prev.images.map((im, j) => ({ ...im, isCover: j === i ? e.target.checked : false })) }))} /> Use as cover photo</label><button type="button" className="text-button danger-text" onClick={() => { URL.revokeObjectURL(image.previewUrl); setFormValues(prev => ({ ...prev, images: prev.images.filter((_, j) => j !== i) })) }}>Remove photo</button></div></div>)}
                </> : <div className="review-panel"><h3>Confirm before saving</h3><p>This creates a draft record, not a published or verified listing.</p><div className="review-grid"><span>Property</span><strong>{formValues.title}</strong><span>City / locality</span><strong>{formOptions.cities.find(c => c.id === formValues.cityId)?.name ?? 'Unknown'} · {formOptions.localities.find(l => l.id === formValues.localityId)?.name ?? 'Locality unknown'}</strong><span>Property type</span><strong>{formValues.propertyType}</strong><span>Owner</span><strong>{formOptions.owners.find(o => o.id === formValues.ownerId)?.name ?? 'Unknown'}</strong><span>Floors / rooms</span><strong>{formValues.floors.length} floors · {formValues.floors.reduce((sum, f) => sum + f.rooms.length, 0)} rooms</strong><span>Monthly rent offers</span><strong>{formValues.floors.reduce((sum, f) => sum + f.rooms.reduce((rSum, r) => rSum + r.offers.length, 0), 0)} offers</strong><span>Deposit</span><strong>{formValues.securityDepositBasis.replaceAll('_', ' ')}</strong><span>Notice period</span><strong>{formValues.noticePeriodMonths === '' ? 'Unknown' : formValues.noticePeriodMonths === '0' ? 'None' : `${formValues.noticePeriodMonths} months`}</strong><span>Photos</span><strong>{formValues.images.length} uploaded files</strong><span>Amenities</span><strong>{formValues.propertyAmenities.filter(a => a.value !== 'unknown').length} property values · {formValues.floors.reduce((n, f) => n + f.amenities.filter(a => a.value !== 'unknown').length + f.rooms.reduce((rn, r) => rn + r.amenities.filter(a => a.value !== 'unknown').length, 0), 0)} floor/room values set</strong><span>Record status</span><strong>Draft · Synthetic demo · Unverified</strong></div><div className="review-detail-section"><h4>Property amenities</h4><p>{formValues.propertyAmenities.filter(a => a.value !== 'unknown').map(a => `${formOptions.amenities.find(o => o.attribute_key === a.key)?.display_name ?? a.key}: ${a.value === 'yes' ? 'Yes' : 'No'}`).join(' · ') || 'No property amenity has been confirmed; unset values remain Unknown.'}</p>{formValues.floors.map((floor, fi) => <div key={fi}><h4>{floor.label} — floor amenities</h4><p>{floor.amenities.filter(a => a.value !== 'unknown').map(a => `${formOptions.amenities.find(o => o.attribute_key === a.key)?.display_name ?? a.key}: ${a.value === 'yes' ? 'Yes' : 'No'}`).join(' · ') || 'No floor amenities confirmed.'}</p>{floor.rooms.map((room, ri) => <div key={ri}><h4>{room.label} — room amenities and availability</h4><p>{room.type === 'shared' ? `${room.totalBeds} total beds · ${room.availableBeds === '' ? 'available beds unknown' : `${room.availableBeds} available beds`}` : `Room status: ${room.status}`}{room.availabilityLastConfirmedAt ? ` · Confirmed ${room.availabilityLastConfirmedAt}` : ' · Availability confirmation date unknown'}</p><p>{room.amenities.filter(a => a.value !== 'unknown').map(a => `${formOptions.amenities.find(o => o.attribute_key === a.key)?.display_name ?? a.key}: ${a.value === 'yes' ? 'Yes' : 'No'}`).join(' · ') || 'No room amenities confirmed.'}</p></div>)}</div>)}</div><div className="review-photo-strip">{formValues.images.map(image => <figure key={image.key}><img src={image.previewUrl} alt={image.altText || image.fileName} /><figcaption>{image.label.replaceAll('_', ' ')}{image.isCover ? ' · Cover' : ''}</figcaption></figure>)}</div><div className="review-caution">Please confirm rent, eligibility, deposit, rules and availability are based on information you actually have. Leave unsupported details as Unknown.</div></div>}
                {formError && <p role="alert" className="form-error">{formError}</p>}
                <div className="modal-footer">{reviewMode && <button className="secondary-button" type="button" disabled={savingProperty} onClick={() => { setReviewMode(false); setFormError('') }}>Back to edit</button>}<button className="secondary-button" type="button" disabled={savingProperty} onClick={() => setShowAddForm(false)}>Cancel</button><button className="primary-button" type="submit" disabled={savingProperty || uploadingPhotos}>{uploadingPhotos ? 'Uploading photos…' : savingProperty ? 'Saving…' : reviewMode ? 'Confirm and save draft' : 'Review before saving'}</button></div>
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

function AmenityChecklist({ title, options, values, onChange }: { title: string; options: AmenityOption[]; values: AmenityValue[]; onChange: (values: AmenityValue[]) => void }) {
  if (!options.length) return null
  const current = new Map(values.map(item => [item.key, item.value]))
  return <section className="amenity-checklist"><div className="subsection-heading"><strong>{title}</strong><span>{options.length} attributes</span></div><p className="form-help">Set each attribute to Yes, No or Unknown. Unknown is not treated as No.</p><div className="amenity-grid">{options.map(option => <label className="amenity-row" key={option.attribute_key}><span>{option.display_name}</span><select value={current.get(option.attribute_key) ?? 'unknown'} onChange={event => onChange(values.map(item => item.key === option.attribute_key ? { ...item, value: event.target.value as AmenityValue['value'] } : item))}><option value="unknown">Unknown</option><option value="yes">Yes</option><option value="no">No</option></select></label>)}</div></section>
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
