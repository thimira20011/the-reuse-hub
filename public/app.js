// shared app script for index inventory fetch
async function loadInventoryTo(selector) {
  const el = document.getElementById(selector);
  const res = await fetch('/api/inventory');
  const data = await res.json();
  if (!data || !data.length) { el.innerHTML = '<p>No items</p>'; return; }
  const grouped = data.reduce((acc, it) => {
    (acc[it.category] = acc[it.category] || []).push(it);
    return acc;
  }, {});

  let html = '';
  for (const cat of Object.keys(grouped)) {
    html += `<h3>${cat}</h3>`;
    for (const it of grouped[cat]) {
      html += `<div class="item"><div><strong>${it.name}</strong><div style="font-size:13px;color:#666">${it.description||''}</div></div><div>${it.quantity}</div></div>`;
    }
  }
  el.innerHTML = html;
}

// when index loads, update inventory section
if (document.getElementById('inventoryList')) {
  window.addEventListener('DOMContentLoaded', () => loadInventoryTo('inventoryList'));
}

// small helper: refresh inventory display on pages that have selectable lists
async function refreshSelects() {
  const selects = document.querySelectorAll('select#itemSelect');
  if (!selects.length) return;
  const res = await fetch('/api/inventory');
  const data = await res.json();
  selects.forEach(sel => {
    sel.innerHTML = data.map(i => `<option value="${i.id}">${i.name} (${i.quantity})</option>`).join('');
  });
}
window.addEventListener('DOMContentLoaded', refreshSelects);