const _ = require('lodash');
const fetch = require('node-fetch');
const PythonShell = require('python-shell');
var xmlhttprequest = require('xmlhttprequest');
var ws = require('ws');
var fs = require('fs');
global.XMLHttpRequest = xmlhttprequest.XMLHttpRequest;
global.WebSocket = ws;
var jupyter = require('jupyter-js-services');

/**
 * @description Turns an Array into a full string reprsentation. Includes brackets
 *
 * Parameters:
 * {Array} info - Array
 * @returns string
 */
function stringifyArray(info){
  if ((typeof info) == 'string'){
    return "[\"" + info + "\"]";
  }
  let str = "[";
  for (var item in info) {
    str +=  "\"" + info[item] + "\"" + ",";
  }
  var exampleLength = str.length;
  if (exampleLength > 2) { // Slice off hanging comma
    str = str.slice(0,exampleLength-1);
  }
  str += "]";
  return str;
}

/**
 * @description Creates code to be used in showString.
 * Version only recgonizes a variable "stock" and runs
 * batch processes based on arg stock_names (array).
 *
 * Parameters:
 * {String} notebook - name of the notebook/ Path of notebook
 * {Array of Numbers|Strings} stock_names - Array of arguments passed
 *                            Each argument executes the notebook
 * @returns string
 */
function createCode(notebook, stock_names){
  let arrayCon = stringifyArray(stock_names);
  let code = "import sys\nimport nbformat\nfrom nbparameterise import extract_parameters, parameter_values, replace_definitions\n\n";
  code += "inital = \"" + notebook + "\"\nstock_names = " + arrayCon + " \n\n";
  code += "with open(inital) as f:\n    nb = nbformat.read(f, as_version=4)\n\norig_parameters = extract_parameters(nb)\n\nfor name in stock_names:\n    ";
  code += "print(\"Running for stock\", name)\n    params = parameter_values(orig_parameters, stock=name)\n    ";
  code += "new_nb = replace_definitions(nb, params)\n    with open(\"display %s.ipynb\" % name, \'w\') as f:\n        nbformat.write(new_nb, f)";
  return code;
}



function showString(req,res){
  let id = req.body;

  let gatewayUrl = process.env.BASE_GATEWAY_HTTP_URL || 'http://localhost:8888';
  let gatewayWsUrl = process.env.BASE_GATEWAY_WS_URL || 'ws://localhost:8888';
  let demoSrc1 = '%cd Documents/Python Scripts';
  let demoSrc2 = createCode('display.ipynb',id.number);
  console.log('Targeting server:', gatewayUrl);
  let ajaxSettings = {};

  if (process.env.BASE_GATEWAY_USERNAME) {
    ajaxSettings['user'] = process.env.BASE_GATEWAY_USERNAME
  }
  if (process.env.BASE_GATEWAY_PASSWORD) {
    ajaxSettings['password'] = process.env.BASE_GATEWAY_PASSWORD
  }
  console.log('ajaxSettings: ', ajaxSettings);

  // get info about the available kernels
  jupyter.Kernel.getSpecs({
    baseUrl: gatewayUrl,
    ajaxSettings: ajaxSettings
  }).then((kernelSpecs) => {
    console.log('Available kernelspecs:', kernelSpecs);

    // request a new kernel
    console.log('Starting kernel:')
    jupyter.Kernel.startNew({
      baseUrl: gatewayUrl,
      wsUrl: gatewayWsUrl, // passing this separately to demonstrate basic auth
      name: kernelSpecs.default,
      ajaxSettings: ajaxSettings
    }).then((kernel) => {
      // execute some code
      console.log('Executing sample code');
      var future = kernel.execute({code: demoSrc1});
      var future = kernel.execute({ code: demoSrc2 } );
      future.onDone = () => {
        // quit the demo when done, but leave the kernel around
        process.exit(0);
      };
      future.onIOPub = (msg) => {
        // print received messages
        console.log('Received message:', msg);
      };
    }).catch(req => {
      console.log('Error starting new kernel:', req.xhr.statusText);
      process.exit(1);
    });
  }).catch((req) => {
    console.log('Error fetching kernel specs:', req.xhr.statusText);
    process.exit(1);
  });
}


function getTerminal(req,res){
  PythonShell.run('./Python Scripts/client.py',{args: ["--kernel-id=cf092435-b489-454a-9bc6-86c030813b7b","--code=import sys\nimport nbformat\nfrom nbparameterise import extract_parameters, parameter_values, replace_definitions\n\ninital = \"display.ipynb\"\nstock_names = [\"YOOG\"]\n\nwith open(inital) as f:\n    nb = nbformat.read(f, as_version=4)\n\norig_parameters = extract_parameters(nb)\n\nfor name in stock_names:\n    print(\"Running for stock\", name)\n    params = parameter_values(orig_parameters, stock=name)\n    new_nb = replace_definitions(nb, params)\n    with open(\"display %s.ipynb\" % name, \'w\') as f:\n        nbformat.write(new_nb, f)"]} ,function (err,results) {
  if (err) throw err;
  console.log('results: %j', results);
});
}


function getAll(req,res){
  //  let id = req.params.id;  //req.params returns {id: "x"}, Use req.body for POST
    return fetch('http://localhost:8888/api/kernels').then( (data) => {
      data.json().then(function(resp) {
        res.json({Data: resp || []});
      });
   }).catch((err) => {
      res.status(500).send(err);
   });
}

function getAllPost(req,res){
  let id = req.body;
  console.log(createCode('display.ipynb',id.number));
  showString(req,res);
  res.send({Data: (typeof id.number) || []});
}


let routes = {
    getAll: getAll,
    getTerminal: getTerminal,
    showString: showString,
    getAllPost: getAllPost
}

module.exports = routes;
