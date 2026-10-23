import { useEffect, useState } from 'react'
import './PublicApp.css'

type Listing = {
  id: string; title: string; description: string; property_type: string; city: string
  locality: string | null; gender_eligibility: string | null; cooking_allowed: boolean | null
  couples_allowed: boolean | null; co_ed_rooms_allowed: boolean | null; listing_status: string
  verification_status: string; data_label: string; starting_monthly_amount: number | string | null
  starting_monthly_currency: string | null; wifi_available: boolean | null; wifi_value_state: string | null
  images: { id: string; image_url: string; alt_text?: string }[]
  rooms?: { id: string; room_label: string; room_type: string; max_occupants: number; room_status: string; prices: { amount: number | string; currency: string; rent_basis: string; stay_period: string }[] }[]
  security_deposit_basis: string | null; security_deposit_amount: number | string | null
  security_deposit_refund_policy: string | null; notice_period_value: number | string | null; notice_period_unit: string | null
  electricity_billing_mode: string | null; electricity_rate_per_unit: number | string | null
}
const API = 'http://localhost:3001/api/public'
const initialParams = new URLSearchParams(location.search)
const demo = initialParams.get('demo') === 'true' || initialParams.get('includeDemo') === 'true'
const money = (v: number | string | null | undefined, currency = 'INR') => v == null || v === '' ? 'Price not provided' : new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(v))
const yesNo = (v: boolean | null | undefined) => v === true ? 'Yes' : v === false ? 'No' : 'Not confirmed'

export default function PublicApp() {
 const [page,setPage] = useState<'home'|'results'|'detail'>(location.pathname.startsWith('/property/')?'detail':location.pathname==='/search'?'results':'home')
 const [city,setCity] = useState(initialParams.get('city') || initialParams.get('locality') || '')
 const [query,setQuery] = useState(new URLSearchParams(location.search).get('q') || '')
 const [type,setType] = useState(new URLSearchParams(location.search).get('type') || 'PG')
 const [budget,setBudget] = useState(new URLSearchParams(location.search).get('maxRent') || '')
 const [wifi,setWifi] = useState(initialParams.get('wifi') === 'true')
 const [cooking,setCooking] = useState(initialParams.get('cooking') === 'true')
 const [rows,setRows] = useState<Listing[]>([])
 const [item,setItem] = useState<Listing|null>(null)
 const [busy,setBusy] = useState(false)
 const [error,setError] = useState('')
 const [notice,setNotice] = useState('')
 const [filters,setFilters] = useState(false)
 const [sort,setSort] = useState('price')
 async function search() {
  setBusy(true); setError(''); setNotice('')
  const p = new URLSearchParams()
  const knownCities = ['Noida', 'Prayagraj', 'Patna', 'Kota']
  if(city.trim()) {
   if(knownCities.some(c => c.toLowerCase() === city.trim().toLowerCase())) p.set('city', city.trim())
   else p.set('locality', city.trim())
  }
  if(query.trim()) setNotice('Natural-language preference matching is not implemented yet. The text was not used to filter listings; use location and structured filters below.')
  if(type==='PG'||type==='Flat') p.set('type',type)
  if(budget) p.set('maxRent',budget)
  if(wifi) p.set('wifi','true')
  if(cooking) p.set('cooking','true')
  if(demo) p.set('includeDemo','true')
  try {
   const r=await fetch(API+'/properties?'+p.toString()); const b=await r.json()
   if(!r.ok) throw new Error(b.error||'Search failed')
   setRows(b.data||[]); setPage('results'); history.pushState({},'','/search?'+p.toString()+(query.trim()?'&q='+encodeURIComponent(query.trim()):''))
  } catch(e) {setError(e instanceof Error?e.message:'Search failed');setRows([])}
  finally {setBusy(false)}
 }
 async function open(item: Listing) {
  setItem(item);setPage('detail');setError('');history.pushState({},'','/property/'+item.id+(demo?'?demo=true':''))
  try {const r=await fetch(API+'/properties/'+item.id+(demo?'?includeDemo=true':''));const b=await r.json();if(!r.ok)throw new Error(b.error||'Property not found');setItem(b.data)}
  catch(e){setError(e instanceof Error?e.message:'Unable to load property')}
 }
 useEffect(()=>{
  const loadRoute = () => {
   const path = location.pathname
   if(path==='/search') { void search(); return }
   if(path.startsWith('/property/')) {
    const id = path.split('/').pop()
    if(!id) return
    setPage('detail'); setBusy(true); setError(''); setItem(null)
    fetch(API+'/properties/'+id+(demo?'?includeDemo=true':''))
     .then(async r=>{const b=await r.json();if(!r.ok)throw new Error(b.error||'Not found');setItem(b.data)})
     .catch(e=>setError(e instanceof Error?e.message:'Unable to load property'))
     .finally(()=>setBusy(false))
    return
   }
   setPage('home'); setItem(null); setError('')
  }
  const handlePopState = () => loadRoute()
  window.addEventListener('popstate',handlePopState)
  if(location.pathname==='/search'||location.pathname.startsWith('/property/')) loadRoute()
  return ()=>window.removeEventListener('popstate',handlePopState)
 },[])
 const shown=[...rows].sort((a,b)=>sort==='price'?(Number(a.starting_monthly_amount??Infinity)-Number(b.starting_monthly_amount??Infinity)):0)
 return <div className="roomler-public">
  <header className="public-header"><a className="public-logo" href="/"><img src="/roomler-logo.png" alt="Roomler — Your space. Your vibe."/></a><form className="header-search" onSubmit={e=>{e.preventDefault();void search()}}><input aria-label="City or locality" placeholder="Select city or locality" value={city} onChange={e=>setCity(e.target.value)}/><input aria-label="Describe your stay" placeholder="Describe the stay you need…" value={query} onChange={e=>setQuery(e.target.value)}/><button>⌕</button></form><nav><span className="nav-soon">Login · Soon</span><span className="nav-soon post-property">Post Property · Soon</span></nav></header>
  {page==='home'&&<main className="home-page"><section className="hero"><div className="hero-copy"><h1>Your PG. Your Vibe. Your Style.</h1><p>Find a stay that feels right for you.</p><div className="stay-tabs">{[['PG','PG'],['Flat','Flats'],['Flatmates','Flat Mates']].map(([v,label])=><button key={v} className={type===v?'active':''} disabled={v==='Flatmates'} onClick={()=>setType(v)}>{v==='PG'?'⌂':v==='Flat'?'▦':'♧'} {label}{v==='Flatmates'?' · Soon':''}</button>)}</div><form className="hero-search" onSubmit={e=>{e.preventDefault();void search()}}><label>⌖ <input placeholder="Select city or locality" value={city} onChange={e=>setCity(e.target.value)}/></label><label>✧ <input placeholder="Describe the stay you need…" value={query} onChange={e=>setQuery(e.target.value)}/></label><button className="search-submit">⌕ Search</button></form><button className="advanced-link" onClick={()=>setFilters(!filters)}>☷ Advanced Search</button>{filters&&<div className="advanced-panel"><label>Monthly budget up to (₹)<input value={budget} onChange={e=>setBudget(e.target.value.replace(/[^0-9]/g,''))}/></label><label><input type="checkbox" checked={wifi} onChange={e=>setWifi(e.target.checked)}/> Wi-Fi</label><label><input type="checkbox" checked={cooking} onChange={e=>setCooking(e.target.checked)}/> Cooking allowed</label><button onClick={()=>void search()}>Search</button></div>}</div><aside className="hero-promo"><h2>PGs near<br/>top colleges</h2><p>Find comfortable stays close to your campus.</p><button onClick={()=>void search()}>Explore Now →</button></aside></section><section className="popular-cities"><h2>Popular Cities</h2><div>{['Noida','Prayagraj','Patna','Kota'].map(c=><button key={c} onClick={()=>{setCity(c);setType(type==='Flat'?'Flat':'PG');setTimeout(()=>void search(),0)}}>{c}</button>)}</div></section><section className="benefits">{[['♢','Listing transparency','See which details are confirmed and which remain unknown'],['▱','Clear rental terms','Review deposit, notice period and charges where provided'],['✧','Structured filters','Narrow results by location, budget and known amenities'],['♧','PGs and flats','Browse available property types']].map(x=><article key={x[1]}><span>{x[0]}</span><h3>{x[1]}</h3><p>{x[2]}</p></article>)}</section></main>}
  {page==='results'&&<main className="results-page"><div className="filter-strip"><button onClick={()=>setFilters(!filters)}>☷ Filters</button><button className={wifi?'chosen':''} onClick={()=>setWifi(!wifi)}>⌁ Wi-Fi</button><button className={cooking?'chosen':''} onClick={()=>setCooking(!cooking)}>♜ Cooking allowed</button><button onClick={()=>setBudget(budget?'':'10000')}>₹ {budget?'Under ₹'+Number(budget).toLocaleString('en-IN'):'Set budget'}</button><button onClick={()=>setType(type==='PG'?'Flat':'PG')}>{type==='PG'?'PGs':'Flats'}</button><button onClick={()=>void search()}>Apply</button></div>{filters&&<div className="advanced-panel"><label>City/locality<input value={city} onChange={e=>setCity(e.target.value)}/></label><label>Monthly budget up to (₹)<input value={budget} onChange={e=>setBudget(e.target.value.replace(/[^0-9]/g,''))}/></label><button onClick={()=>void search()}>Apply filters</button></div>}<div className="results-heading"><h1>Stays {city?'in '+city:''}</h1><label>Sort by <select value={sort} onChange={e=>setSort(e.target.value)}><option value="price">Lowest monthly price</option></select></label></div>{demo&&<p className="demo-warning">Synthetic demo listings only — not genuine verified accommodation.</p>}{notice&&<p className="demo-warning">{notice}</p>}{busy?<div className="state-panel">Searching properties…</div>:error?<div className="state-panel error">{error}<button onClick={()=>void search()}>Try again</button></div>:shown.length===0?<div className="state-panel"><h2>No matching stays found</h2><p>Try removing a filter or increasing your budget. Unknown amenities are not treated as matches.</p><button onClick={()=>{setBudget('');setWifi(false);setCooking(false);setTimeout(()=>void search(),0)}}>Clear filters</button></div>:<div className="listing-grid">{shown.map(p=><button className="listing-card" key={p.id} onClick={()=>void open(p)}><div className="listing-image">{p.images?.[0]?.image_url&&!p.images[0].image_url.startsWith('s3://')?<img src={p.images[0].image_url} alt={p.images[0].alt_text||p.title}/>:<div className="image-unavailable">Photo not available</div>}<span>{p.verification_status==='independently_checked'?'Independently checked':'Unverified'}</span></div><div className="listing-body"><h2>{p.title}</h2><p>{p.gender_eligibility||'Eligibility not confirmed'} · {p.locality||'Locality not specified'}, {p.city}</p><p>{p.wifi_value_state==='known'?'Wi-Fi '+(p.wifi_available?'Yes':'No'):'Wi-Fi not confirmed'} · Cooking {yesNo(p.cooking_allowed)}</p><strong>{money(p.starting_monthly_amount,p.starting_monthly_currency||'INR')}<small> / month</small></strong></div></button>)}</div>}</main>}
  {page==='detail'&&<main className="detail-page"><button className="back-link" onClick={()=>{void search()}}>← Back to results</button>{busy&&!item?<div className="state-panel">Loading property…</div>:error&&!item?<div className="state-panel error">{error}</div>:item&&<><div className="detail-title"><div><h1>{item.title}</h1><p>{item.locality||'Locality not specified'}, {item.city} · {item.property_type}</p></div><div><strong>{money(item.starting_monthly_amount,item.starting_monthly_currency||'INR')} / month</strong><span>{item.verification_status==='independently_checked'?'Independently checked':'Not independently verified'}</span></div></div>{demo&&<p className="demo-warning">Synthetic demo listing — not a genuine verified property.</p>}<div className="detail-gallery">{item.images?.length?item.images.slice(0,5).map(im=>im.image_url&&!im.image_url.startsWith('s3://')?<img key={im.id} src={im.image_url} alt={im.alt_text||item.title}/>:<div key={im.id} className="image-unavailable">Photo not available</div>):<div className="image-unavailable">Photos not available</div>}</div><div className="detail-columns"><section><h2>About this stay</h2><p>{item.description||'Description not provided.'}</p><h2>Eligibility and amenities</h2><dl><dt>Occupancy eligibility</dt><dd>{item.gender_eligibility||'Not confirmed'}</dd><dt>Couples allowed</dt><dd>{yesNo(item.couples_allowed)}</dd><dt>Co-ed rooms allowed</dt><dd>{yesNo(item.co_ed_rooms_allowed)}</dd><dt>Cooking allowed</dt><dd>{yesNo(item.cooking_allowed)}</dd><dt>Wi-Fi</dt><dd>{item.wifi_value_state==='known'?yesNo(item.wifi_available):'Not confirmed'}</dd></dl><h2>Rental terms</h2><dl><dt>Security deposit</dt><dd>{item.security_deposit_amount!=null?money(item.security_deposit_amount):item.security_deposit_basis?.replaceAll('_',' ')||'Not provided'}</dd><dt>Deposit refund policy</dt><dd>{item.security_deposit_refund_policy?.replaceAll('_',' ')||'Not confirmed'}</dd><dt>Notice period</dt><dd>{item.notice_period_value!=null?item.notice_period_value+' '+(item.notice_period_unit||''):'Not provided'}</dd><dt>Electricity</dt><dd>{item.electricity_billing_mode||'Not provided'}{item.electricity_rate_per_unit?' · ₹'+item.electricity_rate_per_unit+'/unit':''}</dd></dl>{item.rooms?.map(r=><article className="room-detail" key={r.id}><h3>{r.room_label} · {r.room_type==='single'?'Private room':'Shared room'}</h3><p>Occupancy: {r.max_occupants} · Status: {r.room_status||'Unknown'}</p>{r.prices?.length?r.prices.map((p,i)=><p key={i}>{money(p.amount,p.currency)} / {p.stay_period} ({p.rent_basis==='per_bed'?'per bed':'per room'})</p>):<p>Price not provided</p>}</article>)}</section><aside><h2>Contact property</h2><p>Owner contact is not exposed by the current public API. No contact details are fabricated.</p></aside></div></>}</main>}
  <footer className="public-footer">Roomler · Your space. Your vibe.</footer>
 </div>
}
