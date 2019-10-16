# 🔬 OP_RETURN Data parser & search

An OP_RETURN data parser and search for the Bitcoin chain.

It allows searching for matching data present on OP_RETURN scripts and returns the
associated block hash, height and transaction ID.

## Architecture

The architecture of this project is simple. Two main services shape the application
running themselves independently on two child processes that execute the OP_RETURN Parser
and the HTTP API.

#### OP_RETURN Parser

The OP_RETURN Parser process reads the Bitcoin chain by communicating using its RPC API.

Blocks are queried in descendent order relative to the best block's height until the hard limit
is reached (1000000 on testnet and 500000 on mainnet).

Once OP_RETURN data is retrieved from a block, this data is saved into a PostgreSQL database,
indexed using a Trigram index which allows [fast text search in an easy way](https://about.gitlab.com/blog/2016/03/18/fast-search-using-postgresql-trigram-indexes/).

Each block is saved in an independent database transaction.

The task described above is enqueued every 10 seconds (could be more), so, in case a new block is received, the parsing service parses that block.

#### HTTP API

The HTTP API consists of a simple Express server which queries the database directly and returns
the matching OP_RETURN data content to the input query data sent by the client.

Given the following query `GET/ http://localhost:8080/opreturn/data` against Bitcoin testnet

the following response is returned:

```json
{
	"query": "data",
	"op_returns": [
		{
			"data": "somedata",
			"height": 1575268,
			"blockHash": "000000009a0ded2d0c8d9fdf69ad8268c1af13147531bf43f2b25003883371e5",
			"txId": "50c89f9729607381026d263b6a71422ad3272a7786f3b7a68601617afa8c8581"
		}
		// etc
	]
}
```

## Usage

#### Dependencies

Before running the application, the following dependencies need to be installed:

| Dependencies | Version |
| ------------ | ------- |
| NodeJS       | 10.15+  |
| PostgreSQL   | 10+     |
| Bitcoind     | 0.18.1  |

### Setup

Using psql or any other PostgreSQL client, create a new database:

```
$ createdb parser
```

Then, install NPM dependencies:

```
$ npm install
```

NOTE: For to the parser to run, the RPC API has to be enabled on Bitcoind.

### Usage

The following environment variables need to be set before starting the application:

- DB_USER:
- DB_NAME:
- DB_PASSWORD
- RPC_USERNAME
- RPC_PASSWORD
- NETWORK: testnet | mainnet
- LOG_LEVEL: info | debug | trace
- PORT: the webserver port. Defaults to `8080`

Once the environment variables are set, you can run the program as in two steps:

Transpile Typescript to Javascript

```
$ npm run build
```

Start the application

```
$ node dist/index.js | npx bunyan -o short
```

Open `http://localhost:8080/opreturn/:data` and replace `:data` with the content you
wish to search for on the Bitcoin chain.

If you want to set another port, you can do so by creating an environment variable `PORT` before
running the application

### Testing

# Testing

To run tests simply run:

```
$ npm run test
```

### Functional tests

Very simple functional test have been implemented to check whether the API
returns the correct JSON payload when /opreturn/\${data} is called.

**NOTE**: In order for the functional tests to work, an application instance must be
running on port `8080`

### Unit tests

Unit tests are important, and they specially add value when working in a team environment.
Due to lack of time and the individual nature of the project I didn't make use of them.
However a clear showcase of how I approach unit testing can be found on my [Github profile](https://github.com/limiaspasdaniel)

### Further improvements

Parsing performance can be improved by:

- Deserializing blocks manually instead of using bitcoinjs and only retrieving the information needed
- Splitting parsing workload across multiple worker threads
- Improving the queue system to handle failing tasks and retries

Reliability can be improved by:

- Using PM2 or any other process manager for hot reloading.
