/** @type {import('next').NextConfig} */
const nextConfig = {
  // Assurez-vous que l'App Router est activé
  experimental: {
    appDir: true,
  },
  // Activez l'analyse des pages pour le débogage
  output: 'standalone',
  // Assurez-vous que les pages 404 sont correctement gérées
  // Ne modifiez cette ligne que si vous avez défini une page 404 personnalisée
  // trailingSlash: true,
  // Assurez-vous qu'il n'y a pas de redirections configurées qui pourraient causer des problèmes
  // Si vous avez des redirections, vérifiez qu'elles sont correctes:
  /*
  async redirects() {
    return [
      {
        source: '/get-started',
        destination: '/dashboard',
        permanent: false,
      },
    ]
  },
  */
}

module.exports = nextConfig
