(function () {
  try {
    function readCookie(name) {
      var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
      return match ? decodeURIComponent(match[1]) : null
    }

    var mode = readCookie('resume-theme-mode')
    var root = document.documentElement

    if (mode === 'dark') {
      root.classList.add('dark')
      root.style.colorScheme = 'dark'
    } else if (mode === 'light') {
      root.classList.remove('dark')
      root.style.colorScheme = 'light'
    } else {
      var raw = localStorage.getItem('resume-theme')
      if (!raw) return
      var theme = JSON.parse(raw)
      if (theme.mode === 'dark') {
        root.classList.add('dark')
        root.style.colorScheme = 'dark'
      } else {
        root.classList.remove('dark')
        root.style.colorScheme = 'light'
      }
      if (theme.primaryColor) {
        root.style.setProperty('--color-primary', theme.primaryColor)
      }
      return
    }

    var savedTheme = localStorage.getItem('resume-theme')
    if (savedTheme) {
      var parsed = JSON.parse(savedTheme)
      if (parsed.primaryColor) {
        root.style.setProperty('--color-primary', parsed.primaryColor)
      }
    }
  } catch (e) {}
})()
