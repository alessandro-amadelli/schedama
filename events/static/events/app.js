registerSW();

async function registerSW() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('{% url "sw.js" %}', {
        scope: "/"
    });
    } catch(err) {
      console.log('SW registration failed: ', err);
    }
  }
}
