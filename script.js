/* ====== PENGATURAN: ubah sesuai kebutuhan ====== */
const CONFIG = {
  eventDate: new Date('2026-12-12T16:00:00+07:00'),
  account: '1234567890',
  whatsapp: '6281234567890',          // nomor WA mempelai (format 62...)
  qrText: 'BCA 1234567890 Cinta Putri Anderson'
};
/* =============================================== */
const $ = id => document.getElementById(id);
const modal = new bootstrap.Modal($('infoModal'));
const say = t => { $('modalText').textContent = t; modal.show(); };

// Nama tamu dari URL: ?to=Budi+Santoso
const to = new URLSearchParams(location.search).get('to');
if (to) $('guestName').textContent = to;

// Buka undangan + musik
const bgm = $('bgm');
function setPlaying(p){
  $('playBtn').textContent = p ? '❚❚' : '▶';
  $('floatMusic').classList.toggle('spin', p);
}
function toggleMusic(){
  if (bgm.paused) bgm.play().then(()=>setPlaying(true)).catch(()=>say('File musik.mp3 belum ada di folder assets/audio.'));
  else { bgm.pause(); setPlaying(false); }
}
$('openBtn').onclick = () => {
  $('cover').classList.add('open');
  document.body.classList.remove('locked');
  bgm.play().then(()=>setPlaying(true)).catch(()=>{});
  document.body.classList.add('opened');
};
$('playBtn').onclick = $('floatMusic').onclick = toggleMusic;
const fmt = s => isFinite(s) ? Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0') : '0:00';
bgm.ontimeupdate = () => { $('barFill').style.width = (bgm.currentTime/bgm.duration*100||0)+'%'; $('tNow').textContent = fmt(bgm.currentTime); };
bgm.onloadedmetadata = () => $('tEnd').textContent = fmt(bgm.duration);

// Hitung mundur
function tick(){
  let d = Math.max(0, CONFIG.eventDate - Date.now()) / 1000;
  $('cd-d').textContent = Math.floor(d/86400);
  $('cd-h').textContent = Math.floor(d%86400/3600);
  $('cd-m').textContent = Math.floor(d%3600/60);
  const detik = Math.floor(d%60);
  if ($('cd-s').textContent != detik) {
    $('cd-s').textContent = detik;
    $('cdBox').classList.remove('bump'); void $('cdBox').offsetWidth; $('cdBox').classList.add('bump');
  }
}
tick(); setInterval(tick, 1000);

// Animasi muncul saat scroll
const io = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting){ e.target.classList.add('show'); io.unobserve(e.target);} }), {threshold:.15});
document.querySelectorAll('[data-anim]').forEach(el => io.observe(el));
document.querySelectorAll('#timeline li').forEach((li,i) => { li.dataset.anim = 'left'; li.style.transitionDelay = i*130+'ms'; io.observe(li); });


// Daun emas berjatuhan
document.querySelectorAll('[data-leaves]').forEach(box => {
  for (let i = 0; i < +box.dataset.leaves; i++) {
    const s = document.createElement('span');
    const ukuran = 8 + Math.random() * 12;
    s.className = 'leaf';
    s.style.cssText = `left:${Math.random()*100}%;width:${ukuran}px;height:${ukuran}px;animation-duration:${8+Math.random()*10}s;animation-delay:${-Math.random()*14}s;--geser:${Math.round(Math.random()*120-60)}px`;
    box.appendChild(s);
  }
});

// Garis progres scroll
addEventListener('scroll', () => {
  const h = document.documentElement;
  $('progress').style.width = (h.scrollTop / (h.scrollHeight - h.clientHeight) * 100 || 0) + '%';
}, {passive:true});

// Simpan ke kalender (.ics)
$('calBtn').onclick = () => {
  const f = d => d.toISOString().replace(/[-:]|\.\d{3}/g,'');
  const end = new Date(CONFIG.eventDate.getTime()+7*3600e3);
  const ics = ['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT','SUMMARY:Pernikahan Cinta & Fajar','DTSTART:'+f(CONFIG.eventDate),'DTEND:'+f(end),'LOCATION:The Botanical Garden','END:VEVENT','END:VCALENDAR'].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));
  a.download = 'pernikahan-Cinta-Fajar.ics'; a.click();
};

// Salin rekening
$('copyBtn').onclick = () => {
  (navigator.clipboard ? navigator.clipboard.writeText(CONFIG.account) : Promise.reject())
    .then(()=>say('Nomor rekening disalin: '+CONFIG.account))
    .catch(()=>say('Nomor rekening: '+CONFIG.account));
};
// QR (ganti dengan gambar QR asli Anda: qr.png)
$('qrImg').src = 'assets/images/qr.png';
$('qrImg').onerror = function(){ this.onerror=null; this.src='data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#fff"/><text x="50" y="48" font-size="9" text-anchor="middle" fill="#12332a">Letakkan</text><text x="50" y="60" font-size="9" text-anchor="middle" fill="#12332a">qr.png</text></svg>'); };

// RSVP -> kirim lewat WhatsApp
$('rsvpForm').onsubmit = e => {
  e.preventDefault();
  const name = $('rName').value.trim();
  if(!name){ $('rName').classList.add('is-invalid'); return; }
  $('rName').classList.remove('is-invalid');
  const hadir = $('rStatus').value === 'hadir';
  const msg = `Halo, saya ${name}. ${hadir?'Saya akan hadir':'Mohon maaf, saya tidak bisa hadir'} (${$('rJumlah').value}).\n${$('rPesan').value.trim()}`;
  const ok = $('rsvpOk');
  ok.classList.remove('d-none');
  ok.innerHTML = hadir ? `Terima kasih, ${name.replace(/</g,'&lt;')}! Sampai jumpa di hari bahagia kami. ` : `Terima kasih sudah memberi kabar, ${name.replace(/</g,'&lt;')}. `;
  const a = document.createElement('a');
  a.href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
  a.target = '_blank'; a.rel = 'noopener'; a.className = 'alert-link'; a.textContent = 'Kirim lewat WhatsApp';
  ok.appendChild(a);
};


// Galeri: klik foto untuk memperbesar
const photoModal = new bootstrap.Modal($('photoModal'));
document.querySelectorAll('.gal').forEach(b => b.addEventListener('click', () => {
  $('photoBig').src = b.dataset.src;
  photoModal.show();
}));
$('photoBig').onerror = () => { photoModal.hide(); say('Foto belum ditambahkan. Taruh file-nya di assets/images/.'); };