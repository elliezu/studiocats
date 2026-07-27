# StudioCats — static site

Standard multi-page HTML. Every page is a real file with its own URL, title, meta description, canonical link, Open Graph tags and JSON-LD structured data. No JavaScript is needed to read any page (the home page has one small optional script for the animated background).

## Structure

    index.html                        home
    animation-style/                  01 section index
    animation-style/<set>/            set detail (13 pages)
    virtual-fashion/                  02 section index
    virtual-fashion/<project>/        project detail (6 pages)
    3d-works/                         03 monthly archive
    3d-works/<render>/                render detail (19 pages)
    apps/                             04 tools index
    apps/<tool>/                      tool detail + FAQ (8 pages)
    ai-automation/                    05 journal index
    ai-automation/<entry>/            journal entry (7 pages)
    about/                            about + contact
    404.html, sitemap.xml, robots.txt, uploads/

## GitHub Pages

1. Push the contents of this folder to the repository root (or to `/docs`).
2. Settings → Pages → Source: your branch, folder `/ (root)` or `/docs`.
3. Edit `SITE` URLs: search for `studiocats.github.io` in the HTML files and replace with your real domain so canonical/OG/sitemap URLs are correct.

## Editing

- Text: edit the HTML directly.
- Images: drop files in `uploads/` and replace a grey `<div class="slot">…</div>` with `<img src="../uploads/name.jpg" alt="...">`.
- YouTube: replace the grey 16:9 slot with a standard `<iframe>` embed.
- Adding a page: copy an existing detail page folder, change the text, and add a link from its section index plus a `<url>` entry in `sitemap.xml`.
