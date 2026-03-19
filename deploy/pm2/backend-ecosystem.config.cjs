module.exports = {
  apps: [
    {
      name: 'glitchgang-api',
      cwd: '/var/www/glitchgang/Backend',
      script: 'server.js',
      interpreter: 'node',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '600M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    }
  ]
};
