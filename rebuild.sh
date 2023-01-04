git reset --hard
git pull
cd backend
npm install
cd ../frontend
bash build.sh
npm run build
pm2 restart touren-fahrer-api
