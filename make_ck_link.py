import sys

BASE = "https://jimstigler.github.io/jupyterlite-extension/lab/index.html?from="

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage:")
        print('python3 make_ck_link.py "<github notebook url>"')
        sys.exit(1)

    github_url = sys.argv[1].strip()
    ck_link = BASE + github_url

    print("\nCourseKata Launch Link:\n")
    print(ck_link)

    print("\nMarkdown:\n")
    print(f"[Open in CourseKata Notebook]({ck_link})")

    print("\nHTML (new tab):\n")
    print(f'<a href="{ck_link}" target="_blank">Open in CourseKata Notebook</a>')
