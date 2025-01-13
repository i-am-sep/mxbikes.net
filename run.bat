@echo off
setlocal

:: Set the static directory path
set "STATIC_DIR=static"

:: Create the static directory if it doesn't exist
if not exist "%STATIC_DIR%" (
  echo Creating %STATIC_DIR% directory...
  mkdir "%STATIC_DIR%"
)

:: Create the data directory if it doesn't exist
if not exist "%STATIC_DIR%\data" (
  echo Creating %STATIC_DIR%\data directory...
  mkdir "%STATIC_DIR%\data"
)

:: Create the assets directory if it doesn't exist
if not exist "%STATIC_DIR%\assets" (
    echo Creating %STATIC_DIR%\assets directory...
    mkdir "%STATIC_DIR%\assets"
)

:: Create the images directory if it doesn't exist
if not exist "%STATIC_DIR%\assets\images" (
    echo Creating %STATIC_DIR%\assets\images directory...
    mkdir "%STATIC_DIR%\assets\images"
)

:: Create the gifs directory if it doesn't exist
if not exist "%STATIC_DIR%\assets\gifs" (
    echo Creating %STATIC_DIR%\assets\gifs directory...
    mkdir "%STATIC_DIR%\assets\gifs"
)

:: Create index.html file if it doesn't exist
if not exist "%STATIC_DIR%\index.html" (
  echo Creating %STATIC_DIR%\index.html file...
  type nul > "%STATIC_DIR%\index.html"
  echo ^<!DOCTYPE html^>^<html^>^<head^>^<title^>MXB Mods^</title^>^</head^>^<body^>^<h1^>Welcome to the MXB Mods Download Page^</h1^>^</body^>^</html^> >> "%STATIC_DIR%\index.html"
)

:: Create styles.css file if it doesn't exist
if not exist "%STATIC_DIR%\styles.css" (
    echo Creating %STATIC_DIR%\styles.css file...
    type nul > "%STATIC_DIR%\styles.css"
    echo /* Your styles here */ >> "%STATIC_DIR%\styles.css"
)

:: Create scripts.js file if it doesn't exist
if not exist "%STATIC_DIR%\scripts.js" (
    echo Creating %STATIC_DIR%\scripts.js file...
    type nul > "%STATIC_DIR%\scripts.js"
    echo // Your scripts here >> "%STATIC_DIR%\scripts.js"
)


:: Create mods.json file if it doesn't exist
if not exist "%STATIC_DIR%\data\mods.json" (
  echo Creating %STATIC_DIR%\data\mods.json file...
    type nul > "%STATIC_DIR%\data\mods.json"
    echo {
        "mods": [
          {
            "id": "deegan-smx",
            "name": "Haiden Deegan #1 SMX Replica",
            "categories": ["bikes"],
            "description": "Here is Deegan's vented plate SMX bike he raced the final two rounds of the series.",
            "image": "https://cdn.mxb-mods.com/wp-content/uploads/2024/09/sadffasdfsda-1536x1161.webp",
            "images": [
              "https://cdn.mxb-mods.com/wp-content/uploads/2024/09/mxbikes_focus_collage-768x964.webp"
            ],
            "downloadLinks": {
              "MEGA Download": "https://mega.nz/folder/19BCFY5T#ej0StYY0fNkApPX0DxqNlA",
              "MediaFire Download": "https://www.mediafire.com/folder/l9lo2rohxexqh/Deegan+SMX+1+Vented"
            }
          },
          {
            "id": "ridepak-mx",
            "name": "Ride Pak MX",
              "categories": ["tracks"],
            "description": "Shoutout to Moisty for the photoscan. This is an Aussie track near Melbourne. Made for A-Kits",
            "image": "https://cdn.mxb-mods.com/wp-content/uploads/2024/06/TrackScreen.png",
            "images": [
                "https://cdn.mxb-mods.com/wp-content/uploads/2024/06/43-768x512.png",
                "https://cdn.mxb-mods.com/wp-content/uploads/2024/06/mxbikes-2024-06-07-16-55-27-768x512.png",
                "https://cdn.mxb-mods.com/wp-content/uploads/2024/06/d-1-768x512.png"
              ],
            "downloadLinks": {
              "High Quality Download": "https://www.mediafire.com/file/g8gaynyku2uwpkw/RidePark_MX.pkz/file",
              "Low Quality Download": "https://www.mediafire.com/file/ts89y0r0hc2c3ck/RidePark_MX.pkz/file",
              "Server Download": "https://www.mediafire.com/file/invwp70qomsj1l1/RidePark_MX.pkz/file"
            }
          },
          {
            "id": "nike-boots",
            "name": "Nike 6.0 Boots",
            "categories": ["gear"],
            "description": "Credit to Isaiah for creating it. Contact him on Discord (eyezaya.) for PSD<br>Isaiah's Warehouse: <a href='https://discord.gg/S2kh5t2VCr' target='_blank' class='text-blue-400 hover:underline'>https://discord.gg/S2kh5t2VCr</a>",
            "image": "https://cdn.mxb-mods.com/wp-content/uploads/2024/08/NikeBoot-1.gif",
            "images": [
              "https://cdn.mxb-mods.com/wp-content/uploads/2024/08/Untitled-ezgif.com-video-to-gif-converter.gif"
            ],
            "downloadLinks": {
                "Model Download": "https://www.mediafire.com/file/8jjfs5nhod460tc/AJN_NikeBoots.zip/file",
              "Troyjannn Colorways": "https://www.mediafire.com/file/fmob55fhjuplvko/TroyJan_Nike.zip/file"
              }
          },
          {
            "id": "24aksmx",
            "name": "24AKSMX – R1 – Concord",
              "categories": ["tracks"],
            "description": "I wanted to create something that played similar to how the real life tracks did. This same principle is reflected in the next two rounds as well.",
            "image": "https://cdn.mxb-mods.com/wp-content/uploads/2024/10/cover-2-1536x999.webp",
            "images": [
                "https://cdn.mxb-mods.com/wp-content/uploads/2024/10/3-6-png.webp",
                "https://cdn.mxb-mods.com/wp-content/uploads/2024/10/2-6-768x500.webp"
              ],
            "downloadLinks": {
                "Player Version - HQ (Drive)": "https://drive.google.com/file/d/1pkoNeF0q0Og8HHPq4MrQ4mZAKeA149OP/view?usp=sharing",
                "Player Version - HQ (Mega)": "https://mega.nz/file/sl4CCSKI#XKFJSlbUgOlogo6FKPj20T-4zNn3j1xlz-9pvuF-o-g",
                "Player Version - LQ (Drive)": "https://drive.google.com/file/d/1fDOZXYltjhC03KCad92gE05FTkceviCq/view?usp=drive_link",
                "Player Version - LQ (Mega)": "https://mega.nz/file/Etp3UZCT#iDmLkzlqA6clWgAstoFdScuiji8PI9aQcLoxvB6hEJU",
                "Server Version (Drive)": "https://drive.google.com/file/d/1FuJppCz2GJdwDpscPuvT9xNSq2F9Ec2Qv/view?usp=drive_link",
                "Server Version (Mega)": "https://mega.nz/file/g9QTTSqD#AqWGBU5vBJGw8amyHaHbGl2wjVP8j3FeWecN8zqLmwM"
              }
          },
          {
            "id": "24aksmx-r2",
            "name": "24AKSMX – R2 – Ft Worth",
              "categories": ["tracks"],
            "description": "The Official Round 2 of the AKSMX series 11-29 I wanted to create something that played similar to how the real life tracks did. This layout left a lot to be desired but I am hopeful it will brew some good racing!",
            "image": "https://cdn.mxb-mods.com/wp-content/uploads/2024/11/th-jpg.webp",
            "images": [
                "https://cdn.mxb-mods.com/wp-content/uploads/2024/11/mxbikes-2024-11-28-10-56-58-1536x643.webp",
                "https://cdn.mxb-mods.com/wp-content/uploads/2024/11/mxbikes-2024-11-28-10-56-50-1536x643.webp",
                "https://cdn.mxb-mods.com/wp-content/uploads/2024/11/mxbikes-2024-11-28-10-56-33-1536x643.webp"
              ],
              "downloadLinks": {
                "High Quality (Drive)": "https://drive.google.com/file/d/1FRc_GqlrvaZ8DOOzSdfzpyoOuNZl7-y-/view?usp=drive_link",
                "High Quality (Mega)": "https://mega.nz/file/Eg5UkAxK#p3iRUrD4xHCxoZGSFxxN0IGt16ApOAQPUI3vRp-gUfc",
                "Low Quality (Drive)": "https://drive.google.com/file/d/12zb5sm5oHCeKP56OIqwmIeVBg_vS4aGt/view?usp=drive_link",
                "Low Quality (Mega)": "https://mega.nz/file/VsphFaSS#fHOZapkqSRfL7HMIIZt_hpMutxGvlfCQNhZnag2WlS4",
                "Server Version": "https://mega.nz/file/t9ZmlYLZ#iuDZwFcC74mDRgpy3GVm7ojIhOw5GBKuDk6IQOPVVAU"
            }
        }
      ]
    }
  >> "%STATIC_DIR%\data\mods.json"
)


echo All static files created successfully in: %STATIC_DIR%
pause
endlocal