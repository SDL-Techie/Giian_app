export const fetchProtectedFile = async (url: string): Promise<Blob> => {
  const token = localStorage.getItem('token');
  const response = await fetch(url, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) throw new Error('Unable to retrieve file');
  return response.blob();
};

export const downloadProtectedFile = async (url: string, fileName: string) => {
  const blob = await fetchProtectedFile(url);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
};
