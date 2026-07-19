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

export async function deleteCloudinaryAsset(parameters: {
  publicId: string
  resourceType: 'image' | 'video'
}) {
  const config = getCloudinaryConfig()
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  })

  const result = await cloudinary.uploader.destroy(parameters.publicId, {
    resource_type: parameters.resourceType,
    invalidate: true,
  })
  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new Error(`Cloudinary refused to delete the asset: ${result.result}`)
  }
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
