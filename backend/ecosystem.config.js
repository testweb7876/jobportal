module.exports = {
  apps: [{
    name: 'jobportal-api',
    script: 'src/server.js',
    instances: 'max',       // use all CPU cores
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 5000,
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
    },
    error_file: 'logs/pm2-error.log',
    out_file:   'logs/pm2-out.log',
    log_file:   'logs/pm2-combined.log',
    time: true,
  }],
};
