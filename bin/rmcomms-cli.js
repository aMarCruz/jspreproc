#!/usr/bin/env node
// -*- js -*-

/**
 * Simple filter to remove comments and duplicate empty lines
 * @author Alberto Martínez
 */

/*
 * The CLI object should *not* call process.exit() directly. It should only return
 * exit codes. This allows other programs to use the CLI object and still control
 * when the program exits.
 */

var rmcomms = require('rmcomms')

rmcomms(process.argv)

/*
 * Wait for the stdout buffer to drain.
 */
process.on('exit', function (code) {

  process.exit(typeof code === 'number' ? code : rmcomms.exitCode)

})
