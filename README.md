# GoogleTest adapter README

Allows viewing all GoogleTests in a tree view, and running/debugging them.

## Features

This extension presents all GoogleTests in your application in a tree view. The developer can then run/debug any of these tests.

![Show GoogleTest Adapter](/images/Demo.gif)

## Usage

This extension is standalone, and doesn't depend on any other extensions. To use this extension, you must first define a "Debug" configuration in `launch.json` to debug your GoogleTests, and then set this for your tests `debugConfig`.  

## Extension Settings

This extension contributes the following settings:

* `gtest-adapter.debugConfig`: The name of the debug configuration which defines the GTest test application, and how to debug it.

* `gtest-adapter.showCodeLens`: Determines whether to show the CodeLens test status or not. Default is true

* `gtest-adapter.refreshAfterBuild`: Determines whether to automatically refresh the test tree after each build. Default is true

* `gtest-adapter.gotoTestTitle`: Used for localization. Title for [Go To Test] in CodeLens. 

* `gtest-adapter.runTitle`: Used for localization. Title for [Run] in CodeLens. 

* `gtest-adapter.debugTitle`: Used for localization. Title for [Debug] in CodeLens. 

* `gtest-adapter.supportLocation`: Used internally by the extension to know if navigating  to the code is supported. The extension will manage the value of this setting automatically, and will decide whether to offer the "Go to Code" option in the popup menu.

* `gtest-adapter.showRunOutput`: Determines whether to show the output of the GoogleTest runs. Default is true

* `gtest-adapter.clearRunOutput`: Determines whether to clear the output of the GoogleTest runs whenever starting a new run. Default is true

In addition to these specific extensions settings, this extension creates adds to the `editor.tokenColorCustomizations` setting to allow for coloring the GoogleTest output.

## Known Issues

* There is no way to navigate from a tree leaf to the corresponding test, if you are using versions of GoogleTest prior to version [1.8.1](https://github.com/google/googletest/tree/release-1.8.1). (more information about GoogleTest versions [here](/GoogleTestVersion.md))

* Codelens isn't available , if you are using versions of GoogleTest prior to version [1.8.1](https://github.com/google/googletest/tree/release-1.8.1). (more information about GoogleTest versions [here](/GoogleTestVersion.md))

* Codelens isn't updated when changes are made to the code. To refresh Codelens, you need to rebuild the googletest application , and refresh the tests tree. If the Codelens with this limitation is distracting, it can be disabled by setting `gtest-adapter.showCodeLens` to `false`.

* Links in GoogleTest output will not work if other extensions declare languages for output windows. This is a limitation of VsCode, which doesn't allow to declare a specific language per Output Channel.

## Release Notes

### 1.4.0

* Supports links to files from GoogleTest output.

### 1.3.1

* Minor release. If `gtest-adapter.refreshAfterBuild` is set to true, will reload the test tree after every build task. Fixes Ubuntu install issue.

### 1.3.0

* Enhancement: Better tree experience. Selecting a tree action by right click (Run/Debug/Go to code) will execute the action on the right clicked node, and not the selected one.

### 1.2.5

* Feature: Easier extension configuration

### 1.2.4

* Feature: Shows output of GoogleTest runs

### 1.2.3

* Bug: Go to Tests didn't work in some configurations 

### 1.2.1

* Feature: Added option to automatically refresh test tree after each build

### 1.2.0

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
