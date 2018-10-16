# Simple Blockchain
This is a very simple blockchain implementation that I wrote for Udacity's Blockchain Developer nanodegree program.


### Prerequisites

The only devleopment prerequisite is [Node.js](https://nodejs.org). I used Node version 10.12.0 during development.

All other dependencies are installed with NPM. For a complete list, look in the package.json file in the project root.


## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. 

Clone the source code to your local machine:
``` bash
git clone https://github.com/mastry/simple-blockchain.git
```

Install the project dependencies:
```bash
cd simple-blockchain
npm install
```

Create some test data and run the tests:
```bash
node test/simple-blockchain.test.js
```

To view blocks in your browser, run the command below and then open your browser to [http://localhost:8000/get/0](http://localhost:8000/get/0). Change the number at the end of that URL to view a different block.
```bash
node server.js
```

## Running the tests

Automated tests are located in tests/simple-blockchain.test.js. You can run that file with node directly.

```bash
node test/simple-blockchain.test.js
```

This will dsply results similar to this:
```
TAP version 13
# Block
ok 1 Cloned data should be equal
ok 2 Cloned hash should be equal
ok 3 Cloned height should be equal
ok 4 Cloned previousBlockHash should be equal
ok 5 Cloned time should be equal
# Blockchain
ok 6 Block height should be at least 1
ok 7 Genesis block previous block hash is 0
ok 8 Genesis block height is zero
ok 9 Genesis block body is correct
ok 10 Hashes are chained properly
ok 11 Block height increases
ok 12 Individual blocks validate
ok 13 Blockchain validates all blocks

1..13
# tests 13
# pass  13

# ok
```

You can also run the configured NPM script that uses Tape for a nicely formatted ouput:
```bash
npm run-script test
```

```
Block

    ✔ Cloned data should be equal
    ✔ Cloned hash should be equal
    ✔ Cloned height should be equal
    ✔ Cloned previousBlockHash should be equal
    ✔ Cloned time should be equal

  Blockchain

    ✔ Block height should be at least 1
    ✔ Genesis block previous block hash is 0
    ✔ Genesis block height is zero
    ✔ Genesis block body is correct
    ✔ Hashes are chained properly
    ✔ Block height increases
    ✔ Individual blocks validate
    ✔ Blockchain validates all blocks


  total:     13
  passing:   13
  duration:  50ms
```

### Manual tests
For manual testing of server.js during development I used the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension for Visual Studio Code. You can open the test/server.test.rest file in VS Code and click to run any of the endpoints defined defined there.  

### Lint tests

Eslint with the "Standard" rules is used for source code style checks. There are two NPM scripts configured in package.json for lint. The first will run eslint to check for style errors:

```bash
npm run-script lint
```

The other script will automatically fix lint issues:
```bash 
npm run-script lint-fix
```

## Deployment

Add additional notes about how to deploy this on a live system

## Built With

* [Express](http://www.dropwizard.io/1.0.2/docs/) - Implementation of REST API
* [Tape](https://maven.apache.org/) - Testing framework
* [JSDoc](https://rometools.github.io/rome/) - Documentation generator
* [level](http://leveldb.org) - Key/value store for blockchain data


## Versioning

I use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/mastry/simple-blockchain/tags). 

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* 

