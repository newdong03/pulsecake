@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Meet your Cake - http://localhost:8080  (stop: Ctrl+C)
start "" http://localhost:8080
python -m http.server 8080 || py -m http.server 8080
pause
