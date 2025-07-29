// Development widget loader
// This file redirects to the Vite dev server during development
(function() {
  const script = document.createElement('script');
  script.type = 'module';
  script.src = 'http://localhost:5173/src/widget/loader.ts';
  document.head.appendChild(script);
})();