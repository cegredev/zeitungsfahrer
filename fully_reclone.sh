mv backend/.env ../tourenfahrer.env
mv backend/store ../tourenfahrer.store
cd ..
rm -rf tourenfahrer
git clone https://github.com/cegredev/tourenfahrer.git tourenfahrer
mv tourenfahrer.env tourenfahrer/backend/.env
mv tourenfahrer.store tourenfahrer/backend/store
cd tourenfahrer
bash rebuild.sh
