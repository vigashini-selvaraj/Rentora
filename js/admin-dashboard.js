const navButtons = document.querySelectorAll('.nav-item[data-view]');
const views = document.querySelectorAll('.page-view');
const pageCrumb = document.getElementById('pageCrumb');
const sidebar = document.getElementById('sidebar');
const toast = document.getElementById('toast');
let toastTimer;

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function openView(viewName) {
  const target = document.getElementById(`view-${viewName}`);
  if (!target) return;
  views.forEach(view => view.classList.toggle('active-view', view === target));
  navButtons.forEach(button => button.classList.toggle('active', button.dataset.view === viewName));
  const activeButton = document.querySelector(`.nav-item[data-view="${viewName}"]`);
  if (pageCrumb) {
    pageCrumb.textContent = activeButton ? activeButton.textContent.trim().replace(/\s+\d+$/, '') : 'Overview';
  }
  if (sidebar) sidebar.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navButtons.forEach(button => button.addEventListener('click', () => openView(button.dataset.view)));
document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => openView(button.dataset.go)));

const mobileMenu = document.getElementById('mobileMenu');
if (mobileMenu && sidebar) {
  mobileMenu.addEventListener('click', () => sidebar.classList.toggle('open'));
}

function applyFilter(inputId, rowsSelector, statusId = null) {
  const input = document.getElementById(inputId);
  const statusSelect = statusId ? document.getElementById(statusId) : null;
  if (!input) return;
  const update = () => {
    const query = input.value.trim().toLowerCase();
    const status = statusSelect ? statusSelect.value : 'all';
    let visible = 0;
    document.querySelectorAll(rowsSelector).forEach(row => {
      const searchable = (row.dataset.search || row.textContent).toLowerCase();
      const rowStatus = (row.dataset.status || '').toLowerCase();
      const match = searchable.includes(query) && (status === 'all' || rowStatus === status.toLowerCase());
      row.hidden = !match;
      if (match) visible++;
    });
    const countId = rowsSelector === '#propertiesTable tr' ? 'propertyCount' :
      rowsSelector === '#enquiriesTable tr' ? 'enquiryCount' : null;
    const count = countId ? document.getElementById(countId) : null;
    if (count) count.textContent = `Showing ${visible} ${rowsSelector === '#propertiesTable tr' ? 'properties' : 'enquiries'}`;
  };
  input.addEventListener('input', update);
  if (statusSelect) statusSelect.addEventListener('change', update);
}

applyFilter('propertySearch', '#propertiesTable tr', 'propertyStatusFilter');
applyFilter('enquirySearch', '#enquiriesTable tr', 'enquiryStatusFilter');
applyFilter('customerSearch', '#customersTable tr');
applyFilter('ownerSearch', '#ownersTable tr');
applyFilter('paymentSearch', '#paymentsTable tr', 'paymentStatusFilter');
applyFilter('payoutSearch', '#payoutsTable tr', 'payoutStatusFilter');
applyFilter('leaseSearch', '#leasesTable tr', 'leaseStatusFilter');

// Payment type filter handler
const paymentTypeFilter = document.getElementById('paymentTypeFilter');
if (paymentTypeFilter) {
  paymentTypeFilter.addEventListener('change', () => {
    const val = paymentTypeFilter.value;
    document.querySelectorAll('#paymentsTable tr').forEach(row => {
      const match = val === 'all' || row.dataset.type === val;
      row.hidden = !match;
    });
  });
}

// Inline Status Change Handling
document.querySelectorAll('.inline-status').forEach(select => {
  select.addEventListener('change', () => {
    const row = select.closest('tr');
    const status = select.value;
    row.dataset.status = status;
    const label = row.querySelector('.status-label');
    if (label) {
      label.className = 'status status-label ' + ({
        'New': 'status-new',
        'Contacted': 'status-contacted',
        'Viewing scheduled': 'status-viewing',
        'Resolved': 'status-resolved',
        'Closed': 'status-closed'
      }[status] || 'status-new');
      label.textContent = status;
    }
    showToast(`Enquiry status updated to "${status}".`);
    const filter = document.getElementById('enquiryStatusFilter');
    if (filter && filter.value !== 'all' && filter.value !== status) {
      row.hidden = true;
    }
  });
});

// Modal Operations
const modal = document.getElementById('propertyModal');
function openModal() {
  if (!modal) return;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}
function closeModal() {
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

const addProp1 = document.getElementById('addPropertyBtn');
const addProp2 = document.getElementById('addPropertyBtn2');
if (addProp1) addProp1.addEventListener('click', () => openView('add-property'));
if (addProp2) addProp2.addEventListener('click', () => openView('add-property'));

const closeBtn = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelModal');
if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

if (modal) {
  modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
}
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal(); });

// Helper: Save new property to LocalStorage for website persistence
function savePropertyToStorage(property) {
  try {
    const existing = JSON.parse(localStorage.getItem('rentora_custom_properties') || '[]');
    existing.unshift(property);
    localStorage.setItem('rentora_custom_properties', JSON.stringify(existing));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

// Helper: Add property row to dashboard tables & update counts
function addPropertyToDashboard(property) {
  const { title, rent, location, beds, baths, area, status, image } = property;
  const numRent = Number(rent);

  // Update propertiesTable
  const tbody = document.getElementById('propertiesTable');
  if (tbody) {
    const row = document.createElement('tr');
    row.dataset.status = status;
    row.dataset.search = `${title} ${location}`.toLowerCase();
    const statusLabel = status === 'available'
      ? '<span class="status status-available">Available</span>'
      : '<span class="status status-review">In review</span>';
    
    row.innerHTML = `
      <td>
        <div class="property-cell">
          <img src="${image || 'assets/modern-luxury-villa.jpg'}" alt="${title}">
          <div>
            <strong>${title}</strong>
            <small>${beds} BHK · ${baths} Baths · ${area || '1,650 sqft'}</small>
          </div>
        </div>
      </td>
      <td class="rent-value">₹${numRent.toLocaleString('en-IN')} <small>/ month</small></td>
      <td>${statusLabel}</td>
      <td>${location}</td>
      <td><button class="secondary-button small-action" data-action="edit">Edit</button></td>
    `;
    tbody.prepend(row);
  }

  // Update overview recent properties
  const recent = document.getElementById('recentProperties');
  if (recent) {
    const recentRow = document.createElement('tr');
    recentRow.dataset.search = `${title} ${location}`.toLowerCase();
    const statusLabel = status === 'available'
      ? '<span class="status status-available">Available</span>'
      : '<span class="status status-review">In review</span>';
    
    recentRow.innerHTML = `
      <td>
        <div class="property-cell">
          <img src="${image || 'assets/modern-luxury-villa.jpg'}" alt="${title}">
          <div>
            <strong>${title}</strong>
            <small>${location} · ${beds} BHK</small>
          </div>
        </div>
      </td>
      <td class="rent-value">₹${numRent.toLocaleString('en-IN')} <small>/ month</small></td>
      <td>${statusLabel}</td>
      <td>
        <button class="row-more" aria-label="More options">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
        </button>
      </td>
    `;
    recent.prepend(recentRow);
  }

  // Update navbar count & propertyCount display
  const navCount = document.getElementById('navPropCount');
  if (navCount) {
    const curr = parseInt(navCount.textContent || '24', 10);
    navCount.textContent = curr + 1;
  }
}

// Load existing custom properties from LocalStorage into the Admin Dashboard on init
function initCustomPropertiesInDashboard() {
  try {
    const customProps = JSON.parse(localStorage.getItem('rentora_custom_properties') || '[]');
    customProps.forEach(prop => {
      addPropertyToDashboard(prop);
    });
  } catch (err) {
    console.error('Error loading custom properties:', err);
  }
}
initCustomPropertiesInDashboard();

// ============================================================================
// Creator Studio: Live Preview & Submission
// ============================================================================
const creatorForm = document.getElementById('creatorPropertyForm');
const creatorTitleInput = document.getElementById('creatorTitle');
const creatorRentInput = document.getElementById('creatorRent');
const creatorCategorySelect = document.getElementById('creatorCategory');
const creatorLocationInput = document.getElementById('creatorLocation');
const creatorBedsSelect = document.getElementById('creatorBeds');
const creatorBathsSelect = document.getElementById('creatorBaths');
const creatorAreaInput = document.getElementById('creatorArea');
const creatorFurnishingSelect = document.getElementById('creatorFurnishing');
const creatorStatusSelect = document.getElementById('creatorStatus');
const creatorDescInput = document.getElementById('creatorDesc');
const creatorImageHidden = document.getElementById('creatorImage');
const imagePicker = document.getElementById('imagePicker');

// Live preview DOM elements
const previewImg = document.getElementById('previewImg');
const previewBadgeCategory = document.getElementById('previewBadgeCategory');
const previewPrice = document.getElementById('previewPrice');
const previewLocation = document.getElementById('previewLocation');
const previewTitle = document.getElementById('previewTitle');
const previewDesc = document.getElementById('previewDesc');
const previewBeds = document.getElementById('previewBeds');
const previewBaths = document.getElementById('previewBaths');
const previewArea = document.getElementById('previewArea');
const previewStatusBadge = document.getElementById('previewStatusBadge');

function updateLivePreview() {
  if (previewTitle && creatorTitleInput) {
    previewTitle.textContent = creatorTitleInput.value.trim() || 'Modern Luxury Residence';
  }
  if (previewPrice && creatorRentInput) {
    const rentVal = Number(creatorRentInput.value) || 0;
    previewPrice.textContent = `₹${rentVal.toLocaleString('en-IN')}`;
  }
  if (previewLocation && creatorLocationInput) {
    previewLocation.textContent = creatorLocationInput.value.trim() || 'Prime Location';
  }
  if (previewBadgeCategory && creatorCategorySelect) {
    const opt = creatorCategorySelect.options[creatorCategorySelect.selectedIndex];
    previewBadgeCategory.textContent = opt ? opt.text : 'Apartment';
  }
  if (previewBeds && creatorBedsSelect) {
    const bedVal = creatorBedsSelect.value;
    previewBeds.textContent = bedVal.includes('+') ? `${bedVal} Beds` : `${bedVal} BHK`;
  }
  if (previewBaths && creatorBathsSelect) {
    previewBaths.textContent = `${creatorBathsSelect.value} Baths`;
  }
  if (previewArea && creatorAreaInput) {
    previewArea.textContent = creatorAreaInput.value.trim() || '1,500 sqft';
  }
  if (previewDesc && creatorDescInput) {
    previewDesc.textContent = creatorDescInput.value.trim() || 'Contemporary upscale living with dedicated amenities and premium fittings.';
  }
  if (previewStatusBadge && creatorStatusSelect) {
    const st = creatorStatusSelect.value;
    previewStatusBadge.textContent = st === 'available' ? 'Available' : 'In Review';
    previewStatusBadge.className = `status ${st === 'available' ? 'status-available' : 'status-review'}`;
  }
}

// Bind live preview events
[creatorTitleInput, creatorRentInput, creatorLocationInput, creatorAreaInput, creatorDescInput].forEach(elem => {
  if (elem) elem.addEventListener('input', updateLivePreview);
});

[creatorCategorySelect, creatorBedsSelect, creatorBathsSelect, creatorFurnishingSelect, creatorStatusSelect].forEach(elem => {
  if (elem) elem.addEventListener('change', updateLivePreview);
});

// Image Picker Interaction
if (imagePicker) {
  const cards = imagePicker.querySelectorAll('.image-picker-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      const src = card.dataset.src;
      if (creatorImageHidden) creatorImageHidden.value = src;
      if (previewImg) previewImg.src = src;
    });
  });
}

// Reset Button
const resetCreatorBtn = document.getElementById('resetCreatorBtn');
if (resetCreatorBtn && creatorForm) {
  resetCreatorBtn.addEventListener('click', () => {
    creatorForm.reset();
    if (creatorImageHidden) creatorImageHidden.value = 'assets/twilight-luxury-apartment.png';
    if (previewImg) previewImg.src = 'assets/twilight-luxury-apartment.png';
    const cards = imagePicker.querySelectorAll('.image-picker-card');
    cards.forEach((c, idx) => c.classList.toggle('selected', idx === 0));
    updateLivePreview();
  });
}

// Handle Creator Studio Form Submission
if (creatorForm) {
  creatorForm.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(creatorForm);
    const newProperty = {
      id: 'prop-' + Date.now(),
      title: String(data.get('title')).trim(),
      rent: Number(data.get('rent')),
      category: String(data.get('category')),
      location: String(data.get('location')).trim(),
      beds: String(data.get('beds')),
      baths: String(data.get('baths')),
      area: String(data.get('area')).trim() || '1,500 sqft',
      furnishing: String(data.get('furnishing')),
      status: String(data.get('status')),
      image: String(data.get('image')) || 'assets/twilight-luxury-apartment.png',
      desc: String(data.get('desc')).trim()
    };

    if (!newProperty.title || !newProperty.rent || !newProperty.location) {
      showToast('Please fill out all required fields.');
      return;
    }

    // Save to local storage for public website sync
    savePropertyToStorage(newProperty);

    // Add to dashboard tables
    addPropertyToDashboard(newProperty);

    // Show confirmation and transition to Properties view
    showToast(`Property "${newProperty.title}" published to website.`);
    openView('properties');

    // Reset search so newly added row is visible
    const searchInput = document.getElementById('propertySearch');
    if (searchInput) {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
    }
  });
}

// Dynamic Quick Modal Submission Handling (Fallback)
const quickForm = document.getElementById('quickPropertyForm');
if (quickForm) {
  quickForm.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const newProperty = {
      id: 'prop-' + Date.now(),
      title: String(data.get('title')).trim(),
      rent: Number(data.get('rent')),
      category: 'apartment',
      location: String(data.get('location')).trim(),
      beds: String(data.get('beds')),
      baths: '2',
      area: '1,400 sqft',
      furnishing: 'furnished',
      status: String(data.get('status')),
      image: 'assets/modern-luxury-villa.jpg',
      desc: 'Comfortable residential living with full amenities.'
    };

    if (!newProperty.title || !newProperty.rent || !newProperty.location) return;

    savePropertyToStorage(newProperty);
    addPropertyToDashboard(newProperty);

    closeModal();
    event.currentTarget.reset();
    showToast(`Property "${newProperty.title}" successfully published.`);
    openView('properties');

    const searchInput = document.getElementById('propertySearch');
    if (searchInput) {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
    }
  });
}

// Global quick search trigger
const globalSearch = document.getElementById('globalSearch');
if (globalSearch) {
  globalSearch.addEventListener('input', event => {
    const value = event.target.value.trim();
    if (!value) return;
    if (/owner|landlord/i.test(value)) {
      openView('owners');
      const field = document.getElementById('ownerSearch');
      if (field) { field.value = value; field.dispatchEvent(new Event('input')); }
    } else if (/pay|rent|collect|transact|fee|escrow/i.test(value)) {
      openView('payments');
      const field = document.getElementById('paymentSearch');
      if (field) { field.value = value; field.dispatchEvent(new Event('input')); }
    } else if (/payout|disburs|remit/i.test(value)) {
      openView('payouts');
      const field = document.getElementById('payoutSearch');
      if (field) { field.value = value; field.dispatchEvent(new Event('input')); }
    } else if (/lease|contract|agreement/i.test(value)) {
      openView('leases');
      const field = document.getElementById('leaseSearch');
      if (field) { field.value = value; field.dispatchEvent(new Event('input')); }
    } else if (/enquir|customer|tenant/i.test(value)) {
      openView(/customer|tenant/i.test(value) ? 'customers' : 'enquiries');
      const field = document.getElementById(/customer|tenant/i.test(value) ? 'customerSearch' : 'enquirySearch');
      if (field) { field.value = value; field.dispatchEvent(new Event('input')); }
    } else if (/propert|house/i.test(value)) {
      openView('properties');
      const field = document.getElementById('propertySearch');
      if (field) { field.value = value; field.dispatchEvent(new Event('input')); }
    }
  });
}

// Logout Trigger
const logoutBtn = document.getElementById('adminLogoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    showToast('Logging out of Rentora Admin...');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 500);
  });
}

// Theme & Direction Preferences
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const themeLabel = document.getElementById('themeLabel');
const directionButtons = document.querySelectorAll('.direction-button');

function setTheme(theme) {
  const isDark = theme === 'dark';
  document.body.classList.toggle('dark-theme', isDark); document.documentElement.setAttribute('data-theme', theme);
  if (themeToggle) {
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
  }
  if (themeIcon) {
    themeIcon.innerHTML = isDark
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
  }
  if (themeLabel) {
    themeLabel.textContent = isDark ? 'Light mode' : 'Dark mode';
  }
  try { localStorage.setItem('rentora-admin-theme', theme); localStorage.setItem('rentora-theme', theme); } catch (error) {}
}

function setDirection(direction) {
  document.documentElement.setAttribute('dir', direction);
  directionButtons.forEach(button => {
    const active = button.dataset.direction === direction;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  try { localStorage.setItem('rentora-admin-direction', direction); } catch (error) {}
}

let savedTheme = 'light';
let savedDirection = 'ltr';
try {
  savedTheme = localStorage.getItem('rentora-admin-theme') || localStorage.getItem('rentora-theme') || 'light';
  savedDirection = localStorage.getItem('rentora-admin-direction') || 'ltr';
} catch (error) {}
setTheme(savedTheme);
setDirection(savedDirection);

if (themeToggle) {
  themeToggle.addEventListener('click', () => setTheme(document.body.classList.contains('dark-theme') ? 'light' : 'dark'));
}
directionButtons.forEach(button => button.addEventListener('click', () => setDirection(button.dataset.direction)));
