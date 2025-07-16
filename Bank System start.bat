@echo off
title Pitsas Camp Bank - Startup
color 0B
echo.
echo ================================================================================
echo                            *** ATTENTION ***
echo                        - DO NOT CLOSE THIS WINDOW -
echo                    The application runs through this window.
echo ================================================================================
echo.
echo   ####   #   #####  #####  #####  #####     ####   #####  #   #  #   #
echo   #   #  #     #    #      #   #  #         #   #  #   #  ##  #  #  #
echo   ####   #     #    ####   #####  ####      ####   #####  # # #  ###
echo   #      #     #    #      #   #  #         #   #  #   #  #  ##  #  #
echo   #      #     #    #####  #   #  #####     ####   #   #  #   #  #   #
echo.
echo                          PITSAS CAMP BANK SYSTEM
echo                             Version 1.0.0
echo                     Copyright 2025 - Lazaros Paliamaxidis
echo                         Eikoniki Trapeza Kataskhnosis
echo.
echo ================================================================================
echo.


color 0A
echo Starting application...
echo.
echo ================================================================================
echo  STATUS: Loading Pitsas Camp Bank...
echo  MODE: Electron Desktop App
echo  ENVIRONMENT: Desktop Application
echo ================================================================================
echo.

echo [STARTING] Opening Pitsas Camp Bank...
color 0B
npx electron .

REM Check if application started successfully
if errorlevel 1 (
    color 0C
    echo.
    echo ================================================================================
    echo [ERROR] Application failed to start
    echo ================================================================================
    echo.
    echo Possible solutions:
    echo 1. Make sure Node.js is installed
    echo 2. Run: npm install electron --save-dev
    echo 3. Check if files are in correct folder structure
    echo.
    echo For help, contact: pallazarosb@gmail.com
    echo.
    pause
    exit /b 1
)

color 0B
echo.
echo ================================================================================
echo [SUCCESS] Application terminated normally
echo ================================================================================
echo.
echo  DO NOT CLOSE THIS WINDOW The application runs through this window.
echo.
echo Press any key to close this window...
pause >nul
