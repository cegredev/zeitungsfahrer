git pull
cd ../frontend
bash build.sh
cd backend
npm install
npm run build
pm2 restart touren-fahrer-api
