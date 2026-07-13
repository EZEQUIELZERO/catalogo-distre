/* ======================================================
   CONFIGURACIÓN BASE
   ====================================================== */
const DEFAULT_WHATSAPP = "5492915663645";
const ADMIN_USER = "admin";
const ADMIN_PASS = "editor2026";

const GENERIC_IMG = "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'>
  <rect width='400' height='400' fill='#10131a'/>
  <g fill='none' stroke='#3a3f4d' stroke-width='2'>
    <rect x='110' y='90' width='180' height='220' rx='14'/>
    <circle cx='200' cy='170' r='34'/>
    <path d='M150 270 L250 270'/>
    <path d='M160 250 L240 250'/>
  </g>
  <text x='200' y='340' font-family='Segoe UI, sans-serif' font-size='17' fill='#6b7180' text-anchor='middle'>Sin foto disponible</text>
</svg>`);

const PRODUCTS_DISTRE = [
  { ean:"7798332024292", name:"MOCHILA BOOS ELIXIR Nº14", price:52273,
    img:"https://dcdn-us.mitiendanube.com/stores/001/024/956/products/3-8b9395ceeb36037a7617745369212140-1024-1024.webp",
    brand:"Boos", cat:"Mochila" },
  { ean:"7798332024285", name:"MOCHILA BOOS ELIXIR Nº21", price:52273,
    img:"https://dcdn-us.mitiendanube.com/stores/001/024/956/products/5-fcf1d85a2ef68b476e17745368776919-1024-1024.webp",
    brand:"Boos", cat:"Mochila" },
  { ean:"7798332024933", name:"MOCHILA BOOS ELIXIR Nº28", price:52273,
    img:GENERIC_IMG,
    brand:"Boos", cat:"Mochila" },
  { ean:"7798332022014", name:"BOOS CAJA ACQUA EDP 100 ML + DEO 150 ML", price:29942,
    img:"https://cdn.batitienda.com/baticloud/images/product_picture_9e4653f057864d309c7cdf1d01e7e158_638968163792720254_0_m.jpeg",
    brand:"Boos", cat:"Estuche" },
  { ean:"7798332022021", name:"BOOS CAJA BLACK EDP 100 ML + DEO 150 ML", price:29942,
    img:GENERIC_IMG,
    brand:"Boos", cat:"Estuche" },
  { ean:"7798332022038", name:"BOOS CAJA RED EDP 100 ML + DEO 150 ML", price:29942,
    img:"https://sandraselmaonline.com.ar/wp-content/uploads/2025/01/boos-red-for-men.jpg",
    brand:"Boos", cat:"Estuche" }
];

const PRODUCTS_ALGABO = [];
const PRODUCTS_SAPHIRUS = [];

const memoryStore = {};
function storageGet(key){
  try{ return localStorage.getItem(key); }
  catch(e){ return (key in memoryStore) ? memoryStore[key] : null; }
}
function storageSet(key, value){
  try{ localStorage.setItem(key, value); }
  catch(e){ memoryStore[key] = value; }
}

let overrides = {};
let cart = {};
let whatsappNumber = DEFAULT_WHATSAPP;
let isAdmin = false;
let currentModalEan = null;
let activeTab = 'distre';
let customProducts = {};

function getActiveProducts(){
  const tabProducts = activeTab === 'distre' ? PRODUCTS_DISTRE : (activeTab === 'algabo' ? PRODUCTS_ALGABO : PRODUCTS_SAPHIRUS);
  const custom = customProducts[activeTab] || [];
  return [...tabProducts, ...custom];
}

function findBaseProduct(ean){
  return PRODUCTS_DISTRE.find(p => p.ean === ean) || 
         PRODUCTS_ALGABO.find(p => p.ean === ean) || 
         PRODUCTS_SAPHIRUS.find(p => p.ean === ean) ||
         (customProducts['distre']?.find(p => p.ean === ean)) ||
         (customProducts['algabo']?.find(p => p.ean === ean)) ||
         (customProducts['saphirus']?.find(p => p.ean === ean));
}

function loadState(){
  try{ overrides = JSON.parse(storageGet('distre_overrides')) || {}; }catch(e){ overrides = {}; }
  try{ cart = JSON.parse(storageGet('distre_cart')) || {}; }catch(e){ cart = {}; }
  try{ customProducts = JSON.parse(storageGet('distre_custom_products')) || {}; }catch(e){ customProducts = {}; }
  whatsappNumber = storageGet('distre_whatsapp') || DEFAULT_WHATSAPP;
}

function saveOverrides(){ storageSet('distre_overrides', JSON.stringify(overrides)); }
function saveCart(){ storageSet('distre_cart', JSON.stringify(cart)); }
function saveWhatsappNumber(){ storageSet('distre_whatsapp', whatsappNumber); }
function saveCustomProducts(){ storageSet('distre_custom_products', JSON.stringify(customProducts)); }

function getEffective(p){
  const o = overrides[p.ean] || {};
  const price = Number.isFinite(o.price) ? o.price : p.price;
  const enabled = typeof o.enabled === 'boolean' ? o.enabled : true;
  return { ...p, price, enabled };
}

function formatPrice(n){
  return "$ " + Math.round(n).toLocaleString("es-AR");
}

function onImgError(img){
  img.onerror = null;
  img.src = GENERIC_IMG;
}

function showToast(msg){
  const wrap = document.getElementById('toastWrap');
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  wrap.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{
    t.classList.remove('show');
    setTimeout(()=>t.remove(), 300);
  }, 2200);
}

function openOverlayEl(el){ el.classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeOverlayEl(el){ el.classList.remove('open'); document.body.style.overflow = ''; }

/* ======================================================
   INICIALIZACIÓN
   ====================================================== */
loadState();

document.getElementById('tabBtnDistre').addEventListener('click', ()=>{ activeTab='distre'; renderGrid(); });
document.getElementById('tabBtnAlgabo').addEventListener('click', ()=>{ activeTab='algabo'; renderGrid(); });
document.getElementById('tabBtnSaphirus').addEventListener('click', ()=>{ activeTab='saphirus'; renderGrid(); });
document.getElementById('adminTabBtnDistre').addEventListener('click', ()=>{ activeTab='distre'; renderAdminList(); });
document.getElementById('adminTabBtnAlgabo').addEventListener('click', ()=>{ activeTab='algabo'; renderAdminList(); });
document.getElementById('adminTabBtnSaphirus').addEventListener('click', ()=>{ activeTab='saphirus'; renderAdminList(); });

// Eventos de modal
document.getElementById('modalClose').addEventListener('click', ()=> closeOverlayEl(document.getElementById('overlay')));
document.getElementById('modalCloseBtn').addEventListener('click', ()=> closeOverlayEl(document.getElementById('overlay')));
document.getElementById('loginClose').addEventListener('click', ()=> closeOverlayEl(document.getElementById('loginOverlay')));
document.getElementById('adminClose').addEventListener('click', ()=> closeOverlayEl(document.getElementById('adminOverlay')));
document.getElementById('cartClose').addEventListener('click', ()=> closeOverlayEl(document.getElementById('cartOverlay')));
document.getElementById('addProductClose').addEventListener('click', ()=> closeOverlayEl(document.getElementById('addProductOverlay')));
document.getElementById('addProductCancelBtn').addEventListener('click', ()=> closeOverlayEl(document.getElementById('addProductOverlay')));

// Login
document.getElementById('loginSubmit').addEventListener('click', ()=>{
  const user = document.getElementById('loginUser').value;
  const pass = document.getElementById('loginPass').value;
  if(user === ADMIN_USER && pass === ADMIN_PASS){
    isAdmin = true;
    closeOverlayEl(document.getElementById('loginOverlay'));
    openOverlayEl(document.getElementById('adminOverlay'));
    renderAdminList();
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
});

document.getElementById('adminIconBtn').addEventListener('click', ()=>{
  if(!isAdmin) openOverlayEl(document.getElementById('loginOverlay'));
  else openOverlayEl(document.getElementById('adminOverlay'));
});

document.getElementById('logoutBtn').addEventListener('click', ()=>{
  isAdmin = false;
  closeOverlayEl(document.getElementById('adminOverlay'));
});

// WhatsApp
document.getElementById('saveWhatsapp').addEventListener('click', ()=>{
  whatsappNumber = document.getElementById('adminWhatsapp').value || DEFAULT_WHATSAPP;
  saveWhatsappNumber();
  showToast('Número de WhatsApp actualizado');
});

// Agregar producto
document.getElementById('addProductBtn').addEventListener('click', ()=>{
  document.getElementById('addProductForm').reset();
  document.getElementById('imgPreview').innerHTML = '';
  openOverlayEl(document.getElementById('addProductOverlay'));
});

// Preview de imagen
document.getElementById('formImageFile').addEventListener('change', (e)=>{
  const file = e.target.files[0];
  if(file){
    const reader = new FileReader();
    reader.onload = (event)=>{
      const preview = document.getElementById('imgPreview');
      preview.innerHTML = `<img src="${event.target.result}">`;
      document.getElementById('formImageUrl').value = '';
    };
    reader.readAsDataURL(file);
  }
});

document.getElementById('formImageUrl').addEventListener('change', ()=>{
  const url = document.getElementById('formImageUrl').value;
  if(url){
    document.getElementById('imgPreview').innerHTML = `<img src="${url}" onerror="this.src='${GENERIC_IMG}'">`;
    document.getElementById('formImageFile').value = '';
  }
});

// Submit del formulario
document.getElementById('addProductForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  
  const ean = document.getElementById('formEan').value.trim();
  const price = parseInt(document.getElementById('formPrice').value);
  const name = document.getElementById('formName').value.trim();
  const brand = document.getElementById('formBrand').value.trim() || 'Sin marca';
  const cat = document.getElementById('formCategory').value;
  const tab = document.getElementById('formTab').value;
  const imageUrl = document.getElementById('formImageUrl').value || GENERIC_IMG;
  
  if(!ean || !price || !name || !cat || !tab){
    showToast('Por favor completa todos los campos obligatorios');
    return;
  }
  
  const newProduct = { ean, name, price, brand, cat, img: imageUrl };
  
  if(!customProducts[tab]) customProducts[tab] = [];
  const exists = customProducts[tab].find(p => p.ean === ean);
  if(exists){
    showToast('Este producto ya existe');
    return;
  }
  
  customProducts[tab].push(newProduct);
  saveCustomProducts();
  
  closeOverlayEl(document.getElementById('addProductOverlay'));
  showToast(`Producto "${name}" agregado a ${tab.toUpperCase()}`);
  
  activeTab = tab;
  renderGrid();
  renderAdminList();
});

// Renderizar grid
function renderGrid(){
  const products = getActiveProducts();
  const grid = document.getElementById('grid');
  
  if(products.length === 0){
    grid.innerHTML = '<div class="empty-state"><div>No hay productos en esta categoría</div></div>';
    return;
  }
  
  grid.innerHTML = products.map(p => {
    const eff = getEffective(p);
    if(!eff.enabled) return '';
    const displayPrice = eff.price ? formatPrice(eff.price) : 'Consultar precio';
    return `
      <div class="card" onclick="openProductModal('${p.ean}')">
        <div class="card-img">
          <img src="${p.img}" onerror="onImgError(this)" alt="${p.name}">
          <div class="badge">${p.cat}</div>
        </div>
        <div class="card-body">
          <div class="card-name">${p.name}</div>
          <div class="card-ean">EAN: ${p.ean}</div>
          <div class="card-price">${displayPrice}</div>
          <div class="cart-controls">
            <div class="cart-row-btns">
              <button class="cart-mini-btn add" onclick="addToCart('${p.ean}'); event.stopPropagation();">➕ Agregar</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  updateCounter();
}

function openProductModal(ean){
  const p = findBaseProduct(ean);
  if(!p) return;
  const eff = getEffective(p);
  currentModalEan = ean;
  
  document.getElementById('modalImg').src = p.img;
  document.getElementById('modalCat').textContent = p.cat;
  document.getElementById('modalName').textContent = p.name;
  document.getElementById('modalEan').textContent = p.ean;
  document.getElementById('modalBrand').textContent = p.brand || 'N/A';
  
  if(eff.price){
    document.getElementById('modalPrice').textContent = formatPrice(eff.price);
    document.getElementById('modalPrice').className = 'modal-price';
  } else {
    document.getElementById('modalPrice').textContent = 'Consultar precio';
    document.getElementById('modalPrice').className = 'modal-price price-consult-modal';
  }
  
  const cartQty = cart[ean] || 0;
  document.getElementById('modalCartQty').textContent = cartQty;
  
  const msg = `Hola, me interesa el producto: ${p.name} (EAN: ${p.ean})`;
  document.getElementById('modalWhatsapp').href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
  
  openOverlayEl(document.getElementById('overlay'));
}

function addToCart(ean){
  if(!cart[ean]) cart[ean] = 0;
  cart[ean]++;
  saveCart();
  updateCounter();
  if(currentModalEan === ean) document.getElementById('modalCartQty').textContent = cart[ean];
  showToast('Producto agregado al carrito');
}

function removeFromCart(ean){
  if(cart[ean]){
    cart[ean]--;
    if(cart[ean] <= 0) delete cart[ean];
    saveCart();
    updateCounter();
    if(currentModalEan === ean) document.getElementById('modalCartQty').textContent = cart[ean] || 0;
  }
}

document.getElementById('modalAddCart').addEventListener('click', ()=> addToCart(currentModalEan));
document.getElementById('modalRemoveCart').addEventListener('click', ()=> removeFromCart(currentModalEan));

function updateCounter(){
  const total = Object.values(cart).reduce((a,b)=>a+b,0);
  document.getElementById('counter').textContent = total > 0 ? `${total} items` : '';
  document.getElementById('cartBadge').textContent = total;
}

// Carrito
document.getElementById('cartBtn').addEventListener('click', ()=>{
  const cartList = document.getElementById('cartList');
  const items = Object.keys(cart);
  
  if(items.length === 0){
    cartList.innerHTML = '<div class="cart-empty">Tu carrito está vacío</div>';
    document.getElementById('cartTotal').textContent = '$ 0';
    document.getElementById('sendOrderBtn').style.pointerEvents = 'none';
    document.getElementById('sendOrderBtn').style.opacity = '0.5';
  } else {
    let html = '';
    let total = 0;
    items.forEach(ean => {
      const p = findBaseProduct(ean);
      const eff = getEffective(p);
      const price = eff.price || 0;
      const qty = cart[ean];
      const subtotal = price * qty;
      total += subtotal;
      
      html += `
        <div class="cart-item">
          <img src="${p.img}" onerror="onImgError(this)">
          <div class="cart-item-info">
            <div class="cart-item-name">${p.name}</div>
            <div class="cart-item-price">${formatPrice(price)}</div>
            <div class="qty-control">
              <button class="qty-btn" onclick="removeFromCart('${ean}'); renderCart();">-</button>
              <div class="qty-val">${qty}</div>
              <button class="qty-btn" onclick="addToCart('${ean}'); renderCart();">+</button>
            </div>
          </div>
          <div class="cart-item-right">
            <div class="cart-item-total">${formatPrice(subtotal)}</div>
            <button class="cart-remove" onclick="delete cart['${ean}']; saveCart(); renderCart(); updateCounter();">✕</button>
          </div>
        </div>
      `;
    });
    
    cartList.innerHTML = html;
    document.getElementById('cartTotal').textContent = formatPrice(total);
    document.getElementById('sendOrderBtn').style.pointerEvents = 'auto';
    document.getElementById('sendOrderBtn').style.opacity = '1';
    
    const orderMsg = items.map(ean => {
      const p = findBaseProduct(ean);
      const qty = cart[ean];
      return `${qty}x ${p.name} (EAN: ${p.ean})`;
    }).join('\n');
    
    document.getElementById('sendOrderBtn').href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Quisiera hacer un pedido:\n\n${orderMsg}`)}`;
  }
  
  openOverlayEl(document.getElementById('cartOverlay'));
});

function renderCart(){
  document.getElementById('cartBtn').click();
}

document.getElementById('clearCartBtn').addEventListener('click', ()=>{
  cart = {};
  saveCart();
  updateCounter();
  renderCart();
});

// Admin
function renderAdminList(){
  const products = getActiveProducts();
  const list = document.getElementById('adminProductList');
  
  list.innerHTML = products.map(p => {
    const o = overrides[p.ean] || {};
    const price = Number.isFinite(o.price) ? o.price : p.price;
    const enabled = typeof o.enabled === 'boolean' ? o.enabled : true;
    
    return `
      <div class="admin-row ${!enabled ? 'disabled-row' : ''}">
        <img src="${p.img}" onerror="onImgError(this)">
        <div>
          <div class="p-name">${p.name}</div>
          <div class="p-ean">${p.ean}</div>
        </div>
        <input type="number" class="price-input" value="${price}" onchange="
          overrides['${p.ean}'] = overrides['${p.ean}'] || {};
          overrides['${p.ean}'].price = parseInt(this.value) || null;
          saveOverrides();
          renderGrid();
        ">
        <label class="switch">
          <input type="checkbox" ${enabled ? 'checked' : ''} onchange="
            overrides['${p.ean}'] = overrides['${p.ean}'] || {};
            overrides['${p.ean}'].enabled = this.checked;
            saveOverrides();
            renderGrid();
          ">
          <span class="slider-toggle"></span>
        </label>
      </div>
    `;
  }).join('');
  
  document.getElementById('adminWhatsapp').value = whatsappNumber;
}

document.getElementById('exportConfig').addEventListener('click', ()=>{
  const data = { overrides, customProducts };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'catalogo-config.json';
  a.click();
  showToast('Configuración exportada');
});

document.getElementById('resetConfig').addEventListener('click', ()=>{
  if(confirm('¿Estás seguro? Se eliminarán todos los cambios personalizados.')){
    overrides = {};
    customProducts = {};
    saveOverrides();
    saveCustomProducts();
    renderGrid();
    renderAdminList();
    showToast('Configuración restablecida');
  }
});

// Búsqueda
document.getElementById('searchInput').addEventListener('input', (e)=>{
  const query = e.target.value.toLowerCase();
  const products = getActiveProducts();
  const grid = document.getElementById('grid');
  
  const filtered = products.filter(p => 
    getEffective(p).enabled && (
      p.name.toLowerCase().includes(query) || 
      p.ean.includes(query)
    )
  );
  
  grid.innerHTML = filtered.length === 0 
    ? '<div class="empty-state"><div>No se encontraron productos</div></div>'
    : filtered.map(p => {
        const eff = getEffective(p);
        const displayPrice = eff.price ? formatPrice(eff.price) : 'Consultar precio';
        return `
          <div class="card" onclick="openProductModal('${p.ean}')">
            <div class="card-img">
              <img src="${p.img}" onerror="onImgError(this)" alt="${p.name}">
              <div class="badge">${p.cat}</div>
            </div>
            <div class="card-body">
              <div class="card-name">${p.name}</div>
              <div class="card-ean">EAN: ${p.ean}</div>
              <div class="card-price">${displayPrice}</div>
              <div class="cart-controls">
                <div class="cart-row-btns">
                  <button class="cart-mini-btn add" onclick="addToCart('${p.ean}'); event.stopPropagation();">➕ Agregar</button>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
});

renderGrid();
updateCounter();
