export interface LocalizedText {
  uz: string
  uzLatin: string
  ru: string
}

// ── Traffic Fines ──
export interface FineDto {
  id: string
  articleNumber: string
  violationDescription: LocalizedText
  additionalNotes: LocalizedText | null
  penaltyAmountTiyins: number
  penaltyMaxTiyins: number | null
  imageUrl: string | null
  sortOrder: number
  isActive: boolean
}

// ── Hazard Labels ──
export interface HazardLabelDto {
  id: string
  slug: string
  name: LocalizedText
  description: LocalizedText
  imageUrl: string | null
  hazardClass: string
  sortOrder: number
}

// ── First Aid ──
export interface FirstAidProcedureListDto {
  id: string
  slug: string
  name: LocalizedText
  summary: LocalizedText | null
  iconUrl: string
  sortOrder: number
  stepCount: number
}

export interface FirstAidStepDto {
  id: string
  stepOrder: number
  title: LocalizedText
  description: LocalizedText
  imageUrl: string | null
}

export interface FirstAidProcedureDto extends Omit<FirstAidProcedureListDto, 'stepCount'> {
  steps: FirstAidStepDto[]
}

// ── Glossary ──
export interface GlossaryCategoryDto {
  id: string
  slug: string
  name: LocalizedText
  icon: string | null
  sortOrder: number
  termCount: number
}

export interface GlossaryTermDto {
  id: string
  term: LocalizedText
  definition: LocalizedText
  sortOrder: number
  relatedQuestionIds: string[]
}

export interface GlossaryTermDetailDto extends GlossaryTermDto {
  relatedQuestions: { id: string; textSnippet: string }[]
}

// ── Color Vision ──
export interface ColorVisionPlateDto {
  plateId: string
  imageUrl: string
}

export interface ColorVisionResultDto {
  passed: boolean
  score: number
  total: number
}

// ── Paginated ──
export interface PaginatedList<T> {
  items: T[]
  meta: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}
