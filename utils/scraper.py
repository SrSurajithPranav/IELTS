from html.parser import HTMLParser
from urllib.parse import urljoin
import requests


class _PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self.meta_description = ""
        self.paragraphs = []
        self.links = []
        self._in_title = False
        self._capture_paragraph = False
        self._paragraph_buffer = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "title":
            self._in_title = True
        elif tag == "meta" and attrs.get("name", "").lower() == "description":
            self.meta_description = attrs.get("content", "").strip()
        elif tag == "p":
            self._capture_paragraph = True
            self._paragraph_buffer = []
        elif tag == "a" and attrs.get("href"):
            self.links.append(attrs["href"])

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        elif tag == "p" and self._capture_paragraph:
            text = " ".join(part.strip() for part in self._paragraph_buffer if part.strip()).strip()
            if text:
                self.paragraphs.append(" ".join(text.split()))
            self._capture_paragraph = False
            self._paragraph_buffer = []

    def handle_data(self, data):
        text = data.strip()
        if not text:
            return
        if self._in_title:
            self.title += f"{text} "
        elif self._capture_paragraph:
            self._paragraph_buffer.append(text)


def scrape_public_page(url, max_paragraphs=3, max_links=5):
    response = requests.get(
        url,
        timeout=20,
        headers={"User-Agent": "Mozilla/5.0 IELTSTrainingBot/1.0"},
    )
    response.raise_for_status()

    parser = _PageParser()
    parser.feed(response.text)

    title = " ".join(parser.title.split()).strip() or url
    paragraphs = parser.paragraphs[:max_paragraphs]
    description_parts = []
    if parser.meta_description:
        description_parts.append(parser.meta_description)
    description_parts.extend(paragraphs)
    description = " ".join(description_parts).strip()
    if len(description) > 500:
        description = description[:497].rstrip() + "..."

    cleaned_links = []
    for href in parser.links:
        absolute = urljoin(url, href)
        if absolute not in cleaned_links:
            cleaned_links.append(absolute)
        if len(cleaned_links) >= max_links:
            break

    return {
        "url": url,
        "title": title,
        "description": description,
        "links": cleaned_links,
    }
