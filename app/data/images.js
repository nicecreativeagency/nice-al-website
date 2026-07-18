const UNSPLASH = 'https://images.unsplash.com'
const params = 'auto=format&fit=crop&w=1200&q=80'

const img = (id) => `${UNSPLASH}/${id}?${params}`

export const workImages = {
  iveco: img('photo-1519003722824-194d4455a60c'),
  kia: img('photo-1503376780353-7e6692767b70'),
  sixt: img('photo-1449965408869-eaa3f722e40d'),
  vodafone: img('photo-1512428559087-560fa5ceab42'),
  telekom: img('photo-1516251193007-45ef944ab0c6'),
  airjordan: img('photo-1552346154-21d32810aba3'),
}

export const capabilityImages = {
  branding: img('photo-1600607687939-ce8a6c25118c'),
  digital: img('photo-1517292987719-0369a794ec0f'),
  content: img('photo-1492724441997-5dc865305da7'),
  art: img('photo-1558655146-9f40138edfeb'),
}

export const teamImages = {
  erzen: img('photo-1507003211169-0a1dd7228f2d'),
  luisa: img('photo-1494790108377-be9c29b29330'),
}

export const productImages = {
  linku: img('photo-1611162617213-7d7a39e9b1d7'),
  dizajmeri: img('photo-1561070791-2526d30994b5'),
}
