# Phase 5C — LTX-2.5 audio/video experiment preflight

**Review date: 19 October 2026.** This is a read-only preflight for one synthetic experiment. No inference request, sign-in, upload, billing action, application integration, database change, or deployment was performed.

## Candidate and published Space

The selected candidate is the official [Lightricks LTX-2.5 Space](https://huggingface.co/spaces/Lightricks/LTX-2.5). At review time its page reported **Running on Zero**. The published [`app.py`](https://huggingface.co/spaces/Lightricks/LTX-2.5/blob/main/app.py) exposes text-to-video generation and labels its video output as including audio.

Source inspection found the requested settings supported: width and height have a 512-pixel minimum; two seconds maps to 49 frames at 24 fps using the pipeline's `8k+1` frame rule; the convolutional (`conv`) decoder is supported; the seed is an input; prompt enhancement can be disabled; and auto duration can be disabled. The Gradio callback input/output lists align with the generation callback signature in the inspected source. Prompt enhancement is implemented through a separate Space, so it must remain off to avoid an additional external call. No image input is needed for this text-only request.

The LTX-2.5 pipeline generates video and audio latents together; its published code passes generated audio through the audio decoder/vocoder and supplies it to the MP4 encoder. This supports expecting synchronized audio, but does not guarantee an audible or valid audio track in every result. The output must be checked rather than assumed.

## Cost and quota gate

The public [ZeroGPU documentation](https://huggingface.co/docs/hub/en/spaces-zerogpu) describes daily free quotas of two minutes for anonymous users and five minutes for free accounts. Quota is account-specific and resets 24 hours after first GPU use. The Space requests an xlarge GPU; xlarge work is charged at twice the ordinary GPU-time rate.

For these settings, the published Space's duration estimate bottoms out at 60 GPU seconds. At xlarge's 2× rate, the expected charge is **120 quota seconds**. This is an estimate based on the Space's declared reservation calculation, not a measured runtime. The anonymous allowance would be consumed in full; a free account's documented daily allowance is enough in principle.

**Blocking condition:** I cannot inspect the user's live Hugging Face account or establish that at least 120 free quota seconds remain. The public Space being online does not establish that account-specific quota. Per the instruction to stop when this cannot be established, the experiment is not submitted. A later attempt requires both confirmation of at least 120 seconds of remaining free quota and a separate explicit approval to submit exactly one request. Stop if the UI indicates a login requirement that the user has not satisfied, paid credits, billing, an upgrade, or less than 120 seconds remaining. No retries.

## License review

The [LTX-2.5 model page](https://huggingface.co/Lightricks/LTX-2.5) identifies the model's **LTX-2.x Community License Agreement**. The agreement permits use under its terms, including commercial use for organizations below US$10 million in annual revenue; organizations above that threshold require a separate commercial agreement. It also places responsibility for lawful inputs, outputs, and use on the user and includes conditions for distribution and hosted services. The Space's accepted model-gating license allows its server to load the weights; it does not transfer the user's rights or obligations. This preflight does not establish commercial deployment approval.

The model is not suitable for the local Intel UHD 620: the published [system requirements](https://docs.ltx.io/open-source-model/getting-started/system-requirements/) call for a supported NVIDIA GPU with at least 32 GB VRAM, among other software and memory requirements. The hosted ZeroGPU Space is the contemplated compute path, subject to the quota gate above.

## One-request proposal (not submitted)

If separately approved after quota confirmation, submit this single synthetic prompt with no image or Vidio project data:

> A small blue paper boat floats across a shallow puddle as gentle rain falls. The boat moves slowly through realistic ripples. Soft natural daylight, stationary cinematic camera. Audible gentle rain and water splashes, no dialogue, no music.

Use 512×512, 2 seconds / 49 frames, convolutional decoder, seed 42, prompt enhancement OFF, auto duration OFF. Do not enable random seed. Do not retry on any failure.

If successful, retain the downloaded MP4 locally only if the Space permits download. Record the actual file properties and generation time. Verify both `video` and `audio` streams with FFprobe, run a full decode pass, inspect multiple distinct frames for motion, and listen to the audio; a stream listing alone does not prove audible synchronized sound. If either stream is missing or invalid, record failure and stop.

## Sources

- [LTX-2.5 Space](https://huggingface.co/spaces/Lightricks/LTX-2.5) and [published app source](https://huggingface.co/spaces/Lightricks/LTX-2.5/blob/main/app.py), inspected 19 October 2026.
- [Hugging Face ZeroGPU documentation](https://huggingface.co/docs/hub/en/spaces-zerogpu), quota and GPU sizing.
- [LTX-2.5 model page and license](https://huggingface.co/Lightricks/LTX-2.5).
- [LTX system requirements](https://docs.ltx.io/open-source-model/getting-started/system-requirements/).
