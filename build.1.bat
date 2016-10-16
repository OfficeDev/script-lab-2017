@echo off

echo This script is designed to automate the simple 
echo "dev -> {publish-branch} -> build -> push" flow

set /p PublishBranch=Enter the name of the publish branch (generally "staging" or "master"):
set /p PullBranch=Enter the name of the branch to pull changes from (generally "dev" or "staging"):

echo We will now checkout "%PublishBranch%" and merge "%PullBranch%" into it. Ready? If not, close the command prompt now.
echo .
pause


echo .
echo git checkout %PublishBranch%
git checkout %PublishBranch%

echo .
echo git pull origin %PublishBranch%
git pull origin %PublishBranch%

echo .
echo git merge %PullBranch%
git merge %PullBranch%


echo .
echo All good? Will now do a build.
pause

echo .
npm run build