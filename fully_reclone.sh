cd ..
mv tourenfahrer/backend/.env tourenfahrer.env
mv tourenfahrer/backend/store tourenfahrer.store
rm -rf tourenfahrer
git clone https://github.com/cegredev/tourenfahrer.git tourenfahrer
mv tourenfahrer.env tourenfahrer/backend/.env
mv tourenfahrer.store tourenfahrer/backend/store
cd tourenfahrer
bash rebuild.sh
