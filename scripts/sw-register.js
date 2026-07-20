/*
 Registro do Service Worker com detecção de atualizações
*/

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js', {
        scope: '/'
      });

      console.log('✅ Service Worker registrado com sucesso:', registration);

      // Verificar atualizações a cada 6 horas
      setInterval(() => {
        registration.update();
      }, 6 * 60 * 60 * 1000);

      // Detectar nova versão disponível
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nova versão pronta
            console.log('🔄 Nova versão disponível!');
            
            // Opcional: Mostrar notificação ao usuário
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Gabriel Arcade - Atualização Disponível', {
                body: 'Uma nova versão está pronta. Recarregue para atualizar.',
                icon: './manifest.json',
                badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%230084FF" width="192" height="192" rx="40"/></svg>',
                tag: 'app-update',
                requireInteraction: false
              });
            }

            // Escutar mensagem do novo SW
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });

      // Quando o controller mudar, recarregar a página
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

    } catch (error) {
      console.error('❌ Erro ao registrar Service Worker:', error);
    }
  });

  // Solicitar permissão para notificações
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      console.log('Permissão de notificação:', permission);
    });
  }
}

// Função para limpar cache manualmente (opcional)
window.clearAppCache = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    registration.active.postMessage({ type: 'CLEAR_CACHE' });
    console.log('Cache limpo com sucesso');
  }
};
