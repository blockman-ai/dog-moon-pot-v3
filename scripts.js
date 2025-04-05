
// Config
const ADDRESS = "bc1psewn5hprrlhhcze9x9lcpd74wmpy26cwaxpzc270v8x0h9kt3kls6hrax4";
const PRICE_API = "https://api.mempool.space/api/v1/runes/DOG/price/usd";
const ENTRY_JSON = "lottery_entries.json";
const STATUS_JSON = "lottery_status.json";
const WINNERS_JSON = "winners_history.json";

let userAddress = null;

// Utility
const $ = id => document.getElementById(id);

// Load Pot Stats
async function loadPot() {
  try {
    const res = await fetch(STATUS_JSON);
    const status = await res.json();
    $("live-pot").textContent = status.pot + " $DOG";
    $("payout").textContent = status.payout + " $DOG";
    $("rollover").textContent = status.rollover + " $DOG";
    $("creator-fee").textContent = status.creator_fee + " $DOG";
    $("last-winner").textContent = `${status.last_winner} — ${status.last_amount} $DOG`;
  } catch (e) {
    console.error("Pot stats error:", e);
  }
}

// Load Countdown
function loadCountdown() {
  const endTime = new Date();
  endTime.setUTCHours(24, 0, 0, 0);
  setInterval(() => {
    const now = new Date();
    const diff = endTime - now;
    const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
    const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, "0");
    const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");
    $("countdown").textContent = `${hours}h ${minutes}m ${seconds}s`;
  }, 1000);
}

// Entry Checker
async function checkEntry() {
  const input = $("entry-input").value.trim().toLowerCase();
  if (!input) return;

  try {
    const res = await fetch(ENTRY_JSON);
    const entries = await res.json();
    const match = entries.find(e => e.txid.includes(input) || (e.email && e.email.toLowerCase() === input));
    $("entry-result").textContent = match ? `${match.from} — ${match.amount} $DOG` : "Not found";
  } catch (e) {
    $("entry-result").textContent = "Error checking entry.";
  }
}

// Notify Me (stub, real email handler pending)
function notifyMe() {
  const email = $("alert-email").value.trim();
  const txid = $("alert-txid").value.trim();
  if (!email) return alert("Enter email or @handle");
  console.log("Notify request:", { email, txid });
  alert("You will be notified if you win!");
}

// QR Code
function showQRCode() {
  const url = `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${ADDRESS}`;
  const win = window.open();
  win.document.write(`<img src="${url}" alt="QR Code to send $DOG" />`);
}

// Load DOG price
async function loadPrice() {
  try {
    const res = await fetch(PRICE_API);
    const price = await res.json();
    $("dog-price").textContent = "$" + parseFloat(price.usd).toFixed(4);
  } catch (e) {
    $("dog-price").textContent = "$0.00";
  }
}

// Load past winners
async function loadWinners() {
  try {
    const res = await fetch(WINNERS_JSON);
    const data = await res.json();
    const list = $("winner-list");
    list.innerHTML = "";
    data.slice(0, 5).forEach(w => {
      const li = document.createElement("li");
      const short = w.from.slice(0, 6) + "..." + w.from.slice(-4);
      const time = new Date(w.timestamp).toLocaleString();
      li.textContent = `${short} — ${w.amount} $DOG @ ${time}`;
      list.appendChild(li);
    });
  } catch (e) {
    $("winner-list").innerHTML = "<li>Unable to load winners</li>";
  }
}

// Connect UniSat Wallet
async function connectWallet() {
  try {
    const accounts = await window.unisat.requestAccounts();
    userAddress = accounts[0];
    $("wallet-status").textContent = "Connected: " + userAddress.slice(0, 6) + "..." + userAddress.slice(-4);
  } catch (err) {
    alert("Failed to connect UniSat wallet");
  }
}

// View Entry from Wallet
async function viewMyEntry() {
  if (!userAddress) {
    alert("Please connect your UniSat wallet first.");
    return;
  }

  try {
    const res = await fetch(ENTRY_JSON);
    const entries = await res.json();
    const match = entries.find(e => e.from.toLowerCase() === userAddress.toLowerCase());

    if (match) {
      alert(`Your entry: ${match.amount} $DOG — TXID: ${match.txid.slice(0, 12)}...`);
    } else {
      alert("You haven't entered this round yet.");
    }
  } catch (e) {
    alert("Error checking your wallet entry.");
  }
}

// Init
loadPot();
loadCountdown();
loadPrice();
loadWinners();
