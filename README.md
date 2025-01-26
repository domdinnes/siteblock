# siteblock
Simple script which runs periodically to block productivity drains.

## Setup

Run the following two commands to  

1) Install all necessary packages:
```shell
npm install
```

2) Ensure that `etc/hosts` and `etc/hosts.md5` exist and have the correct permissions.
```shell
npm run setup
```

## Running
```shell
npm start
```

## TODO:
1) Get this running as a cron job on mac/linux.
2) Extract blocked sites to a config file.
3) Create a script within the repo to auto set-up the cron job so this can be effortlessly ported to new machines.
4) Change name to monkeyblock? 