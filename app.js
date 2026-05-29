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

  // ── Předvyplnit zbývající měsíce v panelu přepočtu
  // (jen pokud uživatel ještě nezadal číslo splátky)
  const afterMonthInput = document.getElementById('recalcAfterMonth');
  if (!afterMonthInput.value.trim()) {
    document.getElementById('recalcMonths').value = n;
  }

  // ── Zobrazení sekce výsledků ────────────────────
  const resultsSection = document.getElementById('results');
  resultsSection.classList.remove('hidden');

  setTimeout(() => {
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 80);
}

// ── Sestavení splátkového kalendáře ─────────────────
// Pořadí: nejprve se postupně splatí veškeré úroky,
// teprve poté se začíná umořovat jistina.
function buildSchedule(P, M, i, n) {
  const tbody = document.getElementById('scheduleBody');
  tbody.innerHTML = '';

  // Celkový fond úroků = co zaplatí dlužník navíc oproti jistině
  let interestPool = M * n - P;
  let balance = P;

  for (let month = 1; month <= n; month++) {
    let interestPayment, principalPayment;

    if (interestPool > 0.005) {
      // Stále splácíme úroky
      interestPayment = Math.min(M, interestPool);
      principalPayment = M - interestPayment;
      interestPool -= interestPayment;
    } else {
      // Všechny úroky zaplaceny – celá splátka jde na jistinu
      interestPayment = 0;
      principalPayment = M;
    }

    balance -= principalPayment;

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

// ── Rozbalení / sbalení panelu přepočtu ─────────────
function toggleRecalc() {
  const content = document.getElementById('recalcContent');
  const icon = document.getElementById('recalcIcon');
  const toggle = document.getElementById('recalcToggle');

  const isHidden = content.classList.contains('hidden');
  content.classList.toggle('hidden');
  icon.classList.toggle('open', isHidden);
  toggle.setAttribute('aria-expanded', String(isHidden));
}

// ── Vyplnění zůstatku podle čísla splátky ───────────
function recalcFillBalance() {
  const afterMonth = parseInt(document.getElementById('recalcAfterMonth').value, 10);
  const hint = document.getElementById('recalcMonthHint');
  const balanceInput = document.getElementById('recalcBalance');
  const monthsInput = document.getElementById('recalcMonths');

  if (isNaN(afterMonth) || afterMonth < 1) {
    hint.textContent = '';
    return;
  }

  // Najít zůstatek z tabulky
  const rows = document.querySelectorAll('#scheduleBody tr');
  if (afterMonth <= rows.length) {
    const cell = rows[afterMonth - 1].querySelector('td:last-child');
    if (cell) {
      const raw = cell.textContent.replace(/\u00a0/g, '').replace(/[^0-9,.-]/g, '').replace(',', '.');
      const val = parseFloat(raw);
      if (!isNaN(val)) {
        balanceInput.value = val.toFixed(2);
        clearError(balanceInput);
        hint.textContent = '→ zůstatek ' + cell.textContent.trim();
      }
    }
    // Předvyplnit zbývající měsíce
    const totalRows = rows.length;
    monthsInput.value = totalRows - afterMonth;
  } else {
    hint.textContent = '(splátka neexistuje)';
  }
}

// ── Přepočet po inflaci ──────────────────────────────
function applyRecalc() {
  const balanceInput = document.getElementById('recalcBalance');
  const inflationInput = document.getElementById('recalcInflation');
  const monthsInput = document.getElementById('recalcMonths');

  const balance = parseFloat(balanceInput.value);
  const inflation = parseFloat(inflationInput.value);
  const months = parseInt(monthsInput.value, 10);

  if (!balanceInput.value.trim() || isNaN(balance) || balance <= 0) {
    showError(balanceInput, 'Zadejte platný zůstatek dluhu.');
    return;
  }
  clearError(balanceInput);

  if (!inflationInput.value.trim() || isNaN(inflation) || inflation < 0 || inflation > 100) {
    showError(inflationInput, 'Zadejte platnou inflaci (0–100 %).');
    return;
  }
  clearError(inflationInput);

  if (!monthsInput.value.trim() || isNaN(months) || months <= 0 || !Number.isInteger(months)) {
    showError(monthsInput, 'Zadejte platný počet zbývajících měsíců.');
    return;
  }
  clearError(monthsInput);

  // Navýšení zůstatku o inflaci a předvyplnění formuláře
  const newPrincipal = balance * (1 + inflation / 100);
  document.getElementById('principal').value = newPrincipal.toFixed(2);
  document.getElementById('months').value = months;

  // Scrollovat nahoru a spustit výpočet
  document.querySelector('.input-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  setTimeout(() => calculate(), 400);
}

// ── Reset formuláře ──────────────────────────────────
function resetForm() {
  document.getElementById('principal').value = '';
  document.getElementById('rate').value = '';
  document.getElementById('months').value = '';

  document.getElementById('results').classList.add('hidden');

  ['recalcAfterMonth', 'recalcBalance', 'recalcInflation', 'recalcMonths'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  document.getElementById('scheduleContent').classList.add('hidden');
  document.getElementById('toggleIcon').classList.remove('open');

  document.querySelectorAll('input').forEach(clearError);
  document.getElementById('principal').focus();
}

// ── Pomocné funkce pro validaci ──────────────────────
function showError(input, message) {
  clearError(input);
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

// ── Enter spustí výpočet / přepočet ─────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        if (input.closest('#recalcContent')) {
          applyRecalc();
        } else {
          calculate();
        }
      }
    });
    input.addEventListener('input', () => clearError(input));
  });
});