import express from "express";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import { CookieJar } from "tough-cookie";
import fetchCookie from "fetch-cookie";

const app = express();
const PORT = process.env.PORT || 3000;

const jar = new CookieJar();
const fetchWithCookies = fetchCookie(fetch, jar);

app.use(express.static("public"));

app.get("/browse", async (req, res) => {
  let url = req.query.url;
  if (!url) return res.send("No URL provided");

  if (!url.startsWith("http")) {
    url = "https://" + url;
  }

  try {
    const response = await fetchWithCookies(url, {
      headers: {
        "User-Agent": "SharpenBrowser/1.0"
      }
    });

    let html = await response.text();
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;

    document.querySelectorAll("a").forEach(a => {
      if (a.href) {
        a.href = "/browse?url=" + encodeURIComponent(a.href);
      }
    });

    document.querySelectorAll("form").forEach(form => {
      form.action = "/browse?url=" + encodeURIComponent(form.action || url);
    });

    res.setHeader("Content-Type", "text/html");
    res.send(dom.serialize());
  } catch (err) {
    res.send("Failed to load site.");
  }
});

app.listen(PORT, () =>
  console.log(`Sharpen Browser running`)
);
