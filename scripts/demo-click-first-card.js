/* Primeiro card do catalogo (div ou button.card-hover na grid) */
(function () {
  var c =
    document.querySelector('main .grid .card-hover') ||
    document.querySelector('main .card-hover') ||
    document.querySelector('main button.card-hover');
  if (!c) return 'no-card';
  c.scrollIntoView({ block: 'center', behavior: 'smooth' });
  c.click();
  return 'ok';
})();
