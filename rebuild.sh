git reset --hard
git pull
cd frontend
bash build.sh
cd ../backend
bash build.sh
pm2 restart touren-fahrer-api
