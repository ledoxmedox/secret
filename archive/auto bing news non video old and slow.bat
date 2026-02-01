:loop
adb shell input swipe 250 800 250 400 88
timeout 1
adb shell input tap 558 1313
timeout 6
adb shell input keyevent 4
timeout 2
adb shell input swipe 500 500 500 1500 100
timeout 2
adb shell input swipe 500 500 500 1500 100
timeout 2
GOTO :loop
