@echo off

echo .
echo git add -A
git add -A

echo .
echo git status
git status


echo .
echo Does the status seem right? Will do a commit now
pause

echo .
echo git commit -m "Updated dist"
git commit -m "Updated dist"


echo .
echo Final check before pushing to master?
pause

echo .
echo git push origin master
git push origin master


echo .
echo Done! Press any key to close
pause
