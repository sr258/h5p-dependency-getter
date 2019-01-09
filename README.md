# h5p-dependency-getter

This Node application downloads the dependencies of h5p libraries from its sources. The advantages over using the regular H5P CLI are:

* The H5P CLI uses a static library information file. This means that changes in the dependencies of libraries might not be reflected. This application gets the dependencies directly from the library.
* The library information used by the H5P CLI is out of date and can't be updated locally. This application adds its own more up-to-date list and tries to guess the location of unknown libraries on GitHub.
* The H5P CLI tool does not download dependencies for the editor or libraries that are used in semantics.json but not in library.json.
* The H5P CLI tool forces you to have GitHub account and to add your SSH key to GitHub.

Note that the application always downloads from the master branch of the repositories and gets the source code of the libraries. If they require any kind of compiling, transpiling oder packing, you have to run this yourself.

## Installing

The application **requires you to have Git** up and running.

```
git clone https://github.com/sr258/h5p-dependency-getter
cd h5p-dependency-getter
npm install
```

## Running it

To download the dependencies of a library that is already in your file system into the directory ``/home/h5p_stuff/libraries``:
```
npm run h5p-dependency-getter -- -d /home/h5p_stuff/libraries -p /home/h5p_stuff/libraries/my-existing-h5p-library
```

To download the dependencies (and the library itself) of a library that has NOT BEEN DOWNLOADED YET into the directory ``/home/h5p_stuff/libraries``:
```
npm run h5p-dependency-getter -- -d /home/h5p_stuff/libraries -n the-h5p-library-i-want-to-download
``` 

If you don't have a GitHub account or don't want to add your SSH key to it, you can run it with the --https flag:
```
npm run h5p-dependency-getter -- -d /home/h5p_stuff/libraries -n the-h5p-library-i-want-to-download --https
``` 
But beware: The dependency getter tries to guess the location of unknown h5p libraries on GitHub. If the library can't be found, you're asked to enter credentials when using the ``--https`` mode. The download process will be paused until you enter them. If you don't use the ``--https`` flag, the download will simply fail and the whole download process will continue with the next library without any user interaction.