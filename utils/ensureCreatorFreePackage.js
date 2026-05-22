import Package from '../models/Package.model.js';

const FREE_PACKAGE = {
  name: 'Free',
  description: 'Free tier with basic access to your academy',
  price: 0,
  features: ['Academy access', 'Basic signals'],
};

/** Ensures every creator has a default Free package (idempotent). */
export async function ensureCreatorFreePackage(creatorId) {
  const existing = await Package.findOne({
    creator: creatorId,
    name: { $regex: /^free$/i },
  });
  if (existing) return existing;

  return Package.create({
    ...FREE_PACKAGE,
    creator: creatorId,
  });
}
