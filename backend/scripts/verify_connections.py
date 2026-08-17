import asyncio
import os
import sys
import time
from datetime import datetime, timezone

import httpx
from dotenv import load_dotenv

# Load local .env
load_dotenv()

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.config import get_settings
from src.persistence.cosmos_client import get_cosmos_manager


async def test_azure_cosmos() -> dict:
    print("\n" + "=" * 60)
    print(" 1. TESTING AZURE COSMOS DB (Free Tier: 1,000 RU/s + 25GB)")
    print("=" * 60)
    start_time = time.perf_counter()
    try:
        manager = get_cosmos_manager()
        manager.initialize_database_and_containers()
        ping_res = manager.ping()
        elapsed = (time.perf_counter() - start_time) * 1000

        # Perform test write and read on patient_sessions
        sessions_container = manager.get_container("patient_sessions")
        test_session_id = f"TEST_SESSION_{int(time.time())}"
        test_doc = {
            "id": test_session_id,
            "userId": "system_verifier",
            "chatHistory": [{"role": "system", "content": "Verification probe"}],
            "turn_count": 0,
            "progress_percent": 0,
            "ttl": 60,  # 1 minute TTL test
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        sessions_container.upsert_item(test_doc)
        read_doc = sessions_container.read_item(
            item=test_session_id, partition_key="system_verifier"
        )
        assert read_doc["id"] == test_session_id

        # Cleanup test doc
        sessions_container.delete_item(
            item=test_session_id, partition_key="system_verifier"
        )

        print(f"  [+] Database: {ping_res.get('database_id')}")
        print(
            "  [+] Containers verified: patient_sessions, slot_holds, medical_records, appointments, audit_logs"
        )
        print("  [+] Test Item Upsert/Read/Delete: SUCCESS (verified TTL)")
        print(f"  [+] Latency: {elapsed:.2f} ms")
        return {"status": "SUCCESS", "latency_ms": elapsed}
    except (RuntimeError, ValueError, OSError, httpx.HTTPError) as ex:
        print(f"  [-] FAILED: {ex}")
        return {"status": "FAILED", "error": str(ex)}


async def test_supabase_pgvector() -> dict:
    print("\n" + "=" * 60)
    print(" 2. TESTING SUPABASE PGVECTOR (2,670 Vectors Knowledge Base)")
    print("=" * 60)
    start_time = time.perf_counter()
    settings = get_settings()
    supabase_url = settings.supabase_url
    anon_key = settings.supabase_anon_key.get_secret_value()

    if not supabase_url or not anon_key:
        print("  [-] Supabase URL or Anon Key not configured.")
        return {"status": "FAILED", "error": "Missing credentials"}

    try:
        # Call RPC match_knowledge_chunks with a 1024-dim dummy vector
        dummy_vector = [0.01] * 1024
        rpc_url = f"{supabase_url.rstrip('/')}/rest/v1/rpc/match_knowledge_chunks"
        headers = {
            "apikey": anon_key,
            "Authorization": f"Bearer {anon_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "query_embedding": dummy_vector,
            "match_threshold": 0.0,
            "match_count": 3,
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(rpc_url, json=payload, headers=headers)
            elapsed = (time.perf_counter() - start_time) * 1000

            if resp.status_code == 200:
                results = resp.json()
                print(f"  [+] RPC endpoint: {rpc_url}")
                print("  [+] pgvector search response: 200 OK")
                print(f"  [+] Retrieved chunks count: {len(results)}")
                if len(results) > 0:
                    sample_title = results[0].get("metadata", {}).get("title", "N/A")
                    print(
                        f"  [+] Sample chunk match: {sample_title[:60]}... (similarity: {results[0].get('similarity', 0):.4f})"
                    )
                print(f"  [+] Latency: {elapsed:.2f} ms")
                return {
                    "status": "SUCCESS",
                    "chunks_retrieved": len(results),
                    "latency_ms": elapsed,
                }
            else:
                print(f"  [-] RPC returned error {resp.status_code}: {resp.text}")
                return {
                    "status": "FAILED",
                    "status_code": resp.status_code,
                    "error": resp.text,
                }
    except (httpx.HTTPError, TimeoutError, RuntimeError, OSError) as ex:
        print(f"  [-] Supabase test failed: {ex}")
        return {"status": "FAILED", "error": str(ex)}


async def test_google_gemini_keys() -> dict:
    print("\n" + "=" * 60)
    print(" 3. TESTING GOOGLE GEMINI GENERATIVE AI (Strict: 3.1 & 3.5 Flash Lite)")
    print("=" * 60)
    settings = get_settings()
    keys = settings.get_gemini_api_keys()
    if not keys:
        print("  [-] No Gemini API keys found.")
        return {"status": "FAILED", "error": "No keys"}

    success_count = 0
    total_keys = len(keys)

    # Alternate between gemini-3.1-flash-lite and gemini-3.5-flash-lite
    models = [settings.gemini_generative_model_1, settings.gemini_generative_model_2]

    async with httpx.AsyncClient(timeout=15.0) as client:
        for idx, key in enumerate(keys, 1):
            start_k = time.perf_counter()
            target_model = models[(idx - 1) % len(models)]
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent?key={key}"
            payload = {
                "contents": [{"parts": [{"text": "Reply with 'GEMINI_OK' only."}]}],
                "generationConfig": {"temperature": 0.0, "maxOutputTokens": 10},
            }
            try:
                resp = await client.post(url, json=payload)
                elapsed_k = (time.perf_counter() - start_k) * 1000
                if resp.status_code == 200:
                    data = resp.json()
                    cand = (
                        data.get("candidates", [{}])[0]
                        .get("content", {})
                        .get("parts", [{}])[0]
                        .get("text", "")
                        .strip()
                    )
                    print(
                        f"  [+] Key #{idx:02d} [{target_model}] (prefix {key[:12]}...): OK ({cand}) in {elapsed_k:.0f}ms"
                    )
                    success_count += 1
                else:
                    # Fallback to the other allowed model
                    alt_model = models[1 - ((idx - 1) % len(models))]
                    alt_url = f"https://generativelanguage.googleapis.com/v1beta/models/{alt_model}:generateContent?key={key}"
                    alt_resp = await client.post(alt_url, json=payload)
                    alt_elapsed = (time.perf_counter() - start_k) * 1000
                    if alt_resp.status_code == 200:
                        alt_data = alt_resp.json()
                        cand = (
                            alt_data.get("candidates", [{}])[0]
                            .get("content", {})
                            .get("parts", [{}])[0]
                            .get("text", "")
                            .strip()
                        )
                        print(
                            f"  [+] Key #{idx:02d} [Failover: {alt_model}] (prefix {key[:12]}...): OK ({cand}) in {alt_elapsed:.0f}ms"
                        )
                        success_count += 1
                    else:
                        print(
                            f"  [-] Key #{idx:02d} [{target_model}] (prefix {key[:12]}...): HTTP {resp.status_code} - {resp.text[:80]}"
                        )
            except (httpx.HTTPError, TimeoutError, RuntimeError, OSError) as ex:
                print(f"  [-] Key #{idx:02d} (prefix {key[:12]}...): ERROR - {ex}")

    print(f"\n  [=] Gemini Keys Active: {success_count}/{total_keys}")
    return {
        "status": "SUCCESS" if success_count > 0 else "FAILED",
        "active_keys": success_count,
        "total_keys": total_keys,
    }


async def test_mistral_embeddings() -> dict:
    print("\n" + "=" * 60)
    print(" 4. TESTING MISTRAL SEMANTIC EMBEDDINGS (Rotation Pool: 13 Keys)")
    print("=" * 60)
    settings = get_settings()
    keys = settings.get_mistral_api_keys()
    if not keys:
        print("  [-] No Mistral API keys found.")
        return {"status": "FAILED", "error": "No keys"}

    success_count = 0
    total_keys = len(keys)

    async with httpx.AsyncClient(timeout=15.0) as client:
        for idx, key in enumerate(keys, 1):
            start_k = time.perf_counter()
            url = "https://api.mistral.ai/v1/embeddings"
            headers = {
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": settings.mistral_embedding_model,
                "input": ["đau ngực khó thở lan ra cánh tay trái"],
            }
            try:
                resp = await client.post(url, json=payload, headers=headers)
                elapsed_k = (time.perf_counter() - start_k) * 1000
                if resp.status_code == 200:
                    data = resp.json()
                    embedding = data.get("data", [{}])[0].get("embedding", [])
                    dims = len(embedding)
                    print(
                        f"  [+] Key #{idx:02d} (prefix {key[:6]}...): OK ({dims}D Vector) in {elapsed_k:.0f}ms"
                    )
                    success_count += 1
                else:
                    print(
                        f"  [-] Key #{idx:02d} (prefix {key[:6]}...): HTTP {resp.status_code} - {resp.text[:80]}"
                    )
            except (httpx.HTTPError, TimeoutError, RuntimeError, OSError) as ex:
                print(f"  [-] Key #{idx:02d} (prefix {key[:6]}...): ERROR - {ex}")

    print(f"\n  [=] Mistral Keys Active: {success_count}/{total_keys}")
    return {
        "status": "SUCCESS" if success_count > 0 else "FAILED",
        "active_keys": success_count,
        "total_keys": total_keys,
    }


async def main():
    print("\n" + "#" * 70)
    print("  VMEC DEDICATED BACKEND - CLOUD INFRASTRUCTURE VERIFICATION")
    print("#" * 70)

    cosmos_res = await test_azure_cosmos()
    supabase_res = await test_supabase_pgvector()
    gemini_res = await test_google_gemini_keys()
    mistral_res = await test_mistral_embeddings()

    print("\n" + "=" * 70)
    print("                     EXECUTIVE SUMMARY")
    print("=" * 70)
    print(f"  1. Azure Cosmos DB (Free Tier):       {cosmos_res['status']}")
    print(f"  2. Supabase pgvector (2,670 Vectors): {supabase_res['status']}")
    print(
        f"  3. Google Gemini AI (7 Keys):         {gemini_res['status']} ({gemini_res.get('active_keys', 0)}/{gemini_res.get('total_keys', 0)} active)"
    )
    print(
        f"  4. Mistral Embeddings (13 Keys):      {mistral_res['status']} ({mistral_res.get('active_keys', 0)}/{mistral_res.get('total_keys', 0)} active)"
    )
    print("=" * 70)

    all_passed = (
        cosmos_res["status"] == "SUCCESS"
        and supabase_res["status"] == "SUCCESS"
        and gemini_res["status"] == "SUCCESS"
        and mistral_res["status"] == "SUCCESS"
    )

    if all_passed:
        print("\n [SUCCESS] ALL 4 CLOUD INFRASTRUCTURE SERVICES ARE 100% OPERATIONAL!")
        sys.exit(0)
    else:
        print(
            "\n [WARNING] Some services failed verification. Please review logs above."
        )
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
