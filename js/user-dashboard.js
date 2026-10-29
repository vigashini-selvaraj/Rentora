(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const properties = [
    {id:1,title:'Modern Family Apartment',location:'Anna Nagar, Chennai',beds:3,baths:2,area:'1,250 sq.ft.',rent:24000,status:'Available',image:'assets/twilight-luxury-apartment.png',date:'2026-10-12'},
    {id:2,title:'Sunlit 2BHK Apartment',location:'RS Puram, Coimbatore',beds:2,baths:2,area:'980 sq.ft.',rent:16500,status:'Available',image:'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=85',date:'2026-10-10'},
    {id:3,title:'Garden View Villa',location:'KK Nagar, Madurai',beds:4,baths:3,area:'1,900 sq.ft.',rent:32000,status:'Available',image:'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=85',date:'2026-10-08'},
    {id:4,title:'Compact City Studio',location:'Cantonment, Trichy',beds:1,baths:1,area:'520 sq.ft.',rent:9500,status:'Available',image:'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=900&q=85',date:'2026-10-06'}
  ];
  let saved = JSON.parse(localStorage.getItem('rentora-user-saved') || '[1,2,3]');
  let enquiries = [
    {id:'ENQ-1032',propertyId:1,date:'12 Oct 2026',status:'Contacted',updated:'Today, 10:15 AM'},
    {id:'ENQ-1024',propertyId:2,date:'10 Oct 2026',status:'Viewing Scheduled',updated:'Yesterday, 4:40 PM'},
    {id:'ENQ-1011',propertyId:3,date:'08 Oct 2026',status:'New',updated:'08 Oct 2026'}
  ];
  const statusClass = s => ({'New':'status-new','Contacted':'status-contacted','Viewing Scheduled':'status-viewing','Resolved':'status-resolved','Closed':'status-closed'}[s] || 'status-closed');
  const money = n => '₹' + n.toLocaleString('en-IN');
  const prop = id => properties.find(p=>p.id===id) || properties[0];
  function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2600)}
  function propertyCard(p){
    const isSaved = saved.includes(p.id);
    return `<article class="property-card" data-property="${p.id}" data-search="${(p.title+' '+p.location).toLowerCase()}">
      <div class="property-image">
        <img src="${p.image}" alt="${p.title}" loading="lazy">
        <span class="property-badge">${p.status}</span>
        <button class="favorite-button ${isSaved?'is-saved':''}" data-favorite="${p.id}" aria-label="${isSaved?'Remove from':'Save to'} favourites" aria-pressed="${isSaved}">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="${isSaved?'currentColor':'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
      <div class="property-content">
        <div class="property-title-row">
          <h3>${p.title}</h3>
          <span class="property-price">${money(p.rent)} <small>/ mo</small></span>
        </div>
        <p class="property-location"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" style="display:inline-block;vertical-align:-1px;margin-right:4px;"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>${p.location}</p>
        <div class="property-meta">
          <span>${p.beds} beds</span>
          <span>${p.baths} baths</span>
          <span>${p.area}</span>
        </div>
        <div class="property-card-bottom">
          <a class="detail-link" href="property-details.html">View details ↗</a>
          <span class="status status-resolved">${p.status}</span>
        </div>
      </div>
    </article>`}
  function renderSaved(){const selected=properties.filter(p=>saved.includes(p.id));const query=($('#savedSearch')?.value||'').trim().toLowerCase();const sort=$('#savedSort')?.value||'recent';let list=selected.filter(p=>(p.title+' '+p.location).toLowerCase().includes(query));if(sort==='rent-low')list.sort((a,b)=>a.rent-b.rent);if(sort==='rent-high')list.sort((a,b)=>b.rent-a.rent);if(sort==='recent')list.sort((a,b)=>b.date.localeCompare(a.date));$('#savedGrid').innerHTML=list.map(propertyCard).join('');$('#savedEmpty').hidden=list.length!==0;$('#savedCount').textContent=saved.length;$('#savedStat').textContent=saved.length;$('#profileSavedCount').textContent=`${saved.length} ${saved.length===1?'home':'homes'}`;}
  function renderEnquiries(){const query=($('#enquirySearch')?.value||'').toLowerCase();const filter=$('#enquiryFilter')?.value||'all';const list=enquiries.filter(e=>{const p=prop(e.propertyId);return(p.title+' '+p.location+' '+e.id).toLowerCase().includes(query)&&(filter==='all'||e.status===filter)});$('#enquiryRows').innerHTML=list.map(e=>{const p=prop(e.propertyId);return `<tr><td><div class="table-property"><img src="${p.image}" alt=""><div><strong>${p.title}</strong><small>${p.location} · ${e.id}</small></div></div></td><td>${e.date}</td><td><span class="status ${statusClass(e.status)}">${e.status}</span></td><td>${e.updated}</td><td><a class="detail-link" href="property-details.html">View ↗</a></td></tr>`}).join('');$('#enquiryEmpty').hidden=list.length!==0;$('#enquirySummary').textContent=`Showing ${list.length} ${list.length===1?'enquiry':'enquiries'}`;$('#enquiryCount').textContent=enquiries.filter(e=>['New','Contacted','Viewing Scheduled'].includes(e.status)).length;$('#activeStat').textContent=enquiries.filter(e=>['New','Contacted','Viewing Scheduled'].includes(e.status)).length;}
  function renderRecent(){const recent=properties.filter(p=>saved.includes(p.id)).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,3);$('#recentSaved').innerHTML=recent.map(propertyCard).join('')||'<div class="empty-state"><h2>No saved homes yet</h2><p>Browse listings and tap the heart to save a property.</p><a class="primary-button" href="properties.html">Browse properties</a></div>';$('#recentEnquiries').innerHTML=enquiries.slice(0,2).map(e=>{const p=prop(e.propertyId);return `<div class="enquiry-preview-row"><img class="mini-property" src="${p.image}" alt=""><div class="enquiry-preview-main"><strong>${p.title}</strong><p>Enquiry ${e.id} · ${e.date}</p></div><span class="status ${statusClass(e.status)}">${e.status}</span><span class="enquiry-preview-date">${e.updated}</span></div>`}).join('');}
  function renderAll(){renderSaved();renderEnquiries();renderRecent()}
  function showView(name){
    $$('.page-view').forEach(v=>v.classList.toggle('active-view',v.id===`view-${name}`));
    $$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
    $('#pageCrumb').textContent=({
      overview:'Overview',
      saved:'Saved properties',
      enquiries:'My enquiries',
      payments:'Payments & Rent',
      leases:'My Tenancy & Escrow',
      maintenance:'Maintenance & Service',
      rentals:'Rental History',
      preferences:'Housing Preferences',
      profile:'My profile'
    })[name]||'Overview';
    $('#sidebar').classList.remove('open');
    window.scrollTo({top:0,behavior:'smooth'});
  }
  document.addEventListener('click',e=>{
    const nav=e.target.closest('[data-view]');
    if(nav){showView(nav.dataset.view);return}
    const go=e.target.closest('[data-go]');
    if(go){showView(go.dataset.go);return}
    const fav=e.target.closest('[data-favorite]');
    if(fav){
      const id=Number(fav.dataset.favorite);
      saved=saved.includes(id)?saved.filter(n=>n!==id):[...saved,id];
      localStorage.setItem('rentora-user-saved',JSON.stringify(saved));
      renderAll();
      toast(saved.includes(id)?'Property added to saved homes.':'Property removed from saved homes.');
      return;
    }
    const logout=e.target.closest('#userLogoutBtn');
    if(logout){
      toast('Logging out...');
      setTimeout(()=>{window.location.href='login.html';},500);
      return;
    }
  });
  $('#mobileMenu').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
  $('#savedSearch').addEventListener('input',renderSaved);$('#savedSort').addEventListener('change',renderSaved);$('#enquirySearch').addEventListener('input',renderEnquiries);$('#enquiryFilter').addEventListener('change',renderEnquiries);
  const themeToggle=$('#themeToggle');
  function setTheme(theme){
    document.body.classList.toggle('dark-theme',theme==='dark');document.documentElement.setAttribute('data-theme', theme);
    themeToggle.setAttribute('aria-pressed',String(theme==='dark'));
    const isDark = theme==='dark';
    $('#themeIcon').innerHTML=isDark
      ? '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
      : '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    $('#themeLabel').textContent=isDark?'Light mode':'Dark mode';
    localStorage.setItem('rentora-admin-theme',theme);
    localStorage.setItem('rentora-user-theme',theme);localStorage.setItem('rentora-theme',theme);
  }
  themeToggle.addEventListener('click',()=>setTheme(document.body.classList.contains('dark-theme')?'light':'dark'));
  setTheme(localStorage.getItem('rentora-admin-theme')||localStorage.getItem('rentora-user-theme')||localStorage.getItem('rentora-theme')||'light');
  function setDirection(direction){document.documentElement.dir=direction;$$('.direction-button').forEach(b=>{const active=b.dataset.direction===direction;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});localStorage.setItem('rentora-admin-direction',direction);localStorage.setItem('rentora-user-direction',direction)}$$('.direction-button').forEach(b=>b.addEventListener('click',()=>setDirection(b.dataset.direction)));setDirection(localStorage.getItem('rentora-admin-direction')||localStorage.getItem('rentora-user-direction')||'ltr');
  const profileForm=$('#profileForm');const profileKeys=['fullName','email','phone','contactMethod','location','notes'];try{const savedProfile=JSON.parse(localStorage.getItem('rentora-user-profile')||'{}');profileKeys.forEach(k=>{if(savedProfile[k]!==undefined&&$('#'+k))$('#'+k).value=savedProfile[k]});}catch{}
  profileForm.addEventListener('submit',e=>{e.preventDefault();const data={};profileKeys.forEach(k=>data[k]=$('#'+k).value);localStorage.setItem('rentora-user-profile',JSON.stringify(data));$('#profileNameHeading').textContent=data.fullName||'Resident User';$$('.profile-copy strong').forEach(el=>el.textContent=data.fullName||'Resident User');toast('Profile saved in this browser.');});

  // Modal Handlers (Lease Agreement & NOC Certificate)
  const leaseModal = $('#leaseModal');
  const nocModal = $('#nocModal');
  $('#openLeaseModalBtn')?.addEventListener('click', () => { leaseModal?.classList.add('open'); });
  $('#closeLeaseModalBtn')?.addEventListener('click', () => { leaseModal?.classList.remove('open'); });
  $('#closeLeaseModalAction')?.addEventListener('click', () => { leaseModal?.classList.remove('open'); });

  $('#openNocModalBtn')?.addEventListener('click', () => { nocModal?.classList.add('open'); });
  $('#closeNocModalBtn')?.addEventListener('click', () => { nocModal?.classList.remove('open'); });
  $('#closeNocModalAction')?.addEventListener('click', () => { nocModal?.classList.remove('open'); });

  [leaseModal, nocModal].forEach(m => {
    m?.addEventListener('click', e => {
      if (e.target === m) m.classList.remove('open');
    });
  });

  // Preferences Form Handler
  const preferencesForm = $('#preferencesForm');
  preferencesForm?.addEventListener('submit', e => {
    e.preventDefault();
    const loc = $('#prefNeighborhood')?.value || 'Anna Nagar, Besant Nagar';
    const bud = $('#prefBudget')?.value || '45000';
    const beds = $('#prefBeds')?.value || '3 BHK';
    if ($('#prefLocSummary')) $('#prefLocSummary').textContent = loc;
    if ($('#prefBudgetSummary')) $('#prefBudgetSummary').textContent = `Up to ₹${Number(bud).toLocaleString('en-IN')} / mo`;
    if ($('#prefBedsSummary')) $('#prefBedsSummary').textContent = `${beds} Apartment`;
    toast('Housing preferences saved. Matching listings prioritized.');
  });

  renderAll();
})();
