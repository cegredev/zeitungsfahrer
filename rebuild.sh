git reset --hard
git pull
cd backend
bash build.sh
cd ../frontend
bash build.sh
pm2 restart touren-fahrer-api
