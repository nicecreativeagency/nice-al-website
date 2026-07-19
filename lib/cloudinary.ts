import 'server-only'

import { v2 as cloudinary } from 'cloudinary'

export function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary environment variables are not configured.')
  }

  return { cloudName, apiKey, apiSecret }
}

export function createCloudinaryUploadSignature(parameters: {
  folder: string
  timestamp: number
}) {
  const { apiSecret } = getCloudinaryConfig()
  return cloudinary.utils.api_sign_request(parameters, apiSecret)
}

export function verifyCloudinaryResponseSignature(parameters: {
  publicId: string
  version: number
  signature: string
}) {
  const { apiSecret } = getCloudinaryConfig()
  const expected = cloudinary.utils.api_sign_request(
    {
      public_id: parameters.publicId,
      version: parameters.version,
    },
    apiSecret,
  )

  return expected === parameters.signature
}

export function getCloudinaryFolder(
  organizationSlug: string,
  clientId: string,
) {
  return `nice-social-hub/${organizationSlug}/${clientId}`
}

export function createCloudinaryDeliveryUrl(parameters: {
  cloudName: string
  resourceType: 'image' | 'video'
  version: number
  publicId: string
  format: string
}) {
  const encodedPublicId = parameters.publicId
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  return `https://res.cloudinary.com/${parameters.cloudName}/${parameters.resourceType}/upload/v${parameters.version}/${encodedPublicId}.${parameters.format}`
}
