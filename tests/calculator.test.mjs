import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { calculateEstimate } from '../assets/js/calculator.mjs';

function near(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} is not close to ${expected}`);
}

test('planning uses separate input and output prices per million tokens', () => {
  const result = calculateEstimate({
    planning: { inputTokens: 120000, outputTokens: 20000, inputPerMillion: 0.3, outputPerMillion: 2.5 }
  });
  near(result.lines.planning, 0.086);
  near(result.totalUsd, 0.086);
});

test('speech is priced per thousand characters without treating characters as minutes', () => {
  const result = calculateEstimate({ speech: { characters: 2750, rate: 0.04 } });
  near(result.lines.speech, 0.11);
});

test('omitted quantities and zero-rate existing material add no API cost', () => {
  assert.deepEqual(calculateEstimate(), {
    lines: { planning: 0, transcription: 0, image: 0, video: 0, speech: 0 },
    subtotal: 0, retryAllowance: 0, totalUsd: 0, totalAud: 0
  });
  const result = calculateEstimate({
    planning: { inputTokens: 100000, outputTokens: 10000, inputPerMillion: 0, outputPerMillion: 0 },
    transcription: { minutes: 30, rate: 0 }, image: { count: 15, rate: 0 },
    video: { seconds: 96, rate: 0 }, speech: { characters: 5000, rate: 0 },
    retryPercent: 35, audPerUsd: 1.5
  });
  assert.equal(result.totalUsd, 0);
  assert.equal(result.totalAud, 0);
});

test('mixed units, retry allowance and assumed currency conversion stay separate', () => {
  const result = calculateEstimate({
    planning: { inputTokens: 120000, outputTokens: 20000, inputPerMillion: 2, outputPerMillion: 10 },
    transcription: { minutes: 10, rate: 0.0077 },
    image: { count: 40, rate: 0.067 },
    video: { seconds: 96, rate: 0.15 },
    speech: { characters: 5000, rate: 0.04 },
    retryPercent: 25, audPerUsd: 1.5
  });
  near(result.lines.planning, 0.44);
  near(result.lines.transcription, 0.077);
  near(result.lines.image, 2.68);
  near(result.lines.video, 14.4);
  near(result.lines.speech, 0.2);
  near(result.subtotal, 17.797);
  near(result.retryAllowance, 4.44925);
  near(result.totalUsd, 22.24625);
  near(result.totalAud, 33.369375);
});

test('small estimates retain precision rather than rounding each line to cents', () => {
  const result = calculateEstimate({ transcription: { minutes: 0.5, rate: 0.0077 }, retryPercent: 10, audPerUsd: 1.5 });
  near(result.subtotal, 0.00385);
  near(result.retryAllowance, 0.000385);
  near(result.totalUsd, 0.004235);
  near(result.totalAud, 0.0063525);
});

test('negative, nonfinite and nonnumeric values cannot produce misleading totals', () => {
  const cases = [
    { planning: { inputTokens: -1 } },
    { planning: { outputTokens: NaN } },
    { planning: { inputPerMillion: Infinity } },
    { planning: { outputPerMillion: -0.1 } },
    { transcription: { minutes: -10 } },
    { transcription: { rate: NaN } },
    { image: { count: -1 } },
    { image: { rate: '0.04' } },
    { video: { seconds: Infinity } },
    { video: { rate: null } },
    { speech: { characters: -1 } },
    { speech: { rate: NaN } },
    { retryPercent: -1 },
    { audPerUsd: 0 },
    { audPerUsd: -1 },
    { audPerUsd: NaN },
    { audPerUsd: Infinity }
  ];
  for (const input of cases) assert.throws(() => calculateEstimate(input));
  for (const input of [null, [], 'estimate', { image: null }, { planning: [] }]) {
    assert.throws(() => calculateEstimate(input), TypeError);
  }
});

test('a finite input that overflows the computed total is rejected', () => {
  assert.throws(() => calculateEstimate({ image: { count: Number.MAX_VALUE, rate: 2 } }), RangeError);
});

test('rate catalogue provides sourced alternatives and a zero API option per stage', () => {
  const catalogue = JSON.parse(readFileSync(new URL('../content/rates.json', import.meta.url), 'utf8'));
  assert.equal(catalogue.checkedOn, '2026-10-30');
  assert.equal(catalogue.currency, 'USD');
  assert.match(catalogue.disclaimer, /Image output rates may exclude/);
  assert.equal(new Set(catalogue.providers.map(p => p.id)).size, catalogue.providers.length);
  const fields = {
    planning: ['inputPerMillion', 'outputPerMillion'], transcription: ['perAudioMinute'],
    image: ['perImage'], video: ['perGeneratedSecond'], speech: ['perThousandCharacters']
  };
  for (const [category, rateFields] of Object.entries(fields)) {
    const choices = catalogue.providers.filter(p => p.category === category);
    assert.ok(choices.length >= 3, `Missing alternatives for ${category}`);
    assert.ok(choices.some(p => rateFields.every(field => p[field] === 0)), `Missing zero API option for ${category}`);
    assert.ok(new Set(choices.filter(p => rateFields.some(field => p[field] > 0)).map(p => p.provider)).size >= 2);
    for (const choice of choices) {
      for (const field of rateFields) assert.ok(Number.isFinite(choice[field]) && choice[field] >= 0);
      assert.ok(choice.model && choice.note);
      assert.match(choice.source, /^https:\/\//);
    }
  }
  assert.equal(catalogue.providers.find(p => p.id === 'gemini-flash-image').outputOnly, true);
});
