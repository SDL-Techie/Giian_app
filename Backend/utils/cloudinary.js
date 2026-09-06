import crypto from 'crypto';

const sign = (params, secret) => {
  const base = Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join('&');
  return crypto.createHash('sha1').update(`${base}${secret}`).digest('hex');
};

export const uploadImageToCloudinary = async (file, folder = 'giian/products') => {
  if (!file?.buffer) return null;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) throw new Error('Cloudinary is not configured');

  const timestamp = Math.floor(Date.now() / 1000);
  const transformation = 'c_limit,w_1600,h_1600,q_auto:good';
  const signedParams = { folder, timestamp, transformation };
  const form = new FormData();
  form.append('file', new Blob([file.buffer], { type: file.mimetype }), file.originalname);
  form.append('api_key', apiKey);
  form.append('timestamp', String(timestamp));
  form.append('folder', folder);
  form.append('transformation', transformation);
  form.append('signature', sign(signedParams, apiSecret));

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: form });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || 'Cloudinary upload failed');
  return data;
};
