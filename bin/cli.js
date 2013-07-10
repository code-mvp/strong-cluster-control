#!/usr/bin/env node

var net = require('net');

var program = require('commander');

var ADDR = require('../lib/ctl').ADDR;
var client = require('../lib/client');
var cmd = require('../lib/cmd');
var version = require('../package.json').version;

var request = {
  cmd: 'status'
};
var display = displayStatusResponse;

program
  .version(version)
  .option('-p,--path <path>', 'cluster ctl socket to connect to, default to ' + client.ADDR)
  ;

program
  .command('status')
  .description('status of cluster, default command')
  .action(function() {
    request.cmd = 'status';
    display = displayStatusResponse;
  });

function displayStatusResponse(rsp) {
  var workerIds = Object.keys(rsp.workers);
  console.log('worker count:', workerIds.length);
  for( id in workerIds) {
    var worker = rsp.workers[id];
    delete worker.id;
    console.log('worker id', id +':', worker);
  }
}

program
  .command('set-size')
  .description('set-size N, set cluster size to N workers')
  .action(function(size) {
    request.cmd = 'set-size';
    request.size = parseInt(size);
    display = function(){};
  });

// XXX temporary, for testing
program
  .command('disconnect')
  .action(function() {
    request.cmd = 'disconnect';
    display = console.log;
  });

program
  .command('fork')
  .action(function() {
    request.cmd = 'fork';
    display = console.log;
  });

//   - add-workers [1]
//   - sub-workers [1]

program
  .command('*')
  .action(function(name) {
    process.stdout.write('unknown command: ' + name + '\n');
    program.help();
  });


program.parse(process.argv);

client.request(program.path, request, response)
  .on('error', function(er) {
    console.error('Communication error (' + er.message + '), check master is listening');
    process.exit(1);
  });

function response(rsp) {
  if(rsp.error) {
    console.error('command', request.cmd, 'failed with', rsp.error);
    process.exit(1);
  }
  display(rsp);
}
