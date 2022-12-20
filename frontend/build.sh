npm install
npm run build
rm -rf /var/www/tourenfahrer/*
shopt -s dotglob # Makes sure .htaccess is also moved
mv build/* /var/www/tourenfahrer
