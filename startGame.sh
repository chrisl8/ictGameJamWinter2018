#!/usr/bin/env bash

# Grab and save the path to this script
# http://stackoverflow.com/a/246128
SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  DIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
done
SCRIPTDIR="$( cd -P "$( dirname "$SOURCE" )" && pwd )"
# echo ${SCRIPTDIR} # For debugging

cd ${SCRIPTDIR}/Station

# TODO: Add code to check for Node, and for node_modules and do an npm install.

# Make the screen font BIG in the terminal
setfont /usr/share/consolefonts/Uni3-Terminus32x16.psf.gz

# Disable screen blanking in terminal
# https://www.raspberrypi.org/forums/viewtopic.php?t=7810
sudo sh -c "TERM=linux setterm -blank 0 >/dev/tty0"

node index.js
