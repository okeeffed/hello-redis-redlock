# Hello Redis Redlock

This repo accompanies the blog post ["Locking Redis Transactions In Node.js"](https://blog.dennisokeeffe.com/blog/2021-10-04-locking-redis-transactions-in-nodejs).

## Quickstart

Requires Redis to be installed.

```s
# In the first terminal
$ redis-server
# In the second terminal
$ npm install

# Running the dirty read example
$ node dirty-read.js
# Running the locking example
$ node index.js
```
