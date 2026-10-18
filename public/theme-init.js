// Applies the saved theme before first paint to avoid a flash. Reads only the theme setting.
(function () {
  try {
    var raw = localStorage.getItem('equanim:data');
    var theme = raw ? (JSON.parse(raw).settings || {}).theme : 'system';
    var dark = theme === 'dark' || ((!theme || theme === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
