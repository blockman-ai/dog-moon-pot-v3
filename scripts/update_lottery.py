# Create `update_lottery.py` script to pull real DOG Rune tx data

script = """
import requests
import json
from datetime import datetime
from decimal import Decimal
from pathlib import Path

# Configuration
ADDRESS = "bc1psewn5hprrlhhcze9x9lcpd74wmpy26cwaxpzc270v8x0h9kt3kls6hrax4"
RUNE_TICK = "DOG"
API_URL = f"https://open-api.unisat.io/v1/indexer/address/{ADDRESS}/rune/txs?tick={RUNE_TICK}&start=0&limit=100"

ENTRIES_PATH = Path("data/lottery_entries.json")
STATUS_PATH = Path("data/lottery_status.json")
MIN_ENTRY = 1000

def fetch_transactions():
    headers = {"accept": "application/json", "User-Agent": "DOGMOONBOT"}
    res = requests.get(API_URL, headers=headers)
    res.raise_for_status()
    return res.json().get("data", {}).get("transactions", [])

def load_entries():
    if ENTRIES_PATH.exists():
        with open(ENTRIES_PATH) as f:
            return json.load(f)
    return []

def save_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

def main():
    transactions = fetch_transactions()
    existing = {e["txid"] for e in load_entries()}
    entries = []

    for tx in transactions:
        txid = tx["txid"]
        time = datetime.utcfromtimestamp(tx["blocktime"]).isoformat() + "Z"
        for transfer in tx.get("transfers", []):
            if transfer["tick"] == RUNE_TICK and transfer["to"] == ADDRESS:
                amount = float(Decimal(transfer["amount"]) / Decimal(1e9))
                if txid not in existing and amount >= MIN_ENTRY:
                    entries.append({
                        "txid": txid,
                        "from": transfer["from"],
                        "to": transfer["to"],
                        "amount": amount,
                        "entries": int(amount) // MIN_ENTRY,
                        "timestamp": time
                    })

    total_dog = sum(e["amount"] for e in entries)
    payout = round(total_dog * 0.75, 6)
    rollover = round(total_dog * 0.20, 6)
    creator_fee = round(total_dog * 0.05, 6)

    status = {
        "pot": total_dog,
        "payout": payout,
        "rollover": rollover,
        "creator_fee": creator_fee,
        "last_winner": "Pending...",
        "last_amount": 0,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

    save_json(ENTRIES_PATH, entries)
    save_json(STATUS_PATH, status)
    print(f"Saved {len(entries)} new entries and pot status.")

if __name__ == "__main__":
    main()
"""
