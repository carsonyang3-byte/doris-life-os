@echo off
cd /d C:\Users\carso\Desktop\doris-life-os

echo === Building project ===
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    exit /b 1
)

echo === Deploying dist to gh-pages branch ===
cd dist

:: Initialize git repo in dist folder
git init -b gh-pages
git add -A
git commit -m "deploy from local build"

:: Push to gh-pages branch (force replace)
set HTTPS_PROXY=http://127.0.0.1:7897
git push -f https://github.com/carsonyang3-byte/doris-life-os.git gh-pages

echo === Done! ===
