export type Locale = 'uz' | 'uzLatin' | 'ru';

export interface LocalizedText {
  uz: string;
  uzLatin: string;
  ru: string;
}

export type QuestionCategory =
  | 'railway'
  | 'intersection'
  | 'pedestrian'
  | 'overtake'
  | 'traffic_light'
  | 'roundabout'
  | 'speed_zone';

export type SceneType =
  | 'railway_crossing'
  | 'intersection_4way'
  | 'intersection_t'
  | 'pedestrian_crossing'
  | 'two_lane_road'
  | 'traffic_light_intersection'
  | 'roundabout';

export type VehicleType = 'car' | 'truck' | 'bus' | 'train';
export type Direction = 'north' | 'south' | 'east' | 'west';

export interface Position {
  x: number;
  y: number;
}

export interface VehicleConfig {
  id: string;
  type: VehicleType;
  isPlayer: boolean;
  position: Position;
  direction: Direction;
  rotation: number;
  color: string;
  label?: LocalizedText;
}

export interface SignConfig {
  type: 'priority' | 'yield' | 'stop' | 'railway' | 'pedestrian_crossing' | 'speed_limit' | 'no_overtaking' | 'main_road';
  position: Position;
  value?: number;
}

export interface PedestrianConfig {
  id: string;
  position: Position;
  direction: 'left' | 'right';
}

export interface TrafficLightConfig {
  id: string;
  position: Position;
  state: 'red' | 'yellow' | 'green';
  forDirection: Direction;
}

export interface AnimationStep {
  targetId: string;
  path: Position[];
  rotations?: number[];
  duration: number;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

export interface OutcomeConfig {
  type: 'crash' | 'safe';
  animations: AnimationStep[];
  crashPoint?: Position;
  message: LocalizedText;
}

export interface RoadElement {
  type: 'railway_tracks' | 'zebra_crossing' | 'center_line' | 'barrier';
  position: Position;
  width: number;
  height: number;
  rotation?: number;
}

export interface SceneConfig {
  type: SceneType;
  viewBox: string;
  vehicles: VehicleConfig[];
  signs?: SignConfig[];
  pedestrians?: PedestrianConfig[];
  trafficLights?: TrafficLightConfig[];
  roadElements?: RoadElement[];
}

export interface AnswerOption {
  id: string;
  text: LocalizedText;
  correct: boolean;
}

export interface AnimatedQuestion {
  id: string;
  category: QuestionCategory;
  difficulty: 'easy' | 'medium' | 'hard';
  question: LocalizedText;
  options: AnswerOption[];
  explanation: LocalizedText;
  pddReference?: string;
  scene: SceneConfig;
  outcomes: Record<string, OutcomeConfig>;
}

export type QuizPhase = 'setup' | 'question' | 'animating' | 'result' | 'summary';

export interface QuizState {
  currentIndex: number;
  answers: Record<string, string>;
  phase: QuizPhase;
  selectedOption: string | null;
}
