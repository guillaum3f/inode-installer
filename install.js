var inquirer = require('inquirer');
var jsonfile = require('jsonfile')
var mkdirp = require('mkdirp');
var fs = require('fs');
var path = require('path');
var inquirer = require('inquirer');
var child_process = require('child_process');
var request = require('request');
var colors = require('colors');
const exec = require('child_process').exec;
const validUrl = require('valid-url');
const promptSync = require('readline-sync').question;

var finish_process = '';

var server = [
{
    type: 'input',
    name: 'name',
    message: 'server name?*',
    validate: function(str){
        return !!str;
    }
},
{
    type: 'input',
    name: 'description',
    message: 'description?*',
    validate: function(str){
        return !!str;
    }
},
{
    type: 'input',
    name: 'licence',
    message: 'Licence?',
    default: 'none',
    validate: function(str){
        return !!str;
    }
},
{
    type: 'input',
    name: 'owner',
    message: 'Owner?',
    default: 'none',
    validate: function(str){
        return !!str;
    }
},
{
    type: 'input',
    name: 'host',
    message: 'Host and Port Number?* [i.e localhost:8763] ',
    validate: function(str){
        if(str.split(':').length === 2) {
            return true;
        }
    }
},
{
    type: 'input',
    name: 'static',
    message: 'Enable static content?* [true|false]',
    validate: function(str){
        if (str === 'true' || str === 'false') {
            return true;
        }
    }
}
];

var third_part_server = [
{
    type: 'input',
    name: 'name',
    message: 'Server name?*',
    validate: function(str){
        return !!str;
    }
},
{
    type: 'input',
    name: 'description',
    message: 'Description?*',
    validate: function(str){
        return !!str;
    }
},
{
    type: 'input',
    name: 'owner',
    message: 'Owner?*',
    validate: function(str){
        return !!str;
    }
},
{
    type: 'input',
    name: 'licence',
    message: 'Licence?',
    default: 'none',
    validate: function(str){
        return !!str;
    }
},
{
    type: 'input',
    name: 'editor',
    message: 'Your favorite code editor?',
    default: 'vim',
    validate: function(str){
        return !!str;
    }
}
];



var middleware = [
{
    type: 'input',
    name: 'name',
    message: 'Middleware name?*',
    validate: function(str){
        return !!str;
    }
},
{
    type: 'input',
    name: 'description',
    message: 'Description?*',
    validate: function(str){
        return !!str;
    }
},
{
    type: 'input',
    name: 'developper',
    message: 'Developper?*',
    validate: function(str){
        return !!str;
    }
},
{
    type: 'input',
    name: 'licence',
    message: 'Licence?',
    default: 'none',
    validate: function(str){
        return !!str;
    }
},
{
    type: 'input',
    name: 'editor',
    message: 'Your favorite code editor?*',
    validate: function(str){
        return !!str;
    }
}
];

function large_display(message) {
    console.log('\n**** '+message+' ****\n');
}

function back_to_main(message) {
    large_display(message);
    main();
}

function overWrite(item, callback) {

    fs.stat(item, function(err, stat) {
        if(err == null) {
            large_display('Item '+item+' exists');
            inquirer.prompt([{
                type: 'list',
                name: 'overwrite',
                message: 'Overwrite?',
                choices: ['yes','no'],
                default: 'no'
            }]).then(function (answers) {
                if(answers.overwrite === 'yes') {
                    callback();
                }
            });
        } else {
            callback();
        }
    });
}

var target_dir = __dirname;

function main() {
    inquirer.prompt([{
        type: 'list',
        name: 'options',
        message: 'What do you want to do?',
        choices: [
            "Add a server (node)",
            "Add a third-part-server",
            "Add a middleware",
            "Add a local route",
            "Add a remote route",
            new inquirer.Separator(),
            "Quit"
        ]
    }]).then(function (answers) {
        switch(answers.options) {

            case 'Add a server (node)':

                inquirer.prompt(server).then(function(resp) {

                    if(resp.static === 'true') {
                        while (!resp['static-app-url']){
                            resp['static-app-url'] = promptSync('?'.green+' Static app Github url: '.bold.white);
                        }
                        if (!validUrl.isUri(resp['static-app-url'])){
                            resp['static-app-url'] = null;
                        }
                    }

                    finish_process = function() {
                        exec('git clone https://github.com/guillaum3f/inode24.git '+target_dir+'/servers/'+resp.name,
                                (error, stdout, stderr) => {
                                    if(error) console.log(error);
                                    _config.name = resp.name;
                                    _config.owner = resp.owner;
                                    _config.description = resp.description;
                                    _config.licence = resp.licence || 'none';
                                    _config.port = resp.host.split(':')[1];
                                    _config['static-content-enabled'] = resp.static;

                                    if(_config['static-content-enabled'] === 'true') {
                                        _config['static-root'] = path.normalize(target_dir+'/servers/'+resp.name+'/static');
                                        _config['static-entry-point'] = 'index.html';
                                    } 
                                    if(resp['static-app-url']) {
                                        _config['static-origin'] = resp['static-app-url'];
                                        exec('git clone '+_config["static-origin"]+' '+_config["static-root"], (error, stdout, stderr) => {
                                                    if(error) throw(error);
                                                    var fflag=0;
                                                    var finder = require('findit')(_config['static-root']);
                                                    finder.on('file', function (file) {
                                                        if(path.basename(file) === _config['static-entry-point'] && fflag === 0) {
                                                            fflag=1;
                                                            _config['static-root'] = path.dirname(file);
                                                        } else if (path.basename(file) === 'bower.json') {
                                                            exec('cd '+path.dirname(file)+' && bower install', (error, stdout, stderr) => {
                                                                if(error) throw error;
                                                            });
                                                        }
                                                    });
                                                    finder.on('error', function (error) {
                                                        if(error) throw(error);
                                                    });
                                                    finder.on('end', function () {
                                                        finalize_process();
                                                    });
                                                });
                                    } else {
                                        finalize_process();
                                    }

                                });
                    }

                    finalize_process = function() {
                        jsonfile.writeFile(target_dir+'/servers/'+resp.name+'/config.json', _config, {spaces: 2}, function(err) {
                            if(err) console.error(err);
                            exec('cd '+target_dir+'/servers/'+resp.name+' && npm install', (err, stdout, stderr) => {
                                if(err) console.error(err);
                                console.log(colors.green('Inode '+resp.name+' has been installed!'));
                            });
                        });
                    }

                    var config = {};
                    var _config = {};
                    var config_file = '../config.json';

                    if (fs.existsSync(__dirname+'/'+config_file)) { 
                        config = require(__dirname+'/'+config_file);
                        target_dir = target_dir+'/..';
                    } 

                    if(!config.servers) {
                        config.servers = {};
                    }

                    config.servers[resp.name] = resp.host;

                    if (fs.existsSync(__dirname+'/'+config_file)) { 
                        var file = __dirname+'/'+config_file;
                        jsonfile.writeFile(file, config, {spaces: 2}, function(err) {
                            if(err) console.error(err)
                                finish_process();
                        });
                    } else {
                        finish_process();
                    }


                });

                break;

            case 'Add a third-part-server':

                mkdirp(target_dir+'/servers/third-part-servers', function(err) { 
                    if (err) throw err;
                });

                inquirer.prompt(third_part_server).then(function(resp) {

                    finish_process = function() {
                        exec('echo "/*Name : '+
                                resp.name+'\ndescription : '+
                                resp.description+'\nLicence : '+
                                resp.licence +'*/\n" > '+
                                target_dir+'/servers/third-part-servers/'+
                                resp.name+'.js', (error, stdout, stderr) => {

                                    console.log('Execute '+resp.editor+' '+target_dir+'/servers/third-part-servers/'+resp.name+'.js'); 

                                });

                    }

                    var config = {};
                    var config_file = '../config.json';

                    if (fs.existsSync(__dirname+'/'+config_file)) { 
                        config = require(__dirname+'/'+config_file);
                        target_dir = target_dir+'/..';
                    } 

                    if(!config['third-part-servers']) {
                        config['third-part-servers'] = [];
                    }

                    config['third-part-servers'].push(resp.name+'.js');

                    if (fs.existsSync(__dirname+'/'+config_file)) { 
                        var file = __dirname+'/'+config_file;
                        jsonfile.writeFile(file, config, {spaces: 2}, function(err) {
                            if(err) console.error(err)
                                finish_process();
                        })
                    } else {
                        finish_process();
                    }

                });

                break;

            case 'Add a middleware':

                inquirer.prompt(middleware).then(function(resp) {

                    overWrite(__dirname+'/../middlewares/'+resp.name+'.js', function() {
                        fs.writeFile(__dirname+'/../middlewares/'+resp.name+'.js', 
                                '/*\n'+
                                ' * description : '+resp.description+'\n'+
                                ' * Author : '+resp.developper+'\n'+
                                ' * Licence : '+resp.licence+'\n'+
                                '*/\n\n'+
                                'module.exports = function(req, res, next) {'+
                                    '\n\t'+
                                        '\n\t'+
                                        '\n\tnext();'+
                                        '\n\t'+
                                        '\n};', function(err) {
                                            if(err) {
                                                return console.log(err);
                                            }
                                            var child = child_process.spawn(resp.editor, [__dirname+'/../middlewares/'+resp.name+'.js'], {
                                                stdio: 'inherit'
                                            });

                                            child.on('exit', function (e, code) {
                                                back_to_main('The file was saved!');
                                            });
                                        }); 
                    });


                });

                break;

            case 'Add a local route':

                var _route = {};

                inquirer.prompt([{
                    type: 'list',
                    name: 'method',
                    message : 'select a method',
                    choices: ['get', 'post']
                }]).then(function (answers) {

                    _route.method = answers.method;

                    switch(answers.method) {
                        case 'get':
                        case 'post':

                            fs.readdir(__dirname+'/../middlewares/', function (err, files) {

                                var middlewares = [];
                                for(var i=0; i<files.length; i++) {
                                    if(path.extname(files[i]) === '.js') {
                                        middlewares.push({ 'name' : files[i].slice(0,-3) });
                                    }
                                }

                                if(middlewares.length) {

                                    inquirer.prompt([{
                                        type: 'checkbox',
                                        name: 'middlewares',
                                        message : 'Which middleware(s) do you want to expose?',
                                        choices: middlewares
                                    }]).then(function (answers) {

                                        _route.middlewares = answers.middlewares;

                                        for(var md in _route.middlewares) {
                                            console.log(parseInt(md,10)+1 +')'+_route.middlewares[md]);
                                        }

                                        inquirer.prompt([{
                                            type: 'input',
                                            name: 'order',
                                            message : 'Specify order?'
                                        }]).then(function (answers) {

                                            var chain = '';
                                            for(var i=0; i<answers.order.length; i++) {
                                                if(i === answers.order.length-1) {
                                                    chain += 'middlewares["'+_route.middlewares[parseInt(answers.order[i],10)-1]+'"]';
                                                } else {
                                                    chain += 'middlewares["'+_route.middlewares[parseInt(answers.order[i],10)-1]+'"]->';
                                                }
                                            }

                                            console.log(chain);
                                            _route.target = (chain.split('->')[chain.split('->').length-1]).split('.')[1];
                                            _route.targets = chain.split('->').join(', ');

                                            inquirer.prompt([{
                                                type: 'input',
                                                name: 'main',
                                                message : 'Route name?',
                                                default : _route.target 
                                            }]).then(function (answers) {

                                                overWrite(__dirname+'/../routes/'+answers.main+'-'+_route.method+'.js', function() {
                                                    fs.writeFile(__dirname+'/../routes/'+answers.main+'-'+_route.method+'.js', ''+
                                                        'module.exports = function(app, config, middlewares) {'+
                                                            '\n'+
                                                                '\n\tapp.'+_route.method+'("/'+answers.main+'", '+_route.targets+', function(req, res) {'+
                                                                    '\n\n\t\tres.end();'+
                                                                        '\n\t});'+
                                                                '\n'+
                                                                '\n};'+
                                                                '', function(err) {
                                                                    if(err) {
                                                                        return console.log(err);
                                                                    }

                                                                    back_to_main("The file was saved!");
                                                                }); 
                                                    });

                                                });
                                            });

                                    });

                                } else {
                                    back_to_main('Sorry no middleware available.');
                                }
                            });

                            break;
                        default:
                            break;
                    }

                }); 

                break;

            case 'Add a remote route':

                var _route = {};

                fs.readdir(__dirname+'/../middlewares/', function (err, files) {

                    _route.middlewares = [];
                    for(var i=0; i<files.length; i++) {
                        if(path.extname(files[i]) === '.js') {
                            _route.middlewares.push({ 'name' : files[i].slice(0,-3) });
                        }
                    }

                    inquirer.prompt([{
                        type: 'input',
                        name: 'host',
                        message : 'Specify the remote host:'
                    },{
                        type: 'input',
                        name: 'port',
                        message : 'Specify the remote port to use:'
                    }]).then(function (answers) {

                        _route.host = 'http://'+answers.host+':'+answers.port;

                        request.get(_route.host+'/_routes', function(error, response, body) {
                            if(error) throw error;
                            inquirer.prompt([{
                                type: 'list',
                                name: 'target',
                                message : 'Select a remote route (destination) :',
                                choices : body.split('\n')
                            }]).then(function (answers) {

                                _route.method = answers.target.split(' ')[1].toLowerCase();
                                _route.target = answers.target.split(' ')[2];

                                var mode_list=['grasp data'];
                                if(_route.method === 'get') {
                                    mode_list.push('proxify request');
                                }

                                inquirer.prompt([{
                                    type: 'list',
                                    name: 'mode',
                                    message : 'Choose a mode:',
                                    choices : mode_list
                                }]).then(function (answers) {

                                    switch(answers.mode) {
                                        case 'grasp data':

                                            inquirer.prompt([{
                                                type: 'input',
                                                name: 'local-name',
                                                message : 'Local route name?',
                                                default : _route.target
                                            },{
                                                type: 'list',
                                                name: 'local-method',
                                                message : 'select a local method',
                                                default: _route.method,
                                                         choices: ['get', 'post']
                                            }]).then(function (answers) {

                                                _route['local-name'] = answers['local-name'];
                                                _route['local-method'] = answers['local-method'];

                                                switch(_route['local-method']) {
                                                    case 'get':
                                                        _route.data = 'req.query';
                                                        break;

                                                    case 'post':
                                                        _route.data = 'req.body';
                                                        break;

                                                    default:
                                                        _route.data = '{}';
                                                        break;
                                                }

                                                inquirer.prompt([{
                                                    type: 'list',
                                                    name: 'inject',
                                                    message : 'Do you want to inject some middleware(s) locally?',
                                                    choices: ['yes','no']
                                                }]).then(function (answers) {
                                                    if(answers.inject === 'yes') {
                                                        inquirer.prompt([{
                                                            type: 'checkbox',
                                                            name: 'middlewares',
                                                            message : 'Select local middleware(s):',
                                                            choices: _route.middlewares
                                                        }]).then(function (answers) {

                                                            _route._middlewares = answers.middlewares;

                                                            for(var md in _route._middlewares) {
                                                                console.log(parseInt(md,10)+1 +')'+_route._middlewares[md]);
                                                            }

                                                            inquirer.prompt([{
                                                                type: 'input',
                                                                name: 'order',
                                                                message : 'Specify order?'
                                                            }]).then(function (answers) {

                                                                var chain = '';
                                                                for(var i=0; i<answers.order.length; i++) {
                                                                    if(i === answers.order.length-1) {
                                                                        chain += 'middlewares["'+_route._middlewares[parseInt(answers.order[i],10)-1]+'"]';
                                                                    } else {
                                                                        chain += 'middlewares["'+_route._middlewares[parseInt(answers.order[i],10)-1]+'"]->';
                                                                    }
                                                                }

                                                                if(_route._middlewares.length) {
                                                                    console.log(chain);
                                                                    _route.targets = ' '+chain.split('->').join(', ')+', ';
                                                                } else {
                                                                    _route.targets = '';
                                                                }

                                                                overWrite(__dirname+'/../routes/'+_route['local-name']+'-'+_route['local-method']+'.js', function() {
                                                                    fs.writeFile(__dirname+'/../routes/'+_route['local-name']+'-'+_route['local-method']+'.js', ''+
                                                                            'const request = require("request");\n\n'+
                                                                            'module.exports = function(app, config, middlewares) {\n\n'+
                                                                                '\tapp.'+_route['local-method']+'("/'+_route['local-name']+'",'+_route.targets+' function(req, res) {\n\n'+
                                                                                    '\t\trequest({\n'+
                                                                                        '\t\t\turl: "'+_route.host+'/'+_route.target+'", //URL to hit\n'+
                                                                                        '\t\t\t\tqs: '+_route.data+', //Query string data\n'+
                                                                                        '\t\t\t\tmethod: "'+_route.method+'",\n'+
                                                                                            '\t\t\t\t//headers: {\n'+
                                                                                            '\t\t\t\t//    "Content-Type": "MyContentType",\n'+
                                                                                            '\t\t\t\t//    "Custom-Header": "Custom Value"\n'+
                                                                                            '\t\t\t\t//},\n'+
                                                                                            '\t\t\t\tbody: "Hello Hello! String body!" //Set the body as a string\n'+
                                                                                            '\t\t\t}, function(error, response, body){\n'+
                                                                                                '\t\t\t\tif(error) {\n'+
                                                                                                    '\t\t\t\t\tconsole.log(error);\n'+
                                                                                                        '\t\t\t\t} else {\n'+
                                                                                                            '\t\t\t\t\tres.write(body);\n'+
                                                                                                                '\t\t\t\t}\n\n'+
                                                                                                                '\t\t\t\tres.end();\n'+
                                                                                                                '\t\t});\n'+
                                                                                        '\t});\n'+
                                                                                    '}\n'+
                                                                                    '', function(err) {
                                                                                        if(err) {
                                                                                            return console.log(err);
                                                                                        }

                                                                                        back_to_main("The file was saved!");
                                                                                    }); 

                                                                    });
                                                                });

                                                            });

                                                    } else {

                                                        overWrite(__dirname+'/../routes/'+_route['local-name']+'-'+_route['local-method']+'.js', function() {
                                                            fs.writeFile(__dirname+'/../routes/'+_route['local-name']+'-'+_route['local-method']+'.js', ''+
                                                                    'const request = require("request");\n\n'+
                                                                    'module.exports = function(app, config, middlewares) {\n\n'+
                                                                        '\tapp.'+_route['local-method']+'("/'+_route['local-name']+'", function(req, res) {\n\n'+
                                                                            '\t\trequest({\n'+
                                                                                '\t\t\turl: "'+_route.host+'/'+_route.target+'", //URL to hit\n'+
                                                                                '\t\t\t\tqs: '+_route.data+', //Query string data\n'+
                                                                                '\t\t\t\tmethod: "'+_route.method+'",\n'+
                                                                                    '\t\t\t\t//headers: {\n'+
                                                                                    '\t\t\t\t//    "Content-Type": "MyContentType",\n'+
                                                                                    '\t\t\t\t//    "Custom-Header": "Custom Value"\n'+
                                                                                    '\t\t\t\t//},\n'+
                                                                                    '\t\t\t\tbody: "Hello Hello! String body!" //Set the body as a string\n'+
                                                                                    '\t\t\t}, function(error, response, body){\n'+
                                                                                        '\t\t\t\tif(error) {\n'+
                                                                                            '\t\t\t\t\tconsole.log(error);\n'+
                                                                                                '\t\t\t\t} else {\n'+
                                                                                                    '\t\t\t\t\tres.write(body);\n'+
                                                                                                        '\t\t\t\t}\n\n'+
                                                                                                        '\t\t\t\tres.end();\n'+
                                                                                                        '\t\t});\n'+
                                                                                '\t});\n'+
                                                                            '}\n'+
                                                                            '', function(err) {
                                                                                if(err) {
                                                                                    return console.log(err);
                                                                                }

                                                                                back_to_main("The file was saved!");
                                                                            }); 

                                                        });


                                                    }

                                                });

                                            });

                                            break;

                                        case 'proxify request':

                                            inquirer.prompt([{
                                                type: 'input',
                                                name: 'local-name',
                                                message : 'Route name?',
                                                default : _route.target
                                            }]).then(function (answers) {

                                                switch(_route.method) {
                                                    case 'get':
                                                        _route.data = 'req.query';
                                                        break;

                                                    case 'post':
                                                        _route.data = 'req.body';
                                                        break;

                                                    default:
                                                        _route.data = '{}';
                                                        break;
                                                }

                                                var patch_request = '';
                                                var target;

                                                if(_route.target !== answers['local-name']) { 
                                                    patch_request += '\t\tvar params = (req.url.split && req.url.split("?").length === 2) ? "?"+req.url.split("?")[1] : "";\n\t\treq.url="";\n';
                                                    target = '"'+_route.host+'/'+_route.target+'"+params';
                                                } else {
                                                    target = '"'+_route.host+'"';
                                                }

                                                overWrite(__dirname+'/../routes/'+answers['local-name']+'-'+_route.method+'.js', function() {
                                                    fs.writeFile(__dirname+'/../routes/'+answers['local-name']+'-'+_route.method+'.js', ''+
                                                            'const httpProxy = require("http-proxy");\n'+
                                                            'const proxy = httpProxy.createProxyServer({});\n\n'+
                                                            'module.exports = function(app, config, middlewares) {\n\n'+
                                                                '\tapp.'+_route.method+'("/'+answers['local-name']+'", function(req, res) {\n\n'+

                                                                    patch_request+
                                                                        '\t\tproxy.web(req, res, { target: '+target+' }, \n'+
                                                                                '\t\tfunction(err) { if(err) throw err; });\n\n'+

                                                                        '\t});\n\n'+
                                                                    '}\n'+
                                                                    '', function(err) {
                                                                        if(err) {
                                                                            return console.log(err);
                                                                        }

                                                                        back_to_main("The file was saved!");

                                                                    }); 

                                                });
                                            });
                                            break;

                                        default:
                                            break;
                                    }
                                });

                            });
                        });

                    });

                });

                break;

            case 'Quit':
                console.log('bye');
                break;

            default:
                break;
        }
    });
}

main();
