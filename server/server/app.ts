import http, { IncomingMessage, Server, ServerResponse } from "http";
import fs from 'node:fs';
import url from 'node:url'
import path from 'node:path'

interface databaseOBject{
  organization: string,
    createdAt: any,
    updatedAt: string,
    products: string[],
    marketValue: string,
    address: string,
    ceo: string,
    country: string,
    noOfEmployees: number,
    employees: string[],
    id: number
}
const database = path.join(__dirname, '../', 'database.json')
const port = 3005;
const server: Server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
  
  const { query } = url.parse(req.url as string, true);
    if (req.method === "GET") {
      
        fs.promises.readFile(database, 'utf-8')
        .then((fileRead)=>{
          const existingArray:databaseOBject[] = JSON.parse(fileRead);
          res.end(JSON.stringify(existingArray, null, 2));
        })
        .catch((error)=>{
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end(`${error} at such I am Unable to read the file`)
        return
        })

    }
    else if(req.method === "POST"){
      
      let bodyObject = '';
      req.on('data', (bit) => {
        // to store the inputted data from the body to bodyObject
        bodyObject += bit.toString();
        if(bodyObject.length > 1e6){
          req.socket.destroy()
        } 
      });
  
      req.on('end', () => {
        const data:Record<string, unknown>[] = [];
       try {
        data.push(JSON.parse(bodyObject)); // Parse the JSON data from the request body  
       } catch (error) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Please parse in a well formed jsn object, you can consider nesting your input a curly braces{}');
        return
      }
      
       try {
        const key = 'id';
        const createdAt = 'createdAt'
        const updatedAt = 'updatedAt';  
        let reformedData = '';
        for(const object of data){
          reformedData += JSON.stringify(object)
        } 
        const parsedObject = JSON.parse(reformedData) 
        // checking if the database file exist or nnot 
        writeDatabaseFileDynamically(database)
        fs.readFile(database, 'utf-8', (err, fileData) => {
        let existingData = JSON.parse(fileData);
        if(!parsedObject[key] && !parsedObject[createdAt] && !parsedObject[updatedAt]){
            parsedObject[key] = existingData.length + 1
            parsedObject[createdAt] = new Date();
            parsedObject[updatedAt] = new Date();
          }
          existingData.push(parsedObject); // Add the new data to the existing array
          fs.writeFile(database, JSON.stringify(existingData, null, 2), (err) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(parsedObject));
            
          });
          });
        //})
       } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Sorry, There is an error from our side, we will fix that');
        return
      }
      });
    }

    else if (req.method === 'DELETE') {

      if (!query.id) {
        res.writeHead(400, {"content-type": "text/json"});
        res.end('Kindly supply id to delete');
      } 
      else {
        const existingData = fs.readFileSync(database, 'utf-8');
        const existingArray = JSON.parse(existingData);
        const indexToDelete = parseInt(query.id as string);
  
        const dataToWriteBack:databaseOBject[] = existingArray.filter((item: any) => item.id !== indexToDelete);
        // dataToWriteBack.map((item:databaseOBject, index:number) => {
        //   item.id = index + 1;
        //   return item;
        // });
        fs.writeFileSync(database, JSON.stringify(dataToWriteBack, null, 2));
        res.writeHead(200, {"content-type": "text/json"});
        res.end(JSON.stringify(dataToWriteBack));
      }
 }

    else if (req.method === 'PATCH') {

      if (!query.id && !query.address) {
        res.writeHead(400, {"content-type": "text/json"});
        res.end('Kindly supply id and address of item to update');
      } 
      else {
        const existingData = fs.readFileSync(database, 'utf-8');
        const existingArray = JSON.parse(existingData);
        const indexToWriteTo = parseInt(query.id as string);
        for(const object of existingArray){
          if(object.id === indexToWriteTo){
            object.address = 'my new address'
          }
        }
        //const dataToWriteBack = existingArray.filter((item: any) => item.id !== indexToDelete);
        fs.writeFileSync(database, JSON.stringify(existingArray, null, 2));
        res.writeHead(200, {"content-type": "text/json"});
        res.end(JSON.stringify(existingArray));
      }
    }
    else if (req.method === 'PUT') {
      if (!query.id) {
        res.writeHead(400, {"content-type": "text/json"});
        res.end('Kindly supply id Of item to update');
      } 
      else {
        let body = '';
        req.on('data', (chunkOfData)=>{
          body += chunkOfData
        });
        req.on('end', ()=>{
          fs.readFile(database, 'utf-8', (err, dataReadFromFile)=>{
            if(err){
              res.writeHead(500, {"content-type": "text/json"});
              res.end('Internal server error, unable to read file');
            }
            else{
              const dataToPutFromBody = JSON.parse(body)
              const existingArrayOfData = JSON.parse(dataReadFromFile);
              const previousData = existingArrayOfData[parseInt(query.id as string) - 1].createdAt
              const key = 'id';
              const updatedAt = 'updatedAt'
              const createdAt = 'createdAt'
              if(!dataToPutFromBody[key] && !dataToPutFromBody[updatedAt] && !dataToPutFromBody[createdAt]){
                dataToPutFromBody[key] = parseInt(query.id as string);
                dataToPutFromBody[createdAt] = previousData
                dataToPutFromBody[updatedAt] = new Date();
              }
              const indexToWriteTo = parseInt(query.id as string);
              existingArrayOfData.splice(indexToWriteTo -1, 1, dataToPutFromBody);
              fs.writeFileSync(database, JSON.stringify(existingArrayOfData, null, 2));
              res.writeHead(200, {"content-type": "text/json"});
              res.end(JSON.stringify(existingArrayOfData));
            }
          })
        })
      }
    }
  }
);

server.listen(port, ()=>{
  console.log(`server is now listenng at http://localhost:${port}`)
});

function writeDatabaseFileDynamically(data:string){
  if(!fs.existsSync(data)){
    return fs.writeFile(data, JSON.stringify([], null, 2), (err) => {})
  }
}
export default server
