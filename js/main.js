(() => {
  const root = document.documentElement;
  const savedTheme = localStorage.getItem('rentora-theme');
  const savedDirection = localStorage.getItem('rentora-direction');
  if (savedTheme === 'dark' || savedTheme === 'light') {
    root.dataset.theme = savedTheme;
  } else if (!root.dataset.theme) {
    root.dataset.theme = 'light';
  }
  if (savedDirection === 'rtl' || savedDirection === 'ltr') {
    root.dir = savedDirection;
  } else if (!root.dir) {
    root.dir = 'ltr';
  }

  async function loadSharedComponents() {
    const navbarTarget = document.getElementById('navbar');
    const footerTarget = document.getElementById('footer');
    try {
      const cacheBust = Date.now();
      // Try navbar.txt first (prevents VS Code Live Server from prematurely truncating partial HTML files), fallback to navbar.html
      const navPromise = fetch('components/navbar.txt?v=' + cacheBust, { cache: 'no-store' })
        .then(res => res.ok ? res : fetch('components/navbar.html?v=' + cacheBust, { cache: 'no-store' }));

      const footerPromise = fetch('components/footer.txt?v=' + cacheBust, { cache: 'no-store' })
        .then(res => res.ok ? res : fetch('components/footer.html?v=' + cacheBust, { cache: 'no-store' }));

      const [navResponse, footerResponse] = await Promise.all([
        navPromise,
        footerPromise
      ]);
      if (!navResponse.ok || !footerResponse.ok) throw new Error('Unable to load shared components');
      if (navbarTarget) navbarTarget.innerHTML = await navResponse.text();
      if (footerTarget) footerTarget.innerHTML = await footerResponse.text();
      initializeNavigation();
      initializePreferences();
      initializeStickyHeader();
      const year = document.getElementById('current-year');
      if (year) year.textContent = new Date().getFullYear();
      window.dispatchEvent(new CustomEvent('rentora-components-loaded'));
    } catch (error) {
      console.error(error);
      if (navbarTarget) navbarTarget.innerHTML = '<div class="component-error">Navbar could not load. Please run this project using VS Code Live Server.</div>';
      if (footerTarget) footerTarget.innerHTML = '';
    }
  }

  function initializeNavigation() {
    const rawPath = location.pathname.split('/').pop() || 'index.html';
    const currentPage = rawPath.toLowerCase();

    // Mapping for sub-pages or plural variations to ensure active state highlights properly
    let targetPage = currentPage;
    if (currentPage === 'service-detail.html' || currentPage === 'services.html') {
      targetPage = 'service.html';
    } else if (currentPage === 'blog-details.html') {
      targetPage = 'blog.html';
    } else if (currentPage === 'property-detail.html') {
      targetPage = 'properties.html';
    } else if (currentPage === 'admin-dashboard.html') {
      targetPage = 'user-dashboard.html';
    } else if (currentPage === '' || currentPage === '/') {
      targetPage = 'index.html';
    }

    document.querySelectorAll('[data-page]').forEach(link => {
      const linkPage = (link.dataset.page || '').toLowerCase();
      if (linkPage === targetPage || linkPage === currentPage) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });

    // Profile dropdown for desktop
    const profileTrigger = document.querySelector('.profile-trigger');
    const profileMenu = document.querySelector('.profile-menu');
    if (profileTrigger && profileMenu) {
      profileTrigger.addEventListener('click', (event) => {
        event.stopPropagation();
        const isOpen = profileTrigger.getAttribute('aria-expanded') === 'true';
        profileTrigger.setAttribute('aria-expanded', String(!isOpen));
        profileMenu.hidden = isOpen;
      });
      document.addEventListener('click', event => {
        if (!event.target.closest('.profile-wrap')) {
          profileMenu.hidden = true;
          profileTrigger.setAttribute('aria-expanded', 'false');
        }
      });
      document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
          profileMenu.hidden = true;
          profileTrigger.setAttribute('aria-expanded', 'false');
          profileTrigger.focus();
        }
      });
    }

    // Robust mobile navigation toggle (delegated on document for complete reliability across all pages)
    if (!window.__rentoraNavInitialized) {
      window.__rentoraNavInitialized = true;

      document.addEventListener('click', (event) => {
        const toggle = event.target.closest('.menu-toggle');
        if (toggle) {
          event.preventDefault();
          event.stopPropagation();
          const mobileNav = document.querySelector('.mobile-nav') || document.getElementById('mobile-nav');
          if (!mobileNav) return;
          const isOpen = toggle.getAttribute('aria-expanded') === 'true';
          const nextState = !isOpen;
          toggle.setAttribute('aria-expanded', String(nextState));
          toggle.setAttribute('aria-label', nextState ? 'Close navigation menu' : 'Open navigation menu');
          mobileNav.hidden = !nextState;
          mobileNav.classList.toggle('is-open', nextState);
          return;
        }

        // Close mobile nav when clicking outside header
        if (!event.target.closest('.site-header')) {
          const mobileNav = document.querySelector('.mobile-nav') || document.getElementById('mobile-nav');
          const toggle = document.querySelector('.menu-toggle');
          if (mobileNav && (!mobileNav.hidden || mobileNav.classList.contains('is-open'))) {
            mobileNav.hidden = true;
            mobileNav.classList.remove('is-open');
            if (toggle) {
              toggle.setAttribute('aria-expanded', 'false');
              toggle.setAttribute('aria-label', 'Open navigation menu');
            }
          }
        }
      });

      // Close mobile nav on ESC
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          const mobileNav = document.querySelector('.mobile-nav') || document.getElementById('mobile-nav');
          const toggle = document.querySelector('.menu-toggle');
          if (mobileNav && (!mobileNav.hidden || mobileNav.classList.contains('is-open'))) {
            mobileNav.hidden = true;
            mobileNav.classList.remove('is-open');
            if (toggle) {
              toggle.setAttribute('aria-expanded', 'false');
              toggle.setAttribute('aria-label', 'Open navigation menu');
              toggle.focus();
            }
          }
        }
      });

      // Auto close on viewport resize to desktop width (> 900px)
      window.addEventListener('resize', () => {
        if (window.innerWidth > 900) {
          const mobileNav = document.querySelector('.mobile-nav') || document.getElementById('mobile-nav');
          const toggle = document.querySelector('.menu-toggle');
          if (mobileNav) {
            mobileNav.hidden = true;
            mobileNav.classList.remove('is-open');
          }
          if (toggle) {
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Open navigation menu');
          }
        }
      });
    }

    // Close mobile nav when clicking any link inside it
    const activeMobileNav = document.querySelector('.mobile-nav');
    const activeToggle = document.querySelector('.menu-toggle');
    if (activeMobileNav && activeToggle) {
      activeMobileNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          activeMobileNav.hidden = true;
          activeMobileNav.classList.remove('is-open');
          activeToggle.setAttribute('aria-expanded', 'false');
          activeToggle.setAttribute('aria-label', 'Open navigation menu');
        });
      });
    }
  }

  function initializePreferences() {
    function updateThemeButton() {
      const isDark = root.dataset.theme === 'dark';
      document.querySelectorAll('.theme-toggle').forEach(btn => {
        btn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
        btn.setAttribute('title', isDark ? 'Switch to light theme' : 'Switch to dark theme');
      });
    }

    function updateDirectionButton() {
      const rtl = root.dir === 'rtl';
      document.querySelectorAll('.direction-toggle').forEach(btn => {
        const label = btn.querySelector('.direction-label');
        if (label) label.textContent = rtl ? 'RTL' : 'LTR';
        btn.setAttribute('aria-label', rtl ? 'Switch to left-to-right layout' : 'Switch to right-to-left layout');
        btn.setAttribute('title', rtl ? 'Switch to LTR' : 'Switch to RTL');
      });
    }

    updateThemeButton();
    updateDirectionButton();
  }

  // Delegated listeners for theme & direction toggle buttons
  document.addEventListener('click', (event) => {
    const themeBtn = event.target.closest('.theme-toggle');
    if (themeBtn) {
      const current = root.dataset.theme === 'dark' ? 'dark' : 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      localStorage.setItem('rentora-theme', next);
      const isDark = next === 'dark';
      document.querySelectorAll('.theme-toggle').forEach(btn => {
        btn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
        btn.setAttribute('title', isDark ? 'Switch to light theme' : 'Switch to dark theme');
      });
      return;
    }

    const dirBtn = event.target.closest('.direction-toggle');
    if (dirBtn) {
      const next = root.dir === 'rtl' ? 'ltr' : 'rtl';
      root.dir = next;
      localStorage.setItem('rentora-direction', next);
      const rtl = next === 'rtl';
      document.querySelectorAll('.direction-toggle').forEach(btn => {
        const label = btn.querySelector('.direction-label');
        if (label) label.textContent = rtl ? 'RTL' : 'LTR';
        btn.setAttribute('aria-label', rtl ? 'Switch to left-to-right layout' : 'Switch to right-to-left layout');
        btn.setAttribute('title', rtl ? 'Switch to LTR' : 'Switch to RTL');
      });
      return;
    }
  });

  function initializeStickyHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    function handleScroll() {
      if (window.scrollY > 10) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  function initializeResidenceDeck() {
    const deckContainer = document.getElementById('residenceDeck');
    if (!deckContainer) return;

    const cards = Array.from(deckContainer.querySelectorAll('.deck-card'));
    if (!cards.length) return;

    const activeNameEl = document.getElementById('deckActiveName');
    const activeMetaEl = document.getElementById('deckActiveMeta');
    const counterEl = document.getElementById('deckCounter');
    const prevBtn = document.getElementById('deckPrevBtn');
    const nextBtn = document.getElementById('deckNextBtn');

    let currentIndex = 0;
    const totalCards = cards.length;
    let isAnimating = false;

    function updateDeckPositions(animatingCard = null) {
      cards.forEach((card, i) => {
        // Calculate relative position offset from current top card
        const relativePos = (i - currentIndex + totalCards) % totalCards;
        
        // Remove existing pos-* classes
        card.classList.remove('pos-0', 'pos-1', 'pos-2', 'pos-3', 'pos-hidden');
        
        if (card === animatingCard) {
          // If this card is currently popping out, let its animation finish
          return;
        }

        if (relativePos === 0) {
          card.classList.add('pos-0');
        } else if (relativePos === 1) {
          card.classList.add('pos-1');
        } else if (relativePos === 2) {
          card.classList.add('pos-2');
        } else if (relativePos === 3) {
          card.classList.add('pos-3');
        } else {
          card.classList.add('pos-hidden');
        }
      });

      // Update Floating Info Details
      const activeCard = cards[currentIndex];
      if (activeCard) {
        const name = activeCard.dataset.name || '';
        const rent = activeCard.dataset.rent || '';
        const status = activeCard.dataset.status || '';
        if (activeNameEl) activeNameEl.textContent = name;
        if (activeMetaEl) activeMetaEl.textContent = `${rent} · ${status}`;
      }

      if (counterEl) {
        counterEl.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(totalCards).padStart(2, '0')}`;
      }
    }

    function popNextCard() {
      if (isAnimating) return;
      isAnimating = true;

      const topCard = cards[currentIndex];
      topCard.classList.add('popping-out');

      // Advance index
      currentIndex = (currentIndex + 1) % totalCards;

      // Update stack behind it immediately
      cards.forEach((card, i) => {
        if (card === topCard) return;
        const relativePos = (i - currentIndex + totalCards) % totalCards;
        card.classList.remove('pos-0', 'pos-1', 'pos-2', 'pos-3', 'pos-hidden');
        if (relativePos === 0) card.classList.add('pos-0');
        else if (relativePos === 1) card.classList.add('pos-1');
        else if (relativePos === 2) card.classList.add('pos-2');
        else if (relativePos === 3) card.classList.add('pos-3');
        else card.classList.add('pos-hidden');
      });

      // Update text info
      const activeCard = cards[currentIndex];
      if (activeCard) {
        const name = activeCard.dataset.name || '';
        const rent = activeCard.dataset.rent || '';
        const status = activeCard.dataset.status || '';
        if (activeNameEl) activeNameEl.textContent = name;
        if (activeMetaEl) activeMetaEl.textContent = `${rent} · ${status}`;
      }
      if (counterEl) {
        counterEl.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(totalCards).padStart(2, '0')}`;
      }

      setTimeout(() => {
        topCard.classList.remove('popping-out');
        updateDeckPositions();
        isAnimating = false;
      }, 500);
    }

    function popPrevCard() {
      if (isAnimating) return;
      isAnimating = true;

      currentIndex = (currentIndex - 1 + totalCards) % totalCards;
      updateDeckPositions();

      setTimeout(() => {
        isAnimating = false;
      }, 400);
    }

    // Attach listeners
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        popNextCard();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        popPrevCard();
      });
    }

    // Clicking on any visible card cycles to it or pops the top card
    cards.forEach((card, idx) => {
      card.addEventListener('click', () => {
        if (idx === currentIndex) {
          popNextCard();
        } else {
          currentIndex = idx;
          updateDeckPositions();
        }
      });
    });

    // Initial setup
    updateDeckPositions();
  }

  function boot() {
    loadSharedComponents();
    initializeResidenceDeck();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
