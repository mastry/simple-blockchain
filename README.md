# Simple Blockchain
This is a very simple blockchain implementation that I wrote for Udacity's Blockchain Developer nanodegree program. It implements a star registration service on top of the blockchain.

### Prerequisites

The only devleopment prerequisite is [Node.js](https://nodejs.org). I used Node version 10.12.0 during development.

All other dependencies are installed with NPM. For a complete list, look in the package.json file in the project root.


## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. 

Clone the source code to your local machine:
``` bash
git clone https://github.com/mastry/simple-blockchain.git
```

Create some test data and run the tests:
```bash
node test/simple-blockchain.test.js
node test/star-registry.test.js
node test/server.test.js
```

To view blocks in your browser, run the command below and then open your browser to [http://localhost:8000/get/0](http://localhost:8000/block/0). That should show the genesis block. Change the number at the end of that URL to view a different block (assuming you've added any).
```bash
node server.js
```

## Using the REST API

The REST API server (see Getting Started above) exposes the endpoints described below. To add a new star to the registry you have to follow this sequence:

* /requestValidation
* /message-signature/validate
* /block 

To retrieve an existing star registration, use one of the following search endpoints:

* /stars/address:{address} _(search by address of submitter)_
* /stars/hash:{hash} _(search by block hash)_
* /block/{height} _(search by block height)_

See the details for each endpoint below.

### /requestValidation
This endpoint is used to begin the registration process. It returns a message that must be signed with the specified bitcoin address (see /message-signature/validate below).

```bash
curl -X "POST" "http://localhost:8000/requestValidation" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ"
}'
```

The response also includes a "ValidationWindow" that contains the number of seconds left in the validation window. Once the validation window expires (in 300 seconds), registration must be restarted with /requestValidation. Here's a sample response:

```bash
{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
  "requestTimeStamp": "1532296090",
  "message": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:1532296090:starRegistry",
  "validationWindow": 300
}
```

### /message-signature/validate
Use this endpoint to validate the submitter's identity. This is accomplished by signing the message received in /requestValidation with the same address used in that call.

```bash
curl -X "POST" "http://localhost:8000/message-signature/validate" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
  "signature": "H6ZrGrF0Y4rMGBMRT2+hHWGbThTIyhBS0dNKQRov9Yg6GgXcHxtO9GJN4nwD2yNXpnXHTWU9i+qdw5vpsooryLU="
}'
```
A successful response will look something like this:

```bash
{
  "registerStar": true,
  "status": {
    "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
    "requestTimeStamp": "1532296090",
    "message": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:1532296090:starRegistry",
    "validationWindow": 193,
    "messageSignature": "valid"
  }
}
```
### /block
This endpoint adds a new star registration to the blockchain. It's an HTTP POST method that expects the block body (star details - see example below) to be in the body of the POST. You can call it with curl like this:

```bash
curl -X "POST" "http://localhost:8000/block" \
     -H 'Content-Type: application/json; charset=utf-8' \
     -d $'{
  "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
  "star": {
    "dec": "-26° 29'\'' 24.9",
    "ra": "16h 29m 1.0s",
    "story": "Found star using https://www.google.com/sky/",
    "magnitude": 1,
    "constellation": "Aquarius"
  }
}'
```

The "dec" and "ra" values are the declination and right ascension of the star. The magnitude and constallation values are optional. The new Block is returned with its blockchain hash, height, etc...

### /block/{height}
This endpoint gets the block with height {height}. For example, to get the block with height 42 with curl:

```bash
curl http://localhost:8000/block/42
```
The genesis block is block zero (height 0). If there is no block with the specified height, the endpoint returns 404.

### /stars/address:{address}
Use this endpoint to search for all the stars submitted by a particular bitcoin address.

```bash
curl "http://localhost:8000/stars/address:142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ"
```

### /stars/hash:{hash}
Use this endpoint to search for a star by its blockchain hash value.

```bash
curl "http://localhost:8000/stars/hash:a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f"
```

## Running the tests

Automated tests are located in the tests folder. Ther you will find a test script for simple-blockchain, star-registry, and server. 

* simple-blockchain.test.js
* star-registry.test.js
* server.test.js

You can run each of these with node directly. For example...

```bash
node test/simple-blockchain.test.js
```

This will display results similar to this:
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

You can also run the configured NPM scripts that use Tape for nicely formatted ouput.

* test-blockchain
* test-star-registry
* test-server

```bash
npm run-script test-blockchain
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

## Built With

* [Express](http://www.dropwizard.io/1.0.2/docs/) - Implementation of REST API
* [Tape](https://maven.apache.org/) - Testing framework
* [SuperTest](https://github.com/visionmedia/supertest) - REST API testing
* [JSDoc](https://rometools.github.io/rome/) - Documentation generator
* [level](http://leveldb.org) - Key/value store for blockchain data


## Versioning

I use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/mastry/simple-blockchain/tags). 

## License

This project is licensed under the MIT License - see the [LICENSE.txt](LICENSE.txt) file for details

## Acknowledgments

* JP Richardson for [this code snippet](https://stackoverflow.com/a/12345876)


