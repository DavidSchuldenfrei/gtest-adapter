# gtest-adapter README

Allows viewing all GTests in a tree view, and running/debugging them.

## Features

This extension presents all GTests in your application in a tree view. The developer can then run/debug any of these tests.

![Show GTest Adapter](/images/Demo.gif)

## Extension Settings

This extension contributes the following settings:

* `gtest-adapter.debugConfig`: The name of the debug configuration which defines the GTest test application, and how to debug it.

## Known Issues

* Currently missing a search test functionality in the tree.
* There is no way to navigate from a tree leaf to the corresponding test.


## Release Notes

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

Initial release of GTest Adapter.
