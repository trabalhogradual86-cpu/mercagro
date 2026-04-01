/* Primeiro botao Editar em Meus Equipamentos */
(function () {
  var btns = Array.from(document.querySelectorAll('main button'));
  var b = btns.find(function (x) {
    return (x.innerText || '').trim() === 'Editar';
  });
  if (!b) return 'no';
  b.scrollIntoView({ block: 'center', behavior: 'smooth' });
  b.click();
  return 'ok';
})();
