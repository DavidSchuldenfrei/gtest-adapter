# GoogleTest Version Support

In order to allow navigating from the test tree to the code, this extension uses extra information provided by GoogleTest. 

This extra information wasn't available in versions of GoogleTest which don't have commit [603ce4b](https://github.com/google/googletest/commit/603ce4b81df48a268b84d0e4f2b999b89b903250). If you want to enable this feature, you need to update your code to use release version [1.8.1](https://github.com/google/googletest/tree/release-1.8.1) of GoogleTest