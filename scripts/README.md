# Useful tools to run Bitcoin Core (bitcoind)

`rpc_credentials_gen.py` : tool to generate RPC credentials easily. Requires Python

usage: rpc_credentials_gen.py [-h] username [password]

Create login credentials for a JSON-RPC user

positional arguments:
  username    the username for authentication
  password    leave empty to generate a random password or specify "-" to
              prompt for password

optional arguments:
  -h, --help  show this help message and exit
  
Note: script downloaded from `https://github.com/bitcoin/bitcoin/tree/master/share/rpcauth`
__
