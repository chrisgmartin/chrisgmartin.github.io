from mcp.server.fastmcp import FastMCP
from typing import Literal
from mcp.server.fastmcp.prompts import base
from time import time
import os
import httpx
import jwt
from contextvars import ContextVar
from functools import wraps
from mcp.server.fastmcp import Context

mcp = FastMCP("compliance-toolkit", stateless_http=True)


# ---------- Auth functions ----------

SECRET = "dev-secret-do-not-use-in-production"

# Threaded through the request via ContextVar so tool signatures stay clean.
# FastMCP rejects tool parameters that start with '_', so we can't pass auth
# identity as a function kwarg. Tools read it via current_auth_user().
_current_auth_user: ContextVar[str] = ContextVar("_current_auth_user", default="anonymous")


def current_auth_user() -> str:
    """Return the authenticated subject ('sub' claim) for the in-flight tool call."""
    return _current_auth_user.get()


def require_auth(tool_name: str):
    """Decorator: validate a Bearer JWT from the request headers and check scope."""
    def deco(fn):
        @wraps(fn)
        def wrapper(*args, ctx: Context = None, **kwargs):
            # FastMCP makes the request available via ctx.request_context
            headers = {}
            if ctx and hasattr(ctx, "request_context"):
                req = ctx.request_context.request
                if req:
                    headers = dict(req.headers)

            auth = headers.get("authorization", "")
            if not auth.startswith("Bearer "):
                return {"error": "missing or malformed Authorization header", "isError": True}

            token = auth.removeprefix("Bearer ").strip()
            try:
                payload = jwt.decode(token, SECRET, algorithms=["HS256"])
            except jwt.ExpiredSignatureError:
                return {"error": "token expired", "isError": True}
            except jwt.InvalidTokenError as e:
                return {"error": f"invalid token: {e}", "isError": True}

            scope_tools = payload.get("scope", {}).get("tools", [])
            if tool_name not in scope_tools:
                return {
                    "error": f"token does not authorize tool '{tool_name}'",
                    "authorized": scope_tools,
                    "isError": True,
                }

            token_ref = _current_auth_user.set(payload["sub"])
            try:
                return fn(*args, **kwargs)
            finally:
                _current_auth_user.reset(token_ref)
        return wrapper
    return deco

# ---------- Mock data (in production: real sources) ----------

SDN_LIST = {
    "vladimir petrov": {"list": "OFAC SDN", "added": "2024-03-15", "program": "RUSSIA-EO14024"},
    "global shadow holdings": {"list": "OFAC SDN", "added": "2023-11-02", "program": "SDGT"},
    "atlas crypto exchange": {"list": "EU Consolidated", "added": "2025-01-20", "program": "EU-CYBER"},
}

JURISDICTION_RISK = {
    "US": ("low",  "FATF compliant, mature AML regime"),
    "GB": ("low",  "FATF compliant, FCA oversight"),
    "DE": ("low",  "FATF compliant, BaFin oversight"),
    "AE": ("medium", "FATF grey list 2022-2024, recently exited"),
    "KY": ("medium", "Offshore jurisdiction, enhanced due diligence advised"),
    "RU": ("high", "Comprehensive sanctions, enhanced screening required"),
    "IR": ("prohibited", "OFAC comprehensive sanctions — do not transact"),
    "KP": ("prohibited", "OFAC comprehensive sanctions — do not transact"),
}

# ---------- Tool 0: audit logging ----------

import logging, json, sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    stream=sys.stderr,  # stdout is reserved for MCP protocol!
)


_CACHE: dict[str, tuple[float, dict]] = {}
_CACHE_TTL_SECONDS = 3600  # 1 hour — adjust for compliance freshness requirements


# ---------- Cache functions ----------

def _cache_get(name: str) -> dict | None:
    key = name.strip().lower()
    if key not in _CACHE:
        return None
    ts, value = _CACHE[key]
    if time() - ts > _CACHE_TTL_SECONDS:
        del _CACHE[key]
        return None
    return value


def _cache_set(name: str, value: dict) -> None:
    _CACHE[name.strip().lower()] = (time(), value)


# ---------- Tool 2: jurisdiction risk ----------

@mcp.tool()
def check_jurisdiction_risk(country_code: str) -> dict:
    logging.info("tool_call=%s args=%s", "check_jurisdiction_risk", json.dumps({"country_code": country_code}))
    code = country_code.strip().upper()
    if code not in JURISDICTION_RISK:
        return {
            "country_code": code,
            "tier": "unknown",
            "rationale": "Country code not in risk register — flag for review.",
        }
    tier, rationale = JURISDICTION_RISK[code]
    return {"country_code": code, "tier": tier, "rationale": rationale}

# ---------- Tool 3: alert summarization ---------- 

@mcp.tool()
def summarize_alert(
    alert_id: str,
    counterparty_name: str,
    counterparty_country: str,
    amount_usd: float,
    transaction_type: Literal["wire", "crypto-withdrawal", "crypto-deposit", "card"],
) -> dict:
    logging.info(
        "tool_call=%s args=%s",
        "summarize_alert",
        json.dumps({
            "alert_id": alert_id,
            "counterparty_name": counterparty_name,
            "counterparty_country": counterparty_country,
            "amount_usd": amount_usd,
            "transaction_type": transaction_type,
        }),
    )
    sanctions = lookup_sanctions_hit(counterparty_name)
    jurisdiction = check_jurisdiction_risk(counterparty_country)

    flags = []
    if sanctions["match"] is True:
        list_label = sanctions.get("list") or ", ".join(sanctions.get("datasets", [])) or "OpenSanctions"
        program_label = sanctions.get("program") or sanctions.get("matched_entity") or sanctions.get("score", "")
        flags.append(f"SANCTIONS HIT: {list_label} ({program_label})")
    elif sanctions["match"] == "unknown":
        flags.append(f"SCREENING DEGRADED: {sanctions.get('fallback_reason') or sanctions.get('error', 'upstream unavailable')}")
    if jurisdiction["tier"] == "prohibited":
        flags.append(f"PROHIBITED JURISDICTION: {jurisdiction['country_code']}")
    if jurisdiction["tier"] == "high":
        flags.append(f"HIGH-RISK JURISDICTION: {jurisdiction['country_code']}")
    if amount_usd >= 10_000:
        flags.append(f"CTR THRESHOLD: amount ${amount_usd:,.2f} ≥ $10K")
    
    if any(f.startswith("SANCTIONS") or f.startswith("PROHIBITED") for f in flags):
        recommendation = "halt-and-escalate"
    elif flags:
        recommendation = "escalate-for-human-review"
    else:
        recommendation = "low-risk-suggest-dismiss"

    return {
        "alert_id": alert_id,
        "summary": (
            f"Alert {alert_id}: {transaction_type} of ${amount_usd:,.2f} with "
            f"counterparty '{counterparty_name}' ({counterparty_country})."
        ),
        "flags": flags or ["no automated flags"],
        "recommendation": recommendation,
        "requires_human_approval": True, # always — agent never auto-acts
        "sources": {"sanctions": sanctions, "jurisdiction": jurisdiction},
    }


# ---------- Tool 4: sanctions screening with OpenSanctions API ----------

OPENSANCTIONS_BASE = "https://api.opensanctions.org"
OPENSANCTIONS_API_KEY = os.environ.get("OPENSANCTIONS_API_KEY", "")


def _local_fallback(name: str, reason: str) -> dict:
    """Fallback to the small embedded SDN list when the upstream API is unavailable.

    NOT a substitute for the full sanctions check — clearly marks the response
    as a degraded reading so investigators know to re-screen when upstream recovers.
    """
    key = name.strip().lower()
    if key in SDN_LIST:
        hit = SDN_LIST[key]
        return {
            "match": True,
            "name_queried": name,
            "degraded_reading": True,
            "fallback_reason": reason,
            "list": hit["list"],
            "program": hit["program"],
            "added": hit["added"],
            "recommended_action": "halt-and-escalate-AND-re-screen-when-upstream-recovers",
        }
    return {
        "match": "unknown",
        "name_queried": name,
        "degraded_reading": True,
        "fallback_reason": reason,
        "screened_sources": "embedded fallback only (3 names)",
        "recommended_action": "manual-screening-required",
    }

def _do_screening(name: str) -> dict:
    """Existing screening logic — cache, OpenSanctions API call, fallback.

    Private helper. The public tool wraps this with auth and stamps the caller.
    """
    cached = _cache_get(name)
    if cached is not None:
        logging.info("sanctions_screening name=%s source=cache outcome=%s", name, cached.get("match"))
        return {**cached, "from_cache": True}

    payload = {
        "queries": {
            "q1": {
                "schema": "Thing",  # Person | Organization | Thing (Thing matches both)
                "properties": {"name": [name]},
            }
        }
    }
    try:
        response = httpx.post(
            f"{OPENSANCTIONS_BASE}/match/sanctions",
            json=payload,
            headers={"Authorization": f"Bearer {OPENSANCTIONS_API_KEY}"},
            timeout=5.0,
        )
        response.raise_for_status()
        results = response.json().get("responses", {}).get("q1", {}).get("results", [])
    except httpx.TimeoutException:
        return _local_fallback(name, "OpenSanctions API timed out after 5s")
    except httpx.HTTPStatusError as e:
        return _local_fallback(name, f"OpenSanctions API returned {e.response.status_code}")
    except Exception as e:
        return _local_fallback(name, f"Sanctions screening failed: {type(e).__name__}")

    if not results:
        no_match = {
            "match": False,
            "name_queried": name,
            "screened_sources": "OpenSanctions aggregated (250+ sources)",
            "recommended_action": "proceed-with-standard-cdd",
        }
        _cache_set(name, no_match)
        logging.info("sanctions_screening name=%s source=api outcome=no-match", name)
        return no_match

    top = results[0]
    hit = {
        "match": True,
        "name_queried": name,
        "matched_entity": top.get("caption"),
        "score": top.get("score"),
        "schema": top.get("schema"),
        "datasets": top.get("datasets", []),
        "first_seen": top.get("first_seen"),
        "recommended_action": "halt-and-escalate",
        "source_url": f"https://www.opensanctions.org/entities/{top.get('id', '')}/",
    }
    _cache_set(name, hit)
    logging.info("sanctions_screening name=%s source=api outcome=hit score=%s", name, top.get("score"))
    return hit


@mcp.tool()
@require_auth("lookup_sanctions_hit")
def lookup_sanctions_hit(name: str, ctx: Context = None) -> dict:
    """Screen a person or entity name against the live OpenSanctions database
    (OFAC SDN, EU Consolidated, UN, and ~250 other sanction sources).

    Requires a Bearer JWT in the Authorization header with 'lookup_sanctions_hit'
    in its tool scope. The caller's identity is recorded on every response.

    Args:
        name: Full legal name or entity name to screen. Case-insensitive.
    """
    result = _do_screening(name)
    result["screened_by"] = current_auth_user()
    return result


# ---------- Resources: authoritative documents ----------

POLICY_DOCS = {
    "kyc-tier-2": {
        "title": "KYC Tier 2 — Enhanced Due Diligence Requirements",
        "effective_date": "2025-09-01",
        "content": """\
KYC Tier 2 — Enhanced Due Diligence (EDD)

SCOPE: Customers classified Tier 2 require enhanced due diligence at onboarding and
on a 12-month review cadence. Triggers include cumulative volume > $50,000/year,
exposure to medium-risk jurisdictions, or politically-exposed-person (PEP) status.

REQUIRED EVIDENCE:
1. Government-issued ID verified against authoritative source
2. Proof of address dated within 90 days
3. Source-of-wealth documentation (employment letter, business registration, or tax return)
4. Sanctions screening against OFAC SDN, EU Consolidated, UN, and HMT lists
5. Adverse media screening covering the last 5 years

REVIEW CADENCE: Annual; immediate re-review on any material change in profile.
DOCUMENTATION RETENTION: 7 years from account closure per BSA 31 CFR 1010.430.""",
    },
    "sar-narrative-template": {
        "title": "SAR Narrative Template — Internal SOP",
        "effective_date": "2024-11-15",
        "content": """\
SAR Narrative Template — Internal Standard Operating Procedure

The narrative section of a Suspicious Activity Report must answer five questions
concisely. The recommended order:

1. WHO   — Subject(s) of the report. Full legal name, customer ID, role.
2. WHAT  — Suspicious activity. Type, channels, amounts, time window.
3. WHERE — Jurisdictions involved. Counterparties' locations.
4. WHEN  — Date range. Frequency. Velocity changes.
5. WHY   — What makes this suspicious. Reference policy or red-flag indicator.

TONE: Factual. No speculation. No conclusory language ("Customer is a money
launderer" — NO; "Activity is inconsistent with stated source of wealth" — YES).

LENGTH: Aim for 5-15 sentences. Be specific, not comprehensive.""",
    },
    "high-risk-jurisdictions": {
        "title": "High-Risk Jurisdictions — Current List",
        "effective_date": "2026-04-01",
        "content": """\
High-Risk Jurisdictions (effective 2026-04-01)

PROHIBITED (Comprehensive Sanctions):
- Iran (IR), North Korea (KP), Cuba (CU), Syria (SY)
- Russia (RU) — sectoral sanctions per OFAC EO 14024

HIGH RISK (Enhanced Monitoring):
- FATF black list: as published current cycle
- FATF grey list: as published current cycle
- Countries with weak AML/CFT regimes per internal risk assessment

This list is reviewed quarterly. The authoritative source is the Compliance
Policy Manual section 4.2. Refer all edge cases to the compliance lead.""",
    },
}


@mcp.resource("compliance://policies/{doc_id}")
def get_policy_document(doc_id: str) -> str:
    """Return the full text of an internal compliance policy document.

    Use these as authoritative references when drafting case narratives, EDD reports,
    or regulatory responses. Cite the URI and effective_date in any output that
    relies on the document.
    """
    if doc_id not in POLICY_DOCS:
        return f"# Policy not found\n\nNo policy document with ID '{doc_id}' is registered."
    doc = POLICY_DOCS[doc_id]
    return (
        f"# {doc['title']}\n"
        f"Effective: {doc['effective_date']}\n"
        f"Source URI: compliance://policies/{doc_id}\n\n"
        f"{doc['content']}"
    )


@mcp.resource("compliance://policies")
def list_policies() -> str:
    """Return a directory of all available compliance policy documents."""
    lines = ["# Available Compliance Policies\n"]
    for doc_id, doc in POLICY_DOCS.items():
        lines.append(f"- **compliance://policies/{doc_id}**: {doc['title']} (effective {doc['effective_date']})")
    return "\n".join(lines)


# ---------- Prompts: reusable templates ----------

@mcp.prompt()
def draft_sar_narrative(
    case_id: str,
    suspicious_activity_type: str,
    time_window: str = "the last 30 days",
) -> list[base.Message]:
    """Draft a Suspicious Activity Report (SAR) narrative for a case.

    The narrative will follow the firm's standard SAR template (WHO/WHAT/WHERE/WHEN/WHY),
    cite specific transactions from the case file, and reference the policy URIs used.
    """
    return [
        base.UserMessage(
            f"You are a senior compliance analyst drafting a SAR narrative. "
            f"Use ONLY information from the case file and the policy documents you have "
            f"been provided. Cite specific transactions by date and amount. "
            f"Cite policy URIs for any procedural claim. Refuse to speculate.\n\n"
            f"Case: {case_id}\n"
            f"Suspicious activity type: {suspicious_activity_type}\n"
            f"Time window: {time_window}\n\n"
            f"Step 1: Fetch the case file at compliance://cases/{case_id}.\n"
            f"Step 2: Fetch the SAR template at compliance://policies/sar-narrative-template.\n"
            f"Step 3: Draft a 5-15 sentence narrative following the template structure.\n"
            f"Step 4: List the specific URIs you cited.\n\n"
            f"Do not file the SAR. Produce a draft for human review only."
        ),
    ]


@mcp.prompt()
def explain_alert(
    alert_id: str,
    counterparty_name: str,
    counterparty_country: str,
    amount_usd: float,
) -> str:
    """Explain a transaction alert in plain language for a non-technical investigator.

    Returns a single rendered string the model uses as its user-turn input.
    """
    return (
        f"I'm a new investigator. Please explain alert {alert_id} in plain language. "
        f"The alert involves a {amount_usd:,.2f} USD transaction with counterparty "
        f"'{counterparty_name}' in {counterparty_country}.\n\n"
        f"Walk me through:\n"
        f"  1. What screening tools would you run on this?\n"
        f"  2. What the result of each tool tells you in plain English.\n"
        f"  3. What the recommended action is, and why.\n"
        f"  4. What I should ask the customer if I need more information.\n\n"
        f"Use the compliance-toolkit tools to run the screening for me as you explain."
    )

@mcp.prompt()
def review_sar_draft(draft_text: str) -> str:
    """Critique a draft SAR narrative against the firm's quality rubric.

    Returns a structured review pointing out missing sections, speculative language,
    uncited claims, and tone issues. Does NOT rewrite — the human decides what to fix.
    """
    return (
        f"You are a compliance lead reviewing a junior analyst's draft SAR narrative. "
        f"Apply the firm's rubric strictly. Do NOT rewrite the draft — produce a "
        f"structured critique that the analyst can act on.\n\n"
        f"--- DRAFT ---\n{draft_text}\n--- END DRAFT ---\n\n"
        f"Score each of the five criteria on a 1-5 scale and explain:\n"
        f"  1. WHO/WHAT/WHERE/WHEN/WHY structure — are all five present?\n"
        f"  2. Factuality — every claim backed by case data, no speculation?\n"
        f"  3. Citation — specific transactions cited by date and amount?\n"
        f"  4. Tone — factual, non-conclusory, regulator-appropriate?\n"
        f"  5. Length — 5-15 sentences, specific not comprehensive?\n\n"
        f"Then produce a 'top 3 things to fix' list, ordered by importance.\n"
        f"Conclude with a single line: APPROVED | REVISE | REJECT."
    )

# ---------- Run the server ----------

if __name__ == "__main__":
    import sys
    transport = sys.argv[1] if len(sys.argv) > 1 else "stdio"
    if transport == "http":
        mcp.run(transport="streamable-http")
    else:
        mcp.run()  # stdio (default)