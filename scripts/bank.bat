SET csvLocation=%cd%\%1 
CALL %~dp0setPath.bat
node lib\run.js %csvLocation% 1 1