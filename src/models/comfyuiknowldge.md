ComfyUI API Integration Notes (RunningHub)

What worked for the Skin Editor workflow
- Use RunningHub workflow ID 2021189307448434690 for the current Skin Editor.
- Always pass the input image through the LoadImage node (#97). Remote URLs caused failures, so upload the image first and pass the resulting file key to node #97.
- Set overrides through nodeInfoListOverride with nodeId + fieldName + fieldValue.
- Map user settings to nodes:
  - #140 text: prompt
  - #90 denoise: denoise strength (stringified number, 2 decimals)
  - #167 max_shift: max shift (stringified number, 2 decimals)
  - #85 megapixels: megapixels (string)
  - #88 guidance: guidance (string)
  - #166 lora_name: style selector
  - #138 protection flags: skin, nose, mouth, u_lip, l_lip, eye_g, r_eye, l_eye, r_brow, l_brow, hair, cloth, background, neck
- Smart Upscale:
  - Enable SeedVR toggles via node #229 settings
  - 4k: set #213 scale_by = 2 and #214 width/height = 4096
  - 8k: set #213 scale_by = 4 and #214 width/height = 8192
  - Output nodes: when smart upscale is off, output is #136. When on, outputs are #215 and #136.

How the final stable implementation was achieved
- Frontend no longer sends invalid nodeInfoListOverride for non-smart-upscale requests. That override caused APIKEY_INVALID_NODE_INFO errors.
- The backend normalizes outputs to a list of objects, even for a single output, so the frontend always renders a stable list.
- The output polling waits briefly after completion and then checks for output URLs, but with shorter delays to reduce perceived lag.
- Output aggregation includes all file URLs, prioritizing expected nodes, so multi-output results appear in the UI.

Guidelines for integrating a new ComfyUI workflow
1) Start with the workflow JSON and list every node ID you need to control.
2) Identify the LoadImage node and ensure it accepts a file key, not a remote URL. If a remote URL is needed, upload it first and pass the resulting key to the node.
3) Map every UI control to a specific node ID and field name. Use string values where the RunningHub API expects strings.
4) Add conditional node overrides for feature flags (e.g., smart upscale). Only include overrides that are required for that feature.
5) Define expected output node IDs up front and poll for those outputs after the task completes.
6) Normalize outputs on the API boundary into a list of objects with { type, url } so the UI can be consistent.
7) When debugging, log the final nodeInfoListOverride and compare it against the workflow node IDs and field names. Most failures came from invalid node IDs or field names.

Common pitfalls and fixes
- Remote URL input to LoadImage -> upload first, then pass file key.
- Invalid node IDs in nodeInfoListOverride -> remove unknown nodes and re-check workflow export.
- Output missing even after task completion -> poll for specific output nodes and aggregate all file URLs returned by the task.
