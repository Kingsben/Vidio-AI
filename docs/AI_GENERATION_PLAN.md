# First real AI video engine

Research checked **18 October 2026** against the primary sources linked below. This is a proposed next phase: no model, GPU package, paid API, generation endpoint, database change, or simulated generation was added in Phase 4C. Phase 4D then confirmed that Wan2.1-1.3B is a plausible ZeroGPU benchmark candidate but did not run inference because hosted-resource/data-transfer authorization and account eligibility were not established. Current cloud functionality remains project briefs. See the [Phase 4D report](PHASE_4D_REPORT.md) for the current ZeroGPU quotas, authorization gate, secure integration design, and separate administrator architecture.

## Recommendation and $0 boundary

Hardware inspection found **Intel UHD Graphics 620**, no `nvidia-smi`, and **7,922,216,960 bytes of reported system RAM (about 7.38 GiB)**. Windows reported 1 GiB AdapterRAM, which is not a reliable dedicated-VRAM measurement for integrated graphics. No NVIDIA CUDA GPU was observed. This machine is not a practical host for the recommended CUDA video models; do not install large model weights here on that assumption.

The smallest real first capability is an **owner-only, single-shot text-to-video experiment**: one prompt, one seed, one approximately five-second, silent 480p MP4 using **Wan2.1-T2V-1.3B**. Given the inspected hardware and $0 budget, first benchmark it in an **eligible personal Hugging Face ZeroGPU development Space**, within its actual quota and runtime limits. Eligibility, memory during model loading, inference duration and privacy remain unverified; this is a benchmark recommendation, not a functioning backend or an unrestricted free public service.

If a different compatible NVIDIA machine is available, provisionally target at least **12 GB dedicated VRAM** for Wan2.1-1.3B. That is our conservative benchmark target, not a published minimum. Keep CPU offload enabled, skip paid/local-LLM prompt expansion, and support landscape only initially. Do not imply existing portrait/square briefs can all be rendered yet.

An owned suitable GPU avoids rental/API fees, but electricity, existing hardware, downloads, disk and operator time still have costs. If neither eligible free compute nor suitable owned hardware is available, continue briefs and wait for compute rather than substitute stock videos or fake progress.

## Model comparison

Published VRAM figures use different settings and are not directly comparable. CPU offload moves memory pressure into system RAM and slows inference. These are inference choices; training/fine-tuning is out of scope.

| Specific checkpoint | Capability and practical compute evidence | Licence and first-phase fit |
| --- | --- | --- |
| **Wan2.1-T2V-1.3B** | Text-to-video. Official report: **8.19 GB VRAM**; approximately **4 minutes for 5 seconds at 480p on RTX 4090**, without quantization. An 8 GB card is below that reported footprint. CPU-offload/T5-on-CPU flags are documented. | Apache 2.0 weights. Preferred small first model on a measured suitable GPU. [Official instructions](https://github.com/Wan-Video/Wan2.1#run-text-to-video-generation), [specific model card](https://huggingface.co/Wan-AI/Wan2.1-T2V-1.3B). |
| **CogVideoX-2B** | Text-to-video; **720x480, 49 frames at 8 fps**, about six seconds. Model card says optimized Diffusers FP16 starts at **4 GB**, INT8 at **3.6 GB**, versus **18 GB** for SAT FP16. Crucially, those optimized measurements were tested on A100/H100, not arbitrary consumer GPUs. | Apache 2.0 for this 2B model. Benchmark fallback for **6-8 GB NVIDIA** hardware; those are our trial targets, not compatibility guarantees. Expect slow CPU transfers and limited motion quality. [Official model card and caveats](https://huggingface.co/zai-org/CogVideoX-2b). |
| **Wan2.2-TI2V-5B** | Both text and image inputs; 720p-class output at 24 fps. Official single-GPU command requires **at least 24 GB VRAM**, with model offload, dtype conversion, and T5 on CPU. | Apache 2.0 weights. Candidate for adding image-to-video after a successful 24 GB benchmark. The larger A14B official examples require **80 GB**, so do not confuse them with 5B. [Official repository](https://github.com/Wan-Video/Wan2.2#run-text-image-to-video-generation). |
| **LTX-Video 2B 0.9.8 distilled**, then 13B | Text/image conditioning; distilled and FP8 variants aim to reduce compute. Official model table describes light VRAM use but does **not provide a universal consumer-GPU minimum**. Measure peak VRAM, RAM, latency, and output quality before choosing it. | These weights use the **custom LTX-Video Open Weights 0.X licence**, despite Apache-licensed repository code. Royalty-free use below the stated enterprise threshold is subject to use and redistribution restrictions; entities with **at least $10 million annual revenue** need a separate commercial agreement. [Model/version list](https://huggingface.co/Lightricks/LTX-Video), [actual weight licence](https://huggingface.co/Lightricks/LTX-Video/blob/main/LTX-Video-Open-Weights-License-0.X.txt). |

**Do not generalize a family licence:** CogVideoX-5B has a separate licence requiring commercial registration/basic licence, with an additional agreement above one million monthly service visits. It is not an Apache drop-in replacement for 2B. [5B weight licence](https://huggingface.co/zai-org/CogVideoX-5b/blob/main/LICENSE).

Apache 2.0 permits commercial use subject to its terms, including redistribution notices; it does not grant third-party input, likeness, trademark, or output rights. Pin the precise model revision, tokenizer/encoder/VAE revisions, dependencies, and their licences before shipment. [Apache licence](https://www.apache.org/licenses/LICENSE-2.0).

The recommended first checkpoints generate video without a soundtrack. Label outputs **“Generated video — no audio”**. Joint audio/video generation such as current **LTX-2** is a later capability with a separate model/version evaluation; do not promise synchronized sound from Wan T2V. [Official LTX-2 project](https://github.com/Lightricks/LTX-2).

## Hosted development: free versus trial versus paid

| Route | Actual $0 status and limit |
| --- | --- |
| **Hugging Face ZeroGPU** | Genuinely free within quota. Current docs allow eligible personal Free accounts (verified email, account older than 30 days) **up to 2 own Spaces** and **5 GPU minutes/day**; default slice is **48 GB VRAM**. Shared queue, Gradio-only compatibility, runtime constraints, and daily allowance make this a developer demo/benchmark option. Verify eligibility, model load/RAM, actual duration, API quota attribution, data visibility, and access control before routing any app jobs. Organizations need a paid Team/Enterprise plan. [Current official ZeroGPU rules](https://huggingface.co/docs/hub/spaces-zerogpu). |
| **Google Colab Free** | Genuinely free opportunistic **interactive notebook** experiments; GPU type, availability, and session lifetime vary. It prohibits unrelated web-service hosting and restricts bypassing the notebook interface. Do not use it as the app's unattended worker/API. [Official FAQ](https://research.google.com/colaboratory/faq.html). |
| **Hugging Face Inference Providers** | **Paid for Free accounts** under current docs: no included credits; purchasing credits or a paid subscription is required. This is separate from ZeroGPU. [Current billing](https://huggingface.co/docs/inference-providers/pricing). |
| **Replicate** | Pay-as-you-go. Selected models have limited initial free runs, after which billing is requested: a trial, not a dependable free backend. A trial does not establish that this exact video checkpoint is free. [Official billing](https://replicate.com/docs/topics/billing). |
| **Rented GPUs / commercial video APIs** | Paid computing; no integration in this phase. No unrestricted free Kling or Higgsfield API has been established by this research. Reassess a specific provider's official price, licence, retention, quotas, and budget cap only if funding is approved. |

Public demo uploads/prompts may be visible or retained under provider settings/terms. Use non-sensitive test content; do not send existing private project briefs to a third party automatically.

## Hardware decision needed before installation

Record only: GPU vendor/exact model, **dedicated VRAM** and free VRAM under normal use, driver version/CUDA compatibility, system RAM, CPU, free SSD capacity, Windows version, and availability of WSL2/Linux. Do not collect serial numbers, account identifiers, credentials, or `.env.local` contents. Shared graphics memory is not dedicated VRAM.

For a first Wan trial, provisionally target **32 GB system RAM and 50 GB free SSD**; these are engineering headroom estimates, not verified model minima. Confirm complete download sizes and actual peak RAM before proceeding. NVIDIA's CUDA-on-WSL prerequisites must be satisfied; Windows alone proves nothing about model compatibility. Native Windows, AMD/Intel GPUs, integrated graphics, and CPU-only inference are **unverified**, not assumed supported. CPU model, free SSD space, Windows/WSL version and any additional external GPU remain uncollected; obtain those only if a local route is reconsidered. Do not install drivers, enable WSL, or request administrator access in this phase. [NVIDIA WSL guide](https://docs.nvidia.com/cuda/wsl-user-guide/index.html).

## Small backend, real state, private artifacts

For a future suitable local GPU, use a **localhost-only Python API + one inference worker** on that machine. For the current ZeroGPU benchmark, invoke inference in the controlled Gradio Space and validate its model loading, quota and privacy first; any later app bridge must keep provider credentials server-side. The backend design below is the proposed app bridge, not an assumption that this Intel laptop performs inference. Use a small **SQLite job store**, avoiding a hosted queue or changes to `public.projects`. Future shared deployment and any new cloud table/storage policies require their own security review; existing Auth, CRUD, ownership, and RLS remain intact.

1. `POST /generation-jobs`: verify the Supabase access token with Auth, derive owner ID server-side, check the selected project through the caller's authenticated access, validate a bounded prompt/seed, and atomically reserve quota plus an idempotent job ID. Never trust a client-supplied owner ID.
2. A single worker transactionally claims a queued job with a lease/heartbeat. Record `queued → running → succeeded / failed / cancelled`; mark expired work interrupted. No automatic unbounded retry. Cancellation must stop computation and release resources.
3. Report real stages/step counts only when emitted by the worker. Otherwise show “Queued”/“Generating”; never animate an invented completion percentage or guarantee an ETA.
4. Write to a temporary private directory outside Vite `public/` and Git. Inspect/decode the generated MP4, then atomically publish the artifact and its model revision/seed/settings. A completed file is required before success. Serve downloads through owner-checked endpoints with Range support; never expose arbitrary filesystem paths.
5. On an eventual cloud deployment, use a private object bucket, short-lived authorized downloads, deletion/retention controls, and owner-isolation tests before launch. Keep model weights local to the worker. No frontend service-role key, provider token, arbitrary model URL, or executable workflow input.

## Initial guardrails and acceptance gates

Proposed pilot limits: **one allowlisted owner**, one running job globally, at most two queued jobs, three attempts/day, fixed resolution/frame/step ceiling, 1,000-character prompt cap, 20-minute hard job timeout, **25 MB output cap**, **500 MB artifact budget**, and seven-day expiry. Reserve attempts before work and enforce limits in the backend, not the UI. Tune these only after measured benchmarks.

Start without image uploads; when image-to-video is added, permit only validated JPEG/PNG, bound bytes and decoded pixels, strip metadata, re-encode safely, and reject remote input URLs to avoid SSRF. Use token authentication, exact allowed origins, rate limits, bounded subprocess arguments (no shell interpolation), and safe non-sensitive logs. Manual prompt/output review is feasible for an owner-only $0 pilot. Block sexual content involving minors, non-consensual imagery, and harmful impersonation; do not present a keyword filter as complete moderation. Add output review/reporting and deletion before wider access.

If storage later uses Supabase Free, current allowance is **1 GB file storage, 500 MB database/project, and 5 GB egress**; generation and repeated video downloads can exhaust it quickly. These are shared platform limits, not extra per-user generation allowances. Hard-stop below the available budget; no automatic paid upgrade. [Supabase quotas](https://supabase.com/docs/guides/platform/billing-on-supabase).

Before connecting the UI: generate at least three original benchmark clips, record wall time/peak VRAM/RAM/disk, inspect motion and decode integrity, and test restart, timeout, cancellation, retry/idempotency, quota rejection, owner checks, and deletion. Then connect only the successful backend, behind an explicit experimental feature switch. Live two-account Supabase/RLS isolation is still pending and must pass before multiuser generation. **No hardware compatibility or real generation has been verified in this research-only phase.**
