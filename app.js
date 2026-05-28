/* =====================================================
   Kalkulátor splátek – app.js
   Vzorec anuitní splátky:
     M = P × [i × (1+i)^n] / [(1+i)^n − 1]
   kde:
     P = jistina
     i = měsíční úroková sazba (roční / 12 / 100)
     n = počet splátek
   ===================================================== */

// ── Service Worker registrace ───────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .catch(err => console.warn('SW registration failed:', err));
  });
}

// ── Formátování čísel ───────────────────────────────
const fmtCurrency = new Intl.NumberFormat('cs-CZ', {
  style: 'currency',
  currency: 'CZK',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const fmtPercent = new Intl.NumberFormat('cs-CZ', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4
});

function formatCZK(amount) {
  return fmtCurrency.format(amount);
}

// ── Výpočet ─────────────────────────────────────────
function calculate() {
  const principalInput = document.getElementById('principal');
  const rateInput = document.getElementById('rate');
  const monthsInput = document.getElementById('months');

  const P = parseFloat(principalInput.value);
  const annualRate = parseFloat(rateInput.value);
  const n = parseInt(monthsInput.value, 10);

  // Validace vstupů
  if (!principalInput.value.trim() || isNaN(P) || P <= 0) {
    showError(principalInput, 'Zadejte platnou jistinu (kladné číslo).');
    return;
  }
  clearError(principalInput);

  if (!rateInput.value.trim() || isNaN(annualRate) || annualRate < 0) {
    showError(rateInput, 'Zadejte platnou úrokovou sazbu (0 nebo více).');
    return;
  }
  clearError(rateInput);

  if (!monthsInput.value.trim() || isNaN(n) || n <= 0 || !Number.isInteger(n)) {
    showError(monthsInput, 'Zadejte platný počet splátek (celé kladné číslo).');
    return;
  }
  clearError(monthsInput);

  // Měsíční úroková sazba
  const i = annualRate / 100 / 12;

  // Výpočet anuitní splátky
  let M;
  if (i === 0) {
    // Bezúročná půjčka – rovnoměrné splátky
    M = P / n;
  } else {
    const factor = Math.pow(1 + i, n);
    M = P * (i * factor) / (factor - 1);
  }

  const totalPayment = M * n;
  const totalInterest = totalPayment - P;

  // ── Zobrazení souhrnu ───────────────────────────
  document.getElementById('monthlyPayment').textContent = formatCZK(M);
  document.getElementById('displayPrincipal').textContent = formatCZK(P);
  document.getElementById('displayRate').textContent = fmtPercent.format(annualRate) + ' %';
  document.getElementById('displayMonthlyRate').textContent = fmtPercent.format(i * 100) + ' %';
  document.getElementById('displayMonths').textContent = n + ' měsíců';
  document.getElementById('totalPayment').textContent = formatCZK(totalPayment);
  document.getElementById('totalInterest').textContent = formatCZK(totalInterest);

  // ── Splátkový kalendář ──────────────────────────
  buildSchedule(P, M, i, n);

  // ── Zobrazení sekce výsledků ────────────────────
  const resultsSection = document.getElementById('results');
  resultsSection.classList.remove('hidden');

  setTimeout(() => {
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 80);
}

// ── Sestavení splátkového kalendáře ─────────────────
function buildSchedule(P, M, i, n) {
  const tbody = document.getElementById('scheduleBody');
  tbody.innerHTML = '';

  let balance = P;

  for (let month = 1; month <= n; month++) {
    const interestPayment = balance * i;
    let principalPayment = M - interestPayment;

    balance -= principalPayment;

    // Oprava plovoucí desetinné čárky v poslední splátce
    if (month === n || balance < 0.005) {
      balance = 0;
    }

    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + month + '</td>' +
      '<td>' + formatCZK(M) + '</td>' +
      '<td>' + formatCZK(interestPayment) + '</td>' +
      '<td>' + formatCZK(principalPayment) + '</td>' +
      '<td>' + formatCZK(balance) + '</td>';

    tbody.appendChild(tr);
  }
}

// ── Rozbalení / sbalení kalendáře ───────────────────
function toggleSchedule() {
  const content = document.getElementById('scheduleContent');
  const icon = document.getElementById('toggleIcon');
  const toggle = document.getElementById('scheduleToggle');

  const isHidden = content.classList.contains('hidden');
  content.classList.toggle('hidden');
  icon.classList.toggle('open', isHidden);
  toggle.setAttribute('aria-expanded', String(isHidden));
}

// ── Reset formuláře ──────────────────────────────────
function resetForm() {
  document.getElementById('principal').value = '';
  document.getElementById('rate').value = '';
  document.getElementById('months').value = '';

  document.getElementById('results').classList.add('hidden');

  // Sbalit kalendář pro příště
  document.getElementById('scheduleContent').classList.add('hidden');
  document.getElementById('toggleIcon').classList.remove('open');

  // Odstranit chybové hlášky
  document.querySelectorAll('input').forEach(clearError);

  document.getElementById('principal').focus();
}

// ── Pomocné funkce pro validaci ──────────────────────
function showError(input, message) {
  clearError(input);
  input.style.borderColor = '';
  const wrapper = input.closest('.input-wrapper');
  if (wrapper) {
    wrapper.style.borderColor = '#D32F2F';
    wrapper.style.boxShadow = '0 0 0 3px rgba(211,47,47,0.12)';
  }
  const errEl = document.createElement('p');
  errEl.className = 'field-error';
  errEl.textContent = message;
  errEl.style.cssText = 'color:#D32F2F;font-size:0.75rem;margin-top:5px;font-weight:500;';
  input.closest('.form-group').appendChild(errEl);
  input.focus();
}

function clearError(input) {
  const wrapper = input.closest('.input-wrapper');
  if (wrapper) {
    wrapper.style.borderColor = '';
    wrapper.style.boxShadow = '';
  }
  const group = input.closest('.form-group');
  if (group) {
    const err = group.querySelector('.field-error');
    if (err) err.remove();
  }
}

// ── Enter spustí výpočet ─────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') calculate();
    });
    input.addEventListener('input', () => clearError(input));
  });
});
