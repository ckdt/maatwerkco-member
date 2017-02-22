import 'jquery';
var modules = require('./modules');

$(function() {
  loadModule({
    'module': 'sidebar'
  });
});

// Load a specific module and give the possibility to use an optional element ID
function loadModule(options) {
  if(typeof options.conditionalId === 'undefined' ||
    document.getElementById(options.conditionalId)) {
      modules[options.module]();
  }
}