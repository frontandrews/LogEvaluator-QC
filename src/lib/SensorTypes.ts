export type EvaluationResult = Record<string, string>;

export type SensorEvaluator = (readings: number[], reference: number) => string;

/**
 * Reference values for various sensors.
 * - `temperature`: The expected temperature value (e.g., average or optimal value).
 * - `humidity`: The expected humidity value.
 * - `monoxide`: The expected monoxide level.
 */
export interface Reference {
  temperature: number;
  humidity: number;
  monoxide: number;
}

export interface Sensor {
  type: SENSOR;
  name: string;
  readings: Array<{ timestamp: string; value: number }>;
}

export interface LogContents {
  reference: Reference;
  sensors: Sensor[];
}

export enum SENSOR {
  THERMOMETER = "thermometer",
  HUMIDITY = "humidity",
  MONOXIDE = "monoxide",
}

export enum FILE_TYPES {
  JSON = "json",
  TXT = "txt",
}

export type FileTypes = "json" | "txt";

export interface SensorDefinition {
  evaluator: SensorEvaluator;
  referenceKey: keyof LogContents["reference"];
}
