/* Foco no primeiro card do painel (outline visivel no video) */
(function () {
  var b = document.querySelector('main button.card-hover');
  if (!b) return 'no';
  b.scrollIntoView({ block: 'center', behavior: 'smooth' });
  b.focus();
  return 'ok';
})();
