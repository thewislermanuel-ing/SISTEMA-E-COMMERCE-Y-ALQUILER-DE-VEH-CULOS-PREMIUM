/**
 * LUXURY MOTORS ELITE CORP. - V5.2 PRO
 * Sistema E-Commerce y Alquiler de Vehículos Premium (SPA)
 * Arquitectura Frontend Principal & Motor Anti-PDF en Blanco
 */

(function () {
  'use strict';

  // State Management
  const state = {
    catalog: [],
    vehiculos: [],
    motos: [],
    cart: [],
    activeCategory: 'todos', // 'todos' | 'vehiculos' | 'motos'
    selectedBrand: 'todas',
    currentSort: 'default',
    searchQuery: '',
    selectedRentalVehicle: null
  };

  // Helper: Format Currency (USD)
  const formatUSD = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(val) || 0);
  };

  // Helper: Escape HTML to prevent XSS
  const escapeHtml = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  // Normalize asset paths so the app works both with assets/ and root-level files
  const normalizeAssetPath = (value) => {
    if (typeof value !== 'string') return '';
    return value.trim().replace(/^\.?\//, '').replace(/^assets\//i, '');
  };

  const resolveAssetPath = (value, fallback = '') => {
    const normalized = normalizeAssetPath(value);
    return normalized || fallback;
  };

  const normalizeCatalogPaths = (items) => {
    if (!Array.isArray(items)) return [];
    return items.map((item) => {
      if (!item || typeof item !== 'object') return item;
      const normalizedItem = { ...item };
      if (normalizedItem.logo) normalizedItem.logo = normalizeAssetPath(normalizedItem.logo);
      if (normalizedItem.imagen) normalizedItem.imagen = normalizeAssetPath(normalizedItem.imagen);
      return normalizedItem;
    });
  };

  // Pre-load default values in state
  const DEFAULT_CLIENT_DATA = {
    name: 'Ing. Wisler M. Espinales',
    id: '24-EISN-8-013',
    license: 'DO-8874125-VIP (Vigente)',
    phone: '+1 (849) 816-5409',
    email: 'thewislermanuel@gmail.com',
    address: 'Av. Anacaona #105, Torre Bella Vista, Santo Domingo, D.N.',
    cardNumber: '4532 8901 2345 8899',
    expiry: '12/28',
    cvv: '789'
  };

  // Local Storage Cart Key
  const CART_STORAGE_KEY = 'luxury_motors_cart_v52';

  // DOM Elements Cache
  let dom = {};

  // Initialize Application
  document.addEventListener('DOMContentLoaded', () => {
    cacheDomElements();
    attachEventListeners();
    loadCartFromStorage();
    loadCatalogData();
  });

  function cacheDomElements() {
    dom = {
      catalogGrid: document.getElementById('catalogGrid'),
      emptyState: document.getElementById('emptyCatalogState'),
      searchInput: document.getElementById('searchInput'),
      btnClearSearch: document.getElementById('btnClearSearch'),
      catTabs: document.querySelectorAll('.cat-tab'),
      brandSelect: document.getElementById('brandSelect'),
      sortSelect: document.getElementById('sortSelect'),
      btnResetFilters: document.getElementById('btnResetFilters'),
      btnResetAll: document.getElementById('btnResetAll'),
      activeFilterBadge: document.getElementById('activeFilterBadge'),
      catalogCategoryTitle: document.getElementById('catalogCategoryTitle'),
      catalogResultsCount: document.getElementById('catalogResultsCount'),
      badgeCountTodos: document.getElementById('badgeCountTodos'),
      badgeCountVehiculos: document.getElementById('badgeCountVehiculos'),
      badgeCountMotos: document.getElementById('badgeCountMotos'),
      navCartBadge: document.getElementById('navCartBadge'),
      floatingCartBadge: document.getElementById('floatingCartBadge'),
      btnFloatingCart: document.getElementById('btnFloatingCart'),
      btnQuickDemo: document.getElementById('btnQuickDemo'),

      // Rental Modal
      rentalModalEl: document.getElementById('rentalModal'),
      rentalCarLogo: document.getElementById('rentalCarLogo'),
      rentalCarCode: document.getElementById('rentalCarCode'),
      rentalCarImg: document.getElementById('rentalCarImg'),
      rentalCarName: document.getElementById('rentalCarName'),
      rentalCarType: document.getElementById('rentalCarType'),
      rentalRateDay: document.getElementById('rentalRateDay'),
      rentalRateHour: document.getElementById('rentalRateHour'),
      rentalModeRadios: document.getElementsByName('rentalModeRadio'),
      modeDays: document.getElementById('modeDays'),
      modeHours: document.getElementById('modeHours'),
      rentalDurationInput: document.getElementById('rentalDurationInput'),
      lblDurationUnit: document.getElementById('lblDurationUnit'),
      btnDecDuration: document.getElementById('btnDecDuration'),
      btnIncDuration: document.getElementById('btnIncDuration'),
      rentalStartDate: document.getElementById('rentalStartDate'),
      calcUnitRate: document.getElementById('calcUnitRate'),
      calcDuration: document.getElementById('calcDuration'),
      calcSubtotal: document.getElementById('calcSubtotal'),
      calcTotalEstimated: document.getElementById('calcTotalEstimated'),
      btnConfirmAddToCartRental: document.getElementById('btnConfirmAddToCartRental'),

      // Cart Modal
      cartModalEl: document.getElementById('cartModal'),
      cartItemsList: document.getElementById('cartItemsList'),
      cartSummarySubtotal: document.getElementById('cartSummarySubtotal'),
      cartSummaryTax: document.getElementById('cartSummaryTax'),
      cartSummaryDeposit: document.getElementById('cartSummaryDeposit'),
      cartSummaryTotal: document.getElementById('cartSummaryTotal'),
      btnClearCart: document.getElementById('btnClearCart'),
      btnProceedToCheckout: document.getElementById('btnProceedToCheckout'),

      // Checkout Modal
      checkoutModalEl: document.getElementById('checkoutModal'),
      checkoutForm: document.getElementById('checkoutForm'),
      btnRefillDemoData: document.getElementById('btnRefillDemoData'),
      clientName: document.getElementById('clientName'),
      clientId: document.getElementById('clientId'),
      clientLicense: document.getElementById('clientLicense'),
      clientPhone: document.getElementById('clientPhone'),
      clientEmail: document.getElementById('clientEmail'),
      clientAddress: document.getElementById('clientAddress'),
      cardNumber: document.getElementById('cardNumber'),
      cardExpiry: document.getElementById('cardExpiry'),
      cardCVV: document.getElementById('cardCVV'),
      checkoutItemsCount: document.getElementById('checkoutItemsCount'),
      checkoutTotalAmount: document.getElementById('checkoutTotalAmount'),
      checkoutDocTypeBadge: document.getElementById('checkoutDocTypeBadge'),
      btnSubmitPayment: document.getElementById('btnSubmitPayment')
    };
  }

  // Event Listeners Registration
  function attachEventListeners() {
    // Search input
    dom.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim().toLowerCase();
      if (state.searchQuery.length > 0) {
        dom.btnClearSearch.classList.remove('d-none');
      } else {
        dom.btnClearSearch.classList.add('d-none');
      }
      renderCatalog();
    });

    dom.btnClearSearch.addEventListener('click', () => {
      dom.searchInput.value = '';
      state.searchQuery = '';
      dom.btnClearSearch.classList.add('d-none');
      renderCatalog();
    });

    // Category Tabs
    dom.catTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        dom.catTabs.forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        state.activeCategory = tab.getAttribute('data-category');
        updateBrandDropdown();
        renderCatalog();
      });
    });

    // Brand selector
    dom.brandSelect.addEventListener('change', (e) => {
      state.selectedBrand = e.target.value;
      renderCatalog();
    });

    // Sort selector
    dom.sortSelect.addEventListener('change', (e) => {
      state.currentSort = e.target.value;
      renderCatalog();
    });

    // Reset filters
    dom.btnResetFilters.addEventListener('click', resetFilters);
    dom.btnResetAll.addEventListener('click', resetFilters);

    // Quick VIP Demo Simulation button in Hero
    if (dom.btnQuickDemo) {
      dom.btnQuickDemo.addEventListener('click', populateVipDemoSimulation);
    }

    // Rental Modal Controls
    Array.from(dom.rentalModeRadios).forEach((radio) => {
      radio.addEventListener('change', () => {
        updateRentalModalCalculations();
      });
    });

    dom.rentalDurationInput.addEventListener('input', () => {
      let val = parseInt(dom.rentalDurationInput.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      dom.rentalDurationInput.value = val;
      updateRentalModalCalculations();
    });

    dom.btnDecDuration.addEventListener('click', () => {
      let val = parseInt(dom.rentalDurationInput.value, 10) || 1;
      if (val > 1) {
        dom.rentalDurationInput.value = val - 1;
        updateRentalModalCalculations();
      }
    });

    dom.btnIncDuration.addEventListener('click', () => {
      let val = parseInt(dom.rentalDurationInput.value, 10) || 1;
      dom.rentalDurationInput.value = val + 1;
      updateRentalModalCalculations();
    });

    dom.rentalStartDate.addEventListener('change', () => {
      updateRentalModalCalculations();
    });

    dom.btnConfirmAddToCartRental.addEventListener('click', confirmAddRentalToCart);

    // Cart Modal Controls
    dom.btnClearCart.addEventListener('click', () => {
      if (state.cart.length === 0) return;
      Swal.fire({
        title: '¿Vaciar Carrito?',
        text: 'Se eliminarán todas las compras y contratos de alquiler configurados.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#00d2ff',
        confirmButtonText: 'Sí, vaciar',
        cancelButtonText: 'Cancelar',
        background: '#0d1424',
        color: '#ffffff'
      }).then((result) => {
        if (result.isConfirmed) {
          state.cart = [];
          saveCartToStorage();
          updateCartBadge();
          renderCartModal();
          Swal.fire({
            title: 'Carrito Vaciado',
            text: 'Su carrito se encuentra libre de ítems.',
            icon: 'info',
            timer: 1500,
            showConfirmButton: false,
            background: '#0d1424',
            color: '#ffffff'
          });
        }
      });
    });

    dom.btnProceedToCheckout.addEventListener('click', () => {
      if (state.cart.length === 0) {
        Swal.fire({
          title: 'Carrito Vacío',
          text: 'Por favor, agregue al menos un vehículo para compra o alquiler antes de continuar.',
          icon: 'warning',
          confirmButtonColor: '#00d2ff',
          background: '#0d1424',
          color: '#ffffff'
        });
        return;
      }
      // Hide cart modal and open checkout
      const cartModal = bootstrap.Modal.getInstance(dom.cartModalEl);
      if (cartModal) cartModal.hide();

      setTimeout(() => {
        const checkoutModal = new bootstrap.Modal(dom.checkoutModalEl);
        checkoutModal.show();
        updateCheckoutSummary();
      }, 300);
    });

    // Checkout Demo Data Refill Button
    dom.btnRefillDemoData.addEventListener('click', () => {
      fillCheckoutDemoData();
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Datos VIP de prueba recargados con éxito',
        showConfirmButton: false,
        timer: 1800,
        background: '#0d1424',
        color: '#ffffff'
      });
    });

    // Card formatting input
    dom.cardNumber.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 16);
      e.target.value = v.replace(/(\d{4})(?=\d)/g, '$1 ');
    });

    dom.cardExpiry.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '').slice(0, 4);
      if (v.length >= 2) {
        e.target.value = v.slice(0, 2) + '/' + v.slice(2);
      } else {
        e.target.value = v;
      }
    });

    // Checkout Form Submission (PDF Generation)
    dom.checkoutForm.addEventListener('submit', handleCheckoutSubmit);
  }

  // Load Catalog Data (Async Fetch + Fallback)
  async function loadCatalogData() {
    try {
      const response = await fetch('vehiculo.json');
      if (!response.ok) throw new Error('Respuesta no satisfactoria del servidor');
      const data = await response.json();
      processCatalog(data);
    } catch (err) {
      console.warn('Fallo en fetch("vehiculo.json"), activando respaldo window.EMBEDDED_VEHICULOS:', err);
      if (window.EMBEDDED_VEHICULOS) {
        processCatalog(window.EMBEDDED_VEHICULOS);
      } else {
        showFatalError('No se pudo cargar el catálogo de vehículos desde el servidor local ni la memoria embebida.');
      }
    }
  }

  function processCatalog(data) {
    state.vehiculos = normalizeCatalogPaths(Array.isArray(data.vehiculos) ? data.vehiculos : []);
    state.motos = normalizeCatalogPaths(Array.isArray(data.motos) ? data.motos : []);

    // Combine into single catalog array
    state.catalog = [...state.vehiculos, ...state.motos];

    // Update Counts
    dom.badgeCountTodos.textContent = state.catalog.length;
    dom.badgeCountVehiculos.textContent = state.vehiculos.length;
    dom.badgeCountMotos.textContent = state.motos.length;

    updateBrandDropdown();
    renderCatalog();
  }

  // Update Brand Dropdown based on active category
  function updateBrandDropdown() {
    let list = state.catalog;
    if (state.activeCategory === 'vehiculos') list = state.vehiculos;
    if (state.activeCategory === 'motos') list = state.motos;

    const uniqueBrands = Array.from(new Set(list.map((item) => item.marca))).filter(Boolean).sort();
    let html = '<option value="todas">Todas las Marcas</option>';
    uniqueBrands.forEach((b) => {
      const selected = state.selectedBrand === b ? 'selected' : '';
      html += `<option value="${escapeHtml(b)}" ${selected}>${escapeHtml(b)}</option>`;
    });
    dom.brandSelect.innerHTML = html;
  }

  // Render Catalog Grid
  function renderCatalog() {
    let items = [...state.catalog];

    // Filter by Category
    if (state.activeCategory === 'vehiculos') {
      items = items.filter((item) => item.categoria === 'vehiculos');
      dom.catalogCategoryTitle.textContent = 'Vehículos & Superdeportivos';
      dom.activeFilterBadge.innerHTML = '<i class="fa-solid fa-car-rear me-1"></i> Vehículos de Lujo';
    } else if (state.activeCategory === 'motos') {
      items = items.filter((item) => item.categoria === 'motos');
      dom.catalogCategoryTitle.textContent = 'Motocicletas Premium & Hyperbikes';
      dom.activeFilterBadge.innerHTML = '<i class="fa-solid fa-motorcycle me-1"></i> Motos de Alta Gama';
    } else {
      dom.catalogCategoryTitle.textContent = 'Colección Completa';
      dom.activeFilterBadge.innerHTML = '<i class="fa-solid fa-layer-group me-1"></i> Todas las Categorías';
    }

    // Filter by Brand
    if (state.selectedBrand !== 'todas') {
      items = items.filter((item) => item.marca.toLowerCase() === state.selectedBrand.toLowerCase());
    }

    // Filter by Real-time Search Query
    if (state.searchQuery) {
      items = items.filter((item) => {
        const query = state.searchQuery;
        const marca = (item.marca || '').toLowerCase();
        const modelo = (item.modelo || '').toLowerCase();
        const tipo = (item.tipo || '').toLowerCase();
        const motor = (item.motor || '').toLowerCase();
        const caracteristicas = (item.caracteristicas || '').toLowerCase();
        const codigo = String(item.codigo || '');
        return (
          marca.includes(query) ||
          modelo.includes(query) ||
          tipo.includes(query) ||
          motor.includes(query) ||
          caracteristicas.includes(query) ||
          codigo.includes(query)
        );
      });
    }

    // Sort Items
    if (state.currentSort === 'price-asc') {
      items.sort((a, b) => (a.precio_venta || 0) - (b.precio_venta || 0));
    } else if (state.currentSort === 'price-desc') {
      items.sort((a, b) => (b.precio_venta || 0) - (a.precio_venta || 0));
    } else if (state.currentSort === 'rent-asc') {
      items.sort((a, b) => (a.precio_alquiler_dia || 0) - (b.precio_alquiler_dia || 0));
    } else if (state.currentSort === 'rent-desc') {
      items.sort((a, b) => (b.precio_alquiler_dia || 0) - (a.precio_alquiler_dia || 0));
    } else if (state.currentSort === 'brand-az') {
      items.sort((a, b) => (a.marca || '').localeCompare(b.marca || ''));
    }

    // Update count display
    dom.catalogResultsCount.textContent = `Mostrando ${items.length} de ${state.catalog.length} unidades disponibles`;

    // Render Cards or Empty State
    if (items.length === 0) {
      dom.catalogGrid.innerHTML = '';
      dom.emptyState.classList.remove('d-none');
      return;
    }

    dom.emptyState.classList.add('d-none');

    let gridHtml = '';
    items.forEach((item) => {
      gridHtml += createCardHtml(item);
    });

    dom.catalogGrid.innerHTML = gridHtml;

    // Attach card button events
    dom.catalogGrid.querySelectorAll('.btn-card-rent').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const code = parseInt(e.currentTarget.getAttribute('data-code'), 10);
        openRentalModal(code);
      });
    });

    dom.catalogGrid.querySelectorAll('.btn-card-buy').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const code = parseInt(e.currentTarget.getAttribute('data-code'), 10);
        addSaleToCart(code);
      });
    });
  }

  // Create HTML for a Single Card
  function createCardHtml(item) {
    const isMoto = item.categoria === 'motos';
    const doorsText = isMoto ? 'Biplaza' : `${item.numeroPuertas || 4} Puertas`;
    const doorsIcon = isMoto ? 'fa-user-group' : 'fa-door-closed';
    const logoSrc = resolveAssetPath(item.logo, '');
    const imageSrc = resolveAssetPath(item.imagen, '');

    return `
      <div class="col-12 col-md-6 col-lg-4 col-xl-3 animate-fade-in">
        <article class="catalog-card">
          <!-- Floating Offer Badge -->
          <div class="card-offer-badge" title="${escapeHtml(item.oferta_alquiler)}">
            ${escapeHtml(item.oferta_alquiler || '⭐ Tarifa VIP Especial')}
          </div>

          <!-- Card Header: Brand Logo & Identification Code -->
          <div class="card-top-info">
            <img src="${escapeHtml(logoSrc)}" alt="${escapeHtml(item.marca)}" class="card-brand-logo" loading="lazy" onerror="this.style.display='none'">
            <span class="card-id-badge">#LME-${item.codigo}</span>
          </div>

          <!-- Vehicle Image with Smooth Zoom on Hover -->
          <div class="card-img-box">
            <img src="${escapeHtml(imageSrc)}" alt="${escapeHtml(item.modelo)}" class="card-vehicle-img" loading="lazy">
          </div>

          <!-- Card Body -->
          <div class="card-body-content">
            <h4 class="card-vehicle-name" title="${escapeHtml(item.modelo)}">${escapeHtml(item.modelo)}</h4>
            <span class="card-vehicle-type">${escapeHtml(item.tipo || 'Superdeportivo')}</span>

            <!-- Specs Grid -->
            <div class="card-specs-grid">
              <div class="spec-item" title="Motor: ${escapeHtml(item.motor)}">
                <i class="fa-solid fa-gauge-high"></i> <span>${escapeHtml(item.motor || 'V8')}</span>
              </div>
              <div class="spec-item" title="Puertas: ${doorsText}">
                <i class="fa-solid ${doorsIcon}"></i> <span>${doorsText}</span>
              </div>
              <div class="spec-item" title="Combustible: ${escapeHtml(item.combustible)}">
                <i class="fa-solid fa-gas-pump"></i> <span>${escapeHtml(item.combustible || 'Gasolina Premium')}</span>
              </div>
              <div class="spec-item" title="Disponibles en Showroom: ${item.existencia}">
                <i class="fa-solid fa-warehouse"></i> <span>Stock: ${item.existencia} u.</span>
              </div>
            </div>

            <!-- Pricing Box -->
            <div class="card-prices-box">
              <div class="price-row-sale">
                <span class="price-label-sale">Precio de Venta:</span>
                <span class="price-val-sale">${formatUSD(item.precio_venta)}</span>
              </div>
              <div class="price-row-rental">
                <div>
                  <span class="text-light-silver">Renta / Día:</span>
                  <div class="rental-rate-day">${formatUSD(item.precio_alquiler_dia)}</div>
                </div>
                <div class="text-end">
                  <span class="text-light-silver">Renta / Hora:</span>
                  <div class="rental-rate-hour">${formatUSD(item.precio_alquiler_hora)}</div>
                </div>
              </div>
            </div>

            <!-- Balanced Action Buttons -->
            <div class="card-actions-row">
              <button class="btn btn-card-rent" data-code="${item.codigo}" title="Alquilar esta unidad">
                <i class="fa-solid fa-key me-1"></i> Alquilar
              </button>
              <button class="btn btn-card-buy" data-code="${item.codigo}" title="Comprar esta unidad">
                <i class="fa-solid fa-cart-shopping me-1"></i> Comprar
              </button>
            </div>
          </div>
        </article>
      </div>
    `;
  }

  // Open Rental Modal
  function openRentalModal(codigo) {
    const item = state.catalog.find((v) => v.codigo === codigo);
    if (!item) return;

    state.selectedRentalVehicle = item;

    // Fill UI
    dom.rentalCarLogo.src = resolveAssetPath(item.logo, '');
    dom.rentalCarCode.textContent = `#LME-${item.codigo}`;
    dom.rentalCarImg.src = resolveAssetPath(item.imagen, '');
    dom.rentalCarName.textContent = item.modelo;
    dom.rentalCarType.textContent = item.tipo;
    dom.rentalRateDay.textContent = `${formatUSD(item.precio_alquiler_dia)} / Día`;
    dom.rentalRateHour.textContent = `${formatUSD(item.precio_alquiler_hora)} / Hora`;

    // Defaults
    dom.modeDays.checked = true;
    dom.rentalDurationInput.value = 3;
    dom.rentalStartDate.value = '2026-10-27';

    updateRentalModalCalculations();

    const rentalModal = new bootstrap.Modal(dom.rentalModalEl);
    rentalModal.show();
  }

  // Update Rental Calculations in Real Time
  function updateRentalModalCalculations() {
    const item = state.selectedRentalVehicle;
    if (!item) return;

    const isDays = dom.modeDays.checked;
    const duration = parseInt(dom.rentalDurationInput.value, 10) || 1;
    const unitRate = isDays ? item.precio_alquiler_dia : item.precio_alquiler_hora;
    const subtotal = unitRate * duration;
    const deposit = 500; // Depósito de Garantía Reembolsable obligatorio
    const totalEstimated = subtotal + deposit;

    dom.lblDurationUnit.textContent = isDays ? 'Cantidad de Día(s):' : 'Cantidad de Hora(s):';
    dom.calcUnitRate.textContent = `${formatUSD(unitRate)} por ${isDays ? 'Día (24h)' : 'Hora'}`;
    dom.calcDuration.textContent = `${duration} ${isDays ? 'Día(s)' : 'Hora(s)'}`;
    dom.calcSubtotal.textContent = formatUSD(subtotal);
    dom.calcTotalEstimated.textContent = formatUSD(totalEstimated);
  }

  // Add Rental to Cart
  function confirmAddRentalToCart() {
    const item = state.selectedRentalVehicle;
    if (!item) return;

    const isDays = dom.modeDays.checked;
    const duration = parseInt(dom.rentalDurationInput.value, 10) || 1;
    const startDate = dom.rentalStartDate.value || '2026-10-27';
    const unitRate = isDays ? item.precio_alquiler_dia : item.precio_alquiler_hora;
    const subtotal = unitRate * duration;

    const cartItem = {
      cartId: 'rent_' + item.codigo + '_' + Date.now(),
      type: 'rental',
      codigo: item.codigo,
      marca: item.marca,
      modelo: item.modelo,
      imagen: resolveAssetPath(item.imagen, ''),
      tipo: item.tipo,
      modalidad: isDays ? 'Día(s)' : 'Hora(s)',
      duracion: duration,
      fechaInicio: startDate,
      precioUnitario: unitRate,
      cantidad: 1,
      subtotal: subtotal,
      fianza: 500 // Fianza fija por contrato
    };

    state.cart.push(cartItem);
    saveCartToStorage();
    updateCartBadge();

    // Close rental modal
    const rentalModal = bootstrap.Modal.getInstance(dom.rentalModalEl);
    if (rentalModal) rentalModal.hide();

    // Notify with SweetAlert2
    Swal.fire({
      title: '¡Contrato de Alquiler Agregado!',
      html: `Se agregó <strong>${escapeHtml(item.modelo)}</strong> en modalidad de <strong>${duration} ${cartItem.modalidad}</strong> desde el <strong>${startDate}</strong> al carrito de compras.<br><strong>Fianza reembolsable:</strong> ${formatUSD(500)}`,
      icon: 'success',
      confirmButtonColor: '#ff9800',
      confirmButtonText: 'Ver Carrito 🛒',
      showCancelButton: true,
      cancelButtonColor: '#00d2ff',
      cancelButtonText: 'Continuar Navegando',
      background: '#0d1424',
      color: '#ffffff'
    }).then((res) => {
      if (res.isConfirmed) {
        openCartModal();
      }
    });
  }

  // Add Sale to Cart
  function addSaleToCart(codigo) {
    const item = state.catalog.find((v) => v.codigo === codigo);
    if (!item) return;

    // Check if already in cart as sale
    const existingIndex = state.cart.findIndex((c) => c.type === 'sale' && c.codigo === codigo);
    if (existingIndex >= 0) {
      if (state.cart[existingIndex].cantidad >= item.existencia) {
        Swal.fire({
          title: 'Stock Límite Alcanzado',
          text: `No hay más de ${item.existencia} unidades físicas disponibles en showroom para este modelo.`,
          icon: 'warning',
          confirmButtonColor: '#00d2ff',
          background: '#0d1424',
          color: '#ffffff'
        });
        return;
      }
      state.cart[existingIndex].cantidad += 1;
      state.cart[existingIndex].subtotal = state.cart[existingIndex].cantidad * item.precio_venta;
    } else {
      const cartItem = {
        cartId: 'sale_' + item.codigo + '_' + Date.now(),
        type: 'sale',
        codigo: item.codigo,
        marca: item.marca,
        modelo: item.modelo,
        imagen: resolveAssetPath(item.imagen, ''),
        tipo: item.tipo,
        modalidad: 'Venta Definitiva',
        duracion: null,
        fechaInicio: null,
        precioUnitario: item.precio_venta,
        cantidad: 1,
        subtotal: item.precio_venta,
        fianza: 0
      };
      state.cart.push(cartItem);
    }

    saveCartToStorage();
    updateCartBadge();

    Swal.fire({
      title: '¡Vehículo Agregado al Carrito!',
      html: `<strong>${escapeHtml(item.modelo)}</strong> ha sido agregado para adquisición definitiva.`,
      icon: 'success',
      confirmButtonColor: '#00d2ff',
      confirmButtonText: 'Ver Carrito 🛒',
      showCancelButton: true,
      cancelButtonColor: '#ff9800',
      cancelButtonText: 'Seguir Comprando',
      background: '#0d1424',
      color: '#ffffff'
    }).then((res) => {
      if (res.isConfirmed) {
        openCartModal();
      }
    });
  }

  // Cart Modal & Financial Calculations
  function openCartModal() {
    renderCartModal();
    const cartModal = new bootstrap.Modal(dom.cartModalEl);
    cartModal.show();
  }

  function renderCartModal() {
    if (state.cart.length === 0) {
      dom.cartItemsList.innerHTML = `
        <div class="text-center py-5">
          <i class="fa-solid fa-cart-plus text-secondary mb-3" style="font-size: 3.5rem;"></i>
          <h4 class="text-white fw-bold">Su carrito se encuentra actualmente vacío</h4>
          <p class="text-light-silver">Explore el catálogo para adquirir o alquilar superdeportivos y motocicletas premium.</p>
        </div>
      `;
      dom.cartSummarySubtotal.textContent = '$0.00 USD';
      dom.cartSummaryTax.textContent = '$0.00 USD';
      dom.cartSummaryDeposit.textContent = '$0.00 USD';
      dom.cartSummaryTotal.textContent = '$0.00 USD';
      return;
    }

    let itemsHtml = '';
    let subtotalOperations = 0;
    let totalDeposits = 0;

    state.cart.forEach((item, idx) => {
      subtotalOperations += item.subtotal;
      totalDeposits += (item.fianza || 0);

      const isRental = item.type === 'rental';
      const typeBadge = isRental
        ? `<span class="badge bg-orange-subtle text-orange border border-warning"><i class="fa-solid fa-key me-1"></i> ALQUILER</span>`
        : `<span class="badge bg-cyan-subtle text-cyan border border-info"><i class="fa-solid fa-shield me-1"></i> VENTA DEFINITIVA</span>`;

      const detailText = isRental
        ? `Alquiler: ${item.duracion} ${item.modalidad} (Desde ${item.fechaInicio})`
        : `Adquisición Vehicular Definitiva (Garantía 3 Años)`;

      const qtyControls = isRental
        ? `<span class="badge bg-dark-subtle border border-secondary text-white py-2 px-3 fw-bold">1 Unidad</span>`
        : `
          <div class="input-group input-group-sm" style="width: 105px;">
            <button class="btn btn-dark border-secondary text-white btn-cart-dec" data-idx="${idx}">-</button>
            <input type="text" class="form-control bg-dark border-secondary text-white text-center fw-bold" value="${item.cantidad}" readonly>
            <button class="btn btn-dark border-secondary text-white btn-cart-inc" data-idx="${idx}">+</button>
          </div>
        `;

      itemsHtml += `
        <div class="cart-item-row d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div class="d-flex align-items-center gap-3">
            <img src="${escapeHtml(resolveAssetPath(item.imagen, ''))}" alt="${escapeHtml(item.modelo)}" class="cart-item-thumb">
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <h6 class="text-white fw-bold mb-0">${escapeHtml(item.modelo)}</h6>
                ${typeBadge}
              </div>
              <small class="text-light-silver d-block">${detailText}</small>
              <small class="text-cyan">Precio Unitario: ${formatUSD(item.precioUnitario)}</small>
            </div>
          </div>

          <div class="d-flex align-items-center gap-4">
            <div>${qtyControls}</div>
            <div class="text-end" style="min-width: 110px;">
              <small class="text-light-silver d-block">Subtotal:</small>
              <strong class="text-gold fs-5">${formatUSD(item.subtotal)}</strong>
            </div>
            <button class="btn btn-outline-danger btn-sm border-0 btn-cart-remove" data-idx="${idx}" title="Eliminar ítem">
              <i class="fa-solid fa-trash-can fs-5"></i>
            </button>
          </div>
        </div>
      `;
    });

    dom.cartItemsList.innerHTML = itemsHtml;

    // Attach cart item events
    dom.cartItemsList.querySelectorAll('.btn-cart-remove').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        state.cart.splice(idx, 1);
        saveCartToStorage();
        updateCartBadge();
        renderCartModal();
      });
    });

    dom.cartItemsList.querySelectorAll('.btn-cart-dec').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        if (state.cart[idx].cantidad > 1) {
          state.cart[idx].cantidad -= 1;
          state.cart[idx].subtotal = state.cart[idx].cantidad * state.cart[idx].precioUnitario;
        } else {
          state.cart.splice(idx, 1);
        }
        saveCartToStorage();
        updateCartBadge();
        renderCartModal();
      });
    });

    dom.cartItemsList.querySelectorAll('.btn-cart-inc').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        state.cart[idx].cantidad += 1;
        state.cart[idx].subtotal = state.cart[idx].cantidad * state.cart[idx].precioUnitario;
        saveCartToStorage();
        updateCartBadge();
        renderCartModal();
      });
    });

    // Update Financial Summary
    const tax = subtotalOperations * 0.18; // ITBIS 18%
    const grandTotal = subtotalOperations + tax + totalDeposits;

    dom.cartSummarySubtotal.textContent = formatUSD(subtotalOperations);
    dom.cartSummaryTax.textContent = formatUSD(tax);
    dom.cartSummaryDeposit.textContent = formatUSD(totalDeposits);
    dom.cartSummaryTotal.textContent = formatUSD(grandTotal);
  }

  // Update Checkout Summary & Pre-filled Defaults
  function updateCheckoutSummary() {
    fillCheckoutDemoData();

    let subtotalOperations = 0;
    let totalDeposits = 0;
    let hasSales = false;
    let hasRentals = false;
    let totalQty = 0;

    state.cart.forEach((item) => {
      subtotalOperations += item.subtotal;
      totalDeposits += (item.fianza || 0);
      totalQty += item.cantidad;
      if (item.type === 'sale') hasSales = true;
      if (item.type === 'rental') hasRentals = true;
    });

    const tax = subtotalOperations * 0.18;
    const grandTotal = subtotalOperations + tax + totalDeposits;

    dom.checkoutItemsCount.textContent = `${totalQty} Ítem(s) en orden`;
    dom.checkoutTotalAmount.textContent = formatUSD(grandTotal);

    if (hasSales && hasRentals) {
      dom.checkoutDocTypeBadge.textContent = 'FACTURA DE VENTA Y CONTRATO DE ALQUILER';
      dom.checkoutDocTypeBadge.className = 'badge bg-warning text-dark fw-bold';
    } else if (hasRentals) {
      dom.checkoutDocTypeBadge.textContent = 'CONTRATO DE ALQUILER Y ACUERDO DE RESPONSABILIDAD';
      dom.checkoutDocTypeBadge.className = 'badge bg-info text-dark fw-bold';
    } else {
      dom.checkoutDocTypeBadge.textContent = 'FACTURA DE VENTA';
      dom.checkoutDocTypeBadge.className = 'badge bg-success text-white fw-bold';
    }
  }

  // Pre-fill Checkout fields with Mandatory Default Values
  function fillCheckoutDemoData() {
    dom.clientName.value = DEFAULT_CLIENT_DATA.name;
    dom.clientId.value = DEFAULT_CLIENT_DATA.id;
    dom.clientLicense.value = DEFAULT_CLIENT_DATA.license;
    dom.clientPhone.value = DEFAULT_CLIENT_DATA.phone;
    dom.clientEmail.value = DEFAULT_CLIENT_DATA.email;
    dom.clientAddress.value = DEFAULT_CLIENT_DATA.address;
    dom.cardNumber.value = DEFAULT_CLIENT_DATA.cardNumber;
    dom.cardExpiry.value = DEFAULT_CLIENT_DATA.expiry;
    dom.cardCVV.value = DEFAULT_CLIENT_DATA.cvv;
  }

  // Quick VIP Demo Simulation (Populate cart with realistic sample)
  function populateVipDemoSimulation() {
    if (state.catalog.length === 0) return;

    const ferrariOrLambo = state.catalog.find(v => (v.marca.includes('Ferrari') || v.marca.includes('Lamborghini') || v.marca.includes('Porsche'))) || state.catalog[2];
    const luxurySedan = state.catalog.find(v => (v.marca.includes('Rolls-Royce') || v.marca.includes('Mercedes') || v.marca.includes('BMW'))) || state.catalog[0];

    state.cart = [
      {
        cartId: 'demo_sale_' + Date.now(),
        type: 'sale',
        codigo: ferrariOrLambo.codigo,
        marca: ferrariOrLambo.marca,
        modelo: ferrariOrLambo.modelo,
        imagen: resolveAssetPath(ferrariOrLambo.imagen, ''),
        tipo: ferrariOrLambo.tipo,
        modalidad: 'Venta Definitiva',
        duracion: null,
        fechaInicio: null,
        precioUnitario: ferrariOrLambo.precio_venta,
        cantidad: 1,
        subtotal: ferrariOrLambo.precio_venta,
        fianza: 0
      },
      {
        cartId: 'demo_rent_' + Date.now(),
        type: 'rental',
        codigo: luxurySedan.codigo,
        marca: luxurySedan.marca,
        modelo: luxurySedan.modelo,
        imagen: resolveAssetPath(luxurySedan.imagen, ''),
        tipo: luxurySedan.tipo,
        modalidad: 'Día(s)',
        duracion: 3,
        fechaInicio: '2026-10-27',
        precioUnitario: luxurySedan.precio_alquiler_dia,
        cantidad: 1,
        subtotal: luxurySedan.precio_alquiler_dia * 3,
        fianza: 500
      }
    ];

    saveCartToStorage();
    updateCartBadge();

    Swal.fire({
      title: '⚡ Simulación VIP Cargada',
      html: `Se han precargado 2 operaciones VIP en su carrito:<br>
        1. <strong>${escapeHtml(ferrariOrLambo.modelo)}</strong> (Venta Definitiva)<br>
        2. <strong>${escapeHtml(luxurySedan.modelo)}</strong> (Alquiler 3 Días desde 2026-10-27)`,
      icon: 'success',
      confirmButtonColor: '#ff9800',
      confirmButtonText: 'Abrir Carrito / Checkout 💳',
      background: '#0d1424',
      color: '#ffffff'
    }).then((res) => {
      if (res.isConfirmed) {
        openCartModal();
      }
    });
  }

  // ========================================================================================================================
  // 7. ARQUITECTURA INFALIBLE PARA GENERACIÓN DE PDF (ANTI-PÁGINA EN BLANCO LME-XXXXXX)
  // ========================================================================================================================
  async function handleCheckoutSubmit(e) {
    e.preventDefault();

    if (state.cart.length === 0) {
      Swal.fire({
        title: 'Carrito Vacío',
        text: 'No hay elementos para procesar la transacción.',
        icon: 'error',
        confirmButtonColor: '#00d2ff',
        background: '#0d1424',
        color: '#ffffff'
      });
      return;
    }

    // Form values
    const clientName = dom.clientName.value.trim() || DEFAULT_CLIENT_DATA.name;
    const clientId = dom.clientId.value.trim() || DEFAULT_CLIENT_DATA.id;
    const clientLicense = dom.clientLicense.value.trim() || DEFAULT_CLIENT_DATA.license;
    const clientPhone = dom.clientPhone.value.trim() || DEFAULT_CLIENT_DATA.phone;
    const clientEmail = dom.clientEmail.value.trim() || DEFAULT_CLIENT_DATA.email;
    const clientAddress = dom.clientAddress.value.trim() || DEFAULT_CLIENT_DATA.address;
    const cardNumber = dom.cardNumber.value.trim() || DEFAULT_CLIENT_DATA.cardNumber;

    // Determine Cart Type
    let hasSales = false;
    let hasRentals = false;
    state.cart.forEach((item) => {
      if (item.type === 'sale') hasSales = true;
      if (item.type === 'rental') hasRentals = true;
    });

    // Generate Random Document ID: LME-XXXXXX (6 digits)
    const docNumber = Math.floor(100000 + Math.random() * 900000);
    const docCode = `LME-${docNumber}`;

    let docTitle = 'FACTURA DE VENTA';
    let filename = `factura_de_venta_${docCode}.pdf`;

    if (hasSales && hasRentals) {
      docTitle = 'FACTURA DE VENTA Y CONTRATO DE ALQUILER';
      filename = `factura_de_venta_y_contrato_de_alquiler_${docCode}.pdf`;
    } else if (hasRentals) {
      docTitle = 'CONTRATO DE ALQUILER Y ACUERDO DE RESPONSABILIDAD';
      filename = `contrato_de_alquiler_y_acuerdo_de_responsabilidad_${docCode}.pdf`;
    }

    // 1. Programmatically close Bootstrap modal to prevent screen freeze
    const checkoutModal = bootstrap.Modal.getInstance(dom.checkoutModalEl);
    if (checkoutModal) checkoutModal.hide();

    // 2. Clear any orphaned backdrop and unlock body scroll
    document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove());
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('padding-right');
    document.body.style.removeProperty('overflow');

    // 3. Show high-end SweetAlert2 Loading dialog with glowing feedback
    Swal.fire({
      title: 'Generando Documento Oficial',
      html: `
        <div class="py-3 text-center">
          <div class="spinner-border text-cyan mb-3" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Generando...</span>
          </div>
          <h5 class="text-white fw-bold mb-1">Generando ${escapeHtml(docTitle)}...</h5>
          <p class="text-light-silver small mb-0">Optimizando imágenes en alta resolución y sellando firmas legales LME.</p>
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
      background: '#0d1424',
      color: '#ffffff'
    });

    // Format Date & Time
    const now = new Date();
    const formattedDate = now.toLocaleDateString('es-DO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }) + ' ' + now.toLocaleTimeString('es-DO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Resolve Logo Base64 from window.PDF_THUMBNAILS
    let logoDataUri = 'logo_pagina.png';
    if (window.PDF_THUMBNAILS) {
      logoDataUri = window.PDF_THUMBNAILS['logo_pagina.png'] || window.PDF_THUMBNAILS['assets/logo_pagina.png'] || logoDataUri;
    }

    // Build Items Table Rows
    let rowsHtml = '';
    let subtotalOperations = 0;
    let totalDeposits = 0;

    state.cart.forEach((item, index) => {
      subtotalOperations += item.subtotal;
      totalDeposits += (item.fianza || 0);

      // Resolve Vehicle Thumbnail from Base64 Data URI
      let thumbDataUri = resolveAssetPath(item.imagen, '');
      if (window.PDF_THUMBNAILS) {
        thumbDataUri = window.PDF_THUMBNAILS[resolveAssetPath(item.imagen, '')] || window.PDF_THUMBNAILS[item.imagen] || window.PDF_THUMBNAILS['assets/' + resolveAssetPath(item.imagen, '')] || thumbDataUri;
      }

      const isRental = item.type === 'rental';
      const badgeHtml = isRental
        ? `<span style="background: #e1f5fe; color: #0277bd !important; border: 1px solid #b3e5fc; padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: bold; text-transform: uppercase;">ALQUILER</span>`
        : `<span style="background: #e8f5e9; color: #2e7d32 !important; border: 1px solid #c8e6c9; padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: bold; text-transform: uppercase;">VENTA</span>`;

      const detailDesc = isRental
        ? `Alquiler: ${item.duracion} ${item.modalidad} (Desde ${item.fechaInicio})`
        : `Adquisición Vehicular Definitiva`;

      rowsHtml += `
        <tr style="border-bottom: 1px solid #e9ecef;">
          <td style="padding: 6px 4px; text-align: center; color: #333333 !important; font-size: 9px; vertical-align: middle;">${index + 1}</td>
          <td style="padding: 6px 4px; text-align: center; vertical-align: middle;">
            <img src="${thumbDataUri}" alt="${escapeHtml(item.modelo)}" style="width: 55px; height: 38px; object-fit: contain; border-radius: 3px; border: 1px solid #ddd; background: #fafafa;">
          </td>
          <td style="padding: 6px 6px; color: #111111 !important; font-size: 9.5px; font-weight: bold; vertical-align: middle;">
            ${escapeHtml(item.marca)} ${escapeHtml(item.modelo)}<br>
            <span style="font-size: 8px; color: #777777 !important; font-weight: normal;">Cód: #LME-${item.codigo} &bull; ${escapeHtml(item.tipo || '')}</span>
          </td>
          <td style="padding: 6px 4px; text-align: center; vertical-align: middle;">${badgeHtml}</td>
          <td style="padding: 6px 6px; color: #444444 !important; font-size: 8.5px; vertical-align: middle;">${detailDesc}</td>
          <td style="padding: 6px 6px; text-align: right; color: #333333 !important; font-size: 9.5px; vertical-align: middle;">${formatUSD(item.precioUnitario)}</td>
          <td style="padding: 6px 4px; text-align: center; color: #333333 !important; font-size: 9px; vertical-align: middle;">${item.cantidad}</td>
          <td style="padding: 6px 6px; text-align: right; color: #111111 !important; font-size: 9.5px; font-weight: bold; vertical-align: middle;">${formatUSD(item.subtotal)}</td>
        </tr>
      `;
    });

    const taxAmount = subtotalOperations * 0.18; // ITBIS 18%
    const grandTotal = subtotalOperations + taxAmount + totalDeposits;

    // Masked Card for receipt
    const cleanCard = cardNumber.replace(/\s+/g, '');
    const maskedCard = '•••• •••• •••• ' + (cleanCard.length >= 4 ? cleanCard.slice(-4) : '8899');

    // Clauses and Legal Signatures Block (Section 7.D.5)
    let clausesAndSignaturesHtml = '';

    if (hasRentals) {
      clausesAndSignaturesHtml = `
        <div style="margin-top: 15px; padding: 10px 14px; background: #fafafa !important; border: 1px solid #e5e5e5; border-radius: 6px; font-size: 9.5px; color: #333333 !important; line-height: 1.5;">
          <h5 style="margin: 0 0 6px 0; font-size: 10.5px; font-weight: bold; color: #111111 !important; text-transform: uppercase;">
            Acuerdo de Responsabilidad y Términos de Alquiler:
          </h5>
          <p style="margin: 0 0 4px 0; color: #333333 !important;"><strong style="color: #111111 !important;">1. Custodia del Bien:</strong> El arrendatario se compromete a operar la unidad con la debida prudencia y a mantenerla en perfecto estado durante la vigencia del contrato.</p>
          <p style="margin: 0 0 4px 0; color: #333333 !important;"><strong style="color: #111111 !important;">2. Cobertura & Deducible:</strong> La unidad cuenta con póliza de seguro completa con deducible del 10% conforme a la política corporativa de alquiler.</p>
          <p style="margin: 0 0 4px 0; color: #333333 !important;"><strong style="color: #111111 !important;">3. Política de Combustible:</strong> La unidad se entrega con tanque lleno y debe devolverse con el mismo nivel de combustible, en caso contrario se aplicará cargo adicional.</p>
        </div>

        <table style="width: 100%; margin-top: 30px; font-size: 10px; text-align: center;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width: 45%; vertical-align: top;">
              <div style="border-top: 1px solid #333; padding-top: 6px; margin: 0 20px;">
                <strong style="color: #111111 !important;">LUXURY MOTORS ELITE CORP.</strong><br>
                <span style="font-size: 9px; color: #555555 !important;">Firma Autorizada / Departamento Comercial</span>
              </div>
            </td>
            <td style="width: 10%;"></td>
            <td style="width: 45%; vertical-align: top;">
              <div style="border-top: 1px solid #333; padding-top: 6px; margin: 0 20px;">
                <strong style="color: #111111 !important;">${escapeHtml(clientName)}</strong><br>
                <span style="font-size: 9px; color: #555555 !important;">Doc ID: ${escapeHtml(clientId)} (Cliente / Arrendatario)</span>
              </div>
            </td>
          </tr>
        </table>
      `;
    } else {
      clausesAndSignaturesHtml = `
        <div style="margin-top: 20px; padding: 10px; background: #fdfdfd; border-left: 3px solid #2e7d32; font-size: 9.5px; color: #444;">
          <strong>Garantía de Satisfacción:</strong> Unidad vendida con garantía certificada de 3 años o 60,000 km, traspaso legal garantizado y asistencia vial 24/7 de cortesía durante la primera entrega.
        </div>
      `;
    }

    // Deposit row in financial totals if applicable
    const depositRowHtml = totalDeposits > 0
      ? `<tr>
          <td style="padding: 2px 0; color: #555555 !important; font-size: 9px;">Depósito de Fianza Reembolsable:</td>
          <td style="padding: 2px 0; text-align: right; color: #e65100 !important; font-weight: bold; font-size: 9.5px;">+${formatUSD(totalDeposits)}</td>
        </tr>`
      : '';

    // COMPLETE DOCUMENT TEMPLATE (Pure White #ffffff Background, Zero Invisible Text)
    const pdfHtmlContent = `
      <div class="pdf-doc-root" style="background-color: #ffffff !important; color: #333333 !important; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px 24px; box-sizing: border-box;">
        <div style="text-align: center; margin-bottom: 12px; border-bottom: 2px solid #111111; padding-bottom: 10px;">
          <img src="${logoDataUri}" alt="Luxury Motors Elite Corp." style="max-height: 52px; width: auto; margin-bottom: 4px; display: inline-block;">
          <h2 style="margin: 0; font-size: 18px; font-weight: bold; color: #111111 !important; letter-spacing: 1.5px; text-transform: uppercase;">
            LUXURY MOTORS ELITE CORP.
          </h2>
          <p style="margin: 3px 0 8px 0; font-size: 8.5px; color: #555555 !important;">
            Av. Anacaona #105, Torre Empresarial Elite, Piso 14 | Tel: +1 (809) 555-ELITE | info@luxurymotors.com
          </p>
          <div style="display: inline-block; background: #111111; color: #ffffff !important; font-size: 11px; font-weight: bold; padding: 4px 18px; border-radius: 4px; letter-spacing: 1px; text-transform: uppercase;">
            ${docTitle}
          </div>
        </div>

        <table style="width: 100%; margin-bottom: 14px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; padding: 8px 12px; font-size: 9px;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width: 52%; vertical-align: top; padding-right: 10px;">
              <strong style="color: #111111 !important; font-size: 9.5px; text-transform: uppercase; display: block; margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">
                DATOS DEL CLIENTE:
              </strong>
              <div style="color: #333333 !important; line-height: 1.4;">
                <strong>Titular:</strong> ${escapeHtml(clientName)}<br>
                <strong>Documento / Cédula:</strong> ${escapeHtml(clientId)}<br>
                <strong>Licencia VIP:</strong> ${escapeHtml(clientLicense)}<br>
                <strong>Teléfono:</strong> ${escapeHtml(clientPhone)}<br>
                <strong>Email:</strong> ${escapeHtml(clientEmail)}<br>
                <strong>Dirección:</strong> ${escapeHtml(clientAddress)}
              </div>
            </td>
            <td style="width: 48%; vertical-align: top; padding-left: 10px; border-left: 1px solid #e9ecef;">
              <strong style="color: #111111 !important; font-size: 9.5px; text-transform: uppercase; display: block; margin-bottom: 4px; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">
                DETALLES DE LA TRANSACCIÓN:
              </strong>
              <div style="color: #333333 !important; line-height: 1.4;">
                <strong>No. Documento:</strong> <span style="color: #0277bd !important; font-weight: bold;">${docCode}</span><br>
                <strong>Fecha & Hora:</strong> ${formattedDate}<br>
                <strong>Método de Pago:</strong> Tarjeta Crédito Blindada (${maskedCard})<br>
                <strong>Estado:</strong> <span style="color: #2e7d32 !important; font-weight: bold;">Procesado & Confirmado</span><br>
                <strong>Agente Emisor:</strong> Sistema Automatizado JPV Pro &bull; V5.2<br>
                <strong>Sucursal:</strong> Santo Domingo D.N. (Torre Bella Vista)
              </div>
            </td>
          </tr>
        </table>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 14px;" cellpadding="0" cellspacing="0">
          <thead>
            <tr style="background: #111111; color: #ffffff !important; font-size: 9px; text-transform: uppercase;">
              <th style="padding: 6px 4px; text-align: center; width: 4%; color: #ffffff !important;">#</th>
              <th style="padding: 6px 4px; text-align: center; width: 12%; color: #ffffff !important;">Foto</th>
              <th style="padding: 6px 6px; text-align: left; width: 28%; color: #ffffff !important;">Vehículo / Modelo</th>
              <th style="padding: 6px 4px; text-align: center; width: 11%; color: #ffffff !important;">Tipo</th>
              <th style="padding: 6px 6px; text-align: left; width: 21%; color: #ffffff !important;">Detalle</th>
              <th style="padding: 6px 6px; text-align: right; width: 10%; color: #ffffff !important;">Precio</th>
              <th style="padding: 6px 4px; text-align: center; width: 4%; color: #ffffff !important;">Cant.</th>
              <th style="padding: 6px 6px; text-align: right; width: 10%; color: #ffffff !important;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <table style="width: 100%; margin-top: 6px; margin-bottom: 10px;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width: 58%; vertical-align: top; padding-right: 15px;">
              <p style="margin: 0; color: #777777 !important; font-size: 8.5px; line-height: 1.4;">
                * Este documento constituye una certificación legal y comercial de los servicios y compras pactadas con Luxury Motors Elite Corp. Todo vehículo cuenta con inspección técnica, documentación oficial y entrega según las condiciones establecidas por el concesionario.
              </p>
            </td>
            <td style="width: 42%; vertical-align: top;">
              <table style="width: 100%; font-size: 9.5px;" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 2px 0; color: #555555 !important;">Subtotal Operaciones:</td>
                  <td style="padding: 2px 0; text-align: right; color: #111111 !important; font-weight: bold;">${formatUSD(subtotalOperations)}</td>
                </tr>
                <tr>
                  <td style="padding: 2px 0; color: #555555 !important;">Impuestos & Tasas (ITBIS 18%):</td>
                  <td style="padding: 2px 0; text-align: right; color: #111111 !important; font-weight: bold;">${formatUSD(taxAmount)}</td>
                </tr>
                ${depositRowHtml}
                <tr>
                  <td style="padding: 6px 0 2px; border-top: 2px solid #111111; color: #111111 !important; font-size: 12px; font-weight: 800; text-transform: uppercase;">TOTAL GENERAL:</td>
                  <td style="padding: 6px 0 2px; border-top: 2px solid #111111; text-align: right; color: #111111 !important; font-size: 13px; font-weight: 900;">${formatUSD(grandTotal)}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        ${clausesAndSignaturesHtml}

        <div style="margin-top: 20px; border-top: 1px dashed #ccc; padding-top: 8px; text-align: center; font-size: 8.5px; color: #888888 !important;">
          Documento generado automáticamente por el Sistema E-Commerce & Alquiler de Vehículos Premium | Arquitectura por Ing. Wisler M. Espinales
        </div>
      </div>
    `;

    const printContainer = document.createElement('div');
    printContainer.id = 'luxury-pdf-export-container';
    printContainer.style.width = '794px';
    printContainer.style.background = '#ffffff';
    printContainer.style.margin = '0 auto';
    printContainer.style.padding = '0';
    printContainer.style.boxSizing = 'border-box';
    printContainer.innerHTML = pdfHtmlContent;

    document.body.appendChild(printContainer);

    try {
      const imgs = Array.from(printContainer.querySelectorAll('img'));
      await Promise.all(imgs.map((img) => {
        if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));

      await new Promise((r) => setTimeout(r, 250));

      const opt = {
        margin: [6, 6, 6, 6],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          scrollY: 0,
          scrollX: 0,
          useCORS: true,
          logging: false,
          windowWidth: 800
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(printContainer).save();

      if (printContainer.parentNode) {
        printContainer.parentNode.removeChild(printContainer);
      }

      Swal.close();

      state.cart = [];
      saveCartToStorage();
      updateCartBadge();
      renderCartModal();

      Swal.fire({
        title: '¡Documento Oficial Descargado!',
        html: `
          <div class="text-start p-2">
            <p>Su transacción <strong>#${docCode}</strong> ha sido procesada con éxito y el documento PDF oficial ha sido generado con todas las imágenes, firmas legales y desglose fiscal.</p>
            <div class="p-3 bg-dark-subtle border border-cyan rounded-3 mb-2">
              <span class="text-cyan d-block"><strong>Archivo:</strong> ${filename}</span>
              <span class="text-white d-block"><strong>Titular:</strong> ${escapeHtml(clientName)}</span>
              <span class="text-gold d-block"><strong>Monto Total Liquidado:</strong> ${formatUSD(grandTotal)}</span>
            </div>
            <small class="text-light-silver">Revise su carpeta de Descargas del sistema para acceder al archivo PDF oficial.</small>
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#00d2ff',
        confirmButtonText: 'Aceptar & Finalizar',
        background: '#0d1424',
        color: '#ffffff'
      });

    } catch (err) {
      console.error('Error generando PDF:', err);

      if (printContainer.parentNode) {
        printContainer.parentNode.removeChild(printContainer);
      }

      Swal.close();

      Swal.fire({
        title: 'Error de Generación',
        text: 'Ocurrió un incidente al exportar el documento PDF. Por favor intente de nuevo.',
        icon: 'error',
        confirmButtonColor: '#ff9800',
        background: '#0d1424',
        color: '#ffffff'
      });
    }
  }

  // Cart Persistence
  function saveCartToStorage() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  function loadCartFromStorage() {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        state.cart = JSON.parse(saved);
        updateCartBadge();
      }
    } catch (e) {
      console.warn('Error reading cart from localStorage:', e);
      state.cart = [];
    }
  }

  function updateCartBadge() {
    const totalCount = state.cart.reduce((acc, item) => acc + (item.cantidad || 1), 0);
    dom.navCartBadge.textContent = totalCount;
    dom.floatingCartBadge.textContent = totalCount;

    if (totalCount > 0) {
      dom.navCartBadge.classList.add('animate-pulse');
      dom.floatingCartBadge.classList.add('animate-pulse');
    } else {
      dom.navCartBadge.classList.remove('animate-pulse');
      dom.floatingCartBadge.classList.remove('animate-pulse');
    }
  }

  function resetFilters() {
    state.selectedBrand = 'todas';
    state.currentSort = 'default';
    state.searchQuery = '';
    state.activeCategory = 'todos';

    dom.searchInput.value = '';
    dom.btnClearSearch.classList.add('d-none');
    dom.brandSelect.value = 'todas';
    dom.sortSelect.value = 'default';

    dom.catTabs.forEach((tab) => {
      if (tab.getAttribute('data-category') === 'todos') {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    updateBrandDropdown();
    renderCatalog();
  }

  function showFatalError(msg) {
    if (dom.catalogGrid) {
      dom.catalogGrid.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="fa-solid fa-triangle-exclamation text-danger fs-1 mb-3"></i>
          <h4 class="text-white fw-bold">Error de Inicialización</h4>
          <p class="text-light-silver">${escapeHtml(msg)}</p>
        </div>
      `;
    }
  }

  // Expose helpful methods on window.LuxuryApp for debugging or inline handlers
  window.LuxuryApp = {
    state,
    resetFilters,
    populateVipDemoSimulation,
    openCartModal
  };

})();
