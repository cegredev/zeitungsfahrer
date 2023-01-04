npm install
npm run build
rm -rf /var/www/tourenfahrer/*
shopt -s dotglob # Makes sure .htaccess is also moved
mv build/* /var/www/tourenfahrer
echo "The contents of this folder have been moved to /var/www/tourenfahrer" > this_is_supposed_to_be_empty
