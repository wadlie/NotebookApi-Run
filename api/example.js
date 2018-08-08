'use strict';

const exampleAPI = require('../lib/example');


function getAll(req,res){
    var example = exampleAPI();
    example.getAll().then( (examples) => {
      res.send('Hello, you are now on the Dev route!');
    }, (error) => {
        res.status(500).send({error: error.message});
  });

  }

let routes = [
  { path: '/example', httpMethod: 'GET', middleware: getAll},
];

module.exports = routes;
