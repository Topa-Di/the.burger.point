/* ============================================================
   THE BURGER POINT — script.js
   Navegación entre pantallas con historial real (la flechita y
   el botón "atrás" del navegador funcionan igual).
   A medida que sumemos pantallas nuevas, van entrando acá.
============================================================= */

const screens = document.querySelectorAll(".screen");

function showScreen(name, { pushHistory = true } = {}) {
  screens.forEach(s => s.classList.toggle("is-active", s.dataset.screen === name));
  if (pushHistory) {
    history.pushState({ screen: name }, "", `#${name}`);
  }
  window.scrollTo(0, 0);
}

window.addEventListener("popstate", (e) => {
  const name = e.state?.screen || "home";
  // Si vuelve atrás sin terminar de cambiar el modo de entrega, se cancela el cambio
  if (!["home", "takeaway-location", "delivery-address"].includes(name)) changingMode = false;
  showScreen(name, { pushHistory: false });
});

// Pantalla inicial según el hash de la URL (o "home" por defecto)
const requested = window.location.hash.replace("#", "");
const needsState = ["menu", "product", "order"]; // pantallas que se llenan al tocar una card
const initialScreen =
  document.querySelector(`[data-screen="${requested}"]`) && !needsState.includes(requested)
    ? requested
    : "home";
history.replaceState({ screen: initialScreen }, "", `#${initialScreen}`);
showScreen(initialScreen, { pushHistory: false });

// ---- Navegación: botones con data-goto y data-action="back" ----
document.addEventListener("click", (e) => {
  const gotoBtn = e.target.closest("[data-goto]");
  if (gotoBtn) {
    showScreen(gotoBtn.dataset.goto);
    return;
  }

  const backBtn = e.target.closest('[data-action="back"]');
  if (backBtn) {
    history.back();
    return;
  }
});

// ---- Confirmar ubicación (take away) ----
document.getElementById("confirm-takeaway-btn").addEventListener("click", () => {
  orderInfo.mode = "Take away";
  orderInfo.address = null;
  afterLocationConfirmed();
});

// ---- Confirmar ubicación (delivery) ----
const addressForm = document.querySelector(".address-form");
const addressError = document.getElementById("delivery-error");

function confirmDelivery() {
  // Los campos obligatorios no pueden estar vacíos (ni solo espacios)
  let firstEmpty = null;
  addressForm.querySelectorAll('[aria-required="true"]').forEach(el => {
    const empty = el.value.trim() === "";
    el.classList.toggle("is-invalid", empty);
    if (empty && !firstEmpty) firstEmpty = el;
  });

  addressError.hidden = !firstEmpty;
  if (firstEmpty) {
    firstEmpty.focus();
    return;
  }

  const calle = document.getElementById("calle").value.trim();
  const entrecalles = document.getElementById("entrecalles").value.trim();
  const numero = document.getElementById("numero").value.trim();
  const aclaraciones = document.getElementById("aclaraciones").value.trim();

  orderInfo.mode = "Delivery";
  orderInfo.address = { calle, entrecalles, numero, aclaraciones };
  afterLocationConfirmed();
}
document.getElementById("confirm-delivery-btn").addEventListener("click", confirmDelivery);
addressForm.addEventListener("submit", (e) => {
  e.preventDefault();
  confirmDelivery();
});

// Al escribir en un campo marcado, se le quita el rojo (y el aviso si ya no queda ninguno)
addressForm.addEventListener("input", (e) => {
  e.target.classList.remove("is-invalid");
  if (!addressForm.querySelector(".is-invalid")) addressError.hidden = true;
});

document.querySelector(".address-form").addEventListener("submit", (e) => e.preventDefault());

/* ============================================================
   MENÚ — acá se editan los productos.
   "img" es la ruta de la foto: si el archivo todavía no existe,
   la card se ve igual (con el panel naranja y sin foto).
   "price" va en pesos, sin puntos ni signos (ej: 8500).
============================================================= */
const MENU = {
  burgers: [
    { name: "Cheese burger", desc: "Smash de 120g, pan brioche, doble queso chedar.", price: 12000, img: "Imagenes/Hamburguesas/Cheese.png" },
    { name: "Bacon cheese burger", desc: "Smash de 120g, pan brioche, doble queso chedar, bacon, salsa barbacoa.", price: 12350, img: "Imagenes/Hamburguesas/Bacon.png" },
    { name: "Onion", desc: "Smash de 120g, pan brioche, cebolla caramelizada, doble queso chedar.", price: 12350, img: "Imagenes/Hamburguesas/Onion.png" },
    { name: "Eggcelente", desc: "Smash de 120g, pan brioche, doble queso chedar, huevo.", price: 12350, img: "Imagenes/Hamburguesas/Egg.png" },
    { name: "Whooper", desc: "Smash de 120g, pan brioche, doble queso chedar, lechuga, tomate, cebolla.", price: 12350, img: "Imagenes/Hamburguesas/Whoper.png" },
    { name: "Vegana", desc: "Hamburgesa %100 vegetal, pan brioche, doble queso chedar", price: 12000, img: "Imagenes/Hamburguesas/Not.png" },
    { name: "Onion vegana", desc: "Hamburgesa %100 vegetal, pan brioche, cebolla caramelizada, doble queso chedar.", price: 12350, img: "Imagenes/Hamburguesas/V O.png" },
    { name: "Whooper vegana", desc: "Hamburgesa %100 vegetal, pan brioche, doble queso chedar, lechuga, tomate, cebolla.", price: 12350, img: "Imagenes/Hamburguesas/V Whop.png" },
  ],
  slides: [
    { name: "Nuggets", desc: "20 unidades de nuestros Nuggets.", price: 10000, img: "Imagenes/slides/Nuggets.png" },
    { name: "Porcion de papas", desc: "Porcion de nuestras papas.", price: 8500, img: "Imagenes/slides/Apapas.png" },
  ],
};

const formatPrice = (n) =>
  n.toLocaleString("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

function renderMenu(key) {
  const items = MENU[key];
  if (!items) return;
  activeMenuKey = key;

  document.querySelectorAll(".menu-tab").forEach(tab =>
    tab.classList.toggle("is-active", tab.dataset.tab === key)
  );

  document.getElementById("menu-grid").innerHTML = items.map((item, i) => `
    <article class="product-card" data-index="${i}" role="button" tabindex="0">
      <img class="product-img" src="${item.img}" alt="${item.name}" onerror="this.remove()">
      <div class="product-info">
        <h3 class="product-name">${item.name}</h3>
        <p class="product-desc">${item.desc}</p>
        <span class="product-price">${formatPrice(item.price)}</span>
      </div>
    </article>
  `).join("");
}

// Pestañas Burgers / Slides
document.querySelectorAll(".menu-tab").forEach(tab => {
  tab.addEventListener("click", () => renderMenu(tab.dataset.tab));
});

// Categorías: cada tarjeta abre el menú con su pestaña activa
const CATEGORY_TO_MENU = {
  hamburguesas: "burgers",
  slides: "slides",
};

document.querySelectorAll(".category-card").forEach(card => {
  card.addEventListener("click", () => {
    const menuKey = CATEGORY_TO_MENU[card.dataset.category];
    if (!menuKey) return;
    renderMenu(menuKey);
    showScreen("menu");
  });
});

/* ============================================================
   PRODUCTO — opciones y agregados (los precios se editan acá)
   El "price" de cada producto en MENU es el de la versión Simple;
   Doble y Triple le suman el "extra" de abajo.
============================================================= */
const OPTIONS = [
  { label: "Simple", extra: 0 },
  { label: "Doble",  extra: 4000 },
  { label: "Triple", extra: 8000 },
];

// Extra de Doble / Triple para cada hamburguesa: es lo que se SUMA al precio Simple.
// La clave tiene que ser el nombre tal cual está en MENU (mismas mayúsculas y tildes).
// Las burgers que no estén acá usan los valores generales de OPTIONS.
const OPTION_PRICES = {
"Cheese burger": { Doble: 13550, Triple: 15000 },
"Bacon cheese burger": { Doble: 13900, Triple: 15450 },
"Onion": { Doble: 13900, Triple: 15450 },
"Eggcelente": { Doble: 13900, Triple: 15450 },
"Whooper": { Doble: 13900, Triple: 15450 },
"Vegana": { Doble: 13550, Triple: 15000 },
"Onion vegana": { Doble: 13900, Triple: 15450 },
"Whooper vegana": { Doble: 13900, Triple: 15450 },
};

// Si un producto necesita otras opciones (los slides, por ejemplo),
// agregale un campo options: [...] con este mismo formato.

const ADDONS = {
  aderezos: [
    { label: "Sin salsa",     price: 0 },
    { label: "Extra cheddar", price: 800 },
    { label: "Extra bacon",   price: 1000 },
  ],
  /*papas: [
    { label: "Con cheddar", price: 1500 },
  ],*/
};

// Opciones de los desplegables: el usuario elige una de cada uno (es opcional).
// "price" es opcional: si no lo ponés, suma 0.
const CHOICES = {
  aderezos: [
    { label: "Por el momento no tenemos aderezos" },
  ],
  papas: [
    { label: "Fritas clásicas" },
   ],
};

const PRODUCT_CONFIG = {
  burgers: { options: OPTIONS, aderezos: true, papas: true },
  slides:  { options: null,    aderezos: true, papas: false },
};

const MAX_QTY = 10;

let activeMenuKey = "burgers";
let currentProduct = null;
let currentOptions = OPTIONS;
const cart = [];

const optionSelect = document.getElementById("detail-option");
const priceEl = document.getElementById("detail-price");
const addBtn = document.getElementById("add-to-order-btn");

// Dibuja las casillas de los agregados (una sola vez al cargar la página)
Object.entries(ADDONS).forEach(([group, list]) => {
  document.getElementById(`addons-${group}`).innerHTML = list.map(a => `
    <label class="addon-option">
      <input type="checkbox" class="addon-input" data-label="${a.label}" data-price="${a.price}">
      <span>${a.label}</span>
      ${a.price ? `<span class="addon-price">+${formatPrice(a.price)}</span>` : ""}
    </label>
  `).join("");
});

// Llena los desplegables de aderezos y papas (una sola vez al cargar)
const choiceSelects = {
  aderezos: document.getElementById("detail-aderezo"),
  papas: document.getElementById("detail-papas"),
};

Object.entries(CHOICES).forEach(([group, list]) => {
  choiceSelects[group].innerHTML =
    `<option value="">Elegí una opción</option>` +
    list.map((c, i) =>
      `<option value="${i}">${c.label}${c.price ? ` (+${formatPrice(c.price)})` : ""}</option>`
    ).join("");
});

/* ============================================================
   DESPLEGABLES CON ESTILO PROPIO
   Los <select> originales siguen existiendo (ocultos) y guardan
   el valor; el botón y la lista de acá son solo la parte visual.
============================================================= */
const dropdownInstances = [];

function enhanceSelect(select) {
  const wrap = document.createElement("div");
  wrap.className = "dd" + (select.classList.contains("select-full") ? " dd-full" : "");
  select.parentNode.insertBefore(wrap, select);
  wrap.appendChild(select);
  select.classList.add("dd-native");

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "dd-btn";
  btn.setAttribute("aria-haspopup", "listbox");
  btn.setAttribute("aria-expanded", "false");

  const label = document.querySelector(`label[for="${select.id}"]`);
  if (label) {
    label.id = label.id || `${select.id}-label`;
    btn.setAttribute("aria-labelledby", label.id);
  }

  const list = document.createElement("ul");
  list.className = "dd-list";
  list.setAttribute("role", "listbox");
  list.hidden = true;

  wrap.append(btn, list);

  let active = 0; // opción resaltada al navegar con el teclado

  function refresh() {
    const current = select.options[select.selectedIndex];
    btn.textContent = current ? current.textContent : "";
    btn.classList.toggle("is-placeholder", select.value === "");
    list.innerHTML = [...select.options].map((o, i) =>
      `<li role="option" data-index="${i}" class="${i === select.selectedIndex ? "is-selected" : ""}">${o.textContent}</li>`
    ).join("");
  }

  function setActive(i) {
    const items = [...list.children];
    if (!items.length) return;
    active = Math.max(0, Math.min(items.length - 1, i));
    items.forEach((li, idx) => li.classList.toggle("is-active", idx === active));
    items[active].scrollIntoView({ block: "nearest" });
  }

  function close() {
    list.hidden = true;
    wrap.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
  }

  function open() {
    dropdownInstances.forEach(d => d.close()); // un solo desplegable abierto a la vez
    list.hidden = false;
    wrap.classList.add("is-open");
    btn.setAttribute("aria-expanded", "true");
    setActive(select.selectedIndex);
  }

  function choose(i) {
    select.selectedIndex = i;
    // Avisa al resto del script (recalcula los precios)
    select.dispatchEvent(new Event("change", { bubbles: true }));
    refresh();
    close();
    btn.focus();
  }

  btn.addEventListener("click", () => (list.hidden ? open() : close()));

  list.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (li) choose(Number(li.dataset.index));
  });

  btn.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (list.hidden) open();
      else setActive(active + (e.key === "ArrowDown" ? 1 : -1));
    } else if (e.key === "Enter" && !list.hidden) {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape") {
      close();
    }
  });

  // Tocar afuera cierra la lista
  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) close();
  });

  refresh();
  dropdownInstances.push({ refresh, close });
}

// Cierra y vuelve a dibujar todos (se usa al abrir un producto)
const refreshDropdowns = () =>
  dropdownInstances.forEach(d => { d.close(); d.refresh(); });

[optionSelect, ...Object.values(choiceSelects)].forEach(enhanceSelect);

// Contador de cantidad
let qty = 1;
const qtyEl = document.getElementById("detail-qty");
const qtyMinus = document.getElementById("qty-minus");
const qtyPlus = document.getElementById("qty-plus");

function setQty(n) {
  qty = Math.min(MAX_QTY, Math.max(1, n));
  qtyEl.textContent = qty;
  qtyMinus.disabled = qty === 1;
  qtyPlus.disabled = qty === MAX_QTY;
  updatePrices();
}

qtyMinus.addEventListener("click", () => setQty(qty - 1));
qtyPlus.addEventListener("click", () => setQty(qty + 1));

// Calcula todo a partir de lo que está elegido en pantalla
function calcOrder() {
  const option = currentOptions[optionSelect.selectedIndex];
  const unit = option.price; // precio final de esta burger en la opción elegida

  // Casillas tildadas
  const checked = [...document.querySelectorAll(".addon-input:checked")];
  const extrasTotal = checked.reduce((sum, c) => sum + Number(c.dataset.price), 0);

  // Lo elegido en los desplegables (aderezo y papas)
  const picked = {};
  let choicesTotal = 0;
  Object.entries(choiceSelects).forEach(([group, select]) => {
    if (select.value === "") return;
    const choice = CHOICES[group][Number(select.value)];
    picked[group] = choice.label;
    choicesTotal += choice.price || 0;
  });

  return {
    option,
    qty,
    extras: checked.map(c => c.dataset.label),
    choices: picked,
    subtotal: unit * qty,                                  // precio de arriba
    total: (unit + extrasTotal + choicesTotal) * qty,      // precio del botón
  };
}

function updatePrices() {
  if (!currentProduct) return;
  const order = calcOrder();
  priceEl.textContent = formatPrice(order.subtotal);
  addBtn.textContent = `Agregar al pedido (${formatPrice(order.total)})`;
}

// Cualquier cambio (opción o casillas) recalcula los precios
document.querySelector(".detail-card").addEventListener("change", updatePrices);

function openProduct(key, index) {
  const product = MENU[key][index];
  if (!product) return;

  const config = PRODUCT_CONFIG[key];
  const baseOptions = product.options || config.options;
  const customPrices = OPTION_PRICES[product.name] || {};

  // Cada opción lleva su precio final: el de la tabla si existe,
  // y si no, el precio Simple más el extra general de OPTIONS
  const productOptions = baseOptions && baseOptions.map(o => ({
    label: o.label,
    price: customPrices[o.label] ?? (product.price + o.extra),
  }));

  currentProduct = product;
  // Sin opciones: queda una sola opción vacía con el precio de la burger
  currentOptions = productOptions || [{ label: "", price: product.price }];

  const img = document.getElementById("detail-img");
  img.style.display = product.img ? "" : "none";
  img.src = product.img;
  img.alt = product.name;

  document.getElementById("detail-name").textContent = product.name;
  document.getElementById("detail-desc").textContent = product.desc;

  // Muestra u oculta los bloques según la categoría
  document.getElementById("field-option").hidden = !productOptions;
  document.getElementById("group-aderezos").hidden = !config.aderezos;
  document.getElementById("group-papas").hidden = !config.papas;

  // El desplegable muestra el precio final de cada opción, por ejemplo "Doble ($ 13.550)"
  optionSelect.innerHTML = currentOptions.map(o =>
    `<option>${o.label} (${formatPrice(o.price)})</option>`
  ).join("");
  document.querySelectorAll(".addon-input").forEach(c => (c.checked = false));
  Object.values(choiceSelects).forEach(s => (s.value = ""));
  refreshDropdowns();
  document.getElementById("detail-notes").value = "";
  addBtn.disabled = false;

  setQty(1); // vuelve la cantidad a 1 y recalcula los precios
  showScreen("product");
}

// Tocar una card del menú abre su pantalla (también con Enter o espacio)
const menuGrid = document.getElementById("menu-grid");

menuGrid.addEventListener("click", (e) => {
  const card = e.target.closest(".product-card");
  if (card) openProduct(activeMenuKey, Number(card.dataset.index));
});

menuGrid.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const card = e.target.closest(".product-card");
  if (card) {
    e.preventDefault();
    openProduct(activeMenuKey, Number(card.dataset.index));
  }
});

// Agregar al pedido: por ahora lo guarda en la lista "cart" y vuelve al menú
addBtn.addEventListener("click", () => {
  const order = calcOrder();
  cart.push({
    name: currentProduct.name,
    option: order.option.label,
    qty: order.qty,
    extras: order.extras,
    choices: order.choices,
    notes: document.getElementById("detail-notes").value.trim(),
    total: order.total,
  });
  console.log("Pedido hasta ahora:", cart);
  updateOrderBar();

  addBtn.disabled = true;
  addBtn.textContent = "¡Agregado!";
  setTimeout(() => history.back(), 600);
});

/* ============================================================
   BARRA "VER TU PEDIDO" — aparece en el menú cuando hay algo
   en el pedido y muestra el total de todo lo agregado.
============================================================= */
const orderBar = document.getElementById("order-bar");
const orderBarBtn = document.getElementById("order-bar-btn");
const menuScreen = document.querySelector('[data-screen="menu"]');

function updateOrderBar() {
  const total = cart.reduce((sum, item) => sum + item.total, 0);
  orderBar.hidden = cart.length === 0;
  menuScreen.classList.toggle("has-order", cart.length > 0);
  orderBarBtn.textContent = `Ver tu pedido (${formatPrice(total)})`;
}

/* ============================================================
   PANTALLA DEL PEDIDO
============================================================= */

// Número de WhatsApp que recibe los pedidos. Solo dígitos, con código de país.
// Es un EJEMPLO: reemplazalo por el real (Argentina celular: 54 9 + código de área + número).
const WHATSAPP_NUMBER = "2241613818";

// Opciones de los desplegables (editalas a gusto)  
const DELIVERY_TIMES = ["Lo antes posible", "20:00-20:30", "20:30-21:00", "21:00-21:30", "21:30-22:00", "22:0022:30", "22:30-23:00", "23:00-23:30", "23:30-00:00"];
const PAYMENTS = ["Efectivo", "Transferencia", "Mercado Pago"];

// Cómo eligió recibir el pedido (lo completan las pantallas de ubicación)
const orderInfo = { mode: "Take away", address: null };

const orderCard = document.getElementById("order-card");
const orderItemsEl = document.getElementById("order-items");
const orderSubtotalEl = document.getElementById("order-subtotal");
const orderModeEl = document.getElementById("order-mode");
const orderAddressEl = document.getElementById("order-address");
const orderTime = document.getElementById("order-time");
const orderPayment = document.getElementById("order-payment");
const orderError = document.getElementById("order-error");
const orderSubmitBtn = document.getElementById("order-submit-btn");

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

const cartTotal = () => cart.reduce((sum, item) => sum + item.total, 0);

// Desplegables de horario y pago
orderTime.innerHTML =
  `<option value="">Hora aproximada</option>` +
  DELIVERY_TIMES.map(t => `<option value="${t}">${t}</option>`).join("");
orderPayment.innerHTML =
  `<option value="">Cómo querés pagar</option>` +
  PAYMENTS.map(p => `<option value="${p}">${p}</option>`).join("");
[orderTime, orderPayment].forEach(enhanceSelect);

// Textos de cada producto del pedido
const itemTitle = (item) =>
  `${item.qty} x ${item.name}${item.option ? " " + item.option : ""}`;

function itemLines(item) {
  const choices = item.choices || {};
  const lines = [];
  if (choices.aderezos) lines.push(`Aderezo: ${choices.aderezos}`);
  if (choices.papas) lines.push(`Papas: ${choices.papas}`);
  item.extras.forEach(e => lines.push(e));
  if (item.notes) lines.push(`Aclaraciones: ${item.notes}`);
  return lines;
}

function addressText(a) {
  let text = `${a.calle} ${a.numero}`;
  if (a.entrecalles) text += ` (entre ${a.entrecalles})`;
  if (a.aclaraciones) text += ` — ${a.aclaraciones}`;
  return text;
}

// Dibuja la pantalla con lo que hay en el pedido
function renderOrder() {
  orderItemsEl.innerHTML = cart.length
    ? cart.map((item, i) => `
        <div class="order-item">
          <div>
            <p class="order-item-name">${escapeHtml(itemTitle(item))} – (${formatPrice(item.total / item.qty)} c/u)</p>
            ${itemLines(item).map(l => `<p class="order-item-line">${escapeHtml(l)}</p>`).join("")}
          </div>
          <div class="order-item-side">
            <span class="order-item-price">${formatPrice(item.total)}</span>
            <button type="button" class="order-item-remove" data-remove="${i}" aria-label="Quitar ${escapeHtml(item.name)} del pedido">×</button>
          </div>
        </div>
      `).join("")
    : `<p class="order-empty">Todavía no agregaste nada a tu pedido.</p>`;

  const total = cartTotal();
  orderSubtotalEl.textContent = formatPrice(total);
  orderSubmitBtn.textContent = `Enviar pedido (${formatPrice(total)})`;
  orderSubmitBtn.disabled = cart.length === 0;

  orderModeEl.textContent = `Modo de entrega: ${orderInfo.mode}`;
  orderAddressEl.hidden = !orderInfo.address;
  if (orderInfo.address) orderAddressEl.textContent = `Dirección: ${addressText(orderInfo.address)}`;
  // Aviso sobre el costo del delivery (solo si eligió Delivery)
  document.getElementById("order-delivery-note").hidden = orderInfo.mode !== "Delivery";
}

// Quitar un producto
orderItemsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-remove]");
  if (!btn) return;
  cart.splice(Number(btn.dataset.remove), 1);
  renderOrder();
  updateOrderBar();
});

// "Ver tu pedido" (la barra del menú) abre esta pantalla
orderBarBtn.addEventListener("click", () => {
  renderOrder();
  showScreen("order");
});

// "Olvidé agregar algo" vuelve al menú
document.getElementById("order-add-more").addEventListener("click", () => showScreen("menu"));

// Validación: todo obligatorio, y el celular necesita al menos 8 dígitos
function isFieldInvalid(el) {
  const value = el.value.trim();
  if (el.id === "order-phone") return value.replace(/\D/g, "").length < 8;
  return value === "";
}

function clearInvalid(e) {
  (e.target.closest(".dd") || e.target).classList.remove("is-invalid");
  if (!orderCard.querySelector(".is-invalid")) orderError.hidden = true;
}
orderCard.addEventListener("input", clearInvalid);
orderCard.addEventListener("change", clearInvalid);

// Mensaje que llega por WhatsApp
function buildWhatsAppMessage() {
  const val = (id) => document.getElementById(id).value.trim();
  const lines = [
    "*Nuevo pedido — The Burger Point*",
    "",
    `*Cliente:* ${val("order-name")} ${val("order-surname")}`,
    `*Celular:* ${val("order-phone")}`,
    `*Entrega:* ${orderInfo.mode}`,
  ];
  if (orderInfo.address) lines.push(`*Dirección:* ${addressText(orderInfo.address)}`);
  lines.push(`*Horario:* ${orderTime.value}`, `*Pago:* ${orderPayment.value}`, "", "*Pedido:*");

  cart.forEach(item => {
    lines.push(`${itemTitle(item)} — ${formatPrice(item.total)}`);
    itemLines(item).forEach(l => lines.push(`   • ${l}`));
  });

  lines.push("", `*Total: ${formatPrice(cartTotal())}*`);
  return lines.join("\n");
}

function submitOrder() {
  if (!cart.length) return;

  let firstInvalid = null;
  orderCard.querySelectorAll('[aria-required="true"]').forEach(el => {
    const invalid = isFieldInvalid(el);
    (el.closest(".dd") || el).classList.toggle("is-invalid", invalid);
    if (invalid && !firstInvalid) firstInvalid = el;
  });

  orderError.hidden = !firstInvalid;
  if (firstInvalid) {
    // Los <select> originales están ocultos: se enfoca el botón del desplegable
    const target = firstInvalid.closest(".dd")?.querySelector(".dd-btn") || firstInvalid;
    target.focus();
    return;
  }

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage())}`;
  window.open(url, "_blank", "noopener");
}

orderSubmitBtn.addEventListener("click", submitOrder);

// ---- Cambiar el modo de entrega (lápiz) ----
let changingMode = false;

window.addEventListener("popstate", (e) => {
  const name = e.state?.screen || "home";
  // Si vuelve atrás sin terminar de cambiar el modo de entrega, se cancela el cambio
  if (!["home", "takeaway-location", "delivery-address"].includes(name)) changingMode = false;
  showScreen(name, { pushHistory: false });
});

// Cuando termina de elegir la ubicación: si venía del lápiz vuelve al pedido,
// si no, sigue el camino normal hacia las categorías
function afterLocationConfirmed() {
  if (changingMode) {
    changingMode = false;
    renderOrder();
    showScreen("order");
  } else {
    showScreen("category");
  }
}
// ---- Horario de atención ----
const OPENING_HOUR = 20; // abre a las 20:00
const CLOSING_HOUR = 0; // cierra a las 00:00 (0 = medianoche)

function isOpenNow() {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "America/Argentina/Buenos_Aires"
    }).format(new Date())
  );
  // Si cierra pasada la medianoche (ej: abre 20, cierra 1) también funciona
  return OPENING_HOUR < CLOSING_HOUR
    ? hour >= OPENING_HOUR && hour < CLOSING_HOUR
    : hour >= OPENING_HOUR || hour < CLOSING_HOUR;
}

function checkOpening() {
  const closed = !isOpenNow();
  document.getElementById("closed-screen").hidden = !closed;
  document.body.classList.toggle("is-closed", closed);
}

checkOpening();
setInterval(checkOpening, 30000); // revisa cada 30 segundos