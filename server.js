import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
const routes = {'/catalog.js':['catalog.js','text/javascript'],'/dashboard.js':['dashboard.js','text/javascript'],'/':['index.html','text/html'],'/index.html':['index.html','text/html'],'/app.js':['app.js','text/javascript'],'/scoring.js':['scoring.js','text/javascript'],'/styles.css':['styles.css','text/css']};
createServer(async(req,res)=>{
  const route = routes[new URL(req.url,'http://localhost').pathname];
  if (!route) {res.writeHead(404);res.end('Not found');return;}
  try {const content=await readFile(new URL(route[0],import.meta.url));res.writeHead(200,{'Content-Type':route[1]+'; charset=utf-8'});res.end(content);}
  catch {res.writeHead(500);res.end('Could not load preview');}
}).listen(Number(process.env.PORT || 4180),'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:'+(process.env.PORT || 4180)));
