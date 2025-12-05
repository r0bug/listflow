# Segmind API Reference - WORKING FORMATS

**IMPORTANT**: These are the TESTED and WORKING formats for Segmind API as of 2025-08-12.
DO NOT CHANGE WITHOUT TESTING!

## Base URLs

- **Claude 3 Opus**: `https://api.segmind.com/v1/claude-3-opus`
- **Claude 3.7 Sonnet**: `https://api.segmind.com/v1/claude-3.7-sonnet`  
- **LLaVA 1.6**: `https://api.segmind.com/v1/llava-v1.6`

## Request Headers (All Models)

```json
{
  "x-api-key": "YOUR_SEGMIND_API_KEY",
  "Content-Type": "application/json"
}
```

## Request Body Format (ALL MODELS USE SAME FORMAT)

```json
{
  "prompt": "Your text prompt here",
  "images": "base64_encoded_image_data_without_prefix",
  "max_tokens": 1024,
  "temperature": 0.7
}
```

### Field Names - CRITICAL
- ✅ **CORRECT**: `"prompt"` (NOT "message", NOT "messages")
- ✅ **CORRECT**: `"images"` (plural - ALL models use this)
- ✅ **CORRECT**: Base64 data should be RAW (no `data:image/jpeg;base64,` prefix)

## Response Format

All models return:
```json
{
  "output": "Generated text response",
  // or
  "response": "Generated text response",
  // or  
  "text": "Generated text response",
  // or
  "content": "Generated text response"
}
```

Check all fields as different models may use different response field names.

## Bilingual Prompt Template

To get both English and Spanish in one call:

```
Analyze this product image and provide descriptions in BOTH English and Spanish.

Format your response EXACTLY like this:

[ENGLISH TITLE - max 80 characters]

[English description - detailed description suitable for an online marketplace listing]

---SPANISH---

[TÍTULO EN ESPAÑOL - máximo 80 caracteres]

[Descripción en español - descripción detallada adecuada para un listado de mercado]
```

## Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Prompt is Mandatory" | Using wrong field name | Use `"prompt"` not `"messages"` |
| "Input image not found" | Using wrong field name | Use `"image"` not `"images"` |
| "messages: at least one message is required" | Using wrong format | Use simple format, not messages array |
| "Internal Polling Error" | Image field issue | Ensure using `"image"` field with base64 data |

## Testing Checklist

Before changing ANY API code:
- [ ] Test with Claude 3 Opus
- [ ] Test with Claude 3.7 Sonnet
- [ ] Test with LLaVA 1.6
- [ ] Test English generation
- [ ] Test Spanish generation
- [ ] Test bilingual generation

## Last Working Configuration

- **Date**: 2025-08-12
- **Commit**: (to be added after testing)
- **Tested by**: User confirmed working with all 3 models

---

**DO NOT MODIFY THE API FORMAT WITHOUT TESTING ALL THREE MODELS!**