#!/usr/bin/env python3
"""
Update the poster headline (title) inside an n8n workflow via the n8n
public REST API — no clicking in the UI.

It fetches the workflow, replaces every occurrence of OLD_TITLE with
NEW_TITLE inside the workflow's nodes, and PUTs the result back.

Usage:
  export N8N_BASE="https://lumphufarm.duckdns.org"
  export N8N_API_KEY="<your n8n API key>"
  export N8N_WORKFLOW_ID="1pTqhtIeSJJiDcUG"

  # 1) Dry run — shows what would change, writes nothing:
  python3 update-n8n-title.py --dry-run

  # 2) Apply the change:
  python3 update-n8n-title.py

Only the standard library is used (works with any Python 3.8+).
"""
import json
import os
import sys
import urllib.request
import urllib.error

# --- What to change -------------------------------------------------------
OLD_TITLE = "ราคาตลาดไทวันนี้"
NEW_TITLE = "ราคาพืชผลเกษตรวันนี้"

# --- Connection (from environment) ---------------------------------------
BASE = os.environ.get("N8N_BASE", "").rstrip("/")
API_KEY = os.environ.get("N8N_API_KEY", "")
WORKFLOW_ID = os.environ.get("N8N_WORKFLOW_ID", "1pTqhtIeSJJiDcUG")

DRY_RUN = "--dry-run" in sys.argv


def die(msg):
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def api(method, path, payload=None):
    """Call the n8n public API and return the parsed JSON body."""
    url = f"{BASE}/api/v1{path}"
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("X-N8N-API-KEY", API_KEY)
    req.add_header("Accept", "application/json")
    if data is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read() or "null")
    except urllib.error.HTTPError as e:
        die(f"{method} {path} -> HTTP {e.code}: {e.read().decode(errors='replace')}")
    except urllib.error.URLError as e:
        die(f"cannot reach {url}: {e.reason}")


def main():
    if not BASE:
        die("set N8N_BASE (e.g. https://lumphufarm.duckdns.org)")
    if not API_KEY:
        die("set N8N_API_KEY")

    print(f"Fetching workflow {WORKFLOW_ID} from {BASE} ...")
    wf = api("GET", f"/workflows/{WORKFLOW_ID}")
    print(f"  name: {wf.get('name')!r}")

    # Count occurrences of OLD_TITLE inside the nodes only.
    nodes_json = json.dumps(wf.get("nodes", []), ensure_ascii=False)
    count = nodes_json.count(OLD_TITLE)
    print(f"  found {count} occurrence(s) of {OLD_TITLE!r} in nodes")

    if count == 0:
        print(
            "\nNothing to replace. The title may be spelled differently in "
            "the workflow.\nEdit OLD_TITLE at the top of this script to match "
            "the exact text n8n sends, then re-run."
        )
        return

    # Replace and rebuild the nodes list.
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
    api("PUT", f"/workflows/{WORKFLOW_ID}", payload)
    print(f"Done. Headline is now {NEW_TITLE!r}.")
    print("Open the workflow in n8n to confirm, then run it once to verify.")


if __name__ == "__main__":
    main()
