Introduction
============

I am a big fan of Prototypejs. It's simplistic, and provides excellent polyfill methods for browsers that do not support modern browser features.
I definitely respect the work that was put in to **prototype-node**, but I found the port was too closely tied to the way that browsers execute javascript, instead of the way that NodeJS executes javascript. I wanted to see if I could do better, so I forked  **prototype-node**.

My intention is to provide equal results with the browser version of Prototypejs, even if the code isn't exactly the same.

Installation
------------

<<<<<<< HEAD
prototype4node is a npm package, installing is as simple as listing it as a dependency in your package.json file. You should also be able to isntall it directly from npm via,

	npm install prototype4node

or globally...

	npm install -g prototype4node
=======

>>>>>>> tmp

Tasks
-----

* <strike>Convert existing library to better manage scope, and bring more in line with CommonJS practices.</strike>
* Investigate ways to improve performance (<em>still want to find more ways to improve performance, but reducing the number of files has had its benefits</em>)
* <strike>Create unit tests with the goal of each test passing in both the browser and nodejs. Test coverage should match major features, using examples pulled from the API when possible.</strike>
* Create npm package
* ???

Progress
--------

Partially converted parts of existing library. I have also written some unit tests using the Mocha testing platform. The tests are not as comprehensive as the unit tests prototype provides, but the goal isn't to rewrite all of prototypes tests, just for major features. I have also identified and resolved an issue that was preventing me from extending the Hash object in another project.

Testing
-------

### Browser

Open up the file tests/index.html to run all tests. All libraries (mocha, prototype, assert) are contained within the tests/lib directory. 

### Server

1. Download and install the mocha testing framework. At the time of writing this is done via npm, `npm install -g mocha`
2. Run mocha, passing the tests directory, `mocha ./tests -R spec`

Credits
-------

PrototypeJS - https://github.com/sstephenson/prototype
prototype.node.js - https://github.com/Rixius/prototype.node.js