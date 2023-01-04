shopt -s dotglob # Makes sure .htaccess is also moved
rm -rf /var/www/tourenfaher/*
mv ../maintenance_frontend/* /var/www/tourenfahrer
npm install
npm run build
rm -rf /var/www/tourenfahrer/*
mv build/* /var/www/tourenfahrer
echo "The contents of this folder have been moved to /var/www/tourenfahrer" > build/this_is_supposed_to_be_empty
