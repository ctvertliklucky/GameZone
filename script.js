// DATA NOMINAL
  const dataNominal = {
    ml: [
      { label: "86 💎", harga: 19000 },
      { label: "172 💎", harga: 37000 },
      { label: "257 💎", harga: 55000 },
      { label: "344 💎", harga: 73000 },
      { label: "514 💎", harga: 109000 },
      { label: "706 💎", harga: 149000 },
      { label: "1024 💎", harga: 215000 },
      { label: "2195 💎", harga: 429000 },
      { label: "5532 💎", harga: 1059000 },
    ],
    ef: [
      { label: "200 Coin", harga: 15000 },
      { label: "500 Coin", harga: 35000 },
      { label: "1000 Coin", harga: 68000 },
      { label: "2000 Coin", harga: 135000 },
      { label: "3000 Coin", harga: 199000 },
      { label: "5000 Coin", harga: 329000 },
    ],
    ff: [
      { label: "70 💎", harga: 15000 },
      { label: "140 💎", harga: 29000 },
      { label: "355 💎", harga: 70000 },
      { label: "720 💎", harga: 139000 },
      { label: "1450 💎", harga: 275000 },
      { label: "2180 💎", harga: 409000 },
    ],
  };

  const metodeBayar = [
    { icon: "💙", nama: "DANA", tipe: "nomor", label: "Nomor DANA" },
    { icon: "💚", nama: "GoPay", tipe: "nomor", label: "Nomor GoPay" },
    { icon: "🌊", nama: "SeaBank", tipe: "nomor", label: "Nomor SeaBank" },
    { icon: "🏦", nama: "Bank Transfer", tipe: "rekening", label: "Nomor Rekening" },
  ];

  let selectedNominal = { ml: null, ef: null, ff: null };
  let selectedBayar = { ml: null, ef: null, ff: null };
  const daftarBank = ["BCA", "BRI", "BNI", "Mandiri"];

  let selectedBayarInfo = { ml: null, ef: null, ff: null }; // { tipe, label } dari metode yang dipilih
  let selectedBayarNomor = { ml: '', ef: '', ff: '' }; // nomor rekening / nomor HP yang diisi user
  let selectedBayarBank = { ml: '', ef: '', ff: '' }; // nama bank yang dipilih (khusus Bank Transfer)
  let voucherTerpilih = { ml: null, ef: null, ff: null };
  let currentPageId = 'beranda'; // di-set ulang oleh initHalamanTopup() di halaman top up

  // ===== SISTEM AUTH (localStorage) =====
  function getUsers() {
    return JSON.parse(localStorage.getItem('gz_users') || '{}');
  }
  function saveUsers(users) {
    localStorage.setItem('gz_users', JSON.stringify(users));
  }
  function currentUser() {
    return localStorage.getItem('gz_currentUser');
  }

  function showAuthTab(id) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-content').forEach(c => c.classList.remove('active'));
    document.getElementById('authtab-' + id).classList.add('active');
    document.getElementById('authcontent-' + id).classList.add('active');
  }

  function tampilkanErrorAuth(id, pesan) {
    const el = document.getElementById(id);
    el.textContent = pesan;
    el.classList.add('show');
  }
  function sembunyikanPesanAuth() {
    ['login-error', 'daftar-error', 'daftar-success'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('show');
    });
  }

  function daftarAkun() {
    sembunyikanPesanAuth();
    const username = document.getElementById('daftar-username').value.trim();
    const password = document.getElementById('daftar-password').value;
    const password2 = document.getElementById('daftar-password2').value;

    if (!username || !password) { tampilkanErrorAuth('daftar-error', 'Username dan password wajib diisi.'); return; }
    if (password.length < 4) { tampilkanErrorAuth('daftar-error', 'Password minimal 4 karakter.'); return; }
    if (password !== password2) { tampilkanErrorAuth('daftar-error', 'Konfirmasi password tidak cocok.'); return; }

    const users = getUsers();
    if (users[username]) { tampilkanErrorAuth('daftar-error', 'Username sudah terdaftar, silakan pilih username lain.'); return; }

    users[username] = { password };
    saveUsers(users);

    const el = document.getElementById('daftar-success');
    el.textContent = 'Akun berhasil dibuat! Silakan login.';
    el.classList.add('show');

    document.getElementById('daftar-username').value = '';
    document.getElementById('daftar-password').value = '';
    document.getElementById('daftar-password2').value = '';

    setTimeout(() => {
      showAuthTab('login');
      document.getElementById('login-username').value = username;
      sembunyikanPesanAuth();
    }, 900);
  }

  function loginAkun() {
    sembunyikanPesanAuth();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) { tampilkanErrorAuth('login-error', 'Username dan password wajib diisi.'); return; }

    const users = getUsers();
    if (!users[username] || users[username].password !== password) {
      tampilkanErrorAuth('login-error', 'Username atau password salah.');
      return;
    }

    localStorage.setItem('gz_currentUser', username);
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    updateAuthUI();
    navigateTo('beranda');
  }

  function logoutAkun() {
    localStorage.removeItem('gz_currentUser');
    updateAuthUI();
    navigateTo('beranda');
  }

  function updateAuthUI() {
    const area = document.getElementById('authArea');
    const user = currentUser();
    if (user) {
      const poin = getPoints(user);
      area.innerHTML = `
        <a class="user-chip" style="cursor:pointer;text-decoration:none;color:inherit;" href="${PAGE_URL.poin}">
          <div class="avatar">${user.charAt(0).toUpperCase()}</div>
          <div>
            <div class="uname">${user}</div>
            <div class="upoin">✨ ${poin} poin</div>
          </div>
        </a>
        <button class="btn-logout" onclick="logoutAkun()">Keluar</button>`;
    } else {
      area.innerHTML = `<a class="btn-nav-login" href="${PAGE_URL.login}">Login</a>`;
    }
  }

  // ===== RIWAYAT PEMBELIAN =====
  function getHistory(username) {
    return JSON.parse(localStorage.getItem('gz_history_' + username) || '[]');
  }
  function tambahHistory(username, transaksi) {
    const list = getHistory(username);
    list.unshift(transaksi);
    localStorage.setItem('gz_history_' + username, JSON.stringify(list));
  }

  const iconGameMap = { 'Mobile Legends': '⚔️', 'eFootball': '⚽', 'Free Fire': '🔥' };

  function renderRiwayat() {
    const body = document.getElementById('riwayatBody');
    const user = currentUser();

    if (!user) {
      body.innerHTML = `
        <div class="riwayat-locked hud-panel">
          <div class="ic">🔒</div>
          <p>Kamu harus login terlebih dahulu untuk melihat riwayat pembelian.</p>
          <button class="btn-primary" onclick="navigateTo('login')">Login Sekarang</button>
        </div>`;
      return;
    }

    const list = getHistory(user);
    if (list.length === 0) {
      body.innerHTML = `
        <div class="riwayat-empty hud-panel">
          <div class="ic">🧾</div>
          <p>Belum ada riwayat pembelian. Yuk mulai top up sekarang!</p>
        </div>`;
      return;
    }

    const totalBelanja = list.reduce((sum, t) => sum + t.total, 0);
    let html = `
      <div class="riwayat-summary">
        <div class="info-box hud-panel"><div class="num">${list.length}</div><div class="label">Total Transaksi</div></div>
        <div class="info-box hud-panel"><div class="num" style="font-size:16px;">Rp ${totalBelanja.toLocaleString('id-ID')}</div><div class="label">Total Belanja</div></div>
      </div>
      <div class="riwayat-table-wrap hud-panel">
      <table class="riwayat-table">
        <thead>
          <tr><th>Game</th><th>Item</th><th>Waktu</th><th>Metode</th><th>Total</th><th>Status</th></tr>
        </thead>
        <tbody>`;

    list.forEach(t => {
      html += `
          <tr>
            <td><span class="rw-icon">${iconGameMap[t.game] || '🎮'}</span> ${t.game}</td>
            <td>${t.item}</td>
            <td>${t.waktu}</td>
            <td>${t.metode}</td>
            <td class="rw-total">Rp ${t.total.toLocaleString('id-ID')}</td>
            <td class="rw-status">✅ Berhasil</td>
          </tr>`;
    });

    html += `
        </tbody>
      </table>
      </div>`;
    body.innerHTML = html;
  }

  // ===== SISTEM POIN =====
  const POIN_PER_PEMBELIAN = 10;

  function getPoints(username) {
    return parseInt(localStorage.getItem('gz_points_' + username) || '0', 10);
  }
  function addPoints(username, jumlah) {
    const total = getPoints(username) + jumlah;
    localStorage.setItem('gz_points_' + username, String(total));
    return total;
  }
  function kurangiPoints(username, jumlah) {
    const total = Math.max(0, getPoints(username) - jumlah);
    localStorage.setItem('gz_points_' + username, String(total));
    return total;
  }

  // ===== SISTEM VOUCHER =====
  const rewardTiers = [
    { id: 'v5', poin: 50, diskon: 5, maxPotongan: 20000, ic: '🎫', nama: 'Voucher Diskon 5%' },
    { id: 'v10', poin: 100, diskon: 10, maxPotongan: 50000, ic: '🎟️', nama: 'Voucher Diskon 10%' },
    { id: 'v20', poin: 200, diskon: 20, maxPotongan: 100000, ic: '🏆', nama: 'Voucher Diskon 20%' },
  ];

  function getVouchers(username) {
    return JSON.parse(localStorage.getItem('gz_vouchers_' + username) || '[]');
  }
  function saveVouchers(username, list) {
    localStorage.setItem('gz_vouchers_' + username, JSON.stringify(list));
  }
  function buatKodeVoucher() {
    const acak = Math.random().toString(36).substring(2, 7).toUpperCase();
    return 'GZ-' + acak;
  }

  function tukarPoin(tierId) {
    const user = currentUser();
    if (!user) { navigateTo('login'); return; }
    const tier = rewardTiers.find(t => t.id === tierId);
    if (!tier) return;
    const poinSaatIni = getPoints(user);
    if (poinSaatIni < tier.poin) { alert('Poin kamu belum cukup untuk menukar hadiah ini.'); return; }

    kurangiPoints(user, tier.poin);
    const voucher = {
      code: buatKodeVoucher(),
      diskon: tier.diskon,
      maxPotongan: tier.maxPotongan,
      nama: tier.nama,
      terpakai: false,
      waktu: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    const vouchers = getVouchers(user);
    vouchers.unshift(voucher);
    saveVouchers(user, vouchers);

    updateAuthUI();
    renderPoin();
    alert(`Berhasil menukar ${tier.poin} poin dengan ${tier.nama}! Kode voucher: ${voucher.code}`);
  }

  function renderPoin() {
    const body = document.getElementById('poinBody');
    const user = currentUser();

    if (!user) {
      body.innerHTML = `
        <div class="poin-locked hud-panel">
          <div class="ic">🔒</div>
          <p>Kamu harus login terlebih dahulu untuk melihat dan menukar poin.</p>
          <button class="btn-primary" onclick="navigateTo('login')">Login Sekarang</button>
        </div>`;
      return;
    }

    const poin = getPoints(user);
    const vouchers = getVouchers(user);

    let html = `
      <div class="poin-hero hud-panel">
        <div class="ph-left">
          <div class="ph-label">Total Poin Kamu</div>
          <div class="ph-num">${poin} <span>poin</span></div>
        </div>
        <div class="ph-right">Setiap <strong>1x pembelian</strong> berhasil, kamu otomatis dapat <strong>${POIN_PER_PEMBELIAN} poin</strong>. Kumpulkan lalu tukar jadi voucher diskon!</div>
      </div>

      <div class="section-label">🎁 Tukar Poin dengan Hadiah</div>
      <div class="reward-grid">`;

    rewardTiers.forEach(tier => {
      const bisaTukar = poin >= tier.poin;
      html += `
        <div class="reward-card hud-panel">
          <div class="rc-ic">${tier.ic}</div>
          <div class="rc-title">${tier.nama}</div>
          <div class="rc-desc">Potongan ${tier.diskon}% (maks. Rp ${tier.maxPotongan.toLocaleString('id-ID')})</div>
          <div class="rc-cost">${tier.poin} poin</div>
          <button class="btn-tukar" onclick="tukarPoin('${tier.id}')" ${bisaTukar ? '' : 'disabled'}>Tukar Sekarang</button>
        </div>`;
    });

    html += `</div>`;
    html += `<div class="section-label">🎫 Voucher Kamu</div>`;

    if (vouchers.length === 0) {
      html += `<div class="poin-empty hud-panel">Belum ada voucher. Tukarkan poin kamu di atas untuk mendapatkan voucher diskon pertama!</div>`;
    } else {
      html += `<div class="voucher-list">`;
      vouchers.forEach(v => {
        html += `
          <div class="voucher-card hud-panel ${v.terpakai ? 'terpakai' : ''}">
            <div class="vc-left">
              <div class="vc-ic">🎫</div>
              <div>
                <div class="vc-code">${v.code}</div>
                <div class="vc-desc">${v.nama} · didapat ${v.waktu}</div>
              </div>
            </div>
            <div class="vc-status ${v.terpakai ? 'habis' : 'aktif'}">${v.terpakai ? 'Sudah Dipakai' : 'Siap Dipakai'}</div>
          </div>`;
      });
      html += `</div>`;
    }

    body.innerHTML = html;
  }

  // ===== VOUCHER DI HALAMAN CHECKOUT =====
  function isiOpsiVoucher(game) {
    const select = document.getElementById('voucher-' + game);
    if (!select) return;
    const user = currentUser();
    select.innerHTML = '<option value="">Tanpa Voucher</option>';
    if (!user) return;
    const vouchers = getVouchers(user).filter(v => !v.terpakai);
    vouchers.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.code;
      opt.textContent = `${v.code} — ${v.nama}`;
      select.appendChild(opt);
    });
  }

  function pilihVoucher(game) {
    const select = document.getElementById('voucher-' + game);
    const kode = select.value;
    voucherTerpilih[game] = kode || null;
    const infoBox = document.getElementById('voucher-applied-' + game);
    if (kode) {
      const user = currentUser();
      const v = getVouchers(user).find(x => x.code === kode);
      infoBox.textContent = `✅ Voucher ${v.nama} aktif — diskon ${v.diskon}% (maks. Rp ${v.maxPotongan.toLocaleString('id-ID')})`;
      infoBox.classList.add('show');
    } else {
      infoBox.classList.remove('show');
    }
    updateSummary(game);
  }

  // ===== FLASH SALE JUMAT (Diskon 10%, berlaku 1x pembelian) =====
  function isJumat() {
    return new Date().getDay() === 5; // 0=Minggu ... 5=Jumat
  }

  function tanggalHariIni() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function diskonSudahDipakai() {
    return localStorage.getItem('flashsale_used_' + tanggalHariIni()) === '1';
  }

  function tandaiDiskonDipakai() {
    localStorage.setItem('flashsale_used_' + tanggalHariIni(), '1');
  }

  function flashSaleAktif() {
    return isJumat() && !diskonSudahDipakai();
  }

  function initFlashSaleBanner() {
    const banner = document.getElementById('flashsaleBanner');
    const title = document.getElementById('flashsaleTitle');
    const sub = document.getElementById('flashsaleSub');
    const halamanTopup = ['ml', 'ef', 'ff']; // tampil di semua halaman top up: ML, eFootball, Free Fire
    if (!isJumat() || !halamanTopup.includes(currentPageId)) {
      banner.classList.remove('show');
      return;
    }
    banner.classList.add('show');
    if (diskonSudahDipakai()) {
      banner.classList.add('used');
      title.textContent = '✅ FLASH SALE JUMAT — SELESAI DIPAKAI';
      sub.textContent = 'Kamu sudah pakai diskon hari ini. Sampai jumpa Jumat depan!';
    } else {
      banner.classList.remove('used');
      title.textContent = 'FLASH SALE JUMAT — DISKON 10% SEMUA ITEM';
      sub.textContent = 'Berlaku hari ini saja, khusus 1x pembelian per pelanggan';
    }
  }

  function updateCountdown() {
    const el = document.getElementById('flashsaleCountdown');
    if (!el) return;
    const halamanTopup = ['ml', 'ef', 'ff'];
    if (!isJumat() || diskonSudahDipakai() || !halamanTopup.includes(currentPageId)) { el.textContent = ''; return; }
    const now = new Date();
    const tengahMalam = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const sisa = tengahMalam - now;
    const j = Math.floor(sisa / 3600000);
    const m = Math.floor((sisa % 3600000) / 60000);
    const s = Math.floor((sisa % 60000) / 1000);
    el.textContent = `BERAKHIR DALAM ${String(j).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function renderNominal(game) {
    const container = document.getElementById('nominal-' + game);
    container.innerHTML = '';
    const diskonAktif = flashSaleAktif();
    dataNominal[game].forEach((item) => {
      const div = document.createElement('div');
      div.className = 'nominal-item';
      const hargaFinal = diskonAktif ? Math.round(item.harga * 0.9) : item.harga;
      div.innerHTML = diskonAktif
        ? `<div class="dm">${item.label}</div><div class="harga"><span class="harga-asli">Rp ${item.harga.toLocaleString('id-ID')}</span><span class="harga-diskon">Rp ${hargaFinal.toLocaleString('id-ID')}</span></div>`
        : `<div class="dm">${item.label}</div><div class="harga">Rp ${item.harga.toLocaleString('id-ID')}</div>`;
      div.onclick = () => {
        container.querySelectorAll('.nominal-item').forEach(el => el.classList.remove('selected'));
        div.classList.add('selected');
        selectedNominal[game] = { ...item, hargaFinal };
        updateTotal(game);
        updateSummary(game);
      };
      container.appendChild(div);
    });
  }

  function renderBayar(game) {
    const container = document.getElementById('bayar-' + game);
    container.innerHTML = '';
    metodeBayar.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'bayar-item';
      div.innerHTML = `<div class="pay-icon">${item.icon}</div>${item.nama}`;
      div.onclick = () => {
        container.querySelectorAll('.bayar-item').forEach(el => el.classList.remove('selected'));
        div.classList.add('selected');
        selectedBayar[game] = item.nama;
        selectedBayarInfo[game] = { tipe: item.tipe, label: item.label };
        selectedBayarNomor[game] = '';
        selectedBayarBank[game] = '';
        renderBayarDetail(game);
        updateSummary(game);
      };
      container.appendChild(div);
    });
  }

  // Menampilkan input Nomor Rekening (Bank Transfer) atau Nomor HP/E-wallet (DANA/GoPay/SeaBank)
  // sesuai metode pembayaran yang baru saja dipilih user.
  function renderBayarDetail(game) {
    const container = document.getElementById('bayar-detail-' + game);
    if (!container) return;
    const info = selectedBayarInfo[game];
    if (!info) { container.innerHTML = ''; return; }

    if (info.tipe === 'rekening') {
      const opsiBank = daftarBank.map(b => `<option value="${b}" ${selectedBayarBank[game] === b ? 'selected' : ''}>${b}</option>`).join('');
      container.innerHTML = `
        <label>Pilih Bank</label>
        <select id="bayar-bank-${game}" onchange="updateBayarBank('${game}', this.value)">
          <option value="">-- Pilih Bank --</option>
          ${opsiBank}
        </select>
        <label>${info.label}</label>
        <input type="text" inputmode="numeric" id="bayar-nomor-${game}" placeholder="Contoh: 1234567890" value="${selectedBayarNomor[game] || ''}" oninput="updateBayarNomor('${game}', this.value)" />
      `;
    } else {
      container.innerHTML = `
        <label>${info.label}</label>
        <input type="text" inputmode="numeric" id="bayar-nomor-${game}" placeholder="Contoh: 081234567890" value="${selectedBayarNomor[game] || ''}" oninput="updateBayarNomor('${game}', this.value)" />
      `;
    }
  }

  function updateBayarBank(game, value) {
    selectedBayarBank[game] = value;
    updateSummary(game);
  }

  function updateBayarNomor(game, value) {
    selectedBayarNomor[game] = value.trim();
    updateSummary(game);
  }

  // Menghitung total akhir dengan mempertimbangkan flash sale ATAU voucher (dipilih yang lebih besar diskonnya)
  function hitungTotal(game) {
    const item = selectedNominal[game];
    if (!item) return null;

    const hargaAsli = item.harga;
    const pakaiFlashSale = flashSaleAktif();
    const hargaFlashSale = pakaiFlashSale ? item.hargaFinal : hargaAsli;

    let voucher = null;
    let hargaVoucher = hargaAsli;
    if (voucherTerpilih[game]) {
      const user = currentUser();
      voucher = user ? getVouchers(user).find(v => v.code === voucherTerpilih[game] && !v.terpakai) : null;
      if (voucher) {
        const potongan = Math.min(Math.round(hargaAsli * voucher.diskon / 100), voucher.maxPotongan);
        hargaVoucher = hargaAsli - potongan;
      }
    }

    // Pilih diskon terbesar antara flash sale dan voucher (tidak digabung)
    if (voucher && hargaVoucher < hargaFlashSale) {
      return { totalAkhir: hargaVoucher, sumber: 'voucher', voucher, hargaAsli };
    } else if (pakaiFlashSale) {
      return { totalAkhir: hargaFlashSale, sumber: 'flashsale', voucher: null, hargaAsli };
    } else {
      return { totalAkhir: hargaAsli, sumber: null, voucher: null, hargaAsli };
    }
  }

  function updateTotal(game) {
    const el = document.getElementById('total-' + game);
    const hasil = hitungTotal(game);
    if (hasil) {
      el.textContent = 'Rp ' + hasil.totalAkhir.toLocaleString('id-ID');
    }
  }

  // Menyusun teks metode pembayaran lengkap, misal "Bank Transfer BCA • 1234567890"
  function labelMetodeBayar(game) {
    const bayar = selectedBayar[game];
    if (!bayar) return '';
    const bank = selectedBayarBank[game];
    const nomor = selectedBayarNomor[game];
    const namaMetode = bank ? `${bayar} ${bank}` : bayar;
    return nomor ? `${namaMetode} • ${nomor}` : namaMetode;
  }

  // Mengisi panel Ringkasan Pesanan di samping form top up secara live
  function updateSummary(game) {
    const uidMap = { ml: 'ml-uid', ef: 'ef-uid', ff: 'ff-uid' };
    const uidInput = document.getElementById(uidMap[game]);
    const uidEl = document.getElementById('summary-' + game + '-uid');
    if (uidInput && uidEl) {
      const val = uidInput.value.trim();
      uidEl.textContent = val || 'Belum diisi';
      uidEl.classList.toggle('empty', !val);
    }

    if (game === 'ml') {
      const zoneInput = document.getElementById('ml-zone');
      const zoneEl = document.getElementById('summary-ml-zone');
      if (zoneInput && zoneEl) {
        const val = zoneInput.value.trim();
        zoneEl.textContent = val || 'Belum diisi';
        zoneEl.classList.toggle('empty', !val);
      }
    }

    const itemEl = document.getElementById('summary-' + game + '-item');
    if (itemEl) {
      const item = selectedNominal[game];
      itemEl.textContent = item ? item.label : 'Belum dipilih';
      itemEl.classList.toggle('empty', !item);
    }

    const bayarEl = document.getElementById('summary-' + game + '-bayar');
    if (bayarEl) {
      const bayar = selectedBayar[game];
      bayarEl.textContent = bayar ? labelMetodeBayar(game) : 'Belum dipilih';
      bayarEl.classList.toggle('empty', !bayar);
    }

    updateTotal(game);
  }

  function prosesBeli(game) {
    if (!currentUser()) {
      alert('Silakan login terlebih dahulu sebelum melakukan pembelian!');
      navigateTo('login');
      return;
    }

    const uidMap = { ml: 'ml-uid', ef: 'ef-uid', ff: 'ff-uid' };
    const uid = document.getElementById(uidMap[game]).value.trim();

    if (!uid) { alert('Harap isi User ID / Player ID terlebih dahulu!'); return; }
    if (!selectedNominal[game]) { alert('Pilih nominal top up terlebih dahulu!'); return; }
    if (!selectedBayar[game]) { alert('Pilih metode pembayaran terlebih dahulu!'); return; }
    if (selectedBayarInfo[game] && selectedBayarInfo[game].tipe === 'rekening' && !selectedBayarBank[game]) {
      alert('Pilih bank terlebih dahulu!');
      return;
    }
    if (!selectedBayarNomor[game]) {
      const label = selectedBayarInfo[game] ? selectedBayarInfo[game].label : 'nomor pembayaran';
      alert(`Harap isi ${label} terlebih dahulu!`);
      return;
    }

    const namaGame = { ml: 'Mobile Legends', ef: 'eFootball', ff: 'Free Fire' };
    const item = selectedNominal[game];
    const hasil = hitungTotal(game);
    const totalAkhir = hasil.totalAkhir;
    let totalText = `Rp ${hasil.hargaAsli.toLocaleString('id-ID')}`;
    let diskonInfo = '';

    if (hasil.sumber === 'flashsale') {
      totalText = `Rp ${totalAkhir.toLocaleString('id-ID')} <span style="text-decoration:line-through;color:#4c5678;font-size:12px;">(Rp ${hasil.hargaAsli.toLocaleString('id-ID')})</span>`;
      diskonInfo = '<br><br>🔥 Diskon Flash Sale Jumat 10% berhasil digunakan untuk pembelian ini!';
      tandaiDiskonDipakai();
      initFlashSaleBanner();
    } else if (hasil.sumber === 'voucher') {
      totalText = `Rp ${totalAkhir.toLocaleString('id-ID')} <span style="text-decoration:line-through;color:#4c5678;font-size:12px;">(Rp ${hasil.hargaAsli.toLocaleString('id-ID')})</span>`;
      diskonInfo = `<br><br>🎫 Voucher ${hasil.voucher.code} (${hasil.voucher.nama}) berhasil digunakan!`;
      const user = currentUser();
      const vouchers = getVouchers(user);
      const v = vouchers.find(x => x.code === hasil.voucher.code);
      if (v) v.terpakai = true;
      saveVouchers(user, vouchers);
      voucherTerpilih[game] = null;
    }

    const sekarang = new Date();
    const waktuText = sekarang.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    tambahHistory(currentUser(), {
      game: namaGame[game],
      item: item.label,
      metode: labelMetodeBayar(game),
      total: totalAkhir,
      waktu: waktuText,
    });

    const poinBaru = addPoints(currentUser(), POIN_PER_PEMBELIAN);
    updateAuthUI();
    isiOpsiVoucher(game);
    document.getElementById('voucher-' + game).value = '';
    document.getElementById('voucher-applied-' + game).classList.remove('show');
    updateSummary(game);

    document.getElementById('modal-msg').innerHTML =
      `Pesanan <strong>${item.label}</strong> untuk <strong>${namaGame[game]}</strong> sedang diproses via <strong>${labelMetodeBayar(game)}</strong>.<br>Total: <strong>${totalText}</strong>${diskonInfo}<br><br>Diamond/Coin akan masuk dalam 1–5 menit. Terima kasih!<br><br>✨ Kamu dapat <strong>+${POIN_PER_PEMBELIAN} poin</strong> (total sekarang: <strong>${poinBaru} poin</strong>)<br>📋 Transaksi ini tersimpan di halaman <strong>Riwayat</strong>.<br><br>📤 Jangan lupa kirim bukti transfer ke WhatsApp <strong>+62 812-3456-7890</strong> atau email <strong>support@gamezone.id</strong> agar pesanan diproses lebih cepat.`;
    document.getElementById('modalSukses').classList.add('show');

    // Reset pilihan metode pembayaran & nomor setelah pesanan berhasil dibuat
    selectedBayar[game] = null;
    selectedBayarInfo[game] = null;
    selectedBayarNomor[game] = '';
    selectedBayarBank[game] = '';
    document.querySelectorAll('#bayar-' + game + ' .bayar-item').forEach(el => el.classList.remove('selected'));
    renderBayarDetail(game);
    updateSummary(game);
  }

  function tutupModal() {
    document.getElementById('modalSukses').classList.remove('show');
  }

  // NAVIGASI ANTAR HALAMAN (multi-page, bukan SPA lagi)
  const PAGE_URL = {
    beranda: 'index.html',
    bayar: 'cara-bayar.html',
    tutorial: 'tutorial.html',
    riwayat: 'riwayat.html',
    poin: 'poin.html',
    tentang: 'tentang.html',
    login: 'login.html',
    ml: 'topup-ml.html',
    ef: 'topup-ef.html',
    ff: 'topup-ff.html',
  };
  function navigateTo(id) {
    window.location.href = PAGE_URL[id] || 'index.html';
  }

  // TABS PEMBAYARAN
  function showPayTab(id) {
    document.querySelectorAll('.pay-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.pay-content').forEach(c => c.classList.remove('active'));
    document.getElementById('tab-' + id).classList.add('active');
    event.target.classList.add('active');
  }

  // ===== HARGA MULAI DI GAME CARD (dipakai di Beranda) =====
  function initHargaMulai() {
    const map = { ml: 'harga-mulai-ml', ef: 'harga-mulai-ef', ff: 'harga-mulai-ff' };
    Object.keys(map).forEach(g => {
      const el = document.getElementById(map[g]);
      if (!el) return;
      const min = Math.min(...dataNominal[g].map(i => i.harga));
      el.textContent = 'Mulai Rp ' + min.toLocaleString('id-ID');
    });
  }

  // ===== INIT UMUM (dipanggil di setiap halaman) =====
  function initHalamanUmum() {
    updateAuthUI();
    initFlashSaleBanner();
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  // ===== INIT KHUSUS HALAMAN TOP UP (dipanggil dengan kode game: 'ml' / 'ef' / 'ff') =====
  function initHalamanTopup(game) {
    currentPageId = game;
    renderNominal(game);
    renderBayar(game);
    isiOpsiVoucher(game);
    updateSummary(game);
    initFlashSaleBanner();
  }
