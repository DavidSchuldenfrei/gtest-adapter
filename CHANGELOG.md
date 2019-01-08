# Change Log
All notable changes to the "gtest-adapter" extension will be documented in this file.

### [1.8.1]

* Feature: Better search in tree. Similar to VsCode file search
* More key bindings

### [1.7.0]

* Feature: When navigating from a tree leaf to the corresponding test is available, double clicking on a leaf, will go to the corresponding test.

* Bug Fixes: Better debugging

### [1.6.2]

* Feature: Allows using multiple debug configs. When multiple debug configs are used, each config will have its own subtree.

### [1.5.0]

* Better Hierarchical display when having parametrized tests

### [1.4.0]

* Supports links to files from GoogleTest output.

### [1.3.1]

* Minor release. If `gtest-adapter.refreshAfterBuild` is set to true, will reload the test tree after every build task. Fixes Ubuntu install issue.

### [1.3.0]

* Enhancement: Better tree experience. Selecting a tree action by right click (Run/Debug/Go to code) will execute the action on the right clicked node, and not the selected one.

### [1.2.5]

* Feature: Easier extension configuration

### [1.2.4]

* Feature: Shows output of GoogleTest runs

### [1.2.3]

* Bug: Go to Tests didn't work in some configurations
 
### [1.2.1]

* Feature: Added option to automatically refresh test tree after each build

### [1.2.0]

* Feature: Added CodeLens for GoogleTests.

### [1.1.1]

* Fixed Vulnerability. Upgraded used package

### [1.1.0]

* Feature: Allows navigating from the tree to the corresponding test in the code.

### [1.0.8]

* Feature: Allows searching in the test tree

### [1.0.7]

* Bug Fix: Takes configuration environment into account when running tests

### [1.0.6]

* Renamed tree view to Google Tests

### [1.0.5]

* Uses the "Test" activity instead of the "Explorer" activity
* Switches to debug activity view when debugging tests
* Clears tree icons when rerunning tests

## [1.0.4]

- Refactored.
- Better status bar.
- Allows to switch debug configurations
- Prettier README.md


## [1.0.3]

- Warns if project was never build.
- Supports workspaceRoot as well as workspaceFolder in launch.json (although obsolete, might be in legacy configurations).

## [1.0.2]

- Allows to pick a debug config if no config found.
- Better error messages.

## [1.0.1]
- Meaningful error when missing configuration
- Improved Icon
- Added keyboard shortcut for Run All Tests
- Prettier status bar

## [1.0.0]
- Initial release
