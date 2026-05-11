import type { NextApiRequest, NextApiResponse } from 'next';
import { getAllScalePositions, midiToFrequency } from '@/lib/music-theory/scaleGenerator';
import type { KeyName, ScaleType, GuitarNote } from '@/types/music';

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions';

function noteCounts(level: number) {
  return level === 6 ? 16 : level === 7 ? 20 : level === 8 ? 24 : level === 9 ? 28 : 32;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { key, scale, level } = req.body as { key: KeyName; scale: ScaleType; level: number };

  if (!key || !scale || !level) return res.status(400).json({ error: 'Missing params' });

  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) return res.status(500).json({ error: 'GROQ_API_KEY not configured' });

  // Build available positions for prompt
  const all = getAllScalePositions(key, scale);
  // Deduplicate & simplify for prompt (group by fret+string)
  const positionList = all.map(p => ({
    note: p.noteName, octave: p.octave, string: p.string, fret: p.fret,
  }));

  const count = noteCounts(level);
  const complexity = level <= 7 ? 'moderate with some position shifts and string crossings'
    : level === 8 ? 'musical phrases with rhythmic variety (mix quarter and eighth notes)'
    : level === 9 ? 'complex lick-style runs with wide position shifts'
    : 'advanced solo-style with extreme position changes and musical expression';

  const prompt = `You are a professional guitar teacher. Create a ${complexity} exercise for ${key} ${scale} scale at difficulty ${level}/10.

Available note positions (string: 0=low E string, 5=high e string, fret: 1-12):
${JSON.stringify(positionList)}

Generate exactly ${count} notes. Rules:
- Use ONLY positions from the list above (match note+string+fret exactly)
- Start from lower strings (string 0-2) for the first few notes  
- duration: 1 = quarter note, 0.5 = eighth note (use 0.5 for level 8+)
- Make it musical and interesting, not just ascending

Return ONLY valid JSON (no markdown):
{"notes":[{"noteName":"C","octave":3,"string":1,"fret":3,"duration":1},...]}`;

  try {
    const groqRes = await fetch(GROQ_API, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6 + (level - 6) * 0.08,
        max_tokens: 3000,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      return res.status(502).json({ error: `Groq error: ${err}` });
    }

    const data = await groqRes.json() as { choices: Array<{ message: { content: string } }> };
    const content = data.choices[0]?.message?.content ?? '';

    // Extract JSON robustly
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(502).json({ error: 'Invalid AI response format' });

    const parsed = JSON.parse(jsonMatch[0]) as { notes: Array<{ noteName: string; octave: number; string: number; fret: number; duration: number }> };

    // Validate & hydrate with frequency + beat index
    const OPEN_STRING_MIDI = [40,45,50,55,59,64];
    const notes: GuitarNote[] = parsed.notes.map((n, beat) => {
      const midi = OPEN_STRING_MIDI[n.string] + n.fret;
      return {
        pitch: `${n.noteName}${n.octave}`,
        noteName: n.noteName as GuitarNote['noteName'],
        octave: n.octave,
        string: n.string,
        fret: n.fret,
        frequency: midiToFrequency(midi),
        beat,
        duration: n.duration ?? 1,
      };
    });

    return res.status(200).json({ notes });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
