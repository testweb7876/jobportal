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

<!-- stop -->
pm2 stop all
<!-- logs check  -->
pm2 logs jobportal-api

# Docker
docker-compose up -d



| Role       | Email                                                       | Password      |
| ---------- | ----------------------------------------------------------- | ------------- |
| superadmin | [superadmin@jobportal.com]                                  | Admin@123456  |
| admin      | [admin@jobportal.com]                                       | Admin@123456  |
| employer   | [employer@jobportal.com]                                    | Employer@123  |
| jobseeker  | [jobseeker@jobportal.com]                                   | Jobseeker@123 |
