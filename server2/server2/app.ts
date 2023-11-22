//import http, { IncomingMessage, Server, ServerResponse } from "http";
import axios from "axios";
import * as cheerio from "cheerio";
import { error } from "console";
import * as http from "http";
/*
implement your server code here
*/

async function webScrapper(url: string) {
  const webData = await axios.get(url);
  const $ = cheerio.load(webData.data);

  const webpageTitle: string = $("head title").text();
  const webpageDescription = $('head meta[name="description"]').attr("content");

  const webpageImages: string[] = [];
  //check the website body tag for all occurences of the image tag and loop through all of them to get their src

  $("body img").each((index, element) => {
    const imageUrl: string | any = $(element).attr("src");
    webpageImages.push(imageUrl);
  });

  const output = {
    Title: webpageTitle,
    Description: webpageDescription,
    Images: webpageImages,
  };

  return output;
}

const server = http.createServer((req, res) => {
  if (req.method === "GET") {
    const urlParam = new URL(req.url || "", `http://${req.headers.host}`);

    const url = urlParam.searchParams.get("url");
    //check if a url is passed in as a query
    if (!url) {
      res.writeHead(400, { "Content-Type": "text/json" });
      res.end("error: Bad request - missing url parameter");
    } else {
      webScrapper(url)
        .then((data) => {
          res.writeHead(200, { "Content-Type": "text/json" });
          res.end(JSON.stringify(data, null, 2));
        })
        .catch((error) => {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end(`${error} Not found: The server cannot find the requested resource`);
        });
    }
  }
});

const port = process.env.PORT || 3009;

server.listen(port, () => {
  console.log(`server is now running at http://localhost:${port}`);
});
