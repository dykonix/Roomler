import { useEffect, useMemo, useState } from 'react'
import './PublicApp.css'

type City = { id: string; name: string; state_name: string }
type Listing = {
  id: string
  title: string
  description?: string
  property_type: 'PG' | 'Flat'
  city: string
  locality: string | null
  gender_eligibility: string | null
  verification_status: string
  data_label: string
  starting_monthly_amount: number | string | null
  starting_monthly_currency: string | null
  wifi_available: boolean | null
  wifi_value_state: string | null
  cooking_allowed: boolean | null
  images: { id: string; image_url: string; alt_text?: string }[]
}

const API = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '') + '/api/public'
const slugify = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const money = (value: number | string | null, currency = 'INR') => value == null || value === ''
  ? 'Monthly price not provided'
  : new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value))

function readRoute() {
  const parts = location.pathname.split('/').filter(Boolean)
  if (parts.length === 1) {
    const slug = parts[0]
    const girls = slug.startsWith('girls-pg-in-')
    const boys = slug.startsWith('boys-pg-in-')
    const prefix = girls ? 'girls-pg-in-' : boys ? 'boys-pg-in-' : 'pg-in-'
    return { citySlug: slug.startsWith(prefix) ? slug.slice(prefix.length) : '', gender: girls ? 'Girls' : boys ? 'Boys' : '', localitySlug: '' }
  }
  if (parts.length === 2 && parts[0].startsWith('pg-in-')) {
    return { citySlug: parts[0].slice('pg-in-'.length), gender: '', localitySlug: parts[1] }
  }
  return { citySlug: '', gender: '', localitySlug: '' }
}

export default function SeoLandingPage() {
  const route = useMemo(readRoute, [])
  const [cities, setCities] = useState<City[]>([])
  const [rows, setRows] = useState<Listing[]>([])
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [locality, setLocality] = useState('')

  const city = cities.find(item => slugify(item.name) === route.citySlug)
  const heading = city
    ? route.gender ? `${route.gender === 'Girls' ? 'Girls’' : 'Boys’'} PGs in ${city.name}`
      : route.localitySlug ? `PGs in ${locality || route.localitySlug.replace(/-/g, ' ')}`
      : `PGs in ${city.name}`
    : 'Find a PG that fits your lifestyle'

  useEffect(() => {
    let cancelled = false
    fetch(API + '/locations')
      .then(async response => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || 'Could not load cities.')
        return body as { cities?: City[] }
      })
      .then(body => { if (!cancelled) setCities(Array.isArray(body.cities) ? body.cities : []) })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load cities.') })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!cities.length || !route.citySlug) return
    const matchingCity = cities.find(item => slugify(item.name) === route.citySlug)
    if (!matchingCity) { setBusy(false); setError('This city page is not configured yet.'); return }
    let cancelled = false
    const params = new URLSearchParams({ city: matchingCity.name, type: 'PG' })
    if (route.gender) params.set('gender', route.gender)
    if (route.localitySlug) params.set('locality', route.localitySlug.replace(/-/g, ' '))
    setBusy(true)
    fetch(API + '/properties?' + params.toString())
      .then(async response => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.error || 'Could not load properties.')
        return body as { data?: Listing[] }
      })
      .then(body => {
        if (cancelled) return
        const properties = Array.isArray(body.data) ? body.data : []
        setRows(properties)
        const foundLocality = properties.find(item => item.locality)?.locality
        if (foundLocality) setLocality(foundLocality)
      })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load properties.') })
      .finally(() => { if (!cancelled) setBusy(false) })
    return () => { cancelled = true }
  }, [cities, route.citySlug, route.gender, route.localitySlug])

  useEffect(() => {
    const title = city ? `${heading} | Roomler` : 'PG and Monthly Stays | Roomler'
    document.title = title
    let description = document.querySelector('meta[name="description"]')
    if (!description) {
      description = document.createElement('meta')
      description.setAttribute('name', 'description')
      document.head.appendChild(description)
    }
    description.setAttribute('content', city
      ? `Explore monthly PG listings in ${locality || city.name}. Compare available details, rental terms and confirmed amenities on Roomler.`
      : 'Explore monthly PG and flat listings by city, budget, eligibility and lifestyle preferences on Roomler.')
    let robots = document.querySelector('meta[name="robots"]')
    if (!robots) {
      robots = document.createElement('meta')
      robots.setAttribute('name', 'robots')
      document.head.appendChild(robots)
    }
    robots.setAttribute('content', import.meta.env.VITE_INDEXING_ENABLED === 'true' && city && rows.length > 0 ? 'index,follow' : 'noindex,nofollow')
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = window.location.origin + window.location.pathname
  }, [city, heading, locality, rows.length])

  return <div className="roomler-public">
    <header className="public-header">
      <a className="public-logo" href="/"><img src="/roomler-logo.png" alt="Roomler — Your space. Your vibe."/></a>
      <nav><a href="/">Home</a><a href="/search">Search stays</a></nav>
    </header>
    <main className="results-page seo-landing-page">
      <nav className="seo-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span> / </span>{city?.name || 'PG listings'}{route.localitySlug && <><span> / </span>{locality || route.localitySlug.replace(/-/g, ' ')}</>}</nav>
      <h1>{heading}</h1>
      <p className="seo-intro">{city
        ? `Explore monthly PG options in ${locality || city.name}. Compare listed prices, eligibility, rental terms and amenities where this information has been provided. Unknown details remain unconfirmed.`
        : 'Find monthly accommodation by city and lifestyle preferences. Choose a city to browse relevant listings.'}</p>
      {city && <div className="seo-category-links">
        <a href={`/pg-in-${slugify(city.name)}/`}>All PGs in {city.name}</a>
        <a href={`/girls-pg-in-${slugify(city.name)}/`}>Girls’ PGs</a>
        <a href={`/boys-pg-in-${slugify(city.name)}/`}>Boys’ PGs</a>
      </div>}
      {error && <div className="state-panel error">{error}</div>}
      {busy ? <div className="state-panel">Loading listings…</div>
        : !error && rows.length === 0 ? <div className="state-panel"><h2>No published listings found yet</h2><p>This page is ready, but there are no matching published real-submitted listings to show. We will not fill it with invented properties.</p><a href="/search">Try the general search</a></div>
        : <div className="listing-grid">{rows.map(property => <a className="listing-card seo-listing-card" href={`/property/${slugify([property.title, property.locality, property.city].filter(Boolean).join(' '))}--${property.id}`} key={property.id}>
          <div className="listing-image">{property.images?.[0]?.image_url && !property.images[0].image_url.startsWith('s3://')
            ? <img src={property.images[0].image_url} alt={property.images[0].alt_text || property.title}/>
            : <div className="image-unavailable">Photo not available</div>}
            <span>{property.verification_status === 'independently_checked' ? 'Independently checked' : 'Not independently verified'}</span>
          </div>
          <div className="listing-body"><h2>{property.title}</h2><p>{property.gender_eligibility || 'Eligibility not confirmed'} · {property.locality || 'Locality not specified'}, {property.city}</p><p>{property.wifi_value_state === 'known' ? `Wi-Fi ${property.wifi_available ? 'Yes' : 'No'}` : 'Wi-Fi not confirmed'} · Cooking {property.cooking_allowed === true ? 'Yes' : property.cooking_allowed === false ? 'No' : 'not confirmed'}</p><strong>{money(property.starting_monthly_amount, property.starting_monthly_currency || 'INR')}<small> / month</small></strong></div>
        </a>)}</div>}
      {city && <section className="seo-helpful-content"><h2>What to compare before choosing a PG</h2><p>Check monthly rent, security deposit, notice period, cooking permissions, Wi-Fi availability and any additional room-level charges. These details can vary by property; confirm them with the property owner before making a decision.</p><h2>About listing accuracy</h2><p>Roomler distinguishes confirmed information from details that have not been provided or independently checked. A missing detail should not be treated as a “no,” and a listing on this page is not a guarantee of current availability.</p></section>}
    </main>
    <footer className="public-footer">Roomler · Your space. Your vibe.</footer>
  </div>
}
