const _ = require('lodash');
const fetch = require('node-fetch');
const PythonShell = require('python-shell');

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


let routes = {
    getAll: getAll,
    getTerminal: getTerminal
}

module.exports = routes;
