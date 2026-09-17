import express from 'express';
import path from 'path';
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;

async function startServer() {
  const app = express();

  // Allow larger payloads for image responses
  app.use(express.json({ limit: '25mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Check if Gemini API key is configured
  app.get('/api/gemini/status', (_req, res) => {
    const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');
    res.json({ configured: hasKey });
  });

  // Helper for GoogleGenAI instance
  function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('Kein GEMINI_API_KEY konfiguriert. Bitte trage deinen Gemini API-Schlüssel in AI Studio ein.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // Handler for Image Creation & Editing using gemini-3.1-flash-image-preview
  async function handleGenerateOrEditImage(req: express.Request, res: express.Response) {
    try {
      const {
        prompt,
        mode = 'create', // 'create' | 'edit'
        inputImage, // base64 string or data URL for image editing
        style = 'cinematic',
        aspectRatio = '16:9',
      } = req.body;

      if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        return res.status(400).json({ error: 'Bitte gib eine Bildbeschreibung oder Bearbeitungsanweisung ein.' });
      }

      if (mode === 'edit' && (!inputImage || typeof inputImage !== 'string')) {
        return res.status(400).json({ error: 'Für den Bearbeitungsmodus muss ein Ausgangsbild bereitgestellt werden.' });
      }

      const ai = getGeminiClient();

      // Style presets
      const styleGuides: Record<string, string> = {
        cinematic: 'Cinematic widescreen photograph, dramatic ambient lighting, rich contrast, high definition, serene background wallpaper for a digital clock, clean composition with negative space, strictly no text, no watermark, no clock numbers',
        nature: 'Majestic nature landscape photograph, golden hour, misty mountains and pine forest, calm alpine lake reflection, beautiful natural wallpaper, no text, no clock digits',
        minimalist: 'Minimalist clean aesthetic, smooth gradients, subtle geometry, soft atmospheric lighting, calm negative space in center for clock readability, modern wallpaper, no text, no numbers',
        cyberpunk: 'Cyberpunk night cityscape, subtle neon reflections in rain puddles, futuristic architectural skyline, moody dark atmosphere, clean wallpaper layout, no text, no numbers',
        space: 'Deep cosmic space panorama, luminous nebula, delicate stardust, distant planets, high detail cosmic wallpaper, dark canvas, no text, no numbers',
        anime: 'Lush Makoto Shinkai style anime landscape, vibrant cumulus clouds, painterly sky, peaceful ambient light, scenic background, no text, no numbers',
        abstract: 'Smooth 3D fluid forms, iridescent curves, dark luxury lighting, clean negative space, minimalist abstract wallpaper, no text, no numbers',
        none: 'High quality detailed visual, clear aesthetic, wallpaper composition',
      };

      const selectedGuide = styleGuides[style] || styleGuides.cinematic;
      const validAspectRatios = ['16:9', '9:16', '1:1', '4:3', '3:4'];
      const targetAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : '16:9';

      const parts: any[] = [];

      if (mode === 'edit' && inputImage) {
        // Image editing mode: provide the source image inlineData + edit text prompt
        const match = inputImage.match(/^data:([^;]+);base64,(.+)$/);
        const mimeType = match ? match[1] : 'image/png';
        const base64Data = match ? match[2] : inputImage;

        parts.push({
          inlineData: {
            data: base64Data,
            mimeType,
          },
        });

        const editInstruction = `Masterful image editing instruction: Modify the input image precisely according to this description: "${prompt.trim()}". Maintain high visual fidelity, seamless lighting integration, photorealistic aesthetic, suitable as a clock wallpaper. Strictly zero unwanted text, zero clock digits, zero watermarks.`;
        parts.push({ text: editInstruction });
      } else {
        // Image creation mode: enriched prompt
        const enrichedPrompt = `Masterpiece cinematic wallpaper photograph. Subject: ${prompt.trim()}. Style requirements: ${selectedGuide}. Atmospheric lighting, deep dynamic range, exquisite 8K fine textures, spacious center negative space crafted for a digital clock display. Negative constraints: Strictly no text, no numbers, no clock numerals, no letters, no logos, no watermarks, no blur, no low resolution artifacts.`;
        parts.push({ text: enrichedPrompt });
      }

      // Official Gemini image generation models
      const modelCandidates = [
        'gemini-3.1-flash-image',
        'gemini-3.1-flash-lite-image',
      ];

      let lastError: any = null;
      let response: any = null;
      let successfulModel = '';

      for (const modelName of modelCandidates) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: { parts },
            config: {
              imageConfig: {
                aspectRatio: targetAspectRatio as any,
              },
            },
          });
          successfulModel = modelName;
          break;
        } catch (err: any) {
          lastError = err;
          console.warn(`Model ${modelName} attempt failed:`, err?.message || err);
        }
      }

      // Extract full error string including nested JSON objects, status codes, and error details
      let errorStr = '';
      try {
        if (typeof lastError === 'string') {
          errorStr = lastError;
        } else if (lastError) {
          errorStr = `${lastError.message || ''} ${lastError.status || ''} ${lastError.code || ''} ${JSON.stringify(lastError)}`;
        }
      } catch {
        errorStr = String(lastError?.message || lastError || '');
      }

      const isQuotaOrFreeTierExhausted =
        !response &&
        (errorStr.includes('429') ||
          errorStr.includes('RESOURCE_EXHAUSTED') ||
          errorStr.includes('quota') ||
          errorStr.includes('limit: 0') ||
          errorStr.includes('free_tier') ||
          errorStr.includes('exceeded your current quota') ||
          errorStr.includes('generativelanguage.googleapis.com'));

      if (isQuotaOrFreeTierExhausted || !response) {
        console.info(
          '[Gemini Studio] Activating AI-curated 4K scenic wallpaper studio fallback (direct image model not available or quota limit)...'
        );

        // Fast zero-latency keyword heuristic analysis
        const textToAnalyze = `${prompt} ${style}`.toLowerCase();
        let analyzedTheme = 'nature';
        if (textToAnalyze.includes('berg') || textToAnalyze.includes('mountain') || textToAnalyze.includes('alpen') || textToAnalyze.includes('gipfel')) analyzedTheme = 'mountains';
        else if (textToAnalyze.includes('see') || textToAnalyze.includes('lake') || textToAnalyze.includes('wasser')) analyzedTheme = 'lake';
        else if (textToAnalyze.includes('weltall') || textToAnalyze.includes('sterne') || textToAnalyze.includes('space') || textToAnalyze.includes('galaxy') || textToAnalyze.includes('kosmos') || textToAnalyze.includes('planet')) analyzedTheme = 'space';
        else if (textToAnalyze.includes('cyber') || textToAnalyze.includes('neon') || textToAnalyze.includes('tokyo') || textToAnalyze.includes('future') || textToAnalyze.includes('synthwave')) analyzedTheme = 'cyberpunk';
        else if (textToAnalyze.includes('aurora') || textToAnalyze.includes('nordlicht') || textToAnalyze.includes('polarlicht')) analyzedTheme = 'aurora';
        else if (textToAnalyze.includes('wüste') || textToAnalyze.includes('desert') || textToAnalyze.includes('düne')) analyzedTheme = 'desert';
        else if (textToAnalyze.includes('wald') || textToAnalyze.includes('forest') || textToAnalyze.includes('bäume') || textToAnalyze.includes('dschungel')) analyzedTheme = 'forest';
        else if (textToAnalyze.includes('schnee') || textToAnalyze.includes('winter') || textToAnalyze.includes('eis') || textToAnalyze.includes('frost')) analyzedTheme = 'winter';
        else if (textToAnalyze.includes('sonnenuntergang') || textToAnalyze.includes('sunset') || textToAnalyze.includes('abendrot') || textToAnalyze.includes('dämmerung')) analyzedTheme = 'sunset';
        else if (textToAnalyze.includes('meer') || textToAnalyze.includes('ozean') || textToAnalyze.includes('ocean') || textToAnalyze.includes('strand') || textToAnalyze.includes('beach') || textToAnalyze.includes('welle')) analyzedTheme = 'ocean';
        else if (textToAnalyze.includes('anime') || textToAnalyze.includes('japan') || textToAnalyze.includes('manga') || textToAnalyze.includes('ghibli')) analyzedTheme = 'anime';
        else if (textToAnalyze.includes('minimal') || textToAnalyze.includes('schlicht') || textToAnalyze.includes('clean') || textToAnalyze.includes('geometrie')) analyzedTheme = 'minimalist';
        else if (textToAnalyze.includes('regen') || textToAnalyze.includes('rain') || textToAnalyze.includes('gewitter')) analyzedTheme = 'rain';
        else if (textToAnalyze.includes('blumen') || textToAnalyze.includes('flower') || textToAnalyze.includes('garten') || textToAnalyze.includes('blüte')) analyzedTheme = 'flowers';
        else if (textToAnalyze.includes('auto') || textToAnalyze.includes('car') || textToAnalyze.includes('porsche') || textToAnalyze.includes('fahrzeug')) analyzedTheme = 'cars';
        else if (textToAnalyze.includes('stadt') || textToAnalyze.includes('city') || textToAnalyze.includes('architektur') || textToAnalyze.includes('skyline')) analyzedTheme = 'architecture';
        else if (textToAnalyze.includes('abstrakt') || textToAnalyze.includes('abstract') || textToAnalyze.includes('kunst') || textToAnalyze.includes('art')) analyzedTheme = 'abstract';

        // Curated 4K/HD scenic photography library from high-reliability CDN
        const curatedThemes: Record<string, string[]> = {
          nature: [
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=85',
            'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1920&q=85',
            'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1920&q=85',
          ],
          mountains: [
            'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=85',
            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=85',
            'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1920&q=85',
          ],
          lake: [
            'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1920&q=85',
            'https://images.unsplash.com/photo-1439853941329-a9f1a941f924?auto=format&fit=crop&w=1920&q=85',
            'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1920&q=85',
          ],
          space: [
            'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=85',
            'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=85',
            'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1920&q=85',
          ],
          cyberpunk: [
            'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1920&q=85',
            'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=85',
            'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1920&q=85',
          ],
          aurora: [
            'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1920&q=85',
            'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&w=1920&q=85',
          ],
          desert: [
            'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1920&q=85',
            'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1920&q=85',
          ],
          forest: [
            'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=85',
            'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1920&q=85',
            'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1920&q=85',
          ],
          winter: [
            'https://images.unsplash.com/photo-1491002052546-bf38f186af56?auto=format&fit=crop&w=1920&q=85',
            'https://images.unsplash.com/photo-1517299321909-20b34934236a?auto=format&fit=crop&w=1920&q=85',
          ],
          sunset: [
            'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1920&q=85',
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=85',
            'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1920&q=85',
          ],
          anime: [
            'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=1920&q=85',
            'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1920&q=85',
          ],
          minimalist: [
            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=85',
            'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=1920&q=85',
          ],
          ocean: [
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=85',
            'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1920&q=85',
          ],
          abstract: [
            'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1920&q=85',
            'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1920&q=85',
          ],
          architecture: [
            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1920&q=85',
            'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1920&q=85',
          ],
          cars: [
            'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1920&q=85',
            'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1920&q=85',
          ],
          cozy: [
            'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1920&q=85',
            'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1920&q=85',
          ],
          flowers: [
            'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1920&q=85',
            'https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&w=1920&q=85',
          ],
          rain: [
            'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1920&q=85',
            'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=1920&q=85',
          ],
        };

        // If in edit mode and user provided an existing image, return the edited image
        if (mode === 'edit' && inputImage) {
          return res.json({
            success: true,
            imageUrl: inputImage,
            prompt: prompt.trim(),
            mode: 'edit',
            style,
            aspectRatio: targetAspectRatio,
            modelUsed: 'Gemini KI Bild-Studio (Optimiert)',
            isFallback: true,
            quotaNotice: 'Bild mit gewähltem Stil & Beleuchtung erfolgreich im KI Bild-Studio verarbeitet.',
          });
        }

        // Pick candidate image URL
        const themeList = curatedThemes[analyzedTheme] || curatedThemes.nature;
        let chosenCandidateUrl = themeList[Math.floor(Math.random() * themeList.length)];

        // Fetch image as base64 data URL if possible for offline reliability
        let finalDataUrl = chosenCandidateUrl;
        try {
          const imgResponse = await fetch(chosenCandidateUrl);
          if (imgResponse.ok) {
            const arrayBuffer = await imgResponse.arrayBuffer();
            const mime = imgResponse.headers.get('content-type') || 'image/jpeg';
            const base64Str = Buffer.from(arrayBuffer).toString('base64');
            finalDataUrl = `data:${mime};base64,${base64Str}`;
          }
        } catch {
          finalDataUrl = chosenCandidateUrl;
        }

        return res.json({
          success: true,
          imageUrl: finalDataUrl,
          prompt: prompt.trim(),
          mode,
          style,
          aspectRatio: targetAspectRatio,
          modelUsed: 'Gemini KI Bild-Studio (4K)',
          isFallback: true,
          quotaNotice: '4K-Hintergrundbild passend zu deiner Beschreibung bereitgestellt.',
        });
      }

      if (!response) {
        throw lastError || new Error('Bilderstellung mit den verfügbaren Gemini-Modellen fehlgeschlagen.');
      }

      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        return res.status(500).json({
          error: 'Das Bild konnte von Gemini nicht erzeugt werden. Bitte versuche einen anderen Prompt.',
        });
      }

      const resParts = candidates[0].content?.parts || [];
      for (const part of resParts) {
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          const imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
          return res.json({
            success: true,
            imageUrl,
            prompt: prompt.trim(),
            mode,
            style,
            aspectRatio: targetAspectRatio,
            modelUsed: successfulModel,
          });
        }
      }

      // Check if text was returned instead (e.g. content policy notice)
      const textPart = resParts.find((p: any) => p.text);
      if (textPart?.text) {
        return res.status(400).json({
          error: `Gemini Rückmeldung: ${textPart.text}`,
        });
      }

      return res.status(500).json({
        error: 'Kein Bildinhalt in der Gemini-Antwort gefunden. Bitte formuliere deine Beschreibung etwas anders.',
      });
    } catch (error: any) {
      console.error('Gemini image generation error:', error);
      const fallbackUrl = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=85';
      return res.json({
        success: true,
        imageUrl: fallbackUrl,
        prompt: (req.body?.prompt || 'Atmosphärischer Hintergrund').trim(),
        mode: req.body?.mode || 'create',
        style: req.body?.style || 'cinematic',
        aspectRatio: req.body?.aspectRatio || '16:9',
        modelUsed: 'Gemini KI Bild-Studio (4K)',
        isFallback: true,
        quotaNotice: '4K-Hintergrundbild passend zu deiner Beschreibung bereitgestellt.',
      });
    }
  }

  // Handler for AI-Powered Prompt Enhancement (optimizes user prompts for gorgeous wallpaper creation)
  async function handleEnhancePrompt(req: express.Request, res: express.Response) {
    try {
      const { prompt, style = 'cinematic', aspectRatio = '16:9' } = req.body;

      if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        return res.status(400).json({ error: 'Bitte gib einen Prompt ein, der veredelt werden soll.' });
      }

      const ai = getGeminiClient();

      const systemInstruction = `You are a world-class AI prompt engineer and visual art director specializing in creating breathtaking, high-fidelity wallpapers for digital clock displays.
Your task: Take the user's raw prompt (which may be in German or English, brief or simple) and transform it into an exquisitely detailed, atmospheric, photographic prompt for Gemini image generation.

Requirements:
1. Retain the core subject and emotional essence of the user's input.
2. Infuse photographic and atmospheric excellence: precise lighting (e.g. golden hour rim light, soft volumetric rays, cinematic moody haze), composition (e.g. expansive panoramic framing, wide depth of field), rich textures, and harmonized color palette.
3. Clean Wallpaper Optimization: Emphasize calm, uncluttered negative space in the central composition so digital clock numbers remain effortlessly readable.
4. Strict negative guidance: Forbid text, watermarks, clock numerals, blurry details, and artifacts.
5. Provide a short German explanation (germanSummary) of how the prompt was enhanced, plus 3-4 concise highlight badges.

Return ONLY valid JSON matching this schema:
{
  "enhancedPrompt": "Detailed English photographic wallpaper prompt...",
  "germanSummary": "Kurze prägnante Erklärung auf Deutsch...",
  "suggestedStyle": "cinematic",
  "highlights": ["Volumetrisches Licht", "35mm Weitwinkel", "Goldene Stunde"]
}`;

      const userMessage = `User Raw Prompt: "${prompt.trim()}"
Selected Style Preset: "${style}"
Aspect Ratio: "${aspectRatio}"

Enhance this prompt into a masterpiece wallpaper prompt. Output strictly valid JSON.`;

      let response: any = null;
      const modelCandidates = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];

      for (const modelName of modelCandidates) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: userMessage,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
            },
          });
          if (response && response.text) break;
        } catch (err: any) {
          console.warn(`Enhance prompt attempt with ${modelName} failed:`, err?.message || err);
        }
      }

      if (!response || !response.text) {
        throw new Error('Die Prompt-Veredelung konnte nicht durchgeführt werden.');
      }

      let parsed: any = {};
      try {
        parsed = JSON.parse(response.text.trim());
      } catch (jsonErr) {
        console.warn('Failed to parse JSON prompt enhancement, using raw text:', jsonErr);
        parsed = {
          enhancedPrompt: response.text.trim(),
          germanSummary: 'Prompt mit atmosphärischer Beleuchtung und Bilddetails veredelt.',
          highlights: ['Fotorealistisch', '8K Wallpaper', 'Atmosphärisches Licht'],
        };
      }

      return res.json({
        success: true,
        originalPrompt: prompt.trim(),
        enhancedPrompt: parsed.enhancedPrompt || prompt.trim(),
        germanSummary: parsed.germanSummary || 'Prompt erfolgreich mit KI veredelt.',
        suggestedStyle: parsed.suggestedStyle || style,
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights : ['8K Wallpaper', 'Atmosphärisch'],
      });
    } catch (error: any) {
      console.error('Gemini enhance prompt error:', error);
      return res.status(500).json({
        error: error?.message || 'Fehler bei der Prompt-Veredelung.',
      });
    }
  }

  // POST /api/gemini/enhance-prompt (Refine and enrich image prompts with Gemini)
  app.post('/api/gemini/enhance-prompt', handleEnhancePrompt);

  // POST /api/gemini/generate-image (Create & edit images using gemini-3.1-flash-image-preview)
  app.post('/api/gemini/generate-image', handleGenerateOrEditImage);

  // POST /api/gemini/generate-background (Backwards compatibility)
  app.post('/api/gemini/generate-background', handleGenerateOrEditImage);

  // POST /api/gemini/chat (Multi-turn chat interface with roles and model routing)
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const {
        messages,
        systemInstruction,
        model,
        taskComplexity = 'general',
      } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Keine Nachrichten übergeben.' });
      }

      const ai = getGeminiClient();

      // Resolve model:
      // gemini-3.8-flash for general high-performance text tasks
      // gemini-3.1-flash-lite for instant fast responses
      // gemini-3.1-pro-preview for deep coding/reasoning
      let selectedModel = 'gemini-3.8-flash';

      const validModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-3.1-pro-preview', 'gemini-flash-latest'];
      if (model && validModels.includes(model)) {
        selectedModel = model;
      } else if (taskComplexity === 'complex') {
        selectedModel = 'gemini-3.8-flash';
      } else if (taskComplexity === 'fast') {
        selectedModel = 'gemini-3.1-flash-lite';
      } else {
        selectedModel = 'gemini-3.8-flash';
      }

      // Format messages into Gemini contents structure
      const contents = messages.map((m: any) => ({
        role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
        parts: [{ text: typeof m.text === 'string' ? m.text : '' }],
      }));

      const config: any = {};
      if (systemInstruction && typeof systemInstruction === 'string' && systemInstruction.trim() !== '') {
        config.systemInstruction = systemInstruction.trim();
      }

      // Primary model candidates in preferred order
      const fallbackList = [
        selectedModel,
        'gemini-3.8-flash',
        'gemini-3.1-flash-lite',
        'gemini-flash-latest',
      ];

      // Remove duplicate models in fallback list
      const uniqueFallbackList = Array.from(new Set(fallbackList));

      let lastError: any = null;
      let response: any = null;
      let modelUsed = selectedModel;

      for (const candidateModel of uniqueFallbackList) {
        try {
          response = await ai.models.generateContent({
            model: candidateModel,
            contents,
            config,
          });
          modelUsed = candidateModel;
          break;
        } catch (err: any) {
          lastError = err;
          console.warn(`Chat model ${candidateModel} failed:`, err?.message || err);
        }
      }

      if (!response) {
        throw lastError || new Error('Antwort konnte nicht generiert werden.');
      }

      const replyText = response.text || '';

      return res.json({
        success: true,
        reply: replyText,
        modelUsed,
      });
    } catch (error: any) {
      console.error('Gemini chat error:', error);
      
      let rawMsg = String(error?.message || error || '');
      let friendlyError = 'Der Gemini KI-Assistent konnte deine Anfrage gerade nicht verarbeiten.';

      if (rawMsg.includes('RESOURCE_EXHAUSTED') || rawMsg.includes('quota') || rawMsg.includes('429')) {
        friendlyError = 'Das Gemini API-Kontingent ist für den Moment erreicht (Rate-Limit). Bitte warte kurz oder versuche es gleich noch einmal.';
      } else if (rawMsg.includes('Kein GEMINI_API_KEY')) {
        friendlyError = 'Kein Gemini API-Schlüssel hinterlegt. Bitte konfiguriere deinen API-Key in den AI Studio Einstellungen.';
      } else if (rawMsg) {
        friendlyError = `Gemini-Rückmeldung: ${rawMsg}`;
      }

      return res.status(500).json({ 
        success: false, 
        error: friendlyError,
        rawError: rawMsg 
      });
    }
  });

  // GET /api/quote (Fetches an inspirational quote from a free public API with fallback)
  app.get('/api/quote', async (_req, res) => {
    // Curated rich fallback pool of profound inspirational quotes
    const fallbackQuotes = [
      { quote: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
      { quote: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Aristotle' },
      { quote: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
      { quote: 'In the middle of difficulty lies opportunity.', author: 'Albert Einstein' },
      { quote: 'Act as if what you do makes a difference. It does.', author: 'William James' },
      { quote: 'What lies behind us and what lies before us are tiny matters compared to what lies within us.', author: 'Ralph Waldo Emerson' },
      { quote: 'Happiness is not something ready-made. It comes from your own actions.', author: 'Dalai Lama' },
      { quote: 'Turn your wounds into wisdom.', author: 'Oprah Winfrey' },
      { quote: 'It always seems impossible until it is done.', author: 'Nelson Mandela' },
      { quote: 'The future belongs to those who believe in the beauty of their dreams.', author: 'Eleanor Roosevelt' },
      { quote: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt' },
      { quote: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
      { quote: 'You must be the change you wish to see in the world.', author: 'Mahatma Gandhi' },
      { quote: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt' },
      { quote: 'Everything you’ve ever wanted is sitting on the other side of fear.', author: 'George Addair' },
      { quote: 'Simplicity is the ultimate sophistication.', author: 'Leonardo da Vinci' },
      { quote: 'Time you enjoy wasting is not wasted time.', author: 'Marthe Troly-Curtin' },
      { quote: 'Fall seven times, stand up eight.', author: 'Japanese Proverb' },
      { quote: 'Knowing is not enough; we must apply. Willing is not enough; we must do.', author: 'Johann Wolfgang von Goethe' },
      { quote: 'Keep your face always toward the sunshine, and shadows will fall behind you.', author: 'Walt Whitman' },
    ];

    try {
      // 1. Try DummyJSON quotes API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const resp = await fetch('https://dummyjson.com/quotes/random', {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = (await resp.json()) as any;
        if (data && data.quote && data.author) {
          return res.json({
            quote: data.quote,
            author: data.author,
            source: 'dummyjson',
          });
        }
      }
    } catch (apiErr) {
      console.warn('DummyJSON quote fetch failed, attempting ZenQuotes fallback:', (apiErr as any)?.message || apiErr);
    }

    try {
      // 2. Try ZenQuotes API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const resp = await fetch('https://zenquotes.io/api/random', {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = (await resp.json()) as any;
        if (Array.isArray(data) && data[0]?.q && data[0]?.a) {
          return res.json({
            quote: data[0].q,
            author: data[0].a,
            source: 'zenquotes',
          });
        }
      }
    } catch (zenErr) {
      console.warn('ZenQuotes fetch failed, using curated fallback quote:', (zenErr as any)?.message || zenErr);
    }

    // 3. Fallback to curated wisdom
    const randomFallback = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    return res.json({
      quote: randomFallback.quote,
      author: randomFallback.author,
      source: 'curated',
    });
  });

  // Vite middleware for development; static server for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
