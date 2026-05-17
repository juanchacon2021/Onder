document.addEventListener('DOMContentLoaded',()=>{
  const upcoming = [
    {name:'Juan Pérez',date:'25 May 2024',days:15},
    {name:'Carlos Rodríguez',date:'22 May 2024',days:12},
    {name:'Miguel Sánchez',date:'21 May 2024',days:11},
    {name:'David García',date:'20 May 2024',days:10},
  ];

  const inventory = [
    {name:'Gel Fijador',stock:3,max:12},
    {name:'Cera Mate',stock:2,max:12},
    {name:'Shampoo',stock:4,max:12}
  ];

  const activity = [
    {title:'Nuevo cliente registrado',meta:'Luis Martínez • 10:30 AM',type:'green'},
    {title:'Visita registrada',meta:'Carlos Rodríguez • 10:15 AM',type:'blue'},
    {title:'Pago recibido',meta:'$15.00 • Efectivo • 09:45 AM',type:'orange'}
  ];

  const $upcomingList = document.getElementById('upcomingList');
  const $inventoryList = document.getElementById('inventoryList');
  const $activityList = document.getElementById('activityList');
  const $salesFigure = document.getElementById('salesFigure');
  const $toast = document.getElementById('toast');

  function initials(name){
    return name.split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase();
  }

  function renderUpcoming(){
    $upcomingList.innerHTML = '';
    upcoming.forEach((u,i)=>{
      const li = document.createElement('li');
      li.innerHTML = `<span class="avatar-sm">${initials(u.name)}</span><div class="meta"><strong>${u.name}</strong><small>${u.date}</small></div><span class="pill warning">En ${u.days} días</span>`;
      $upcomingList.appendChild(li);
    });
  }

  function renderInventory(){
    $inventoryList.innerHTML='';
    inventory.forEach(it=>{
      const percent = Math.max(6,Math.round((it.stock/it.max)*100));
      const li = document.createElement('li');
      li.innerHTML = `<div class="item">${it.name} <small>Stock: ${it.stock}</small></div><div class="bar"><div style="width:${percent}%"></div></div>`;
      $inventoryList.appendChild(li);
    });
  }

  function renderActivity(){
    $activityList.innerHTML='';
    activity.forEach(a=>{
      const li = document.createElement('li');
      li.innerHTML = `<span class="icon ${a.type}">●</span><div><strong>${a.title}</strong><small>${a.meta}</small></div>`;
      $activityList.appendChild(li);
    });
  }

  function updateSales(){
    // Simula actualización de ventas
    const value = '$' + (200 + Math.floor(Math.random()*200)) + '.00';
    $salesFigure.firstChild.nodeValue = value + ' ';
  }

  function showToast(text){
    if(!$toast) return;
    $toast.hidden = false;
    $toast.innerHTML = `<p>${text}</p>`;
    setTimeout(()=>{ $toast.hidden = true; },4000);
  }

  // Simula notificaciones: mostrar 2 toasts con retraso
  function simulateNotifications(){
    setTimeout(()=> showToast('Tienes 2 clientes con corte programado en 3 días'),3000);
    setTimeout(()=> showToast('3 productos en bajo stock — revisar inventario'),7000);
  }

  // Inicial render
  renderUpcoming(); renderInventory(); renderActivity(); updateSales();
  simulateNotifications();

  // Actualizar ventas cada 8s para demo
  setInterval(updateSales,8000);
});
