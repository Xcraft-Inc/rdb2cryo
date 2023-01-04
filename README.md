# rdb2cryo (RethinkDB to Cryo)

Small CLI tool to clone RethinkDB from one host to a Cryo database. Usage:

```
npx rdb2cryo clone <srcHost> <srcDb> <dstCryo>
```

```
<srcHost>  RethinkDB source host
<srcDb>    source db name
<dstCryo>  Cryo destination directory
```

> The port **28015** is used by default if you don't specify the port in the host parameter.

## Examples

```
// Simple example
rdb2rdb clone localhost unit ./

// More complex example with user, password and port
rdb2rdb clone user:password@server.com:28016 unit ./
```
