@echo off
echo === Step 1: Build project ===
cd /d C:\Users\carso\WorkBuddy\projects\doris-life-os
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo === Step 2: Prepare gh-pages branch ===
cd dist
if exist .git rmdir /s /q .git

set HTTPS_PROXY=http://127.0.0.1:7897

git init -b gh-pages
git add -A
git commit -m "deploy: local build with password fix"

echo === Step 3: Push to gh-pages ===
git remote add origin https://github.com/carsonyang3-byte/doris-life-os.git
git push -f origin gh-pages

echo === Done! ===
echo Now go to https://github.com/carsonyang3-byte/doris-life-os/settings/pages
echo Change Source from "GitHub Actions" to "Deploy from a branch" 
echo Select branch "gh-pages" and folder "/ (root)"
echo Click Save
pause
