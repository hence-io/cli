# Hence CLI Machine Commands
The Hence CLI machine commands allow a user to manage multiple Hence Machines from anywhere in their filesystem, at any time.

Many of the commands are simply wrapping the corresponding Vagrant commands, while keeping their Hence Machine definitions up to date.

## General Usage Notes
### Getting help
Help for all commands within the Hence Machine CLI is available via:

`hence machine [optional_subcommand] -h`<br><br>

### The 'Current' machine
Most of the machine commands take an optional [name] argument.  This refers to the machine name as chosen during the `machine init` process.

Hence Machine allows you to interact with numerous machines, and keeps a local record of the current, or active, machine in use.  This allows the user to forego specifying the machine to run each command against, as the [name] argument will always default to the current machine if omitted.

As well, for most commands, the current machine name will be shown beside the small header that is printed to the console.  It will look something like this:
```
--------------------------------------------
 HENCE.io Machine (Current: hence)
--------------------------------------------
```

If you are unsure of what your various machine names are, you can get a full listing via:

`hence machine list`<br><br>

**IMPORTANT** If you specify a machine name for any command's [name] argument that is not the current machine, it will become the new current machine and subsequent commands will be run against it.

---

## Command List
Command | Description
--- | ---
<br>[init](#init) <br><br> | <br>Initialize a new VM<br><br>
<br>[start](#start) [name]<br><br> | <br>Start a VM<br><br>
<br>[restart](#restart) [name]<br><br> | <br>Restart a VM<br><br>
<br>[stop](#stop) [name]<br><br> | <br>Stop a VM<br><br>
<br>[ssh](#ssh) [options] [name]<br><br> | <br>SSH into a VM<br><br>
<br>[sync](#sync) [options] [name]<br><br> | <br>Sync a VM's shared folders with the host.  Runs in watch mode by default<br><br>
<br>[provision](#provision) [name]<br><br> | <br>Provision a VM<br><br>
<br>[destroy](#destroy) [name]<br><br> | <br>Destroy a vm<br><br>
<br>[list](#list) [options]<br><br> | <br>List all available machines<br><br>
<br>[current](#current) [name]<br><br> | <br>Get the current machine definition, or set it by providing a name argument<br><br>
<br>[connect](#connect) [options] [name]<br><br> | <br>Connect to a hence machine's Docker host and Rancher Dashboard<br><br>
<br>[dashboard](#dashboard) [name]<br><br> | <br>Connect to a hence machine VM and/or Rancher Dashboard<br><br>
<br>[config](#config) [name]<br><br> | <br>View a VM's configuration<br><br>
<br>[status](#status) [name]<br><br> | <br>View a VM's configuration<br><br>
<br>[update](#update) [name]<br><br> | <br>Update a VM's configuration<br><br>
<br>[upgrade](#upgrade) [name]<br><br> | <br>Upgrade VM provisioning environment to latest<br><br>
<br>[unlock](#unlock) [name]<br><br> | <br>Terminate all running vagrant processes that may be locking a VM<br><br>

---

## init
### Initialize a new VM
This will start an installation wizard for creating a new machine.

The wizard will first ask you whether or not you would like to use a custom setup, or go with the defaults.  If you choose to use a custom setup (which is the initially selected option), you will be shown the default setting at each config prompt, and be able to accept it with pressing 'enter', or provide your own.

The default VM settings are as follows:

* **Install Location**: $HOME/hence - This location must be present.  If it does not exist, the installer will attempt to create it.
* **Name**: hence
* **IP Address**: 172.19.8.100
* **Dashboard Port**: 8080
* **CPU's**: 2 (you should use the max number of CPU's available on your machine)
* **Memory**: 2048 (recommended is 4096 if your machine can handle it)

After setting up your config options, you will be prompted for final confirmation before the installation proceeds.  The default confirmation value is set to true, so pressing 'enter' at this point will begin the installation.

Upon completion of the **machine init** wizard, a vagrant/virtualbox vm with a rancher server and agent will be installed and configured for use. Here are the main components it will install:

_VM Host_

* Ubuntu 14.04 OS
* Docker 1.7.1 (with TCP forwarding to port 2375)

_Vagrant Plugins_

* [vagrant-vbguest](https://github.com/dotless-de/vagrant-vbguest)
* [vagrant-gatling-rsync](https://github.com/smerrill/vagrant-gatling-rsync)
* [vagrant-hostsupdater](https://github.com/cogitatio/vagrant-hostsupdater)

_Rancher_ (Docker container management infrastructure.  [Homepage](http://rancher.com/rancher/) | [Docs](http://docs.rancher.com/))

* Rancher Server instance
* Rancher Agent instance
* Rancher UI

**Arguments**<br>
_none_

**Options**<br>
_none_

[Back to Command List](#command-list)<br><br>

## start
### Start a VM
Starts a machine using the `vagrant up --provision` command.

It is run with the vagrant provisioning flag, as this ensures that the Rancher server and agent are correctly started from the previous shutdown.

**Arguments**<br>
_name_: Optional. The machine name.

**Options**<br>
_none_

[Back to Command List](#command-list)<br><br>

## restart
### Restart a VM
Restarts a machine using the `vagrant reload --provision` command.

It is run with the vagrant provisioning flag, as this ensures that the Rancher server and agent are correctly started from the previous shutdown.

**Arguments**<br>
_name_: Optional. The machine name.

**Options**<br>
_none_

[Back to Command List](#command-list)<br><br>

## stop
### Stop a VM
Stops a machine using the `vagrant halt` command.

**Arguments**<br>
_name_: Optional. The machine name.

**Options**<br>
_none_

[Back to Command List](#command-list)<br><br>

## ssh
### SSH into a VM
SSH into a machine using the `vagrant ssh` command.

**Arguments**<br>
_name_: Optional. The machine name.

**Options**<br>
_-s, --sudo_: SSH in as root user.  Requires password, which defaults to "vagrant".

[Back to Command List](#command-list)<br><br>

## sync
### Sync a VM's shared folders with the host.  Runs in watch mode by default
Uses the 'vagrant-gatling-rsync' plugin over the native vagrant rsync for better performance.

It can run as a single-run process with a flag.

**Arguments**<br>
_name_: Optional. The machine name.

**Options**<br>
_-s, --single-run_: Run a one-time sync for a VM's shared folders.

[Back to Command List](#command-list)<br><br>

## provision
### Provision a VM
Provision a machine using the `vagrant provision` command.

**Arguments**<br>
_name_: Optional. The machine name.

**Options**<br>
_none_

[Back to Command List](#command-list)<br><br>

## destroy
### Destroy a vm
Destroy a machine using the `vagrant destroy` command.

**NOTE**: This will remove/destroy the following:

1. The machine from the Hence machines list
2. The vagrant VM definitions for the machine
3. The virtualbox vm associated with the machine

This command will **NOT** remove the installation directory specified when the machine was created.  This is intentional, as we don't want the responibility of cleaning up your filesystem, and you shouldn't want the risk.

**Arguments**<br>
_name_: Optional. The machine name.

**Options**<br>
_none_

[Back to Command List](#command-list)<br><br>

## list
### List all available machines
Lists all available machines, and shows the current/active machine with an asterisk (*).

It can also display the VM running statuses of each machine (i.e. stopped, running, aborted, etc...).

**Arguments**<br>
_none_

**Options**<br>
_-s, --status_: Show machine statuses.

[Back to Command List](#command-list)<br><br>

## current
### Current machine getter/setter
Gets the current machine name, or sets the current machine by providing a name argument.

**Arguments**<br>
_name_: Optional. The machine name. Used to set a different machine as active.

**Options**<br>
_none_

[Back to Command List](#command-list)<br><br>

## connect
### Connect to a hence machine's Docker host and Rancher Dashboard
In order to deploy your projects on Rancher, or to interface with the Docker instance running in your vm from your host OS, you'll need to connect it.

Running the command on it's own (`hence machine connect`) will make an initial connection to the Rancher API, and if there are no API keys associated with your new machine, it will create and story them for you.  It will also provide instructions on how to connect you current terminal session with the VM Docker instance and the Rancher API

The '-i' (or --install-local-packages) flag will cause it to install local dependancies, which are rancher-compose and docker@1.7.1.  This is **highly recommended** and only needs to be done once. If you followed the [Quick Start Guide](../README.md#quick-start-guide), you have already done this.

In order to interact with the VM Docker instance, or the Rancher API, you'll need to export the appropriate ENV variables into your current terminal session.

The -x (or --export) flag is used to automatically export the required variables for you, but needs to be run a little differently than other commands:

`eval $(hence machine connect -x)`

**NOTE:** You should not run any flags other than -x while running within an eval() command.

**Arguments**<br>
_name_: Optional. The machine name. Used to set a different machine as active.

**Options**<br>
_-x, --export_: Print only the export vars.  This is intended to be run as "eval $(hence machine connect --export)"<br>
_-i, --install-local-packages_: Check for and install the recommended versions of Docker and Rancher-Compose locally if missing.

[Back to Command List](#command-list)<br><br>

## dashboard
### Connect to a hence machine VM and/or Rancher Dashboard
Will open the Rancher UI Dashboard in the user's default browser.

**NOTE**: This command is untested in Windows, and likely will not work.  It should work fine in Mac OSx and Linux-based OS'es.

**Arguments**<br>
_name_: Optional. The machine name.

**Options**<br>
_none_

[Back to Command List](#command-list)<br><br>

## config
### View a VM's configuration
This will print the machine's configuration specs in a human-readable format.

**Arguments**<br>
_name_: Optional. The machine name.

**Options**<br>
_none_

[Back to Command List](#command-list)<br><br>

## status
### View a VM's configuration
This will print a VM's running status (i.e. stopped, running, aborted, etc...).

**Arguments**<br>
_name_: Optional. The machine name.

**Options**<br>
_none_

[Back to Command List](#command-list)<br><br>

## update
### Update a VM's configuration
This will start a machine update wizard, that will allow you to update any of the config parameters, including install location, that you set when creating the machine.

The following VM settings can be updated:

* **Install Location**
* **Name**
* **IP Address**
* **Dashboard Port**
* **CPU's**
* **Memory**

Upon completion of the wizard, the new setting will be saved to your machine definition, and the vagrant vm for that machine will be reloaded with the new settings in effect.

**Arguments**<br>
_name_: Optional. The machine name.

**Options**<br>
_none_

[Back to Command List](#command-list)<br><br>

## upgrade
### Upgrade VM provisioning environment to latest
This will simply pull down the latest version of the Hence VM repository to your install location via git.

In all likelihood, you'll want to restart the machine afterwards with:

`hence machine restart`

**Arguments**<br>
_name_: Optional. The machine name.

**Options**<br>
_none_

[Back to Command List](#command-list)<br><br>

## unlock
### Terminate all running vagrant processes that may be locking a VM
Every now and then, a vagrant vm can enter a locked state if one of the processes it was running fails, and isn't able to exit properly.

This command will terminate any vagrant processes running against the machine, and you should be able to resume working with any of the commands that run via vagrant.

[Back to Command List](#command-list)<br><br>

---
[Back to Hence Commands](./README.md)
