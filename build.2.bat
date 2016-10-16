@echo off

set /p PublishBranch = Enter the name of the publish branch (generally "staging" or "master"):

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
echo Final check before pushing to %PublishBranch%?
pause

echo .
echo git push origin %PublishBranch%
git push origin %PublishBranch%


echo .
echo Done! Press any key to close
pause
