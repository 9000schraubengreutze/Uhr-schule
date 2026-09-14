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

  // POST /api/gemini/generate-background
  app.post('/api/gemini/generate-background', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey.trim() === '') {
        return res.status(400).json({
          error: 'Kein GEMINI_API_KEY gefunden. Bitte konfiguriere deinen Gemini API-Schlüssel in AI Studio.',
        });
      }

      const { prompt, style = 'cinematic', aspectRatio = '16:9' } = req.body;
      if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        return res.status(400).json({ error: 'Bitte gib eine Beschreibung für das gewünschte Hintergrundbild ein.' });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      // Style presets to ensure high aesthetic quality and clean clock readability
      const styleGuides: Record<string, string> = {
        cinematic: 'Cinematic widescreen photograph, dramatic ambient lighting, rich contrast, high definition, serene background wallpaper for a digital clock, clean composition with negative space, strictly no text, no watermark, no clock numbers',
        nature: 'Majestic nature landscape photograph, golden hour, misty mountains and pine forest, calm alpine lake reflection, beautiful natural wallpaper, no text, no clock digits',
        minimalist: 'Minimalist clean aesthetic, smooth gradients, subtle geometry, soft atmospheric lighting, calm negative space in center for clock readability, modern wallpaper, no text, no numbers',
        cyberpunk: 'Cyberpunk night cityscape, subtle neon reflections in rain puddles, futuristic architectural skyline, moody dark atmosphere, clean wallpaper layout, no text, no numbers',
        space: 'Deep cosmic space panorama, luminous nebula, delicate stardust, distant planets, high detail cosmic wallpaper, dark canvas, no text, no numbers',
        anime: 'Lush Makoto Shinkai style anime landscape, vibrant cumulus clouds, painterly sky, peaceful ambient light, scenic background, no text, no numbers',
        abstract: 'Smooth 3D fluid forms, iridescent curves, dark luxury lighting, clean negative space, minimalist abstract wallpaper, no text, no numbers',
      };

      const selectedGuide = styleGuides[style] || styleGuides.cinematic;
      const enrichedPrompt = `${prompt.trim()}. Style requirements: ${selectedGuide}. Scenic wallpaper background for a clock display.`;

      // Generate image using gemini-3.1-flash-lite-image
      const validAspectRatios = ['16:9', '9:16', '1:1', '4:3', '3:4'];
      const targetAspectRatio = validAspectRatios.includes(aspectRatio) ? aspectRatio : '16:9';

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: enrichedPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: targetAspectRatio as any,
          },
        },
      });

      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        return res.status(500).json({
          error: 'Das Bild konnte von Gemini nicht erzeugt werden. Bitte versuche einen anderen Prompt.',
        });
      }

      const parts = candidates[0].content?.parts || [];
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          const imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
          return res.json({
            success: true,
            imageUrl,
            prompt: prompt.trim(),
            style,
            aspectRatio: targetAspectRatio,
          });
        }
      }

      // Check if text was returned instead (e.g. content policy notice)
      const textPart = parts.find((p) => p.text);
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
      const errorMessage = error?.message || 'Unerwarteter Fehler bei der Gemini-Bilderstellung.';
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
