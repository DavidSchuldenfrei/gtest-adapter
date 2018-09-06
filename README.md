# GoogleTest adapter README

Allows viewing all GoogleTests in a tree view, and running/debugging them.

## Features

This extension presents all GoogleTests in your application in a tree view. The developer can then run/debug any of these tests.

![Show GoogleTest Adapter](/images/Demo.gif)

## Extension Settings

This extension contributes the following settings:

* `gtest-adapter.debugConfig`: The name of the debug configuration which defines the GTest test application, and how to debug it.

* `gtest-adapter.supportLocation`: Used internally by the extension to know if navigating  to the code is supported. The extension will manage the value of this setting automatically, and will decide whether to offer the "Go to Code" option in the popup menu.

## Known Issues

* There is no way to navigate from a tree leaf to the corresponding test, if you are using versions of GoogleTest prior to version [1.8.1](https://github.com/google/googletest/tree/release-1.8.1). (more information about GoogleTest versions [here](/GoogleTestVersion.md))

* Codelens isn't available , if you are using versions of GoogleTest prior to version [1.8.1](https://github.com/google/googletest/tree/release-1.8.1). (more information about GoogleTest versions [here](/GoogleTestVersion.md))

* Codelens isn't updated when changes are made to the code. To refresh Codelens, you need to rebuild the googletest application , and refresh the tests tree.


## Release Notes

### 1.1.2

* Feature: Added CodeLens for GoogleTests. Needs at least version [1.8.1](https://github.com/google/googletest/tree/release-1.8.1) of GoogleTest.

### 1.1.1

* Fixed Vulnerability. Upgraded used package

### 1.1.0 

* Feature: Allows navigating from the tree to the corresponding test in the code. Needs at least version [1.8.1](https://github.com/google/googletest/tree/release-1.8.1) of GoogleTest.

### 1.0.8

* Feature: Allows searching in the test tree

### 1.0.7

* Bug Fix: Takes configuration environment into account when running tests

### 1.0.6

* Bug Fix: Takes configuration environment into account when running tests
* Renamed tree view to Google Tests

### 1.0.5

* Uses the "Test" activity instead of the "Explorer" activity
* Switches to debug activity view when debugging tests
* Clears tree icons when rerunning tests

### 1.0.4

* Refactored.
* Better status bar.
* Allows to switch debug configurations
* Prettier README.md

### 1.0.3

* Warns the user if the project was never built.
* Supports workspaceRoot as well as workspaceFolder in launch.json (although obsolete, might be in legacy configurations).

### 1.0.2

* Allows the user to pick a debug config if no config found.
* Better error messages.

### 1.0.1

Minor tweaks.

### 1.0.0

Initial release of GoogleTest Adapter.
