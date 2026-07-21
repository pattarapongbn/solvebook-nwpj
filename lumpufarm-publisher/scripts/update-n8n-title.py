#!/usr/bin/env python3
"""
Update the poster headline (title) inside an n8n workflow via the n8n
public REST API — no clicking in the UI.

It fetches the workflow, replaces every occurrence of OLD_TITLE with
NEW_TITLE inside the workflow's nodes, and PUTs the result back.

HTTP is done through `curl` (not Python's urllib) because urllib encodes
request headers as latin-1 and crashes on Thai text; curl handles UTF-8
throughout. The API key is passed to curl via a private --config file, so
it never appears in the process list.

Usage:
  export N8N_BASE="https://lumphufarm.duckdns.org"
  export N8N_API_KEY="<your n8n API key>"
  export N8N_WORKFLOW_ID="1pTqhtIeSJJiDcUG"

  # 1) Dry run — shows what would change, writes nothing:
  python3 update-n8n-title.py --dry-run

  # 2) Apply the change:
  python3 update-n8n-title.py

Override the text without editing this file:
  export OLD_TITLE="ราคาตลาดไทวันนี้"
  export NEW_TITLE="ราคาพืชผลเกษตรวันนี้"

Requires: python3 (stdlib only) and curl.
"""
import json
import os
import subprocess
import sys
import tempfile

# --- What to change (env-overridable) ------------------------------------
OLD_TITLE = os.environ.get("OLD_TITLE", "ราคาตลาดไทวันนี้")
NEW_TITLE = os.environ.get("NEW_TITLE", "ราคาพืชผลเกษตรวันนี้")

# --- Connection (from environment) ---------------------------------------
BASE = os.environ.get("N8N_BASE", "").rstrip("/")
API_KEY = os.environ.get("N8N_API_KEY", "")
WORKFLOW_ID = os.environ.get("N8N_WORKFLOW_ID", "1pTqhtIeSJJiDcUG")

DRY_RUN = "--dry-run" in sys.argv


def die(msg):
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def curl(method, path, body_path=None):
    """
    Call the n8n public API through curl.

    Returns (status_code:int, body_text:str). The API key and headers are
    written to a temporary --config file (mode 0600) so they never show up
    in `ps`/argv.
    """
    url = f"{BASE}/api/v1{path}"
    with tempfile.TemporaryDirectory() as tmp:
        cfg_path = os.path.join(tmp, "curl.cfg")
        out_path = os.path.join(tmp, "body.out")

        cfg_lines = [
            f'url = "{url}"',
            f'request = "{method}"',
            f'header = "X-N8N-API-KEY: {API_KEY}"',
            'header = "Accept: application/json"',
            "silent",
            "show-error",
        ]
        if body_path is not None:
            cfg_lines.append('header = "Content-Type: application/json"')
            # curl reads the UTF-8 body verbatim from the file.
            cfg_lines.append(f'data-binary = "@{body_path}"')

        with open(cfg_path, "w", encoding="utf-8") as f:
            f.write("\n".join(cfg_lines) + "\n")
        os.chmod(cfg_path, 0o600)

        result = subprocess.run(
            ["curl", "--config", cfg_path, "--output", out_path,
             "--write-out", "%{http_code}", "--max-time", "30"],
            capture_output=True, text=True,
        )
        if result.returncode != 0:
            die(f"curl failed for {method} {path}: {result.stderr.strip()}")

        status = int(result.stdout.strip() or "0")
        try:
            with open(out_path, encoding="utf-8") as f:
                text = f.read()
        except FileNotFoundError:
            text = ""
        return status, text


def get_workflow():
    status, text = curl("GET", f"/workflows/{WORKFLOW_ID}")
    if status == 401:
        die("401 Unauthorized — check N8N_API_KEY (create one in n8n → Settings → n8n API)")
    if status == 404:
        die(f"404 Not Found — no workflow with id {WORKFLOW_ID!r}")
    if status != 200:
        die(f"GET returned HTTP {status}: {text[:300]}")
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        die("response was not JSON (is N8N_BASE correct and pointing at the API host?)")


def put_workflow(payload):
    with tempfile.NamedTemporaryFile(
        "w", encoding="utf-8", suffix=".json", delete=False
    ) as f:
        json.dump(payload, f, ensure_ascii=False)
        body_path = f.name
    try:
        status, text = curl("PUT", f"/workflows/{WORKFLOW_ID}", body_path=body_path)
    finally:
        os.unlink(body_path)
    if status not in (200, 201):
        die(f"PUT returned HTTP {status}: {text[:400]}")


def main():
    if not BASE:
        die("set N8N_BASE (e.g. https://lumphufarm.duckdns.org)")
    if not API_KEY:
        die("set N8N_API_KEY")

    print(f"Fetching workflow {WORKFLOW_ID} from {BASE} ...")
    wf = get_workflow()
    print(f"  name: {wf.get('name')!r}")

    # Count occurrences of OLD_TITLE inside the nodes only.
    nodes_json = json.dumps(wf.get("nodes", []), ensure_ascii=False)
    count = nodes_json.count(OLD_TITLE)
    print(f"  found {count} occurrence(s) of {OLD_TITLE!r} in nodes")

    if count == 0:
        print(
            "\nNothing to replace. The title is probably spelled differently "
            "in the workflow.\nSet OLD_TITLE to the exact text n8n sends and "
            "re-run, e.g.:\n  export OLD_TITLE='...'\n"
        )
        return

    new_nodes = json.loads(nodes_json.replace(OLD_TITLE, NEW_TITLE))

    if DRY_RUN:
        print(f"\n[dry-run] would replace {count} occurrence(s):")
        print(f"          {OLD_TITLE!r}  ->  {NEW_TITLE!r}")
        print("[dry-run] no changes written. Re-run without --dry-run to apply.")
        return

    # The PUT endpoint accepts only these fields; extra keys are rejected.
    payload = {
        "name": wf["name"],
        "nodes": new_nodes,
        "connections": wf["connections"],
        "settings": wf.get("settings", {}),
    }
    if wf.get("staticData") is not None:
        payload["staticData"] = wf["staticData"]

    print(f"Updating workflow ({count} replacement(s)) ...")
    put_workflow(payload)
    print(f"Done. Headline is now {NEW_TITLE!r}.")
    print("Open the workflow in n8n to confirm, then run it once to verify.")


if __name__ == "__main__":
    main()
