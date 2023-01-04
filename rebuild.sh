git reset --hard
git pull
cd backend
npm install
npm run build
cd ../frontend
bash build.sh
pm2 restart touren-fahrer-api
