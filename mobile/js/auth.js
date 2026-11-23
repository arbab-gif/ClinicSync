/* ClinicSync mobile auth flow. Copy and rules match the web Player auth screens.
   Prototype rules: code 000000 is wrong, any other 6 digits works; a "gmial" email has no account. */
(() => {
  const I = '../organizer/assets/icons/';
  const app = document.getElementById('app');
  const $ = id => document.getElementById(id);
  const go = route => { location.hash = '#/' + route; };
  const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const store = {
    get email() { return sessionStorage.getItem('cs_m_email') || ''; },
    set email(v) { sessionStorage.setItem('cs_m_email', v.trim()); },
    get name() { return sessionStorage.getItem('cs_m_name') || ''; },
    set name(v) { sessionStorage.setItem('cs_m_name', v.trim()); },
  };
  let timer = null, toastTimer = null;

  const toast = msg => {
    const t = $('toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2400);
  };
  const back = to => `<div class="topbar"><a class="icon-btn" href="#/${to}" aria-label="Back"><img src="${I}arrow-left.svg" alt=""></a></div>`;
  const head = (title, sub) => `<div class="head"><h1 tabindex="-1">${title}</h1><p>${sub}</p></div>`;
  const field = ({ id, label, type = 'text', ph, auto, mode, eye }) => `
    <div class="field">
      <label for="${id}">${label}<span class="req" aria-hidden="true"> *</span></label>
      <div class="box" id="${id}-box">
        <input id="${id}" type="${type}" placeholder="${ph}" autocomplete="${auto}"${mode ? ` inputmode="${mode}"` : ''} autocapitalize="${type === 'text' ? 'words' : 'none'}" aria-describedby="${id}-err">
        ${eye ? `<button class="eye" type="button" data-eye="${id}" aria-label="Show password" aria-pressed="false"><img src="${I}eye.svg" alt=""></button>` : ''}
      </div>
      <div class="error" id="${id}-err" role="alert" hidden></div>
    </div>`;
  const setErr = (id, msg) => {
    const box = $(id + '-box'), err = $(id + '-err');
    box.classList.toggle('err', !!msg); err.textContent = msg || ''; err.hidden = !msg;
    $(id).setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  };
  const clearOnType = (...ids) => ids.forEach(id => $(id).addEventListener('input', () => setErr(id, '')));
  const bindEyes = () => document.querySelectorAll('[data-eye]').forEach(b => b.addEventListener('click', () => {
    const input = $(b.dataset.eye), show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    b.setAttribute('aria-pressed', show); b.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  }));
  const busy = (btn, label) => { btn.classList.add('loading'); btn.setAttribute('aria-label', label); btn.innerHTML = '<span class="spinner"></span>'; };
  const idle = (btn, text) => { btn.classList.remove('loading'); btn.removeAttribute('aria-label'); btn.textContent = text; };
  const firstInvalid = () => { const el = app.querySelector('[aria-invalid="true"]'); if (el) el.focus(); };

  const screens = {
    welcome: {
      html: () => `<section class="welcome">
        <span class="ring" aria-hidden="true"></span>
        <span class="brand"><img src="../organizer/assets/logo-mark.png" alt="">ClinicSync</span>
        <div class="welcome-copy">
          <div><h1 tabindex="-1">Join clinics. Play more. Stay <em>connected.</em></h1></div>
          <p>RSVP to sessions, step in as a substitute and keep up with your group.</p>
          <div class="welcome-actions">
            <a class="btn" href="#/sign-up">Create account</a>
            <a class="btn ghost" href="#/sign-in">Sign in</a>
          </div>
        </div>
      </section>`,
    },

    'sign-in': {
      html: () => `<section class="screen">${back('welcome')}
        ${head('Welcome back', 'Sign in to see your clinics and sessions.')}
        <form id="f" novalidate>
          <div class="fields">
            ${field({ id: 'email', label: 'Email', type: 'email', ph: 'Enter your email', auto: 'email', mode: 'email' })}
            ${field({ id: 'pw', label: 'Password', type: 'password', ph: 'Enter your password', auto: 'current-password', eye: true })}
            <a class="link" href="#/forgot">Forgot password</a>
          </div>
          <button class="btn" id="submit" type="submit">Sign in</button>
          <p class="alt">Don't have an account? <a href="#/sign-up">Sign up</a></p>
        </form></section>`,
      bind() {
        $('email').value = store.email; bindEyes(); clearOnType('email', 'pw');
        $('f').addEventListener('submit', e => {
          e.preventDefault();
          const a = setErr('email', emailOk($('email').value) ? '' : 'Enter a valid email address.');
          const b = setErr('pw', $('pw').value ? '' : 'Enter your password.');
          if (!a || !b) return firstInvalid();
          store.email = $('email').value; busy($('submit'), 'Signing in');
          timer = setTimeout(() => go('home'), 700);
        });
      },
    },

    'sign-up': {
      html: () => `<section class="screen">${back('welcome')}
        ${head('Create your account', 'Join clinics as a player or substitute.')}
        <form id="f" novalidate>
          <div class="fields">
            ${field({ id: 'name', label: 'Full name', ph: 'Enter your full name', auto: 'name' })}
            ${field({ id: 'email', label: 'Email', type: 'email', ph: 'Enter your email', auto: 'email', mode: 'email' })}
            ${field({ id: 'pw', label: 'Password', type: 'password', ph: 'Enter your password', auto: 'new-password', eye: true })}
          </div>
          <button class="btn" type="submit">Sign up</button>
          <p class="terms">By continuing, you agree to our <button type="button" data-doc="Terms &amp; Conditions">Terms &amp; Conditions</button> and <button type="button" data-doc="Privacy Policy">Privacy Policy</button></p>
          <p class="alt">Already have an account? <a href="#/sign-in">Sign in</a></p>
        </form></section>`,
      bind() {
        bindEyes(); clearOnType('name', 'email', 'pw');
        app.querySelectorAll('[data-doc]').forEach(b => b.addEventListener('click', () => toast(`${b.dataset.doc} isn't in this prototype yet`)));
        $('f').addEventListener('submit', e => {
          e.preventDefault();
          const checks = [
            setErr('name', $('name').value.trim() ? '' : 'Enter your full name.'),
            setErr('email', emailOk($('email').value) ? '' : 'Enter a valid email address.'),
            setErr('pw', $('pw').value.length >= 8 ? '' : 'Use at least 8 characters.'),
          ];
          if (!checks.every(Boolean)) return firstInvalid();
          store.name = $('name').value; store.email = $('email').value;
          go('verify?from=signup');
        });
      },
    },

    forgot: {
      html: () => `<section class="screen">${back('sign-in')}
        ${head('Forgot password?', "Enter the email linked to your account and we'll send you a 6-digit code.")}
        <form id="f" novalidate>
          <div class="fields">${field({ id: 'email', label: 'Email', type: 'email', ph: 'Enter your email', auto: 'email', mode: 'email' })}</div>
          <button class="btn" id="submit" type="submit" disabled style="opacity:.45">Send code</button>
          <p class="alt"><a href="#/sign-in">Back to sign in</a></p>
        </form></section>`,
      bind() {
        const btn = $('submit');
        const sync = () => { const on = !!$('email').value.trim(); btn.disabled = !on; btn.style.opacity = on ? '' : '.45'; };
        $('email').value = store.email; sync(); clearOnType('email');
        $('email').addEventListener('input', sync);
        $('f').addEventListener('submit', e => {
          e.preventDefault();
          const v = $('email').value;
          if (!setErr('email', emailOk(v) ? '' : 'Enter a valid email address.')) return firstInvalid();
          if (/gmial/i.test(v)) { setErr('email', "We couldn't find an account with this email."); return firstInvalid(); }
          store.email = v; go('verify?from=reset');
        });
      },
    },

    verify: {
      html: q => {
        const signup = q.get('from') === 'signup';
        return `<section class="screen">${back(signup ? 'sign-up' : 'forgot')}
        ${head('Check your email', 'We sent a 6-digit code to <b id="who"></b>')}
        <form id="f" novalidate>
          <div class="code-wrap">
            <div class="otp" id="otp" role="group" aria-label="6-digit code">
              ${Array.from({ length: 6 }, (_, i) => `<input inputmode="numeric" pattern="[0-9]*" maxlength="6" aria-label="Digit ${i + 1}"${i === 0 ? ' autocomplete="one-time-code"' : ' autocomplete="off"'}>`).join('')}
            </div>
            <div class="error" id="otp-err" role="alert" hidden></div>
            <p class="code-note" id="note"></p>
          </div>
          <button class="btn" id="submit" type="submit">Verify</button>
          <p class="alt"><a href="#/${signup ? 'sign-up' : 'sign-in'}">Back to ${signup ? 'sign up' : 'sign in'}</a></p>
        </form></section>`;
      },
      bind(q) {
        const signup = q.get('from') === 'signup';
        $('who').textContent = store.email || 'your email';
        const inputs = [...app.querySelectorAll('#otp input')], otp = $('otp'), err = $('otp-err'), btn = $('submit');
        const showErr = msg => { otp.classList.add('err'); err.textContent = msg; err.hidden = false; };
        const clear = () => { otp.classList.remove('err'); err.hidden = true; };
        const fill = (digits, from) => { [...digits].slice(0, 6 - from).forEach((d, k) => { inputs[from + k].value = d; }); inputs[Math.min(from + digits.length, 5)].focus(); };
        inputs.forEach((el, i) => {
          el.addEventListener('input', () => {
            const d = el.value.replace(/\D/g, ''); clear();
            if (d.length > 1) { el.value = ''; fill(d, i); return; }
            el.value = d; if (d && inputs[i + 1]) inputs[i + 1].focus();
          });
          el.addEventListener('keydown', e => {
            if (e.key === 'Backspace' && !el.value && inputs[i - 1]) { e.preventDefault(); inputs[i - 1].value = ''; inputs[i - 1].focus(); }
            if (e.key === 'ArrowLeft' && inputs[i - 1]) inputs[i - 1].focus();
            if (e.key === 'ArrowRight' && inputs[i + 1]) inputs[i + 1].focus();
          });
          el.addEventListener('paste', e => {
            const d = (e.clipboardData.getData('text') || '').replace(/\D/g, '');
            if (d) { e.preventDefault(); clear(); fill(d, i); }
          });
        });
        const count = () => {
          let s = 30; const note = $('note');
          const draw = () => { note.textContent = `Didn't receive the code? Resend in 00:${String(s).padStart(2, '0')}`; };
          draw(); clearInterval(timer);
          timer = setInterval(() => {
            s -= 1;
            if (s > 0) return draw();
            clearInterval(timer);
            note.innerHTML = 'Didn\'t receive the code? <button type="button" id="resend">Resend</button>';
            $('resend').addEventListener('click', () => { toast('New code sent'); inputs.forEach(x => { x.value = ''; }); clear(); inputs[0].focus(); count(); });
          }, 1000);
        };
        count(); inputs[0].focus();
        $('f').addEventListener('submit', e => {
          e.preventDefault();
          const code = inputs.map(x => x.value).join('');
          if (code.length < 6) return showErr('Enter all 6 digits.');
          clearInterval(timer); busy(btn, 'Verifying');
          timer = setTimeout(() => {
            if (code === '000000') { idle(btn, 'Verify'); showErr('That code is incorrect. Try again.'); count(); inputs[0].focus(); return; }
            go(signup ? 'home' : 'new-password');
          }, 900);
        });
      },
    },

    'new-password': {
      html: () => `<section class="screen">${back('sign-in')}
        ${head('Create new password', 'Your new password must be different from previous passwords.')}
        <form id="f" novalidate>
          <div class="fields">
            <div>
              ${field({ id: 'pw', label: 'New password', type: 'password', ph: 'Enter new password', auto: 'new-password', eye: true })}
              <ul class="rules" id="rules" style="margin-top:10px">
                <li data-r="len">At least 8 characters</li><li data-r="up">One uppercase letter</li>
                <li data-r="num">One number</li><li data-r="sp">One special character</li>
              </ul>
            </div>
            ${field({ id: 'pw2', label: 'Confirm password', type: 'password', ph: 'Re-enter new password', auto: 'new-password', eye: true })}
          </div>
          <button class="btn" type="submit">Reset password</button>
        </form></section>`,
      bind() {
        const rules = { len: v => v.length >= 8, up: v => /[A-Z]/.test(v), num: v => /\d/.test(v), sp: v => /[^A-Za-z0-9]/.test(v) };
        bindEyes(); clearOnType('pw', 'pw2');
        $('pw').addEventListener('input', () => app.querySelectorAll('#rules li').forEach(li => li.classList.toggle('met', rules[li.dataset.r]($('pw').value))));
        $('f').addEventListener('submit', e => {
          e.preventDefault();
          const strong = Object.values(rules).every(r => r($('pw').value));
          const a = setErr('pw', strong ? '' : 'Password does not meet all requirements.');
          const b = setErr('pw2', !strong || $('pw').value === $('pw2').value ? '' : "Passwords don't match.");
          if (!a || !b) return firstInvalid();
          go('password-updated');
        });
      },
    },

    'password-updated': {
      html: () => `<section class="screen"><div class="center">
        <span class="badge"><img src="${I}check-circle-green.svg" alt=""></span>
        ${head('Password updated', 'Your password has been reset. Sign in with your new password.')}
      </div><a class="btn" href="#/sign-in">Back to sign in</a></section>`,
    },

    // End of the auth flow. The player home replaces this screen next.
    home: {
      html: () => `<section class="screen"><div class="center">
        <span class="badge"><img src="${I}check-circle-green.svg" alt=""></span>
        ${head(`You're in${store.name ? ', <span id="first"></span>' : ''}`, 'Your account is ready. The player home screen comes next.')}
        <div class="plan"><b>Starter plan</b><div class="chips"><span>Player</span><span>Substitute</span></div></div>
      </div><button class="btn soft" id="out" type="button">Sign out</button></section>`,
      bind() {
        if ($('first')) $('first').textContent = store.name.split(/\s+/)[0];
        $('out').addEventListener('click', () => { sessionStorage.removeItem('cs_m_name'); go('welcome'); });
      },
    },
  };

  const render = () => {
    clearTimeout(timer); clearInterval(timer); $('toast').hidden = true;
    const [path, query = ''] = location.hash.replace(/^#\/?/, '').split('?');
    if (!screens[path]) { location.replace('#/welcome'); return; }
    const q = new URLSearchParams(query), s = screens[path];
    app.innerHTML = s.html(q); app.scrollTop = 0;
    if (s.bind) s.bind(q);
    if (!app.contains(document.activeElement) || document.activeElement === app) { const h = app.querySelector('h1'); if (h) h.focus({ preventScroll: true }); }
  };
  window.addEventListener('hashchange', render);
  render();
})();
