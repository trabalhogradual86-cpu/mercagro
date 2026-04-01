/* Aba admin por indice: div em main com exatamente 6 botoes filhos (barra de abas) */
(function () {
  var i = __INDEX__;
  var main = document.querySelector('main');
  if (!main) return 'no-main';
  var tabRow = Array.from(main.querySelectorAll('div')).find(function (d) {
    return d.querySelectorAll(':scope > button').length === 6;
  });
  if (!tabRow) return 'no-row';
  var buttons = Array.from(tabRow.querySelectorAll(':scope > button'));
  var btn = buttons[i];
  if (!btn) return 'no-idx';
  btn.scrollIntoView({ block: 'center', behavior: 'smooth' });
  btn.click();
  return 'ok';
})();
