export interface Destination {
  id: string;
  name: string;
  activities: string;
  notes?: string;
}

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  description?: string;
  destinations: Destination[];
}

export enum ModalType {
  NONE,
  ADD_TRIP,
  EDIT_TRIP,
  ADD_DESTINATION,
  VIEW_TRIP_DETAILS,
  AI_SPOT_CHAT, 
}

export enum GeminiFeature {
  SUGGEST_ACTIVITIES = "Suggest Activities",
  GENERATE_PACKING_LIST = "Generate Packing List",
  TRAVEL_TIPS = "Travel Tips",
  CHAT_FAMOUS_SPOTS = "Famous Spots (Chat)",
}

// Interface for chat messages
export interface SuggestedSpotInfo {
  name: string;
  imageUrl?: string;
  imageTitle?: string;
  youtubeUrl?: string;
  youtubeTitle?: string;
  articleUrl?: string;
  articleTitle?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: Date;
  enrichedContent?: SuggestedSpotInfo[];
}