# GoogleTest Version Support

In order to allow navigating from the test tree to the code, this extension uses extra information provided by GoogleTest. 

This extra information wasn't available in prior versions of GoogleTest which don't have commit [603ce4b](https://github.com/google/googletest/commit/603ce4b81df48a268b84d0e4f2b999b89b903250). If you want to enable this feature, you need to update your code to use the current master branch of GoogleTest