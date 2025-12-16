@echo off

echo.
title [1/10]
echo [1/10]
adb shell "input tap 820 1800"
timeout 5
adb shell "input tap 746 2210"
timeout 2

echo.
title [2/10]
echo [2/10]
adb shell "input tap 280 1800"
timeout 5
adb shell "input tap 746 2210"
timeout 2

echo.
title [3/10]
echo [3/10]
adb shell "input tap 820 1150"
timeout 5
adb shell "input tap 746 2210"
timeout 2

echo.
title [4/10]
echo [4/10]
adb shell "input tap 280 1150"
timeout 5
adb shell "input tap 746 2210"
timeout 2

echo.
title [5/10]
echo [5/10]
adb shell "input tap 800 530"
timeout 5
adb shell "input tap 746 2210"
timeout 2

echo.
title [6/10]
echo [6/10]
adb shell "input tap 280 530"
timeout 5
adb shell "input tap 746 2210"
timeout 2

adb shell "input swipe 500 500 500 1500 100"
timeout 1

echo.
title [7/10]
echo [7/10]
adb shell "input tap 280 530"
timeout 5
adb shell "input tap 746 2210"
timeout 2

echo.
title [8/10]
echo [8/10]
adb shell "input tap 800 530"
timeout 5
adb shell "input tap 746 2210"
timeout 2

echo.
title [9/10]
echo [9/10]
adb shell "input tap 280 1150"
timeout 5
adb shell "input tap 746 2210"
timeout 2

echo.
title [10/10]
echo [10/10]
adb shell "input tap 820 1150"

echo 
timeout 1
echo 