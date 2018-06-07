# gtest-adapter README

Allows viewing all GTests in a tree view, and running/debugging them.

## Features

This extension presents all GTests in your application in a tree view. The developper can then run/debug any of these tests.

## Extension Settings

This extension contributes the following settings:

* `gtest-adapter.debugConfig`: The name of the debug configuration which defines the GTest test application, and how to debug it.

## Known Issues

* Currently missing a search test functionality in the tree.
* There is no way to navigate from a tree leaf to the corresponding test.


## Release Notes

### 1.0.0

Initial release of GTest Adapter

# 1.0.1

Minor tweaks

#1.0.2

Allows to pick a debug config if no config found.
Better error messages

