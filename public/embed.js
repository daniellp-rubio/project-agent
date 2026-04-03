;(function () {
  'use strict'

  var script = document.currentScript ||
    document.querySelector('script[data-agent-id]')

  if (!script) return

  var agentId = script.getAttribute('data-agent-id')
  var position = script.getAttribute('data-position') || 'bottom-right'
  var primaryColor = script.getAttribute('data-primary-color') || '#2563eb'

  if (!agentId) {
    console.warn('[AgentHub] data-agent-id is required')
    return
  }

  // Obtener la URL base del script
  var scriptSrc = script.src
  var baseUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf('/'))

  // Crear el iframe
  var iframe = document.createElement('iframe')
  var positionStyle =
    position === 'bottom-left'
      ? 'bottom:0;left:0;'
      : 'bottom:0;right:0;'

  iframe.src = baseUrl + '/chat/' + agentId +
    '?embedded=1' +
    '&primaryColor=' + encodeURIComponent(primaryColor) +
    '&position=' + encodeURIComponent(position)

  iframe.style.cssText = [
    'position:fixed',
    positionStyle,
    'width:420px',
    'height:100vh',
    'max-height:100vh',
    'border:none',
    'z-index:2147483647',
    'pointer-events:none',
    'opacity:0',
    'transition:opacity 0.2s ease',
  ].join(';')

  iframe.setAttribute('title', 'Chat widget')
  iframe.setAttribute('allow', 'microphone')

  document.body.appendChild(iframe)

  // Escuchar mensajes del iframe para redimensionar
  window.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'AGENT_HUB_READY') {
      iframe.style.pointerEvents = 'auto'
      iframe.style.opacity = '1'
    }
    if (event.data && event.data.type === 'AGENT_HUB_CLOSE') {
      iframe.style.pointerEvents = 'none'
      iframe.style.opacity = '0'
    }
  })

  iframe.onload = function () {
    setTimeout(function () {
      iframe.style.pointerEvents = 'auto'
      iframe.style.opacity = '1'
    }, 300)
  }
})()
