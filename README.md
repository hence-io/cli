# Hence Client
This project aims to provide a client interface to the hence.io framework.

**Please note:** this is currently under heavy development, and it is not recommended that anyone but hence.io developers use it at this point.

## Installation
This package should be installed globally.

`npm install -g hence-client`

## Prerequisites
In order to use the `hence machine` commands, you'll need the following set up in your local OS (only tested on OSx so far, but most commands are expected to work in Windows/Linux as well)
* Vagrant 1.7.2+
* Virtualbox 4.3.0+

## Getting Help
You can view a list of available commands by typing:

`hence help`

To view help for any subcommand, type:

`hence [command] --help` or `hence [command] [subcommand] -h`

## Getting Started
To initialize a new hence.io development environment, run the following from your terminal:

`hence machine init`

This will open an installation wizard, that when finished will install a vagrant/virtualbox vm with a rancher server and agent set up.

## General Usage
More documentation coming soon :)

For now, you'll need to resort to viewing the help for the available commands.
