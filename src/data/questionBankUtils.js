export function normalizeTrainingBankData(trainingBank) {
  if (!trainingBank) return [];

  if (Array.isArray(trainingBank)) return trainingBank;

  if (typeof trainingBank === 'object') {
    const values = Object.values(trainingBank);
    if (values.some((value) => Array.isArray(value))) {
      return values.flatMap((value) => (Array.isArray(value) ? value : []));
    }
  }

  return [];
}
