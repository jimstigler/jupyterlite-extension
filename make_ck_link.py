import urllib.parse
import sys

BASE = "https://jimstigler.github.io/jupyterlite-extension/lab?from="

def convert_github_url(url):
    if "github.com" in url and "/blob/" in url:
        raw = url.replace("github.com", "raw.githubusercontent.com")
        raw = raw.replace("/blob/", "/")
        return raw
    return url

def make_link(url):
    raw = convert_github_url(url)
    encoded = urllib.parse.quote(raw, safe=":/")
    return BASE + encoded

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage:")
        print("python make_ck_link.py <github notebook url>")
        sys.exit(1)

    github_url = sys.argv[1]
    ck_link = make_link(github_url)

    print("\nCourseKata Launch Link:\n")
    print(ck_link)

    print("\nMarkdown:\n")
    print(f"[Open in CourseKata Notebook]({ck_link})")

    print("\nHTML (new tab):\n")
    print(f'<a href="{ck_link}" target="_blank">Open in CourseKata Notebook</a>')
