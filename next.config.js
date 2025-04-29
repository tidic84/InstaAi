/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Exclure les modules natifs qui posent problème lors du bundling
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        're2': false,
        'instagram-private-api': false,
      }
    }
    
    return config
  },
  // Assurez-vous que l'App Router est activé
  experimental: {
    appDir: true,
    // Activer le middleware optionel pour bloquer l'accès aux API routes client-side
    serverComponentsExternalPackages: ['instagram-private-api', 're2'],
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
