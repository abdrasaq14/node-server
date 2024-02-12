import http, { IncomingMessage, Server, ServerResponse } from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { z } from "zod";

/*implement your server code here*/

const server: Server = http.createServer(
  (request: IncomingMessage, response: ServerResponse) => {
    if (request.method === "GET") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ name: "hello" }));
      return;
    }
    if (request.method === "POST") {
      let body = "";
      request.on("data", function (data) {
        body += data; 
        // Too much POST data, kill the connection!        
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6) request.socket.destroy();
      });
      request.on("end", function () {
        let jsonBody = null;
        try {
          jsonBody = JSON.parse(body);
        } catch {
          response.writeHead(400, { "Content-Type": "text/plain" });
          response.end("Please send only well-formed JSON body.");
          return;
        }
        try {
          jsonBody = validatePostData(jsonBody);
        } catch (e) {
          response.writeHead(400, { "Content-Type": "application/json" });
          response.end(JSON.stringify({ errors: e }));
          return;
        }
        const time = new Date().toISOString();
        const data = {
          ...jsonBody,
          id: Math.random().toString(32).slice(2),
          createdAt: time,
          updatedAt: time,
        };
        writePostData(data)
          .then(() => {
            response.writeHead(200, { "Content-Type": "application/json" });
            response.end(JSON.stringify({ body: data }));
          })
          .catch(() => {
            response.writeHead(500, { "Content-Type": "text/plain" });
            response.end("Something went wrong");
            return;
          });
        return;
      });
    }
  }
);
server.listen(3005);
const postSchema = z.object({
  organization: z
    .string({
      required_error: "Organization needs to be provided",
      invalid_type_error: "Organization needs to be a string",
    })
    .trim()
    .min(2, "Organization need to have a min length of 2")
    .max(100, "Organization need to have a max length of 100"),
  marketValue: z.string().max(4),
  address: z.string().min(10).max(100),
  country: z.enum(["USA", "Spain", "Nigeria", "Taiwan"]),
  noOfEmployees: z.number().int().positive(),
  employees: z.array(z.string().min(2).max(100)),
  ceo: z.string().min(2).max(50),
  products: z.array(z.string().min(2).max(100)),
});
function validatePostData(json: unknown) {
  const validation = postSchema.safeParse(json);
  if (!validation.success) {
    throw validation.error.formErrors;
  }
  return validation.data;
}
const databaseFilePath = path.join(__dirname, "../", "database.json");
function writePostData(data: unknown) {
  return fs
    .readFile(databaseFilePath, "utf-8")
    .then((fileData: string) => {
      return JSON.parse(fileData);
    })
    .catch(() => {
      return [];
    })
    .then((existingData: unknown[]) => {
      existingData.push(data);
      return fs.writeFile(databaseFilePath, JSON.stringify(existingData));
    });
}