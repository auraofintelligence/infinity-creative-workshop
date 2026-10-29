/**
 * Estimate API usage from explicit quantities and editable USD rates.
 * Omitted stages and quantities default to zero; the AUD conversion defaults
 * to 1 and is an assumption supplied by the caller, not a live exchange rate.
 * This function has no network, storage or billing side effects.
 */
export function calculateEstimate(input = {}) {
  const values = record(input, 'estimate');
  const planning = record(values.planning, 'planning');
  const transcription = record(values.transcription, 'transcription');
  const image = record(values.image, 'image');
  const video = record(values.video, 'video');
  const speech = record(values.speech, 'speech');

  const inputTokens = number(planning.inputTokens, 'planning.inputTokens');
  const outputTokens = number(planning.outputTokens, 'planning.outputTokens');
  const inputPerMillion = number(planning.inputPerMillion, 'planning.inputPerMillion');
  const outputPerMillion = number(planning.outputPerMillion, 'planning.outputPerMillion');
  const minutes = number(transcription.minutes, 'transcription.minutes');
  const transcriptionRate = number(transcription.rate, 'transcription.rate');
  const imageCount = number(image.count, 'image.count');
  const imageRate = number(image.rate, 'image.rate');
  const seconds = number(video.seconds, 'video.seconds');
  const videoRate = number(video.rate, 'video.rate');
  const characters = number(speech.characters, 'speech.characters');
  const speechRate = number(speech.rate, 'speech.rate');
  const retryPercent = number(values.retryPercent, 'retryPercent');
  const audPerUsd = number(values.audPerUsd, 'audPerUsd', 1);
  if (audPerUsd === 0) throw new RangeError('audPerUsd must be greater than zero.');

  const lines = {
    planning: inputTokens / 1_000_000 * inputPerMillion + outputTokens / 1_000_000 * outputPerMillion,
    transcription: minutes * transcriptionRate,
    image: imageCount * imageRate,
    video: seconds * videoRate,
    speech: characters / 1_000 * speechRate
  };
  const subtotal = Object.values(lines).reduce((sum, value) => sum + value, 0);
  const retryAllowance = subtotal * (retryPercent / 100);
  const totalUsd = subtotal + retryAllowance;
  const totalAud = totalUsd * audPerUsd;
  for (const value of [...Object.values(lines), subtotal, retryAllowance, totalUsd, totalAud]) {
    if (!Number.isFinite(value)) throw new RangeError('The supplied values produce an estimate too large to calculate.');
  }
  return { lines, subtotal, retryAllowance, totalUsd, totalAud };
}

function record(value, name) {
  if (value === undefined) return {};
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object.`);
  }
  return value;
}

function number(value, name, fallback = 0) {
  if (value === undefined) return fallback;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${name} must be a finite number.`);
  }
  if (value < 0) throw new RangeError(`${name} must be zero or greater.`);
  return value;
}
