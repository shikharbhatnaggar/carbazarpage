/* ===== Config ===== */
const DEALER_WHATSAPP = "919999999999"; // TODO: replace with real WhatsApp Business number
const DEALER_PHONE = "+91 99999 99999";

/* ===== Shrink header logo on scroll (every page shares this header) ===== */
function initHeaderScroll(){
  const header = document.querySelector('.site-header');
  if(!header) return;
  const THRESHOLD = 60;
  let ticking = false;
  function apply(){
    header.classList.toggle('scrolled', window.scrollY > THRESHOLD);
    ticking = false;
  }
  apply(); // handle a page loaded already scrolled (e.g. via #anchor)
  window.addEventListener('scroll', ()=>{
    if(!ticking){
      requestAnimationFrame(apply);
      ticking = true;
    }
  }, {passive:true});
}
function initMobileNav(){
  const hamburger = document.querySelector('.hamburger');
  const overlay = document.querySelector('.nav-overlay');
  const drawer = document.querySelector('.mobile-nav');
  const closeBtn = document.querySelector('.mobile-nav-close');
  if(!hamburger || !drawer) return;

  const open = ()=>{overlay.classList.add('open');drawer.classList.add('open');document.body.style.overflow='hidden';};
  const close = ()=>{overlay.classList.remove('open');drawer.classList.remove('open');document.body.style.overflow='';};

  hamburger.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  overlay?.addEventListener('click', close);
  drawer.querySelectorAll('a').forEach(a=>a.addEventListener('click', close));
}

/* ===== WhatsApp helper ===== */
function openWhatsApp(message){
  const url = `https://wa.me/${DEALER_WHATSAPP}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

function buildMessageFromForm(form, title){
  const data = new FormData(form);
  let lines = [`*${title}*`];
  for (const [key, value] of data.entries()){
    if(!value) continue;
    const label = key.replace(/[-_]/g,' ').replace(/\b\w/g, c=>c.toUpperCase());
    lines.push(`${label}: ${value}`);
  }
  return lines.join('\n');
}

function initWhatsAppForms(){
  document.querySelectorAll('form[data-wa-form]').forEach(form=>{
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const requiredOk = form.checkValidity();
      if(!requiredOk){ form.reportValidity(); return; }
      const title = form.dataset.waForm || 'New Enquiry — Aradhya Car Bazar';
      const message = buildMessageFromForm(form, title);
      openWhatsApp(message);
      const note = form.querySelector('.form-note');
      if(note){ note.textContent = 'Opening WhatsApp with your details…'; note.classList.add('show'); }
      form.reset();
    });
  });

  /* Quick single-tap whatsapp CTAs e.g. data-wa-msg="..." */
  document.querySelectorAll('[data-wa-msg]').forEach(el=>{
    el.addEventListener('click', (e)=>{
      e.preventDefault();
      openWhatsApp(el.dataset.waMsg);
    });
  });
}

/* ===== Hero carousel ===== */
function initCarousel(){
  const track = document.querySelector('.hero-track');
  if(!track) return;
  const slides = track.querySelectorAll('.hero-slide');
  const dotsWrap = document.querySelector('.hero-dots');
  let idx = 0;
  slides.forEach((_,i)=>{
    const dot = document.createElement('button');
    dot.setAttribute('aria-label', `Go to slide ${i+1}`);
    if(i===0) dot.classList.add('active');
    dot.addEventListener('click', ()=>goTo(i));
    dotsWrap.appendChild(dot);
  });
  function goTo(i){
    idx = (i+slides.length)%slides.length;
    track.style.transform = `translateX(-${idx*100}%)`;
    dotsWrap.querySelectorAll('button').forEach((d,di)=>d.classList.toggle('active', di===idx));
  }
  document.querySelector('.hero-next')?.addEventListener('click', ()=>goTo(idx+1));
  document.querySelector('.hero-prev')?.addEventListener('click', ()=>goTo(idx-1));
  setInterval(()=>goTo(idx+1), 6000);
}

/* ===== Generic slide carousel (used by Customer Reviews) ===== */
function initGenericCarousels(){
  document.querySelectorAll('[data-carousel]').forEach(root=>{
    const track = root.querySelector('[data-carousel-track]');
    const slides = track ? track.children : [];
    const dotsWrap = root.querySelector('[data-carousel-dots]');
    const prevBtn = root.querySelector('[data-carousel-prev]');
    const nextBtn = root.querySelector('[data-carousel-next]');
    if(!track || !slides.length) return;
    let idx = 0;
    if(dotsWrap){
      dotsWrap.innerHTML = '';
      Array.from(slides).forEach((_,i)=>{
        const dot = document.createElement('button');
        dot.setAttribute('aria-label', `Go to slide ${i+1}`);
        if(i===0) dot.classList.add('active');
        dot.addEventListener('click', ()=>goTo(i));
        dotsWrap.appendChild(dot);
      });
    }
    function goTo(i){
      idx = (i+slides.length)%slides.length;
      track.style.transform = `translateX(-${idx*100}%)`;
      dotsWrap?.querySelectorAll('button').forEach((d,di)=>d.classList.toggle('active', di===idx));
    }
    prevBtn?.addEventListener('click', ()=>goTo(idx-1));
    nextBtn?.addEventListener('click', ()=>goTo(idx+1));
    const auto = root.dataset.carouselAuto !== 'false';
    if(auto){ setInterval(()=>goTo(idx+1), Number(root.dataset.carouselInterval)||5500); }
  });
}

/* ===== Live inventory tab filters (Hatchback / Sedan / SUV / price / transmission) ===== */
function matchesInventoryFilter(card, filter){
  if(!filter || filter === 'all') return true;
  const category = card.dataset.category || '';
  const trans = card.dataset.trans || '';
  const price = Number(card.dataset.price || 0);
  switch(filter){
    case 'hatchback':
    case 'sedan':
    case 'suv':
      return category === filter;
    case 'automatic':
      return trans === 'automatic';
    case 'under-6': return price > 0 && price < 600000;
    case 'under-8': return price > 0 && price < 800000;
    case '8-15': return price >= 800000 && price <= 1500000;
    case '15-plus': return price > 1500000;
    default: return true;
  }
}

function initInventoryFilter(){
  document.querySelectorAll('.filter-bar').forEach(bar=>{
    const grid = bar.parentElement?.querySelector('.inv-grid');
    if(!grid) return;
    const chips = bar.querySelectorAll('.filter-chip');
    chips.forEach(chip=>{
      chip.addEventListener('click', ()=>{
        chips.forEach(c=>c.classList.remove('active'));
        chip.classList.add('active');
        const filter = chip.dataset.filter || 'all';
        grid.querySelectorAll('.car-card').forEach(card=>{
          card.style.display = matchesInventoryFilter(card, filter) ? '' : 'none';
        });
      });
    });
  });
}

/* ===== EMI Calculator ===== */
function initEmiCalculator(){
  // Query from the whole widget wrapper, not just the <form>, since the
  // result panel (.emi-result) sits as a sibling of the form, not inside it.
  const wrap = document.querySelector('.emi-wrap');
  if(!wrap) return;
  const price = wrap.querySelector('#emi-price');
  const down = wrap.querySelector('#emi-down');
  const rate = wrap.querySelector('#emi-rate');
  const tenure = wrap.querySelector('#emi-tenure');
  const priceVal = wrap.querySelector('#emi-price-val');
  const downVal = wrap.querySelector('#emi-down-val');
  const rateVal = wrap.querySelector('#emi-rate-val');
  const tenureVal = wrap.querySelector('#emi-tenure-val');
  const resultEmi = wrap.querySelector('#emi-result');
  const resultInterest = wrap.querySelector('#emi-total-interest');
  const resultTotal = wrap.querySelector('#emi-total-payable');
  if(!price || !down || !rate || !tenure || !resultEmi || !resultInterest || !resultTotal) return;

  function calc(){
    const P = Number(price.value) - Number(down.value);
    const r = Number(rate.value)/12/100;
    const n = Number(tenure.value);
    priceVal.textContent = '₹' + Number(price.value).toLocaleString('en-IN');
    downVal.textContent = '₹' + Number(down.value).toLocaleString('en-IN');
    rateVal.textContent = rate.value + '%';
    tenureVal.textContent = n + ' mo';
    let emi = 0;
    if(P > 0 && r > 0){
      emi = (P * r * Math.pow(1+r,n)) / (Math.pow(1+r,n)-1);
    } else if (P > 0) {
      emi = P/n;
    }
    const total = emi*n;
    const interest = total - P;
    resultEmi.textContent = '₹' + Math.max(0,Math.round(emi)).toLocaleString('en-IN');
    resultInterest.textContent = '₹' + Math.max(0,Math.round(interest)).toLocaleString('en-IN');
    resultTotal.textContent = '₹' + Math.max(0,Math.round(total)).toLocaleString('en-IN');
  }
  [price,down,rate,tenure].forEach(inp=>inp.addEventListener('input', calc));
  calc();
}

/* ===== Animated counters ===== */
function initCounters(){
  const counters = document.querySelectorAll('[data-count]');
  if(!counters.length) return;
  const observer = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        const el = entry.target;
        const target = Number(el.dataset.count);
        let cur = 0;
        const step = Math.max(1, Math.round(target/60));
        const tick = ()=>{
          cur += step;
          if(cur >= target){ el.textContent = target.toLocaleString('en-IN'); return; }
          el.textContent = cur.toLocaleString('en-IN');
          requestAnimationFrame(tick);
        };
        tick();
        observer.unobserve(el);
      }
    });
  }, {threshold:.4});
  counters.forEach(c=>observer.observe(c));
}

/* ===== Testimonial carousel (simple) ===== */
function initTestimonials(){
  const wrap = document.querySelector('.testi-track');
  if(!wrap) return;
  const cards = wrap.querySelectorAll('.testi-card');
  let i=0;
  setInterval(()=>{
    i = (i+1)%cards.length;
    wrap.style.transform = `translateX(-${i*100}%)`;
  }, 5000);
}

/* ===== Reveal on scroll =====
   Elements start fully visible (see CSS). Only once we get here —
   meaning JS loaded and IntersectionObserver is supported — do we
   arm the fade-in effect, so a script error elsewhere can never
   leave content invisible. */
function initReveal(){
  if(!('IntersectionObserver' in window)) return;
  const items = document.querySelectorAll('.reveal');
  const obs = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); obs.unobserve(e.target);} });
  }, {threshold:.15});
  items.forEach(i=>{
    i.classList.add('pre');
    // If it's already on screen at load, reveal immediately instead of
    // waiting on a scroll event that may never fire.
    const rect = i.getBoundingClientRect();
    if(rect.top < window.innerHeight && rect.bottom > 0){
      requestAnimationFrame(()=>i.classList.add('in'));
    }
    obs.observe(i);
  });
}

/* Run every init independently — one feature failing to initialize
   (e.g. a missing element on a particular page) must never block
   the others from running and must never leave page content hidden. */
function safeInit(name, fn){
  try{ fn(); }
  catch(err){ console.error(`[init:${name}] failed:`, err); }
}

document.addEventListener('DOMContentLoaded', ()=>{
  safeInit('headerScroll', initHeaderScroll);
  safeInit('mobileNav', initMobileNav);
  safeInit('whatsAppForms', initWhatsAppForms);
  safeInit('carousel', initCarousel);
  safeInit('genericCarousels', initGenericCarousels);
  safeInit('inventoryFilter', initInventoryFilter);
  safeInit('emiCalculator', initEmiCalculator);
  safeInit('counters', initCounters);
  safeInit('testimonials', initTestimonials);
  safeInit('reveal', initReveal);
});
