export interface CompletenessResult {
  hasPhotos: boolean;
  aiProcessed: boolean;
  categorySet: boolean;
  specificsPopulated: boolean;
  priceSet: boolean;
  shippingPolicyChosen: boolean;
  weightEntered: boolean;
  readyToList: boolean;
  score: number;
  percentage: number;
}

interface ItemForCompleteness {
  photos?: { id: string }[] | { length: number };
  title?: string | null;
  description?: string | null;
  ebayCategoryId?: string | null;
  brand?: string | null;
  condition?: string | null;
  startingPrice?: number | null;
  buyNowPrice?: number | null;
  shippingProfileId?: string | null;
  weight?: number | null;
}

export function computeCompleteness(item: ItemForCompleteness): CompletenessResult {
  const photoCount = Array.isArray(item.photos) ? item.photos.length : 0;
  const hasPhotos = photoCount >= 1;
  const aiProcessed = !!(item.title && item.description);
  const categorySet = !!item.ebayCategoryId;
  const specificsPopulated = !!(item.brand && item.condition);
  const priceSet = !!(item.startingPrice || item.buyNowPrice);
  const shippingPolicyChosen = !!item.shippingProfileId;
  const weightEntered = !!(item.weight && item.weight > 0);

  const checks = [hasPhotos, aiProcessed, categorySet, specificsPopulated, priceSet, shippingPolicyChosen, weightEntered];
  const score = checks.filter(Boolean).length;
  const percentage = Math.round((score / 7) * 100);
  const readyToList = score === 7;

  return {
    hasPhotos,
    aiProcessed,
    categorySet,
    specificsPopulated,
    priceSet,
    shippingPolicyChosen,
    weightEntered,
    readyToList,
    score,
    percentage,
  };
}
