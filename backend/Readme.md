tar -xzf jobportal-backend-enterprise.tar.gz
cd jobportal
npm install
cp .env.example .env    # fill values
npm run seed            # DB seed
npm run dev             # development

# Production
pm2 start ecosystem.config.js --env production

<!-- code update  -->
pm2 restart jobportal-api

<!-- logs check  -->
pm2 logs jobportal-api

# Docker
docker-compose up -d