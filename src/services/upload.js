import { api } from './api'

export async function getUploadUrl(filename, contentType) {
  const res = await api.post('/api/upload/presign', {
    filename,
    contentType,
  })
  return res.data
}

export async function uploadFile(file, onProgress) {
  const { uploadUrl, fileUrl, key } = await getUploadUrl(file.name, file.type)

  await api.put(uploadUrl, file, {
    headers: {
      'Content-Type': file.type,
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percent)
      }
    },
  })

  return { fileUrl, key }
}