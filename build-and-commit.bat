git checkout master
git pull origin master
git merge dev
echo all good?
pause
rimraf dist && webpack --config config/webpack.prod.js --progress --profile --bail
git add -A Dist/\*.*