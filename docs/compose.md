# Hence CLI Compose Commands
Run [rancher-compose](http://docs.rancher.com/rancher/rancher-compose/) commands against any machine. The `project` command will encompass what this does and more, but this is very useful if you'd like to experiment with on-off stacks without creating Hence Projects out of them.

## General Usage Notes
### Getting help
Help for all the options within the Hence Compose CLI is available via:

`hence compose -h`

Because this is primarily a wrapper around rancher-compose, you can view it's help docs by running:

`hence compose rancher-help` or `rancher-compose help`<br><br>

### Requirements
Hence Compose requires the rancher-compose library to be installed.

If you followed the [Quick Start Guide](../README.md#quick-start-guide), you'll already have this installed.  Otherwise, you can download the binary from the rancher dashboard from one of your Hence Machines, or install it (and the appropriate version of docker) with this command:

`hence machine connect -i`<br><br>

---

## Command List
Command | Description
--- | ---
<br>[*](#-wildcard-command-)<br><br> | <br>Wildcard placeholder. Replace (*) with any _rancher-compose_ command to run it against a machine<br><br>
<br>[rancher-help](#rancher-help)<br><br> | <br>View the help text for rancher-compose<br><br>

---

## * (Wildcard Command)
### Run any _rancher-compose_ command against a machine
All commands must be run against a running [Hence Machine](./machine.md), and must be able to access both a docker-compose.yml and rancher-compose.yml file, either in the current directory, or as provided by the --dir flag.

i.e. `hence compose up --dir ~/my_project`

By default, the currently active machine will be used.  If you're unsure of what the current machine is, you can find out with:

`hence machine current`

You can also specify the machine to use by running with the --machine flag and providing the machine name:

i.e. `hence compose up --machine my_machine`

When you run any rancher-compose command, Hence Compose will automatically connect to the Rancher API using the API keys stored in that machine's definition.  If no API keys are present on the machine, they will be created, and then used to connect.

Flags are provided to allow providing a machine other that the current/active one to run against, and the ability to specify the directory where your docker-compose.yml and rancher-compose.yml files are located.

**Command-Specific Notes**<br>
_rm_: This will be run with the '--force' flag which will delete all services

**Arguments**<br>
_none_

**Options**<br>
_-m, --machine [name]_: Which hence machine to use.<br>
_-d, --dir [directory]_: Directory containing the docker-compose.yml and rancher-compose files, if not in current directory.

[Back to Command List](#command-list)<br><br>

## rancher-help
### View the help text for rancher-compose
Because Hence Compose is primarily a wrapper around rancher-compose, it can be helpful to access teh help documentation for it through the Hence CLI.

**Arguments**<br>
_none_

**Options**<br>
_none_

[Back to Command List](#command-list)<br><br>

---
[Back to Hence Commands](./README.md)
