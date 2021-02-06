SET csvLocation=%cd%\%1 
CALL %~dp0setPath.bat
node lib\bnc.js %csvLocation%