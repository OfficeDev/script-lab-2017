@echo off

echo This script is designed to automate the simple 
echo "dev -> master -> build -> push" flow
echo To start, we'll checkout master and merge "dev" into it. Ready?
echo .
pause


echo .
echo git checkout master
git checkout master

echo .
echo git pull origin master
git pull origin master

echo .
echo git merge dev
git merge dev


echo .
echo All good? Will now do a build.
pause

echo .
npm run build