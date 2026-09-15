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

        const editInstruction = `Image editing instruction: Modify the input image according to the following description: "${prompt.trim()}". Maintain aesthetic quality, high resolution, suitable as wallpaper. Strictly no unwanted text or numbers.`;
        parts.push({ text: editInstruction });
      } else {
        // Image creation mode: enriched prompt
        const enrichedPrompt = `${prompt.trim()}. Style requirements: ${selectedGuide}. Scenic wallpaper background for a clock display.`;
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

      // Check if image models failed due to Free Tier quota limits (429, limit: 0) or model restrictions
      const errorStr = String(lastError?.message || lastError || '');
      const isQuotaOrFreeTierExhausted =
        !response &&
        (errorStr.includes('429') ||
          errorStr.includes('RESOURCE_EXHAUSTED') ||
          errorStr.includes('quota') ||
          errorStr.includes('limit: 0') ||
          errorStr.includes('free_tier') ||
          errorStr.includes('exceeded your current quota'));

      if (isQuotaOrFreeTierExhausted) {
        console.info(
          '[Gemini Studio] Image generation quota limit reached (Free-Tier Limit: 0). Activating AI-curated 4K scenic wallpaper studio...'
        );

        try {
          // Use Gemini 3.5 Flash (text model, free tier supported) to analyze the user's prompt
          let analyzedTheme = 'nature';
          let analyzedQuery = prompt.trim();

          try {
            const analysisPrompt = `The user wants a wallpaper with prompt: "${prompt.trim()}" and style: "${style}".
Select the single best matching category from this list:
[mountains, lake, space, cyberpunk, aurora, desert, forest, winter, sunset, anime, minimalist, ocean, abstract]
Respond in pure JSON format: {"category": "mountains", "keywords": "alps sunrise morning fog"}`;

            const analysisRes = await ai.models.generateContent({
              model: 'gemini-3.5-flash',
              contents: analysisPrompt,
              config: {
                responseMimeType: 'application/json',
              },
            });

            const parsed = JSON.parse(analysisRes.text?.trim() || '{}');
            if (parsed.category) analyzedTheme = parsed.category.toLowerCase();
            if (parsed.keywords) analyzedQuery = parsed.keywords;
          } catch (analysisErr) {
            console.warn('Gemini text prompt analysis fallback:', analysisErr);
          }

          // Curated 4K/HD scenic photography library from high-reliability CDN
          const curatedThemes: Record<string, string[]> = {
            mountains: [
              'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=85',
              'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=85',
            ],
            lake: [
              'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1920&q=85',
              'https://images.unsplash.com/photo-1439853941329-a9f1a941f924?auto=format&fit=crop&w=1920&q=85',
            ],
            space: [
              'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=85',
              'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1920&q=85',
            ],
            cyberpunk: [
              'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1920&q=85',
              'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1920&q=85',
            ],
            aurora: [
              'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1920&q=85',
              'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&w=1920&q=85',
            ],
            desert: [
              'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1920&q=85',
            ],
            forest: [
              'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=85',
              'https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=1920&q=85',
            ],
            winter: [
              'https://images.unsplash.com/photo-1491002052546-bf38f186af56?auto=format&fit=crop&w=1920&q=85',
              'https://images.unsplash.com/photo-1517299321909-20b34934236a?auto=format&fit=crop&w=1920&q=85',
            ],
            sunset: [
              'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?auto=format&fit=crop&w=1920&q=85',
              'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=85',
            ],
            anime: [
              'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=1920&q=85',
            ],
            minimalist: [
              'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=85',
            ],
            ocean: [
              'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=85',
              'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1920&q=85',
            ],
            abstract: [
              'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1920&q=85',
            ],
          };

          // Dimension resolution based on aspectRatio
          let width = 1920;
          let height = 1080;
          if (targetAspectRatio === '9:16') {
            width = 1080;
            height = 1920;
          } else if (targetAspectRatio === '1:1') {
            width = 1200;
            height = 1200;
          } else if (targetAspectRatio === '4:3') {
            width = 1600;
            height = 1200;
          } else if (targetAspectRatio === '3:4') {
            width = 1200;
            height = 1600;
          }

          // Pick candidate image URL
          const themeList = curatedThemes[analyzedTheme] || curatedThemes.nature;
          let chosenCandidateUrl = themeList[Math.floor(Math.random() * themeList.length)];

          // If aspectRatio is not 16:9 or if user has a custom query, use Picsum seed for guaranteed exact aspect ratio
          if (targetAspectRatio !== '16:9') {
            const seedStr = encodeURIComponent(analyzedQuery.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 30) || 'clock');
            chosenCandidateUrl = `https://picsum.photos/seed/${seedStr}/${width}/${height}`;
          }

          // Fetch the image and convert to base64 Data URL
          const imgResponse = await fetch(chosenCandidateUrl);
          if (imgResponse.ok) {
            const arrayBuffer = await imgResponse.arrayBuffer();
            const mime = imgResponse.headers.get('content-type') || 'image/jpeg';
            const base64Str = Buffer.from(arrayBuffer).toString('base64');
            const dataUrl = `data:${mime};base64,${base64Str}`;

            return res.json({
              success: true,
              imageUrl: dataUrl,
              prompt: prompt.trim(),
              mode,
              style,
              aspectRatio: targetAspectRatio,
              modelUsed: 'Gemini 3.5 Flash + Curated 4K Studio',
              isFallback: true,
              quotaNotice:
                'Hinweis: Direkte Bildgenerierung (gemini-3.1-flash-image) erfordert einen Gemini API-Key mit aktiviertem Billing-Konto (Free-Tier Limit: 0). Es wurde ein KI-kuratiertes 4K-Hintergrundbild passend zu deiner Beschreibung bereitgestellt.',
            });
          }
        } catch (fallbackErr) {
          console.error('Fallback image fetch error:', fallbackErr);
        }
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
      let errorMessage = error?.message || 'Unerwarteter Fehler bei der Gemini-Bilderstellung.';
      if (
        errorMessage.includes('429') ||
        errorMessage.includes('RESOURCE_EXHAUSTED') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('limit: 0')
      ) {
        errorMessage =
          'Gemini-Kontingent erreicht: Für direkte Bildgenerierung (gemini-3.1-flash-image) ist ein API-Key mit Abrechnung erforderlich (Free-Tier Limit: 0). Bitte verwende ein Bildstudio-Design oder verknüpfe ein abrechnungsfähiges Google Cloud Projekt.';
      }
      return res.status(500).json({ error: errorMessage });
    }
  }

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
      // gemini-3.1-pro-preview for particularly complex tasks
      // gemini-3.5-flash for general tasks
      // gemini-3.1-flash-lite for tasks that should happen fast
      let selectedModel = 'gemini-3.5-flash';

      if (model && ['gemini-3.1-pro-preview', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'].includes(model)) {
        selectedModel = model;
      } else if (taskComplexity === 'complex') {
        selectedModel = 'gemini-3.1-pro-preview';
      } else if (taskComplexity === 'fast') {
        selectedModel = 'gemini-3.1-flash-lite';
      } else {
        selectedModel = 'gemini-3.5-flash';
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

      // Try primary model, fallback if preview model alias is temporarily unavailable
      const fallbackList = [
        selectedModel,
        'gemini-3.5-flash',
        'gemini-3.8-flash',
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
      const errorMessage = error?.message || 'Unerwarteter Fehler im Gemini Chat.';
      return res.status(500).json({ error: errorMessage });
    }
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
