/* Login React — placeholders USER_EMAIL e USER_PASSWORD (substituidos no PowerShell) */
(function () {
  var email = 'USER_EMAIL';
  var password = 'USER_PASSWORD';
  function setInput(el, val) {
    if (!el) return false;
    var desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    if (desc && desc.set) {
      desc.set.call(el, val);
    } else {
      el.value = val;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  var em = document.querySelector('input[type=email]');
  var pw = document.querySelector('input[type=password]');
  if (!em || !pw) return 'no-inputs';
  if (!setInput(em, email)) return 'no-email';
  if (!setInput(pw, password)) return 'no-pass';
  var btn = document.querySelector('form button[type=submit]');
  if (!btn) return 'no-btn';
  btn.click();
  return 'ok';
})();
