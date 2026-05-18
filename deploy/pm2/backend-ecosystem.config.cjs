module.exports = {
  apps: [
    {
      name: 'esportefy-api',
      cwd: '/var/www/Esportefy-web/Backend',
      script: 'server.js',
      interpreter: 'node',
      exec_mode: 'cluster',
      instances: 4,
      autorestart: true,
      watch: false,
      max_memory_restart: '1500M',
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    }
  ]
};
